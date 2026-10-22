import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * app/api/auth/lupa-password/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/auth/lupa-password
 * Mengirim email berisi tautan reset kata sandi (Supabase Auth).
 *
 *   1. Validasi format email
 *   2. Minta Supabase mengirim tautan recovery
 *      -> `redirectTo` menunjuk ke /auth/callback?next=/reset-password,
 *         supaya kode ditukar menjadi session lalu pengguna diarahkan ke
 *         formulir kata sandi baru (lihat app/auth/callback/route.ts)
 *   3. Balasan selalu generik agar tidak membocorkan email mana yang terdaftar
 *
 * Akun lama yang dibuat dengan username/NISN memakai email palsu
 * `<nama>@sekolah.local`, sehingga tidak mungkin menerima email. Untuk akun
 * seperti itu, reset harus dilakukan admin sekolah.
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

/** Origin publik request (mendukung Vercel / reverse proxy). */
function originDari(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  if (!host) return new URL(request.url).origin;
  return `${proto}://${host}`;
}

const PESAN_UMUM =
  "Kalau email itu terdaftar, tautan reset kata sandi sudah dikirim. Periksa kotak masuk dan folder spam Anda.";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      {
        ok: false,
        message: "Layanan autentikasi Supabase belum dikonfigurasi di Environment Variable.",
      },
      { status: 503 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, message: "Email wajib diisi." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Format email tidak valid." },
      { status: 400 }
    );
  }

  // Akun username/NISN memakai domain internal yang tidak punya kotak surat.
  if (email.endsWith("@sekolah.local")) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Akun dengan NISN/username tidak memiliki email asli, jadi tautan reset tidak bisa dikirim. Hubungi admin sekolah untuk mengatur ulang kata sandi Anda.",
      },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  const origin = originDari(request);
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    // Supabase membatasi frekuensi permintaan; sampaikan apa adanya.
    if (/rate limit|security purposes|too many/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, message: "Terlalu banyak permintaan. Tunggu sekitar satu menit lalu coba lagi." },
        { status: 429 }
      );
    }

    // Selain itu tetap balas generik supaya tidak membocorkan status akun.
    console.warn("[auth/lupa-password] gagal mengirim tautan reset:", error.message);
  }

  return NextResponse.json({ ok: true, message: PESAN_UMUM });
}
