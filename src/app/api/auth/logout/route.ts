import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * app/api/auth/logout/route.ts
 * ---------------------------------------------------------------------------
 * POST /api/auth/logout
 * Menghapus session Supabase (cookie httpOnly ikut terhapus) lalu
 * balas { ok: true }. Dipakai tombol logout di halaman publik.
 * ---------------------------------------------------------------------------
 */
export async function POST() {
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

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal keluar. Coba lagi sebentar lagi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
