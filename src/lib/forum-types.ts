/**
 * src/lib/forum-types.ts
 * ---------------------------------------------------------------------------
 * Tipe & konstanta forum yang dipakai bersama oleh halaman (client) dan API.
 * Berkas ini murni (tanpa import server) sehingga aman diimpor di mana saja.
 *
 * Skema Supabase yang dipakai:
 *   forum_topik   (judul, konten, kategori, kelas, penulis_id, like_count, balasan_count)
 *   forum_balasan (topik_id, parent_id, konten, penulis_id)
 *   forum_like    (user_id, topik_id)
 *
 * `forum_topik.kelas` berisi "X" | "XI" | "XII" untuk topik siswa dan NULL
 * untuk topik guru (lihat supabase/migrations/20261026000000_forum_guru.sql).
 */

export type KelasForum = "X" | "XI" | "XII";

export interface Topik {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  kelas: KelasForum | null;
  penulisId: string;
  penulisNama: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  balasanCount: number;
  userLiked: boolean;
}

export interface Balasan {
  id: string;
  topikId: string;
  parentId: string | null;
  konten: string;
  penulisId: string;
  penulisNama: string;
  createdAt: string;
  balasanAnak: Balasan[];
}

export interface ForumSession {
  userId: string;
  nama: string;
  role: "siswa" | "guru" | "admin";
  kelas: KelasForum | null;
  verificationStatus: "belum" | "menunggu" | "terverifikasi" | "ditolak";
}

export const KELAS_LABEL: Record<KelasForum, string> = {
  X: "Kelas X",
  XI: "Kelas XI",
  XII: "Kelas XII",
};

export const KELAS_HREF: Record<KelasForum, string> = {
  X: "/forum/X",
  XI: "/forum/XI",
  XII: "/forum/XII",
};

export const KELAS_WARNA: Record<KelasForum, string> = {
  X: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20",
  XI: "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20",
  XII: "bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20",
};

export interface PilihanKategori {
  nilai: string;
  label: string;
}

/** Nilai enum `public.forum_kategori` untuk forum siswa. */
export const KATEGORI_SISWA: PilihanKategori[] = [
  { nilai: "tugas", label: "Tugas" },
  { nilai: "project", label: "Project" },
  { nilai: "tanya_jawab", label: "Tanya Jawab" },
  { nilai: "pengalaman", label: "Berbagi Pengalaman" },
];

/** Nilai enum `public.forum_kategori` untuk forum guru. */
export const KATEGORI_GURU: PilihanKategori[] = [
  { nilai: "kurikulum", label: "Kurikulum" },
  { nilai: "kesiswaan", label: "Kesiswaan" },
  { nilai: "teknologi", label: "Teknologi" },
  { nilai: "berbagi_praktik", label: "Berbagi praktik" },
];

const WARNA_KATEGORI: Record<string, string> = {
  tugas: "bg-emerald-100 text-emerald-700",
  project: "bg-blue-100 text-blue-700",
  tanya_jawab: "bg-purple-100 text-purple-700",
  pengalaman: "bg-orange-100 text-orange-700",
  kurikulum: "bg-emerald-100 text-emerald-700",
  kesiswaan: "bg-blue-100 text-blue-700",
  teknologi: "bg-purple-100 text-purple-700",
  berbagi_praktik: "bg-orange-100 text-orange-700",
};

export function labelKategori(nilai: string): string {
  const semua = [...KATEGORI_SISWA, ...KATEGORI_GURU];
  return semua.find((k) => k.nilai === nilai)?.label ?? nilai.replace(/_/g, " ");
}

export function warnaKategori(nilai: string): string {
  return WARNA_KATEGORI[nilai] ?? "bg-[#C1E8FF] text-[#052659]";
}

export function kategoriValid(nilai: unknown, daftar: PilihanKategori[]): nilai is string {
  return typeof nilai === "string" && daftar.some((k) => k.nilai === nilai);
}

export function getInitials(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
