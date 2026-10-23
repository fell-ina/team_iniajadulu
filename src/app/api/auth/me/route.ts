import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * app/api/auth/me/route.ts
 * ---------------------------------------------------------------------------
 * GET /api/auth/me
 * Dipakai halaman publik ('use client') untuk mengecek status login:
 *   - 200 { ok: true, nama, role, nisn, verification_status, perlu_verifikasi }
 *   - 200 { ok: false }  jika belum login / session sudah tamat
 * ---------------------------------------------------------------------------
 */
export const dynamic = "force-dynamic";

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

  // Selalu baru: status verifikasi bisa berubah dari dashboard admin.
  const lengkap = await admin
    .from("users")
    .select("nama, role, nisn, verification_status, kelas")
    .eq("id", user.id)
    .maybeSingle();

  let profil = lengkap.data;

  // Kolom verifikasi belum ada (migrasi belum dijalankan) -> pakai data dasar.
  if (lengkap.error) {
    console.warn("[auth/me] fallback tanpa kolom verifikasi:", lengkap.error.message);
    const cadangan = await admin
      .from("users")
      .select("nama, role, kelas")
      .eq("id", user.id)
      .maybeSingle();
    profil = cadangan.data as typeof profil;
  }

  const role = profil?.role ?? null;
  const perluVerifikasi = role !== "admin" && role !== "guru";

  return NextResponse.json(
    {
      ok: true,
      userId: user.id,
      nama: profil?.nama ?? null,
      role,
      nisn: profil?.nisn ?? null,
      verification_status: profil?.verification_status ?? "belum",
      kelas: profil?.kelas ?? null,
      perlu_verifikasi: perluVerifikasi,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
