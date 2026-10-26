import { redirect } from "next/navigation";
import ModerasiForum from "@/components/dashboard/ModerasiForum";
import { ambilProfilDashboard } from "@/lib/dashboard";
import { ambilTopik } from "@/lib/forum-server";
import { ambilLaporanForum } from "@/lib/forum-moderasi";
import type { Topik } from "@/lib/forum-types";

/**
 * /dashboard/forum — moderasi Forum Siswa (khusus admin).
 *
 * Membaca topik ketiga kelas dari tabel forum_topik dan laporan dari tabel
 * forum_laporan, lalu menyerahkannya ke komponen klien. Aksi hapus topik/
 * komentar dan perubahan status laporan ditangani endpoint admin di
 * /api/admin/forum/* (session + role admin diverifikasi di server).
 */
export const dynamic = "force-dynamic";

export default async function HalamanModerasiForum() {
  const profil = await ambilProfilDashboard();

  if (profil?.role !== "admin") {
    redirect("/dashboard");
  }

  let topik: Topik[] = [];
  let galatTopik: string | null = null;

  try {
    const [kelasX, kelasXI, kelasXII] = await Promise.all([
      ambilTopik("X"),
      ambilTopik("XI"),
      ambilTopik("XII"),
    ]);

    topik = [...kelasX, ...kelasXI, ...kelasXII].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  } catch (error) {
    console.error("[dashboard/forum] gagal memuat topik:", error);
    galatTopik =
      "Daftar topik forum belum bisa dimuat. Pastikan tabel forum sudah ada di database.";
  }

  const { laporan, galat: galatLaporan } = await ambilLaporanForum();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
            Moderasi konten
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#021024] sm:text-4xl">
            Moderasi Forum Siswa
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#021024]/55">
            Tinjau diskusi dan komentar siswa dari kelas X, XI, dan XII, termasuk laporan yang
            dikirim siswa.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ModerasiForum
          topikAwal={topik}
          laporanAwal={laporan}
          galatTopik={galatTopik}
          galatLaporan={galatLaporan}
        />
      </div>
    </div>
  );
}
