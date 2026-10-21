import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy.ts (dulu bernama middleware.ts)
 * ---------------------------------------------------------------------------
 * Jaring pengaman untuk alur OAuth Google / tautan konfirmasi email.
 *
 * Normalnya Supabase mengembalikan `?code=...` ke /auth/callback, karena route
 * itu yang kita kirim sebagai `redirectTo`. Tapi kalau "Site URL" / "Redirect
 * URLs" di dashboard Supabase belum memuat URL tersebut (misalnya deployment
 * preview Vercel yang domainnya berbeda), Supabase mengabaikan `redirectTo` dan
 * memakai Site URL apa adanya — biasanya halaman depan. Akibatnya kode mendarat
 * di `/?code=...`, halaman depan tidak tahu harus apa-apa, dan pengguna terlihat
 * tidak login.
 *
 * Proxy ini meneruskan kode tersebut ke /auth/callback supaya penukaran session
 * tetap terjadi, di domain mana pun kode itu mendarat.
 * ---------------------------------------------------------------------------
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Sudah di tempat yang benar.
  if (pathname === "/auth/callback") return NextResponse.next();

  const kode = searchParams.get("code");
  const galat = searchParams.get("error_description") ?? searchParams.get("error_code");

  if (!kode && !galat) return NextResponse.next();

  const tujuan = request.nextUrl.clone();
  tujuan.pathname = "/auth/callback";
  return NextResponse.redirect(tujuan);
}

export const config = {
  // Lewati aset statis & API; sisanya cukup murah karena hanya bereaksi
  // terhadap parameter `code` / error OAuth.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
