"use client";

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export const KATEGORI_LABEL: Record<string, string> = {
  all: "Semua Diskusi",
  tugas: "Tugas",
  project: "Project",
  tanya_jawab: "Tanya Jawab",
  pengalaman: "Berbagi Pengalaman",
};

export const KATEGORI_COLOR: Record<string, string> = {
  tugas: "bg-emerald-100 text-emerald-700",
  project: "bg-blue-100 text-blue-700",
  tanya_jawab: "bg-purple-100 text-purple-700",
  pengalaman: "bg-orange-100 text-orange-700",
};

export const WARNA_KELAS: Record<"X" | "XI" | "XII", { bg: string; text: string; border: string }> = {
  X: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  XI: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  XII: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" },
};

export const SORT_OPTIONS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "terlama", label: "Terlama" },
  { value: "terpopuler", label: "Terpopuler" },
  { value: "terbanyak_balasan", label: "Terbanyak Balasan" },
];