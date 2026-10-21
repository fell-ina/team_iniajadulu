/**
 * src/lib/pendaftaran.ts
 * ---------------------------------------------------------------------------
 * Cookie sementara untuk pendaftaran bertahap:
 *   1. /register  -> akun dibuat, tetapi email verifikasi BELUM dikirim
 *   2. /register/lengkapi -> siswa memilih jurusan & kelas
 *   3. setelah data tersimpan, baru kode verifikasi dikirim
 *
 * Agar tahap 2 hanya bisa dilakukan oleh pemilik akun yang baru dibuat, id user
 * disimpan di cookie httpOnly bersama tanda tangan HMAC (kunci: service role).
 * Nilai cookie berbentuk: `<uuid-user>.<hmac-sha256>`.
 *
 * Hanya dipakai dari Route Handler (server), jangan diimpor ke komponen client.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE_PENDAFTARAN = "th_pendaftaran";

/** Pendaftaran harus diselesaikan dalam 1 jam. */
const UMUR_DETIK = 60 * 60;

function kunci(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function tandaTangan(id: string): string {
  return createHmac("sha256", kunci()).update(id).digest("hex");
}

function opsiCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

/** Simpan id user yang sedang menyelesaikan data jurusan/kelas. */
export async function simpanCookiePendaftaran(id: string) {
  if (!kunci()) return;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_PENDAFTARAN, `${id}.${tandaTangan(id)}`, opsiCookie(UMUR_DETIK));
}

/** Hapus cookie setelah data tersimpan (agar tidak bisa dipakai ulang). */
export async function hapusCookiePendaftaran() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_PENDAFTARAN, "", opsiCookie(0));
}

/** Ambil id user dari cookie, atau null bila tidak ada / tanda tangan salah. */
export async function bacaCookiePendaftaran(): Promise<string | null> {
  if (!kunci()) return null;

  const cookieStore = await cookies();
  const nilai = cookieStore.get(COOKIE_PENDAFTARAN)?.value;
  if (!nilai) return null;

  const [id, sig] = nilai.split(".");
  if (!id || !sig) return null;

  const harapan = tandaTangan(id);
  if (sig.length !== harapan.length) return null;

  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(harapan, "utf8"))) {
      return null;
    }
  } catch {
    return null;
  }

  return id;
}
