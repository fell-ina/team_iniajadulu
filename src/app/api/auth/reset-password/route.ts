import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * app/api/auth/reset-password/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/auth/reset-password
 * Menyimpan kata sandi baru untuk session hasil tautan recovery.
 *
 *   1. Pastikan ada session (didapat dari /auth/callback setelah klik email)
 *   2. Validasi panjang & konfirmasi kata sandi
 *   3. supabase.auth.updateUser({ password })
 *   4. Keluar dari session recovery supaya pengguna masuk ulang dengan
 *      kata sandi barunya
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

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

  let body: { password?: string; konfirmasi?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Permintaan tidak valid." }, { status: 400 });
  }

  const password = body.password ?? "";
  const konfirmasi = body.konfirmasi ?? "";

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Kata sandi minimal 6 karakter." },
      { status: 400 }
    );
  }

  if (password !== konfirmasi) {
    return NextResponse.json(
      { ok: false, message: "Konfirmasi kata sandi tidak cocok." },
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Sesi reset tidak ditemukan atau sudah kedaluwarsa. Minta tautan baru lewat halaman Lupa Kata Sandi.",
      },
      { status: 401 }
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    let pesan = error.message || "Gagal menyimpan kata sandi baru.";
    if (/weak_password|Password should be/i.test(pesan)) {
      pesan = "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    } else if (/same|different from the old/i.test(pesan)) {
      pesan = "Kata sandi baru harus berbeda dari kata sandi sebelumnya.";
    } else if (/expired|invalid|session/i.test(pesan)) {
      pesan =
        "Sesi reset sudah kedaluwarsa. Minta tautan baru lewat halaman Lupa Kata Sandi.";
    }
    return NextResponse.json({ ok: false, message: pesan }, { status: 400 });
  }

  // Session recovery tidak perlu dipertahankan: pengguna masuk lagi dengan
  // kata sandi baru agar cookie benar-benar bersih.
  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.",
    redirectTo: "/login?reset=berhasil",
  });
}
