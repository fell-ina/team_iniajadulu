import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/auth/callback/route.ts
 * ---------------------------------------------------------------------------
 * GET /auth/callback
 * Titik balik OAuth Google (dan tautan konfirmasi email Supabase).
 *
 *   1. Tukar `code` menjadi session (cookie httpOnly ditulis oleh @supabase/ssr)
 *   2. Pastikan user punya baris di tabel `users` (role default: siswa)
 *   3. Alihkan sesuai role: admin/guru -> /dashboard, siswa -> /
 *
 * Jika gagal, pengguna dikembalikan ke /register?google=<alasan>.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

function originDari(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  if (!host) return new URL(request.url).origin;
  return `${proto}://${host}`;
}

export async function GET(request: Request) {
  const origin = originDari(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Google / Supabase bisa mengembalikan error sebelum sampai ke sini.
  if (url.searchParams.get("error") || !code) {
    const alasan = url.searchParams.get("error_code") || url.searchParams.get("error");
    console.warn("[auth/callback] OAuth dibatalkan atau tanpa kode:", alasan);
    return NextResponse.redirect(new URL("/register?google=gagal", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // abaikan bila dipanggil dari konteks yang tidak boleh set cookie
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.warn("[auth/callback] Gagal menukar kode:", error?.message);
    return NextResponse.redirect(new URL("/register?google=sesi-gagal", origin));
  }

  const user = data.user;
  let role: string | null = null;
  // Jurusan & kelas wajib diisi siswa sebelum akun bisa dipakai sepenuhnya.
  let profilLengkap = true;

  // --- Pastikan profil ada di tabel `users` (hanya untuk akun baru) --------
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: profil, error: errorProfil } = await admin
      .from("users")
      .select("role, jurusan, kelas")
      .eq("id", user.id)
      .maybeSingle();

    if (errorProfil) {
      console.warn("[auth/callback] Gagal membaca profil:", errorProfil.message);
    }

    if (profil) {
      // Akun lama (mis. sudah terdaftar lewat email) -> jangan ubah apa pun.
      role = profil.role ?? null;
      profilLengkap = Boolean(profil.jurusan && profil.kelas);
    } else {
      const meta = user.user_metadata ?? {};
      const nama =
        (meta.full_name as string | undefined)?.trim() ||
        (meta.name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Pengguna";

      const { error: errorInsert } = await admin.from("users").insert({
        id: user.id,
        nama,
        role: "siswa",
      });

      if (errorInsert) {
        console.warn("[auth/callback] Gagal membuat profil:", errorInsert.message);
      } else {
        role = "siswa";
        // Akun baru (termasuk lewat Google) harus mengisi jurusan & kelas dulu.
        profilLengkap = false;
      }
    }
  }

  const tujuan =
    role === "admin" || role === "guru"
      ? "/dashboard"
      : profilLengkap
        ? "/"
        : "/register/lengkapi";
  return NextResponse.redirect(new URL(tujuan, origin));
}
