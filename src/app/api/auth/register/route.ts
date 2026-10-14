import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * app/api/auth/register/route.ts
 * ---------------------------------------------------------------------------
 * Endpoint pendaftaran akun baru:
 *   1. Menerima nama, email, password
 *   2. Mendaftarkan user ke Supabase Auth lewat supabase.auth.signUp()
 *   3. Jika konfirmasi email aktif di Supabase, kode verifikasi 6 digit dikirim ke email
 * ---------------------------------------------------------------------------
 */
export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { ok: false, message: "Layanan autentikasi Supabase belum dikonfigurasi di Environment Variable." },
      { status: 503 }
    );
  }

  let body: { nama?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const nama = body.nama?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!nama || !email || !password) {
    return NextResponse.json(
      { ok: false, message: "Nama, email, dan kata sandi wajib diisi." },
      { status: 400 }
    );
  }

  if (nama.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Nama terlalu pendek (minimal 2 karakter)." },
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

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Kata sandi minimal 6 karakter." },
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

  // Deteksi origin dinamis (mis. https://team-iniajadulu-branch.vercel.app saat di Vercel)
  const originHeader = request.headers.get("origin") || request.headers.get("referer");
  let emailRedirectTo: string | undefined = undefined;
  if (originHeader) {
    try {
      const parsed = new URL(originHeader);
      emailRedirectTo = `${parsed.origin}/auth/callback`;
    } catch {
      // abaikan
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    let pesan = error.message;
    if (pesan.includes("already registered") || pesan.includes("User already registered")) {
      pesan = "Email ini sudah terdaftar. Silakan masuk melalui halaman login.";
    } else if (pesan.includes("weak_password") || pesan.includes("Password should be")) {
      pesan = "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    }
    return NextResponse.json({ ok: false, message: pesan }, { status: 400 });
  }

  // Jika session langsung terbentuk (email confirmation dinonaktifkan di Supabase)
  if (data.session) {
    return NextResponse.json({
      ok: true,
      needsVerification: false,
      message: "Pendaftaran berhasil! Akun Anda telah aktif.",
      redirectTo: "/dashboard",
    });
  }

  // Kode verifikasi 6-digit dikirim ke email
  return NextResponse.json({
    ok: true,
    needsVerification: true,
    email,
    message: "Kode verifikasi 6-digit telah dikirim ke email Anda.",
  });
}
