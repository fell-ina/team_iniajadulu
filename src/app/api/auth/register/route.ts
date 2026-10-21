import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { simpanCookiePendaftaran } from "@/lib/pendaftaran";

/**
 * app/api/auth/register/route.ts
 * ---------------------------------------------------------------------------
 * Langkah 1 pendaftaran: buat akun, TANPA mengirim kode verifikasi.
 *
 *   1. Menerima nama, email, password
 *   2. Membuat user di Supabase Auth dengan email_confirm = false
 *      (admin API tidak mengirim email apa pun)
 *   3. Menyimpan id user di cookie sementara bertanda tangan
 *   4. Mengalihkan front-end ke /register/lengkapi untuk pilih jurusan & kelas
 *
 * Kode verifikasi baru dikirim setelah jurusan & kelas tersimpan
 * (lihat app/api/auth/lengkapi/route.ts).
 * ---------------------------------------------------------------------------
 */
export async function POST(request: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Layanan autentikasi Supabase belum dikonfigurasi di Environment Variable (termasuk SUPABASE_SERVICE_ROLE_KEY).",
      },
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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Akun dibuat lewat admin API: password langsung tersimpan, email belum
  // dikonfirmasi, dan TIDAK ada email yang dikirim ke pengguna.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { nama },
  });

  if (error || !data.user) {
    let pesan = error?.message || "Gagal membuat akun. Silakan coba lagi.";
    if (/already registered|already been registered|email address has already/i.test(pesan)) {
      pesan =
        "Email ini sudah terdaftar. Silakan masuk melalui halaman login, atau hubungi admin bila akun belum terverifikasi.";
    } else if (/weak_password|Password should be/i.test(pesan)) {
      pesan = "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    } else if (/invalid.*email|email.*invalid/i.test(pesan)) {
      pesan = "Format email tidak valid.";
    }
    return NextResponse.json({ ok: false, message: pesan }, { status: 400 });
  }

  // Izinkan tahap pengisian jurusan & kelas untuk akun yang baru dibuat ini.
  await simpanCookiePendaftaran(data.user.id);

  return NextResponse.json({
    ok: true,
    email,
    redirectTo: "/register/lengkapi",
    message: "Akun dibuat. Lengkapi jurusan dan kelas untuk menerima kode verifikasi.",
  });
}
