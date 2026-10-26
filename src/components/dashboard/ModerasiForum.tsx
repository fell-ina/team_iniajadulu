"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  KATEGORI_SISWA,
  KELAS_LABEL,
  KELAS_WARNA,
  LABEL_STATUS_LAPORAN,
  formatRelativeTime,
  getInitials,
  labelKategori,
  warnaKategori,
  type Balasan,
  type LaporanForum,
  type StatusLaporanForum,
  type Topik,
} from "@/lib/forum-types";

/**
 * components/dashboard/ModerasiForum.tsx
 * ---------------------------------------------------------------------------
 * Panel moderasi Forum Siswa di dashboard admin.
 *
 * Data topik & laporan diterima dari server (data asli Supabase). Detail topik
 * beserta komentar dibaca lewat endpoint forum yang sudah ada, sedangkan aksi
 * hapus topik/komentar dan perubahan status laporan memakai endpoint moderasi
 * admin (/api/admin/forum/*) yang memverifikasi session + role admin di server.
 * ---------------------------------------------------------------------------
 */

const PER_HALAMAN = 10;

type Tab = "topik" | "laporan";
type PilihanKelas = "semua" | "X" | "XI" | "XII";

type TargetHapus =
  | {
      jenis: "topik";
      id: string;
      judul: string;
      penulis: string;
      kelas: string | null;
    }
  | {
      jenis: "balasan";
      id: string;
      topikId: string;
      penulis: string;
      anak: number;
    };

const WARNA_STATUS_LAPORAN: Record<StatusLaporanForum, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  diproses: "border-blue-200 bg-blue-50 text-blue-700",
  selesai: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ditolak: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_AKSI: {
  status: StatusLaporanForum;
  label: string;
  ikon: typeof Flag;
  kelas: string;
}[] = [
  {
    status: "diproses",
    label: "Diproses",
    ikon: RefreshCw,
    kelas: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    status: "selesai",
    label: "Selesai",
    ikon: Check,
    kelas: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    status: "ditolak",
    label: "Tolak",
    ikon: X,
    kelas: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  },
];

interface Props {
  topikAwal: Topik[];
  laporanAwal: LaporanForum[];
  galatTopik: string | null;
  galatLaporan: string | null;
}

