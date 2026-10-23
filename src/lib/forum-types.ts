export interface Topik {
  id: string;
  judul: string;
  konten: string;
  kelas: "X" | "XI" | "XII";
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
  kelas: "X" | "XI" | "XII" | null;
  verificationStatus: "belum" | "menunggu" | "terverifikasi" | "ditolak";
}

export type KelasForum = "X" | "XI" | "XII";

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

export const KELAS_WARNA: Record<"X" | "XI" | "XII", string> = {
  X: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20",
  XI: "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20",
  XII: "bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20",
};