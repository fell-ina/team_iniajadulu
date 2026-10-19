import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/auth/me/route.ts
 * ---------------------------------------------------------------------------
 * GET /api/auth/me
 * Dipakai halaman publik ('use client') untuk mengecek status login:
 *   - 200 { ok: true, nama, role }  jika ada session (cookie Supabase valid)
 *   - 200 { ok: false }             jika belum login / session sudah tamat
 * ---------------------------------------------------------------------------
 */
export async function GET() {
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
            // Abaikan error jika dipanggil dari konteks yang tidak boleh set cookie
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false });
  }

  // Ambil nama dari tabel 'users' memakai client service role (tanpa cookie)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profil } = await admin
    .from("users")
    .select("nama, role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    nama: profil?.nama ?? null,
    role: profil?.role ?? null,
  });
}
