import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * app/api/auth/resend-otp/route.ts
 * ---------------------------------------------------------------------------
 * Endpoint kirim ulang kode verifikasi OTP ke email user.
 * ---------------------------------------------------------------------------
 */
export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { ok: false, message: "Layanan autentikasi Supabase belum dikonfigurasi di Environment Variable." },
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
    return NextResponse.json({ ok: false, message: "Email wajib diisi." }, { status: 400 });
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
        setAll() {},
      },
    }
  );

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

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });

  if (error) {
    let pesan = error.message;
    if (pesan.includes("rate limit") || pesan.includes("security purposes")) {
      pesan = "Harap tunggu sejenak sebelum meminta kode baru lagi.";
    }
    return NextResponse.json({ ok: false, message: pesan }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Kode verifikasi baru telah dikirimkan ke email Anda.",
  });
}
