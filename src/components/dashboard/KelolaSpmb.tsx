"use client";

/**
 * components/dashboard/KelolaSpmb.tsx
 * ---------------------------------------------------------------------------
 * Panel seleksi pendaftar SPMB / PPDB — satu tabel per jurusan.
 *
 *   - Tab: Semua + PPLG / TJKT / DKV / TKR (berdasarkan pilihan jurusan 1),
 *     masing-masing menampilkan jumlah pendaftar.
 *   - Chip status: Semua / Menunggu / Diterima / Ditolak untuk tab aktif.
 *   - Cari (nama/email/asal sekolah/no. HP) dan paginasi.
 *   - Ekspor Excel: seluruh baris pada tab aktif dengan status Diterima,
 *     Ditolak, atau Semua.
 *   - Centang per baris + "pilih semua" di halaman ini.
 *   - Terima / tolak (per baris maupun massal) dan kembalikan ke menunggu.
 *   - Modal detail berisi seluruh isian formulir.
 * ---------------------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { JURUSAN } from "@/lib/sekolah";

interface PendaftarItem {
  id: string;
  nama: string;
  email: string;
  jenis_kelamin: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  asal_sekolah: string;
  alamat: string;
  no_hp: string;
  jurusan_1: string;
  jurusan_2: string;
  nama_wali: string;
  no_hp_wali: string;
  status: string;
  status_diubah_at: string | null;
  created_at: string;
}

interface AngkaStatus {
  total: number;
  menunggu: number;
  diterima: number;
  ditolak: number;
}

type Ringkasan = Record<string, AngkaStatus>;

interface JawabanDaftar {
  ok: boolean;
  message?: string;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  data: PendaftarItem[];
  ringkasan: Ringkasan;
}

type AksiSeleksi = "terima" | "tolak" | "menunggu";
type StatusEkspor = "diterima" | "ditolak" | "semua";
type TabJurusan = "semua" | (typeof JURUSAN)[number]["kode"];

const STATUS = [
  { nilai: "semua", label: "Semua" },
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "diterima", label: "Diterima" },
  { nilai: "ditolak", label: "Ditolak" },
] as const;

const PER_PAGE = [10, 25, 50];

const EKSPOR = [
  { nilai: "semua", label: "Semua status" },
  { nilai: "diterima", label: "Hanya diterima" },
  { nilai: "ditolak", label: "Hanya ditolak" },
] as const;

function angkaKosong(): AngkaStatus {
  return { total: 0, menunggu: 0, diterima: 0, ditolak: 0 };
}

function labelStatus(status: string | null) {
  switch (status) {
    case "diterima":
      return { teks: "Diterima", kelas: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "ditolak":
      return { teks: "Ditolak", kelas: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { teks: "Menunggu", kelas: "bg-amber-50 text-amber-700 border-amber-200" };
  }
}

/** "2010-08-12" -> "12/08/2010" (tanggal lahir disimpan sebagai date). */
function formatTanggal(iso: string | null) {
  if (!iso) return "—";
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return cocok ? `${cocok[3]}/${cocok[2]}/${cocok[1]}` : iso;
}

function formatWaktu(iso: string | null) {
  if (!iso) return "—";
  const waktu = new Date(iso);
  if (Number.isNaN(waktu.getTime())) return "—";
  return waktu.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function namaJurusan(kode: string) {
  return JURUSAN.find((j) => j.kode === kode)?.nama ?? kode;
}

/** Nama file dari header Content-Disposition bila ada. */
function namaBerkas(header: string | null, cadangan: string) {
  const cocok = /filename="?([^";]+)"?/i.exec(header ?? "");
  return cocok ? cocok[1] : cadangan;
}

/**
 * Nomor halaman yang ditampilkan: 1 … 4 5 [6] 7 8 … 20
 */
function nomorHalaman(kini: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const hasil: (number | "…")[] = [1];
  const mulai = Math.max(2, kini - 1);
  const selesai = Math.min(total - 1, kini + 1);
  if (mulai > 2) hasil.push("…");
  for (let i = mulai; i <= selesai; i += 1) hasil.push(i);
  if (selesai < total - 1) hasil.push("…");
  hasil.push(total);
  return hasil;
}

