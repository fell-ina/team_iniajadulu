import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { buatAdmin } from "@/lib/dashboard";

/**
 * src/lib/admin-forum.ts
 * ---------------------------------------------------------------------------
 * Penjaga akses untuk endpoint moderasi Forum Siswa (/api/admin/forum/*).
 *
 * Setiap endpoint moderasi WAJIB memanggil `sesiAdminForum()` lebih dulu:
 *   - belum login            -> 401
 *   - login tetapi bukan admin -> 403
 *   - admin                  -> lanjut
 *
 * Pemeriksaan dilakukan di server memakai session cookie lalu membaca kolom
 * `users.role`, bukan mengandalkan tombol yang disembunyikan di frontend.
 * RLS tidak diubah: operasi tulis memakai service role di server setelah role
 * diverifikasi.
 * ---------------------------------------------------------------------------
 */

export type AdminForum = {
  userId: string;
  nama: string;
};

type HasilAdmin =
  | { admin: AdminForum; galat: null }
  | { admin: null; galat: NextResponse };

/** Format uuid standar Supabase; menolak id sembarang sebelum menyentuh DB. */
export const POLA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function sesiAdminForum(): Promise<HasilAdmin> {
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
            /* abaikan */
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      admin: null,
      galat: NextResponse.json(
        { ok: false, message: "Anda harus masuk terlebih dahulu." },
        { status: 401 }
      ),
    };
  }

  const { data: profil, error } = await buatAdmin()
    .from("users")
    .select("nama, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[moderasi forum] gagal memeriksa peran:", error.message);
    return {
      admin: null,
      galat: NextResponse.json(
        { ok: false, message: "Gagal memeriksa peran pengguna." },
        { status: 500 }
      ),
    };
  }

  if (profil?.role !== "admin") {
    return {
      admin: null,
      galat: NextResponse.json(
        { ok: false, message: "Hanya admin yang boleh melakukan moderasi forum." },
        { status: 403 }
      ),
    };
  }

  return {
    admin: {
      userId: user.id,
      nama: (profil.nama as string | null) ?? "Admin",
    },
    galat: null,
  };
}

/** Potong judul/konten agar pesan notifikasi tetap wajar. */
export function potongTeks(nilai: string, maksimal = 80): string {
  const bersih = nilai.replace(/\s+/g, " ").trim();
  return bersih.length > maksimal ? `${bersih.slice(0, maksimal - 1)}…` : bersih;
}