export default function ModerasiForum({
  topikAwal,
  laporanAwal,
  galatTopik,
  galatLaporan,
}: Props) {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("topik");
  const [cari, setCari] = useState("");
  const [kelas, setKelas] = useState<PilihanKelas>("semua");
  const [kategori, setKategori] = useState<string>("semua");
  const [halaman, setHalaman] = useState(1);
  const [toast, setToast] = useState<{ jenis: "sukses" | "galat"; pesan: string } | null>(
    null
  );

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTopik, setDetailTopik] = useState<Topik | null>(null);
  const [detailBalasan, setDetailBalasan] = useState<Balasan[]>([]);
  const [memuatDetail, setMemuatDetail] = useState(false);
  const [galatDetail, setGalatDetail] = useState<string | null>(null);

  const [targetHapus, setTargetHapus] = useState<TargetHapus | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState<string | null>(null);
  /** Topik yang sudah benar-benar dihapus server; dipakai agar daftar & statistik
   *  langsung berubah tanpa menunggu router.refresh(). */
  const [topikDihapus, setTopikDihapus] = useState<Set<string>>(() => new Set());
  const sedangHapus = useRef(false);
  const [tinjau, setTinjau] = useState<LaporanForum | null>(null);
  const [memprosesLaporan, setMemprosesLaporan] = useState<StatusLaporanForum | null>(null);

  const topikTampil = useMemo(
    () => topikAwal.filter((t) => !topikDihapus.has(t.id)),
    [topikAwal, topikDihapus]
  );
  const laporanTampil = useMemo(
    () => laporanAwal.filter((l) => !(l.topikId && topikDihapus.has(l.topikId))),
    [laporanAwal, topikDihapus]
  );

  const totalKomentar = useMemo(
    () => topikTampil.reduce((total, t) => total + t.balasanCount, 0),
    [topikTampil]
  );
  const laporanMenunggu = useMemo(
    () => laporanTampil.filter((l) => l.status === "pending").length,
    [laporanTampil]
  );

  const tersaring = useMemo(() => {
    const kueri = cari.trim().toLowerCase();

    return topikTampil.filter((t) => {
      if (kelas !== "semua" && t.kelas !== kelas) return false;
      if (kategori !== "semua" && t.kategori !== kategori) return false;
      if (!kueri) return true;
      return `${t.judul} ${t.konten} ${t.penulisNama}`.toLowerCase().includes(kueri);
    });
  }, [topikTampil, cari, kelas, kategori]);

  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const mulai = (halamanAktif - 1) * PER_HALAMAN;
  const potongan = tersaring.slice(mulai, mulai + PER_HALAMAN);

  const balasanRata = useMemo(() => {
    function ratakan(daftar: Balasan[], kedalaman = 0): { balasan: Balasan; kedalaman: number }[] {
      return daftar.flatMap((b) => [
        { balasan: b, kedalaman },
        ...ratakan(b.balasanAnak ?? [], kedalaman + 1),
      ]);
    }
    return ratakan(detailBalasan);
  }, [detailBalasan]);

  const adaFilter = cari.trim() !== "" || kelas !== "semua" || kategori !== "semua";

  function tampilToast(pesan: string, jenis: "sukses" | "galat" = "sukses") {
    setToast({ pesan, jenis });
    window.setTimeout(() => setToast(null), 4000);
  }

  function ubahFilter(aksi: () => void) {
    aksi();
    setHalaman(1);
  }

  function aturUlangFilter() {
    ubahFilter(() => {
      setCari("");
      setKelas("semua");
      setKategori("semua");
    });
  }

  async function bukaDetail(id: string, ringkas?: Topik) {
    setDetailId(id);
    setDetailTopik(ringkas ?? null);
    setDetailBalasan([]);
    setGalatDetail(null);
    setMemuatDetail(true);

    try {
      const res = await fetch(`/api/forum/topik/${encodeURIComponent(id)}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        const pesan: string = data.message ?? data.error ?? "Gagal memuat detail diskusi.";
        setGalatDetail(pesan);
        tampilToast(pesan, "galat");
        return;
      }

      setDetailTopik(data.topik as Topik);
      setDetailBalasan((data.balasan ?? []) as Balasan[]);
    } catch {
      setGalatDetail("Tidak dapat terhubung ke server.");
      tampilToast("Tidak dapat terhubung ke server.", "galat");
    } finally {
      setMemuatDetail(false);
    }
  }

  function tutupDetail() {
    setDetailId(null);
    setDetailTopik(null);
    setDetailBalasan([]);
    setGalatDetail(null);
  }

  function jumlahTurunan(balasan: Balasan): number {
    return (balasan.balasanAnak ?? []).reduce(
      (total, anak) => total + 1 + jumlahTurunan(anak),
      0
    );
  }

  function buangBalasan(daftar: Balasan[], id: string): Balasan[] {
    return daftar
      .filter((b) => b.id !== id)
      .map((b) => ({ ...b, balasanAnak: buangBalasan(b.balasanAnak ?? [], id) }));
  }

  function mintaHapusTopik(topik: Topik) {
    setGalatHapus(null);
    setTargetHapus({
      jenis: "topik",
      id: topik.id,
      judul: topik.judul,
      penulis: topik.penulisNama,
      kelas: topik.kelas,
    });
  }

  function mintaHapusBalasan(balasan: Balasan) {
    if (!detailTopik) return;
    setGalatHapus(null);
    setTargetHapus({
      jenis: "balasan",
      id: balasan.id,
      topikId: detailTopik.id,
      penulis: balasan.penulisNama,
      anak: jumlahTurunan(balasan),
    });
  }

  function tutupKonfirmasiHapus() {
    if (menghapus) return;
    setTargetHapus(null);
    setGalatHapus(null);
  }

  async function jalankanHapus() {
    if (!targetHapus || sedangHapus.current) return;
    const target = targetHapus;

    sedangHapus.current = true;
    setMenghapus(true);
    setGalatHapus(null);
    try {
      const url =
        target.jenis === "topik"
          ? `/api/admin/forum/topik/${encodeURIComponent(target.id)}`
          : `/api/admin/forum/balasan/${encodeURIComponent(target.id)}`;

      const res = await fetch(url, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        const pesan: string = data.message ?? "Gagal menghapus konten. Coba lagi.";
        setGalatHapus(pesan);
        tampilToast(pesan, "galat");
        return;
      }

      // Hapus server sudah berhasil: sembunyikan objek dari daftar/statistik
      // segera, lalu router.refresh() menyamakan dengan data server terbaru.
      if (target.jenis === "topik") {
        setTopikDihapus((sebelumnya) => new Set(sebelumnya).add(target.id));
        if (detailId === target.id) tutupDetail();
      } else if (detailId === target.topikId) {
        setDetailBalasan((daftar) => buangBalasan(daftar, target.id));
        setDetailTopik((topik) =>
          topik
            ? { ...topik, balasanCount: Math.max(0, topik.balasanCount - 1 - target.anak) }
            : topik
        );
      }

      setTargetHapus(null);
      setTinjau(null);
      tampilToast(data.message ?? "Konten berhasil dihapus.");
      router.refresh();
    } catch {
      const pesan = "Tidak dapat terhubung ke server. Konten belum dihapus.";
      setGalatHapus(pesan);
      tampilToast(pesan, "galat");
    } finally {
      sedangHapus.current = false;
      setMenghapus(false);
    }
  }

  async function ubahStatusLaporan(status: StatusLaporanForum) {
    if (!tinjau || memprosesLaporan) return;

    setMemprosesLaporan(status);
    try {
      const res = await fetch(`/api/admin/forum/laporan/${encodeURIComponent(tinjau.id)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        tampilToast(data.message ?? "Gagal memperbarui status laporan.", "galat");
        return;
      }

      tampilToast(data.message ?? "Status laporan diperbarui.");
      setTinjau(null);
      router.refresh();
    } catch {
      tampilToast("Tidak dapat terhubung ke server.", "galat");
    } finally {
      setMemprosesLaporan(null);
    }
  }

  const detailKelas = detailTopik?.kelas ?? null;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className={`fixed right-4 top-20 z-[130] max-w-xs rounded-2xl px-4 py-3 text-sm shadow-2xl backdrop-blur-xl sm:right-6 ${
            toast.jenis === "galat"
              ? "border border-red-300/40 bg-[#021024]/95 text-red-200"
              : "border border-emerald-300/30 bg-[#021024]/95 text-emerald-200"
          }`}
        >
          {toast.pesan}
        </motion.div>
      )}

      {/* Ringkasan */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Topik forum siswa",
            nilai: topikTampil.length,
            catatan: "Kelas X · XI · XII",
            ikon: MessageCircle,
          },
          {
            label: "Komentar",
            nilai: totalKomentar,
            catatan: "Total balasan siswa",
            ikon: MessageCircle,
          },
          {
            label: "Laporan menunggu",
            nilai: laporanMenunggu,
            catatan: `Dari ${laporanTampil.length} laporan`,
            ikon: Flag,
          },
        ].map(({ label, nilai, catatan, ikon: Ikon }) => (
          <div
            key={label}
            className="rounded-3xl border border-[#021024]/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#052659] text-[#C1E8FF]">
                <Ikon size={17} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-[#021024]">{nilai}</p>
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#021024]/45">
              {label}
            </p>
            <p className="mt-2 text-xs text-[#021024]/45">{catatan}</p>
          </div>
        ))}
      </div>

      {galatTopik && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {galatTopik}
        </p>
      )}

      {/* Tab & muat ulang */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Bagian moderasi forum"
          className="flex overflow-hidden rounded-full border border-[#021024]/12 bg-white p-1 shadow-sm"
        >
          {(
            [
              { nilai: "topik", label: "Topik", jumlah: topikTampil.length },
              { nilai: "laporan", label: "Laporan", jumlah: laporanTampil.length },
            ] as { nilai: Tab; label: string; jumlah: number }[]
          ).map((o) => (
            <button
              key={o.nilai}
              type="button"
              role="tab"
              aria-selected={tab === o.nilai}
              onClick={() => setTab(o.nilai)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === o.nilai
                  ? "bg-[#052659] text-white"
                  : "text-[#021024]/60 hover:bg-[#021024]/5"
              }`}
            >
              {o.label}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  tab === o.nilai ? "bg-white/15 text-[#C1E8FF]" : "bg-[#021024]/5"
                }`}
              >
                {o.jumlah}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            router.refresh();
            tampilToast("Memuat data terbaru dari server.");
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#021024]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#021024]/70 shadow-sm transition hover:bg-[#021024]/5"
        >
          <RefreshCw size={15} />
          Muat ulang
        </button>
      </div>

      {tab === "topik" ? (
        <>
          {/* Filter */}
          <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#021024]/10 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]/55"
              />
              <input
                value={cari}
                onChange={(e) => ubahFilter(() => setCari(e.target.value))}
                placeholder="Cari judul, isi, atau nama penulis..."
                aria-label="Cari topik forum"
                className="h-11 w-full rounded-xl border border-[#021024]/10 bg-[#F4F9FF]/60 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#2F5F8F]/50 focus:border-[#5483B3] focus:bg-white"
              />
            </label>

            <label className="sr-only" htmlFor="filter-kelas">
              Filter kelas
            </label>
            <select
              id="filter-kelas"
              value={kelas}
              onChange={(e) => ubahFilter(() => setKelas(e.target.value as PilihanKelas))}
              className="h-11 rounded-xl border border-[#021024]/10 bg-white px-3 text-sm font-semibold text-[#021024]/75 outline-none focus:border-[#5483B3]"
            >
              <option value="semua">Semua kelas</option>
              <option value="X">Kelas X</option>
              <option value="XI">Kelas XI</option>
              <option value="XII">Kelas XII</option>
            </select>

            <label className="sr-only" htmlFor="filter-kategori">
              Filter kategori
            </label>
            <select
              id="filter-kategori"
              value={kategori}
              onChange={(e) => ubahFilter(() => setKategori(e.target.value))}
              className="h-11 rounded-xl border border-[#021024]/10 bg-white px-3 text-sm font-semibold text-[#021024]/75 outline-none focus:border-[#5483B3]"
            >
              <option value="semua">Semua kategori</option>
              {KATEGORI_SISWA.map((k) => (
                <option key={k.nilai} value={k.nilai}>
                  {k.label}
                </option>
              ))}
            </select>

            {adaFilter && (
              <button
                type="button"
                onClick={aturUlangFilter}
                className="rounded-full px-3 py-2 text-xs font-semibold text-[#021024]/50 transition hover:bg-[#021024]/5 hover:text-[#021024]"
              >
                Atur ulang
              </button>
            )}
          </div>

          {/* Tabel topik */}
          <div className="mt-4 overflow-hidden rounded-3xl border border-[#021024]/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#021024]/10 bg-[#F4F9FF]/80 text-[11px] uppercase tracking-[.12em] text-[#2F5F8F]/70">
                    <th scope="col" className="px-4 py-3 font-bold">Diskusi</th>
                    <th scope="col" className="px-4 py-3 font-bold">Penulis</th>
                    <th scope="col" className="px-4 py-3 font-bold">Kelas</th>
                    <th scope="col" className="px-4 py-3 font-bold">Kategori</th>
                    <th scope="col" className="px-4 py-3 font-bold">Dibuat</th>
                    <th scope="col" className="px-4 py-3 text-center font-bold">Komentar</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {potongan.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#052659]/8 text-[#052659]">
                          <MessageCircle size={24} />
                        </span>
                        <p className="mt-4 text-lg font-bold text-[#021024]">
                          {adaFilter ? "Tidak ada topik yang cocok" : "Belum ada topik forum"}
                        </p>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#021024]/55">
                          {adaFilter
                            ? "Coba kata kunci, kelas, atau kategori lain."
                            : "Topik siswa akan muncul di sini setelah mereka membuat diskusi di forum kelas."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    potongan.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-[#021024]/5 transition last:border-0 hover:bg-[#F4F9FF]/70"
                      >
                        <td className="max-w-[340px] px-4 py-3">
                          <p className="truncate font-semibold text-[#021024]" title={t.judul}>
                            {t.judul}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-[#021024]/45">
                            {t.konten}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#C1E8FF] text-[10px] font-bold text-[#052659]">
                              {getInitials(t.penulisNama)}
                            </span>
                            <span className="max-w-[150px] truncate text-[#021024]/75">
                              {t.penulisNama}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {t.kelas ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${KELAS_WARNA[t.kelas]}`}
                            >
                              {KELAS_LABEL[t.kelas]}
                            </span>
                          ) : (
                            <span className="text-[#021024]/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${warnaKategori(t.kategori)}`}
                          >
                            {labelKategori(t.kategori)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            title={new Date(t.createdAt).toLocaleString("id-ID")}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[#021024]/55"
                          >
                            <Clock3 size={12} />
                            {formatRelativeTime(t.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-[#021024]/70">
                          {t.balasanCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => void bukaDetail(t.id, t)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#021024]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#052659] transition hover:bg-[#C1E8FF]/40"
                            >
                              <MessageCircle size={13} />
                              Baca
                            </button>
                            <button
                              type="button"
                              onClick={() => mintaHapusTopik(t)}
                              aria-label={`Hapus topik ${t.judul}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2 size={13} />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#021024]/8 px-4 py-3">
              <p className="text-xs text-[#021024]/50">
                {tersaring.length === 0
                  ? "Tidak ada topik untuk ditampilkan"
                  : `Menampilkan ${mulai + 1}–${Math.min(
                      mulai + PER_HALAMAN,
                      tersaring.length
                    )} dari ${tersaring.length} topik`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHalaman(halamanAktif - 1)}
                  disabled={halamanAktif <= 1}
                  aria-label="Halaman sebelumnya"
                  className="grid size-8 place-items-center rounded-full border border-[#021024]/12 text-[#021024]/60 transition hover:bg-[#021024]/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs font-semibold tabular-nums text-[#021024]/60">
                  {halamanAktif} / {totalHalaman}
                </span>
                <button
                  type="button"
                  onClick={() => setHalaman(halamanAktif + 1)}
                  disabled={halamanAktif >= totalHalaman}
                  aria-label="Halaman berikutnya"
                  className="grid size-8 place-items-center rounded-full border border-[#021024]/12 text-[#021024]/60 transition hover:bg-[#021024]/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {galatLaporan ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {galatLaporan}
            </p>
          ) : laporanTampil.length > 0 ? (
            <p className="mt-5 rounded-2xl border border-[#021024]/10 bg-white px-4 py-3 text-xs leading-relaxed text-[#021024]/55 shadow-sm">
              Menampilkan {laporanTampil.length} laporan terbaru beserta alasan dan statusnya. Klik
              Tinjau untuk membaca target laporan dan mengubah statusnya.
            </p>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-3xl border border-[#021024]/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#021024]/10 bg-[#F4F9FF]/80 text-[11px] uppercase tracking-[.12em] text-[#2F5F8F]/70">
                    <th scope="col" className="px-4 py-3 font-bold">Pelapor</th>
                    <th scope="col" className="px-4 py-3 font-bold">Target</th>
                    <th scope="col" className="px-4 py-3 font-bold">Alasan</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 font-bold">Dilaporkan</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {laporanTampil.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#052659]/8 text-[#052659]">
                          <Flag size={24} />
                        </span>
                        <p className="mt-4 text-lg font-bold text-[#021024]">Belum ada laporan</p>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#021024]/55">
                          Laporan dari siswa akan tampil di sini beserta alasannya.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    laporanTampil.map((l) => (
                      <tr
                        key={l.id}
                        className="border-b border-[#021024]/5 align-top transition last:border-0 hover:bg-[#F4F9FF]/70"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#052659] text-[10px] font-bold text-[#C1E8FF]">
                              {getInitials(l.pelaporNama)}
                            </span>
                            <span className="max-w-[140px] truncate text-[#021024]/75">
                              {l.pelaporNama}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[260px] px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] ${
                              l.target === "topik"
                                ? "bg-[#C1E8FF] text-[#052659]"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {l.target === "topik" ? "Topik" : "Komentar"}
                          </span>
                          <p className="mt-1.5 truncate font-semibold text-[#021024]" title={l.topikJudul ?? undefined}>
                            {l.topikJudul ?? "Topik tidak ditemukan"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-[#021024]/45">
                            {l.targetKonten || "—"}
                          </p>
                          {l.topikKelas && (
                            <p className="mt-1 text-[11px] text-[#2F5F8F]/60">
                              {KELAS_LABEL[l.topikKelas]}
                            </p>
                          )}
                        </td>
                        <td className="max-w-[280px] px-4 py-3">
                          <p className="line-clamp-3 text-[13px] leading-relaxed text-[#021024]/70">
                            {l.alasan}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${WARNA_STATUS_LAPORAN[l.status]}`}
                          >
                            {LABEL_STATUS_LAPORAN[l.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            title={new Date(l.createdAt).toLocaleString("id-ID")}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[#021024]/55"
                          >
                            <Clock3 size={12} />
                            {formatRelativeTime(l.createdAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTinjau(l)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#052659] px-3 py-1.5 text-xs font-semibold text-[#C1E8FF] transition hover:bg-[#021024] hover:text-white"
                            >
                              <Flag size={13} />
                              Tinjau
                            </button>
                            <button
                              type="button"
                              disabled={!l.topikId}
                              onClick={() => l.topikId && void bukaDetail(l.topikId)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#021024]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#052659] transition hover:bg-[#C1E8FF]/40 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <MessageCircle size={13} />
                              Baca topik
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Dialog detail topik */}
      {detailId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Tutup detail diskusi"
            onClick={tutupDetail}
            className="absolute inset-0"
          />
          <motion.section
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-detail-moderasi"
            className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#021024]/8 pb-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2F5F8F]/65">
                  Detail diskusi siswa
                </p>
                <h2
                  id="judul-detail-moderasi"
                  className="mt-1.5 text-xl font-bold leading-snug text-[#021024]"
                >
                  {detailTopik?.judul ?? "Memuat diskusi..."}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={!detailTopik}
                  onClick={() => detailTopik && mintaHapusTopik(detailTopik)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={13} />
                  Hapus topik
                </button>
                <button
                  type="button"
                  onClick={tutupDetail}
                  aria-label="Tutup detail"
                  className="grid size-9 place-items-center rounded-full text-[#2F5F8F]/60 transition hover:bg-[#021024]/5 hover:text-[#021024]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {detailTopik && (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  {detailKelas && (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 font-semibold ${KELAS_WARNA[detailKelas]}`}
                    >
                      {KELAS_LABEL[detailKelas]}
                    </span>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 font-semibold ${warnaKategori(detailTopik.kategori)}`}
                  >
                    {labelKategori(detailTopik.kategori)}
                  </span>
                  <span className="text-[#021024]/55">{detailTopik.penulisNama}</span>
                  <span className="inline-flex items-center gap-1 text-[#021024]/45">
                    <Clock3 size={12} />
                    {formatRelativeTime(detailTopik.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#021024]/45">
                    <MessageCircle size={12} />
                    {detailTopik.balasanCount} komentar
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-line rounded-2xl bg-[#F4F9FF] px-4 py-4 text-sm leading-7 text-[#021024]/80">
                  {detailTopik.konten}
                </p>
              </>
            )}

            {galatDetail && (
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {galatDetail}
              </p>
            )}

            <div className="mt-5">
              <h3 className="text-sm font-bold text-[#021024]">
                Komentar {detailBalasan.length > 0 ? `(${balasanRata.length})` : ""}
              </h3>

              {memuatDetail ? (
                <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#F4F9FF] px-4 py-6 text-sm text-[#2F5F8F]/70">
                  <Loader2 size={15} className="animate-spin" />
                  Memuat komentar...
                </p>
              ) : balasanRata.length === 0 && !galatDetail ? (
                <p className="mt-3 rounded-2xl bg-[#F4F9FF] px-4 py-6 text-center text-sm text-[#2F5F8F]/70">
                  Belum ada komentar pada diskusi ini.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {balasanRata.map(({ balasan: b, kedalaman }) => (
                    <article
                      key={b.id}
                      style={{ marginLeft: Math.min(kedalaman, 3) * 16 }}
                      className="rounded-2xl border border-[#021024]/8 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="grid size-7 place-items-center rounded-full bg-[#C1E8FF] text-[10px] font-bold text-[#052659]">
                          {getInitials(b.penulisNama)}
                        </span>
                        <span className="text-xs font-bold text-[#021024]">{b.penulisNama}</span>
                        <span className="text-[11px] text-[#2F5F8F]/55">
                          {formatRelativeTime(b.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() => mintaHapusBalasan(b)}
                          aria-label={`Hapus komentar ${b.penulisNama}`}
                          className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-red-600/80 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#021024]/75">
                        {b.konten}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>

          </motion.section>
        </div>
      )}

      {/* Dialog tinjau laporan */}
      {tinjau && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Tutup tinjauan laporan"
            onClick={() => {
              if (!memprosesLaporan) setTinjau(null);
            }}
            className="absolute inset-0"
          />
          <motion.section
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tinjau-laporan-judul"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2F5F8F]/65">
                  Tinjau laporan
                </p>
                <h2
                  id="tinjau-laporan-judul"
                  className="mt-1.5 text-xl font-bold leading-snug text-[#021024]"
                >
                  Laporan {tinjau.target === "topik" ? "topik" : "komentar"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTinjau(null)}
                disabled={Boolean(memprosesLaporan)}
                aria-label="Tutup tinjauan"
                className="grid size-9 shrink-0 place-items-center rounded-full text-[#2F5F8F]/60 transition hover:bg-[#021024]/5 hover:text-[#021024] disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${WARNA_STATUS_LAPORAN[tinjau.status]}`}
              >
                {LABEL_STATUS_LAPORAN[tinjau.status]}
              </span>
              <span className="text-[#021024]/55">Dilaporkan oleh {tinjau.pelaporNama}</span>
              <span className="text-[#021024]/45">{formatRelativeTime(tinjau.createdAt)}</span>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F4F9FF] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#2F5F8F]/70">
                {tinjau.target === "topik" ? "Topik" : "Komentar"} ·{" "}
                {tinjau.topikJudul ?? "Topik tidak ditemukan"}
              </p>
              <p className="mt-1.5 line-clamp-4 whitespace-pre-line text-sm leading-6 text-[#021024]/75">
                {tinjau.targetKonten || "—"}
              </p>
              {tinjau.topikKelas && (
                <p className="mt-1 text-[11px] text-[#2F5F8F]/60">
                  {KELAS_LABEL[tinjau.topikKelas]}
                </p>
              )}
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#2F5F8F]/70">
                Alasan laporan
              </p>
              <p className="mt-1.5 whitespace-pre-line rounded-2xl border border-[#021024]/8 px-4 py-3 text-sm leading-6 text-[#021024]/75">
                {tinjau.alasan}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#2F5F8F]/70">
                Proses laporan
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {STATUS_AKSI.map(({ status, label, ikon: Ikon, kelas }) => {
                  const sama = tinjau.status === status;
                  const sibuk = memprosesLaporan === status;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={sama || Boolean(memprosesLaporan)}
                      onClick={() => void ubahStatusLaporan(status)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${kelas}`}
                    >
                      {sibuk ? <Loader2 size={14} className="animate-spin" /> : <Ikon size={14} />}
                      {sama ? `Sudah ${label.toLowerCase()}` : label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#021024]/8 pt-4">
              <button
                type="button"
                disabled={!tinjau.topikId}
                onClick={() => {
                  const id = tinjau.topikId;
                  if (!id) return;
                  setTinjau(null);
                  void bukaDetail(id);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#052659] transition hover:text-[#2F5F8F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <MessageCircle size={14} />
                Baca topik lengkap
              </button>
              <button
                type="button"
                onClick={() => setTinjau(null)}
                disabled={Boolean(memprosesLaporan)}
                className="rounded-full border border-[#021024]/12 px-4 py-2 text-xs font-semibold text-[#021024]/60 transition hover:bg-[#021024]/5 disabled:opacity-50"
              >
                Tutup
              </button>
            </div>
          </motion.section>
        </div>
      )}

      {/* Dialog konfirmasi hapus */}
      {targetHapus && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Batal menghapus"
            onClick={tutupKonfirmasiHapus}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="konfirmasi-hapus-judul"
            className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={20} />
            </span>
            <h3
              id="konfirmasi-hapus-judul"
              className="mt-4 text-center text-lg font-bold text-[#021024]"
            >
              {targetHapus.jenis === "topik" ? "Hapus topik ini?" : "Hapus komentar ini?"}
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-[#021024]/55">
              {targetHapus.jenis === "topik" ? (
                <>
                  Topik <strong className="text-[#021024]">“{targetHapus.judul}”</strong> oleh{" "}
                  {targetHapus.penulis}
                  {targetHapus.kelas ? ` (Kelas ${targetHapus.kelas})` : ""} akan dihapus permanen
                  bersama komentar dan konten terkait.{" "}
                </>
              ) : (
                <>
                  Komentar oleh {targetHapus.penulis} pada topik ini akan dihapus permanen
                  {targetHapus.anak > 0
                    ? ` beserta ${targetHapus.anak} balasan turunannya`
                    : ""}
                  .{" "}
                </>
              )}
              <span className="font-semibold text-red-600">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>
            {galatHapus && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold leading-relaxed text-red-700"
              >
                {galatHapus}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={menghapus}
                onClick={tutupKonfirmasiHapus}
                className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={menghapus}
                onClick={() => void jalankanHapus()}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {menghapus ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {menghapus ? "Menghapus..." : "Ya, hapus"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
