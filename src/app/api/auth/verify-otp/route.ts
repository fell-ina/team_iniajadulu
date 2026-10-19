import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/auth/verify-otp/route.ts
 * ---------------------------------------------------------------------------
 * Endpoint verifikasi kode OTP email:
 *   1. Menerima email dan token 6 digit dari front-end
 *   2. Memverifikasi dengan supabase.auth.verifyOtp({ email, token, type: 'signup' })
 *   3. Jika berhasil, session ditulis ke cookies httpOnly
 *   4. Sinkronisasi data ke tabel public.users (role: siswa) jika tersedia service role key
 * ---------------------------------------------------------------------------
 */
export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { ok: false, message: "Layanan autentikasi Supabase belum dikonfigurasi di Environment Variable." },
      { status: 503 }
    );
  }

  let body: { email?: string; token?: string; nama?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase();
  const token = body.token?.trim();
  const nama = body.nama?.trim();

  if (!email || !token) {
    return NextResponse.json(
      { ok: false, message: "Email dan kode verifikasi wajib diisi." },
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

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error || !data.user) {
    let pesan = error?.message || "Kode verifikasi tidak valid atau telah kedaluwarsa.";
    if (pesan.includes("Token has expired") || pesan.includes("expired")) {
      pesan = "Kode verifikasi telah kedaluwarsa. Silakan minta kode baru.";
    } else if (pesan.includes("Token is invalid") || pesan.includes("invalid")) {
      pesan = "Kode verifikasi salah. Periksa kembali kotak masuk atau spam email Anda.";
    }
    return NextResponse.json({ ok: false, message: pesan }, { status: 400 });
  }

  // Jika ada service role key, simpan data ke tabel `users`
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );

      const userNama = nama || data.user.user_metadata?.nama || email.split("@")[0];

      await admin.from("users").upsert(
        {
          id: data.user.id,
          nama: userNama,
          role: "siswa",
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.warn("[verify-otp] Gagal upsert tabel users:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Verifikasi berhasil! Akun Anda telah aktif.",
    redirectTo: "/dashboard",
  });
}