export default function KelolaSpmb() {
  const [daftar, setDaftar] = useState<PendaftarItem[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan>({ semua: angkaKosong() });
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabJurusan>("semua");
  const [status, setStatus] = useState<string>("semua");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [cari, setCari] = useState("");
  const [cariDipakai, setCariDipakai] = useState("");

  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const [sibuk, setSibuk] = useState(false);
  const [detail, setDetail] = useState<PendaftarItem | null>(null);
  const [eksporTerbuka, setEksporTerbuka] = useState(false);
  const [mengekspor, setMengekspor] = useState<StatusEkspor | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        status,
        jurusan: tab,
      });
      if (cariDipakai) params.set("q", cariDipakai);

      const res = await fetch(`/api/admin/spmb?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data: JawabanDaftar = await res.json().catch(() => ({} as JawabanDaftar));

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Gagal memuat daftar pendaftar.");
        setDaftar([]);
        return;
      }

      // Halaman terakhir bisa menyusut setelah tab / status / keputusan berubah.
      if (data.totalPages && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setDaftar(Array.isArray(data.data) ? data.data : []);
      setRingkasan(data.ringkasan ?? { semua: angkaKosong() });
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("Tidak dapat terhubung ke server.");
      setDaftar([]);
    } finally {
      setMemuat(false);
    }
  }, [page, perPage, cariDipakai, status, tab]);

  useEffect(() => {
    muat();
  }, [muat]);

  // Pencarian ditunda sebentar agar tidak memanggil API tiap ketikan.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      setCariDipakai(cari.trim());
    }, 400);
    return () => window.clearTimeout(t);
  }, [cari]);

  // Pilihan hanya berlaku untuk halaman/filter yang sedang tampil.
  useEffect(() => {
    setTerpilih(new Set());
  }, [page, perPage, tab, status, cariDipakai]);

  // Menu ekspor ditutup dengan Escape atau klik di luar.
  useEffect(() => {
    if (!eksporTerbuka) return;
    function diLuar(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-menu-ekspor]")) setEksporTerbuka(false);
    }
    function tombol(e: KeyboardEvent) {
      if (e.key === "Escape") setEksporTerbuka(false);
    }
    document.addEventListener("mousedown", diLuar);
    document.addEventListener("keydown", tombol);
    return () => {
      document.removeEventListener("mousedown", diLuar);
      document.removeEventListener("keydown", tombol);
    };
  }, [eksporTerbuka]);

  const hitungTab = ringkasan[tab] ?? angkaKosong();
  const adaFilter = status !== "semua" || Boolean(cariDipakai);

  const idHalaman = useMemo(() => daftar.map((d) => d.id), [daftar]);
  const semuaTerpilih = idHalaman.length > 0 && idHalaman.every((id) => terpilih.has(id));
  const sebagianTerpilih = idHalaman.some((id) => terpilih.has(id)) && !semuaTerpilih;

  function tampilToast(pesan: string) {
    setToast(pesan);
    window.setTimeout(() => setToast(null), 5000);
  }

  function ubahPilihan(id: string) {
    setTerpilih((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  function pilihSemuaHalaman(centang: boolean) {
    setTerpilih(centang ? new Set(idHalaman) : new Set());
  }

  async function jalankanAksi(aksi: AksiSeleksi, ids: string[]) {
    if (ids.length === 0) return false;
    setSibuk(true);
    try {
      const res = await fetch("/api/admin/spmb", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aksi, ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        tampilToast(data.message ?? "Aksi gagal dijalankan.");
        return false;
      }
      tampilToast(data.message ?? "Keputusan tersimpan.");
      setTerpilih(new Set());
      setDetail(null);
      await muat();
      return true;
    } catch {
      tampilToast("Tidak dapat terhubung ke server.");
      return false;
    } finally {
      setSibuk(false);
    }
  }

  async function unduhExcel(statusEkspor: StatusEkspor) {
    setEksporTerbuka(false);
    setMengekspor(statusEkspor);
    try {
      const params = new URLSearchParams({ status: statusEkspor });
      if (tab !== "semua") params.set("jurusan", tab);
      if (cariDipakai) params.set("q", cariDipakai);

      const res = await fetch(`/api/admin/spmb/ekspor?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        tampilToast(data?.message ?? "Ekspor gagal. Coba lagi.");
        return;
      }

      const blob = await res.blob();
      const nama = namaBerkas(
        res.headers.get("Content-Disposition"),
        `spmb-${tab === "semua" ? "semua-jurusan" : tab.toLowerCase()}-${statusEkspor}.xlsx`
      );

      const url = URL.createObjectURL(blob);
      const tautan = document.createElement("a");
      tautan.href = url;
      tautan.download = nama;
      document.body.appendChild(tautan);
      tautan.click();
      tautan.remove();
      URL.revokeObjectURL(url);

      tampilToast(`Berhasil mengunduh ${nama}.`);
    } catch {
      tampilToast("Tidak dapat mengunduh file. Periksa koneksi Anda.");
    } finally {
      setMengekspor(null);
    }
  }

  const awal = total === 0 ? 0 : (page - 1) * perPage + 1;
  const akhir = Math.min(page * perPage, total);

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            role="status"
            className="fixed right-4 top-20 z-[95] max-w-sm rounded-2xl border border-emerald-300/30 bg-[#021024]/95 px-4 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-xl sm:right-6"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab jurusan */}
      <div
        role="tablist"
        aria-label="Tabel pendaftar per jurusan"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-[#021024]/10 bg-white p-1.5 shadow-sm"
      >
        {(
          [
            { nilai: "semua" as TabJurusan, label: "Semua", ket: "Seluruh pendaftar" },
            ...JURUSAN.map((j) => ({
              nilai: j.kode as TabJurusan,
              label: j.kode,
              ket: j.nama,
            })),
          ] as { nilai: TabJurusan; label: string; ket: string }[]
        ).map((item) => {
          const angka = ringkasan[item.nilai] ?? angkaKosong();
          const aktif = tab === item.nilai;
          return (
            <button
              key={item.nilai}
              type="button"
              role="tab"
              aria-selected={aktif}
              title={item.ket}
              onClick={() => {
                setTab(item.nilai);
                setPage(1);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                aktif
                  ? "bg-[#052659] text-[#C1E8FF] shadow-sm"
                  : "text-[#021024]/60 hover:bg-[#021024]/5 hover:text-[#021024]"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  aktif ? "bg-[#C1E8FF] text-[#052659]" : "bg-[#021024]/8 text-[#021024]/55"
                }`}
              >
                {angka.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pencarian, status, ekspor */}
      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#021024]/35"
          />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama, email, asal sekolah, atau nomor HP…"
            className="w-full rounded-full border border-[#021024]/12 bg-white py-3 pl-11 pr-4 text-sm text-[#021024] shadow-sm outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25"
          />
        </label>

        <div
          role="group"
          aria-label="Saring status pendaftar"
          className="flex shrink-0 gap-1 overflow-x-auto rounded-full border border-[#021024]/10 bg-white p-1 shadow-sm"
        >
          {STATUS.map((item) => {
            const aktif = status === item.nilai;
            const jumlah =
              item.nilai === "semua" ? hitungTab.total : hitungTab[item.nilai];
            return (
              <button
                key={item.nilai}
                type="button"
                aria-pressed={aktif}
                onClick={() => {
                  setStatus(item.nilai);
                  setPage(1);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  aktif
                    ? "bg-[#052659] text-[#C1E8FF]"
                    : "text-[#021024]/55 hover:bg-[#021024]/5 hover:text-[#021024]"
                }`}
              >
                {item.label}
                <span className="tabular-nums opacity-70">{jumlah}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative" data-menu-ekspor>
            <button
              type="button"
              onClick={() => setEksporTerbuka((buka) => !buka)}
              aria-haspopup="menu"
              aria-expanded={eksporTerbuka}
              disabled={mengekspor !== null || memuat}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#021024]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#021024]/70 shadow-sm transition hover:bg-[#021024]/5 disabled:opacity-50"
            >
              <FileSpreadsheet size={15} />
              {mengekspor ? "Menyiapkan…" : "Ekspor Excel"}
              <ChevronDown
                size={14}
                className={`transition ${eksporTerbuka ? "rotate-180" : ""}`}
              />
            </button>

            {eksporTerbuka && (
              <div
                role="menu"
                aria-label="Pilih isi file ekspor"
                className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[#021024]/10 bg-white p-1.5 shadow-2xl"
              >
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#2F5F8F]/70">
                  {tab === "semua" ? "Semua jurusan" : `Jurusan ${tab}`}
                </p>
                {EKSPOR.map((item) => {
                  const jumlah =
                    item.nilai === "diterima"
                      ? hitungTab.diterima
                      : item.nilai === "ditolak"
                        ? hitungTab.ditolak
                        : hitungTab.total;
                  return (
                    <button
                      key={item.nilai}
                      type="button"
                      role="menuitem"
                      onClick={() => unduhExcel(item.nilai)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#021024]/75 transition hover:bg-[#F4F9FF] hover:text-[#021024]"
                    >
                      <Download size={15} className="shrink-0 text-[#2F5F8F]" />
                      {item.label}
                      <span className="ml-auto rounded-full bg-[#021024]/8 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#021024]/55">
                        {jumlah}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => muat()}
            disabled={memuat}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#021024]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#021024]/70 shadow-sm transition hover:bg-[#021024]/5 disabled:opacity-50"
          >
            <RefreshCw size={15} className={memuat ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>
      </div>

      {/* Aksi cepat */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#021024]/10 bg-white px-4 py-3 shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#021024]/55">
          <Check size={14} className="text-[#2F5F8F]" />
          {terpilih.size > 0
            ? `${terpilih.size} pendaftar dipilih`
            : "Centang pendaftar untuk memakai aksi cepat"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => jalankanAksi("terima", Array.from(terpilih))}
            disabled={terpilih.size === 0 || sibuk}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 size={14} />
            Terima
            {terpilih.size > 0 ? ` (${terpilih.size})` : ""}
          </button>

          <button
            type="button"
            onClick={() => jalankanAksi("tolak", Array.from(terpilih))}
            disabled={terpilih.size === 0 || sibuk}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <XCircle size={14} />
            Tolak
            {terpilih.size > 0 ? ` (${terpilih.size})` : ""}
          </button>

          {terpilih.size > 0 && (
            <button
              type="button"
              onClick={() => setTerpilih(new Set())}
              className="rounded-full px-3 py-2 text-xs font-semibold text-[#021024]/50 transition hover:bg-[#021024]/5 hover:text-[#021024]"
            >
              Kosongkan
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Tabel */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-[#021024]/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#021024]/10 bg-[#F4F9FF]/80 text-[11px] uppercase tracking-[.12em] text-[#2F5F8F]/70">
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua pendaftar di halaman ini"
                    checked={semuaTerpilih}
                    ref={(el) => {
                      if (el) el.indeterminate = sebagianTerpilih;
                    }}
                    onChange={(e) => pilihSemuaHalaman(e.target.checked)}
                    className="size-4 cursor-pointer accent-[#052659]"
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-bold">Pendaftar</th>
                <th scope="col" className="px-4 py-3 font-bold">Jenis kelamin</th>
                <th scope="col" className="px-4 py-3 font-bold">Tgl lahir</th>
                <th scope="col" className="px-4 py-3 font-bold">Asal sekolah</th>
                <th scope="col" className="px-4 py-3 font-bold">Jurusan</th>
                <th scope="col" className="px-4 py-3 font-bold">Kontak</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {memuat ? (
                Array.from({ length: Math.min(perPage, 8) }).map((_, i) => (
                  <tr key={i} className="border-b border-[#021024]/5 last:border-0">
                    <td className="px-4 py-4">
                      <div className="size-4 animate-pulse rounded bg-[#021024]/10" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 animate-pulse rounded-full bg-[#021024]/10" />
                        <div className="space-y-2">
                          <div className="h-3.5 w-36 animate-pulse rounded bg-[#021024]/10" />
                          <div className="h-3 w-48 animate-pulse rounded bg-[#021024]/8" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 w-16 animate-pulse rounded bg-[#021024]/8" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : daftar.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#052659]/8 text-[#052659]">
                      <ClipboardList size={24} />
                    </span>
                    <p className="mt-4 text-lg font-bold text-[#021024]">
                      {adaFilter
                        ? "Tidak ada pendaftar yang cocok"
                        : tab === "semua"
                          ? "Belum ada pendaftar"
                          : `Belum ada pendaftar jurusan ${tab}`}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#021024]/55">
                      {adaFilter
                        ? "Coba kata kunci atau status yang lain."
                        : "Pendaftaran dari halaman /spmb akan muncul di sini."}
                    </p>
                  </td>
                </tr>
              ) : (
                daftar.map((item) => {
                  const statusItem = labelStatus(item.status);
                  const inisial = (item.nama || item.email || "?").trim().charAt(0).toUpperCase() || "?";
                  const dipilih = terpilih.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-[#021024]/5 transition last:border-0 ${
                        dipilih ? "bg-[#C1E8FF]/25" : "hover:bg-[#F4F9FF]/70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${item.nama}`}
                          checked={dipilih}
                          onChange={() => ubahPilihan(item.id)}
                          className="size-4 cursor-pointer accent-[#052659]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
                            {inisial}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[200px] truncate font-semibold text-[#021024]">
                              {item.nama}
                            </span>
                            <span className="flex max-w-[220px] items-center gap-1.5 truncate text-xs text-[#021024]/45">
                              <Mail size={11} className="shrink-0" />
                              {item.email}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#021024]/70">
                        {item.jenis_kelamin}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#021024]/70">
                        {formatTanggal(item.tanggal_lahir)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[220px] truncate text-[#021024]/70">
                          {item.asal_sekolah}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap items-center gap-1">
                          <span className="rounded-full bg-[#052659] px-2 py-0.5 text-[11px] font-bold text-[#C1E8FF]">
                            {item.jurusan_1}
                          </span>
                          <span className="rounded-full border border-[#021024]/15 px-2 py-0.5 text-[11px] font-semibold text-[#021024]/60">
                            {item.jurusan_2}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[#021024]/75">
                        {item.no_hp}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusItem.kelas}`}
                        >
                          {statusItem.teks}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetail(item)}
                            aria-label={`Lihat detail ${item.nama}`}
                            title="Lihat detail"
                            className="grid size-8 place-items-center rounded-full text-[#052659] transition hover:bg-[#052659]/10"
                          >
                            <Eye size={15} />
                          </button>
                          {item.status !== "diterima" && (
                            <button
                              type="button"
                              onClick={() => jalankanAksi("terima", [item.id])}
                              disabled={sibuk}
                              aria-label={`Terima ${item.nama}`}
                              title="Terima"
                              className="grid size-8 place-items-center rounded-full text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {item.status !== "ditolak" && (
                            <button
                              type="button"
                              onClick={() => jalankanAksi("tolak", [item.id])}
                              disabled={sibuk}
                              aria-label={`Tolak ${item.nama}`}
                              title="Tolak"
                              className="grid size-8 place-items-center rounded-full text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {item.status !== "menunggu" && (
                            <button
                              type="button"
                              onClick={() => jalankanAksi("menunggu", [item.id])}
                              disabled={sibuk}
                              aria-label={`Batalkan keputusan ${item.nama}`}
                              title="Batalkan keputusan"
                              className="grid size-8 place-items-center rounded-full text-[#021024]/45 transition hover:bg-[#021024]/5 disabled:opacity-40"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi */}
        <div className="flex flex-col gap-3 border-t border-[#021024]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#021024]/50">
            Menampilkan <strong className="text-[#021024]">{awal}</strong>–
            <strong className="text-[#021024]">{akhir}</strong> dari{" "}
            <strong className="text-[#021024]">{total}</strong> pendaftar
            {tab === "semua" ? "" : ` jurusan ${tab}`}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-[#021024]/50">
              Baris
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-full border border-[#021024]/12 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#021024] outline-none"
              >
                {PER_PAGE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || memuat}
              aria-label="Halaman sebelumnya"
              className="grid size-8 place-items-center rounded-full border border-[#021024]/12 bg-white text-[#021024]/60 transition hover:bg-[#021024]/5 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>

            {nomorHalaman(page, totalPages).map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="px-1 text-xs text-[#021024]/35">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`min-w-8 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                    n === page
                      ? "bg-[#052659] text-white"
                      : "border border-[#021024]/12 bg-white text-[#021024]/60 hover:bg-[#021024]/5"
                  }`}
                >
                  {n}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || memuat}
              aria-label="Halaman berikutnya"
              className="grid size-8 place-items-center rounded-full border border-[#021024]/12 bg-white text-[#021024]/60 transition hover:bg-[#021024]/5 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal detail */}
      {detail && (
        <ModalDetail
          key={detail.id}
          item={detail}
          sibuk={sibuk}
          onTutup={() => !sibuk && setDetail(null)}
          onAksi={(aksi) => jalankanAksi(aksi, [detail.id])}
        />
      )}
    </div>
  );
}

/* ====================== Modal detail satu pendaftar ====================== */
function ModalDetail({
  item,
  sibuk,
  onTutup,
  onAksi,
}: {
  item: PendaftarItem;
  sibuk: boolean;
  onTutup: () => void;
  onAksi: (aksi: AksiSeleksi) => void;
}) {
  const status = labelStatus(item.status);

  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm"
      onClick={onTutup}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Detail pendaftar ${item.nama}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#2F5F8F]/70">
              Detail pendaftar SPMB
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-[#021024]">{item.nama}</h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#021024]/45">
              <Mail size={12} className="shrink-0" />
              {item.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            disabled={sibuk}
            aria-label="Tutup"
            className="grid size-8 shrink-0 place-items-center rounded-full text-[#021024]/40 transition hover:bg-[#021024]/5 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${status.kelas}`}
          >
            {status.teks}
          </span>
          <span className="text-[11px] text-[#021024]/45">
            {item.status === "menunggu"
              ? `Mendaftar ${formatWaktu(item.created_at)}`
              : `Diputuskan ${formatWaktu(item.status_diubah_at)}`}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <BarisDetail label="Jenis kelamin" nilai={item.jenis_kelamin} kapital />
          <BarisDetail
            label="Tempat & tanggal lahir"
            nilai={`${item.tempat_lahir}, ${formatTanggal(item.tanggal_lahir)}`}
          />
          <BarisDetail label="Asal sekolah" nilai={item.asal_sekolah} />
          <BarisDetail label="No. HP / WhatsApp" nilai={item.no_hp} mono />
          <BarisDetail
            label="Pilihan jurusan 1"
            nilai={`${item.jurusan_1} — ${namaJurusan(item.jurusan_1)}`}
          />
          <BarisDetail
            label="Pilihan jurusan 2"
            nilai={`${item.jurusan_2} — ${namaJurusan(item.jurusan_2)}`}
          />
          <BarisDetail label="Nama orang tua / wali" nilai={item.nama_wali} />
          <BarisDetail label="No. HP / WhatsApp wali" nilai={item.no_hp_wali} mono />
        </div>

        <div className="mt-3">
          <BarisDetail label="Alamat tempat tinggal" nilai={item.alamat} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTutup}
            disabled={sibuk}
            className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
          >
            Tutup
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {item.status !== "menunggu" && (
              <button
                type="button"
                onClick={() => onAksi("menunggu")}
                disabled={sibuk}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Batalkan keputusan
              </button>
            )}
            {item.status !== "ditolak" && (
              <button
                type="button"
                onClick={() => onAksi("tolak")}
                disabled={sibuk}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle size={15} />
                Tolak
              </button>
            )}
            {item.status !== "diterima" && (
              <button
                type="button"
                onClick={() => onAksi("terima")}
                disabled={sibuk}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                Terima
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BarisDetail({
  label,
  nilai,
  mono = false,
  kapital = false,
}: {
  label: string;
  nilai: string;
  mono?: boolean;
  kapital?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#021024]/10 bg-[#F4F9FF]/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#2F5F8F]/70">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-relaxed text-[#021024] ${
          mono ? "font-mono tracking-wide" : ""
        } ${kapital ? "capitalize" : ""}`}
      >
        {nilai || "—"}
      </p>
    </div>
  );
}
