import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * app/api/auth/google/route.ts
 * ---------------------------------------------------------------------------
 * GET /api/auth/google
 * Memulai alur "Daftar / Masuk dengan Google".
 *
 *   1. Buat client Supabase ber-cookie (flow PKCE -> verifier disimpan di cookie)
 *   2. Minta URL otorisasi Google ke Supabase (provider "google")
 *   3. Alihkan browser ke URL tersebut
 *
 * Client ID & Client Secret TIDAK disimpan di repo ini. Keduanya diisi di
 * Supabase Dashboard -> Authentication -> Providers -> Google.
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

export async function GET(request: Request) {
  const origin = originDari(request);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL("/register?google=belum-dikonfigurasi", origin));
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Supabase mengembalikan kode ke route ini, lalu route menukarnya
      // menjadi session (cookie httpOnly) — sama seperti login biasa.
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    console.warn("[auth/google] Gagal membuat URL OAuth:", error?.message);
    return NextResponse.redirect(new URL("/register?google=gagal", origin));
  }

  return NextResponse.redirect(data.url);
}
