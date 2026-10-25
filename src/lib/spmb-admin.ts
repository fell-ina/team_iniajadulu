import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * src/lib/spmb-admin.ts
 * ---------------------------------------------------------------------------
 * Bagian bersama panel seleksi SPMB (`/api/admin/spmb` dan
 * `/api/admin/spmb/ekspor`): koneksi service role, pemeriksaan role admin,
 * nama kolom, serta pesan galat bila migrasi belum dijalankan.
 *
 * Hanya boleh diimpor dari Route Handler / Server Component.
 * ---------------------------------------------------------------------------
 */

export const TABEL_SPMB = "spmb_pendaftar";

export const KOLOM_SPMB =
  "id, nama, email, jenis_kelamin, tempat_lahir, tanggal_lahir, asal_sekolah, alamat, no_hp, jurusan_1, jurusan_2, nama_wali, no_hp_wali, status, status_diubah_at, created_at";

export const STATUS_SPMB = ["menunggu", "diterima", "ditolak"] as const;
export type StatusSpmb = (typeof STATUS_SPMB)[number];

export const PESAN_MIGRASI_STATUS =
  "Kolom status pendaftar belum ada. Jalankan supabase/migrations/20261025000001_add_spmb_status.sql di Supabase SQL Editor terlebih dahulu.";

export const PESAN_MIGRASI_TABEL =
  "Tabel pendaftaran belum tersedia. Jalankan migrasi supabase/migrations/20261025000000_add_spmb_pendaftar.sql terlebih dahulu.";

export type AdminClient = ReturnType<typeof buatAdminClient>;

/** Client service role tanpa cookie (RLS tabel tanpa policy). */
export function buatAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function buatSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
            /* abaikan */
          }
        },
      },
    }
  );
}

/** Hanya admin yang boleh melihat / mengekspor / menyeleksi pendaftar. */
export async function wajibAdmin(admin: AdminClient) {
  const supabase = await buatSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      ),
    } as const;
  }

  const { data: profil, error } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Gagal memeriksa peran pengguna." },
        { status: 500 }
      ),
    } as const;
  }

  if (profil?.role !== "admin") {
    return {
      error: NextResponse.json(
        { ok: false, message: "Hanya admin yang boleh mengelola pendaftar SPMB." },
        { status: 403 }
      ),
    } as const;
  }

  return { user } as const;
}

/**
 * Pesan yang jelas bila tabel / kolom status belum dibuat, supaya panitia
 * tidak melihat daftar kosong tanpa sebab.
 */
export function galatDatabase(error: { code?: string; message?: string }) {
  const pesan = error.message ?? "";

  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /column .*status.* does not exist|status_diubah_at/i.test(pesan)
  ) {
    console.warn("[admin/spmb] kolom status belum ada:", pesan);
    return NextResponse.json({ ok: false, message: PESAN_MIGRASI_STATUS }, { status: 503 });
  }

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /relation .*spmb_pendaftar.* does not exist|Could not find the table/i.test(pesan)
  ) {
    console.warn("[admin/spmb] tabel spmb_pendaftar belum ada:", pesan);
    return NextResponse.json({ ok: false, message: PESAN_MIGRASI_TABEL }, { status: 503 });
  }

  console.error("[admin/spmb] kesalahan database:", pesan);
  return NextResponse.json(
    { ok: false, message: "Terjadi kesalahan pada database. Coba lagi beberapa saat lagi." },
    { status: 500 }
  );
}

/** Buang karakter yang bermakna khusus pada filter PostgREST. */
export function bersihkanKataCari(q: string) {
  return q.replace(/[%,()*"\\]/g, " ").trim();
}

/** Kondisi pencarian bersama untuk daftar & rekap tab jurusan. */
export function kondisiCari(q: string) {
  return `nama.ilike.%${q}%,email.ilike.%${q}%,asal_sekolah.ilike.%${q}%,no_hp.ilike.%${q}%,no_hp_wali.ilike.%${q}%`;
}
