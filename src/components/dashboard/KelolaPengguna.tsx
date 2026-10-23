"use client";

/**
 * components/dashboard/KelolaPengguna.tsx
 * ---------------------------------------------------------------------------
 * Tabel data pengguna untuk admin:
 *   - cari (nama/NISN), paginasi
 *   - dialog filter: role, jurusan, kelas, status NISN, urutan & arah
 *   - centang per baris + "pilih semua" di halaman ini
 *   - aksi cepat: Naikkan kelas, Hapus (dua konfirmasi)
 *   - edit nama, NISN, jurusan, kelas, dan role (password tidak diubah)
 * ---------------------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { JURUSAN, KELAS } from "@/lib/sekolah";

interface PenggunaItem {
  id: string;
  nama: string | null;
  email: string | null;
  role: string | null;
  nisn: string | null;
  jurusan: string | null;
  kelas: string | null;
  verification_status: string | null;
}

interface Ringkasan {
  total: number;
  siswa: number;
  guru: number;
  admin: number;
  menunggu: number;
}

interface JawabanDaftar {
  ok: boolean;
  message?: string;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  lengkap?: boolean;
  data: PenggunaItem[];
  ringkasan: Ringkasan;
}

const ROLE = [
  { nilai: "siswa", label: "Siswa" },
  { nilai: "guru", label: "Guru" },
  { nilai: "admin", label: "Admin" },
] as const;

const PER_PAGE = [10, 25, 50];

const STATUS_NISN = [
  { nilai: "belum", label: "Belum" },
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "terverifikasi", label: "Terverifikasi" },
  { nilai: "ditolak", label: "Ditolak" },
] as const;

interface FilterPengguna {
  role: string;
  jurusan: string;
  kelas: string;
  status: string;
  urut: "nama" | "terbaru";
  arah: "asc" | "desc";
}

const FILTER_AWAL: FilterPengguna = {
  role: "semua",
  jurusan: "semua",
  kelas: "semua",
  status: "semua",
  urut: "nama",
  arah: "asc",
};

function labelRole(role: string | null) {
  if (role === "admin") return { teks: "Admin", kelas: "bg-violet-50 text-violet-700 border-violet-200" };
  if (role === "guru") return { teks: "Guru", kelas: "bg-[#E4F3FF] text-[#052659] border-[#7DA0CA]/40" };
  return { teks: "Siswa", kelas: "bg-[#021024]/5 text-[#021024]/60 border-[#021024]/10" };
}

function labelVerifikasi(status: string | null) {
  switch (status) {
    case "terverifikasi":
      return { teks: "Terverifikasi", kelas: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "menunggu":
      return { teks: "Menunggu", kelas: "bg-amber-50 text-amber-700 border-amber-200" };
    case "ditolak":
      return { teks: "Ditolak", kelas: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { teks: "Belum", kelas: "bg-[#021024]/5 text-[#021024]/50 border-[#021024]/10" };
  }
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

export default function KelolaPengguna() {
  const [daftar, setDaftar] = useState<PenggunaItem[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan>({
    total: 0,
    siswa: 0,
    guru: 0,
    admin: 0,
    menunggu: 0,
  });
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [cari, setCari] = useState("");
  const [cariDipakai, setCariDipakai] = useState("");
  const [filter, setFilter] = useState<FilterPengguna>(FILTER_AWAL);
  const [filterTerbuka, setFilterTerbuka] = useState(false);

  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const [sibuk, setSibuk] = useState(false);

  const [editTarget, setEditTarget] = useState<PenggunaItem | null>(null);
  const [hapusTarget, setHapusTarget] = useState<PenggunaItem[] | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        role: filter.role,
        jurusan: filter.jurusan,
        kelas: filter.kelas,
        status: filter.status,
        urut: filter.urut,
        arah: filter.arah,
      });
      if (cariDipakai) params.set("q", cariDipakai);

      const res = await fetch(`/api/admin/pengguna?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data: JawabanDaftar = await res.json().catch(() => ({} as JawabanDaftar));

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Gagal memuat daftar pengguna.");
        setDaftar([]);
        return;
      }

      // Halaman terakhir bisa menyusut setelah penghapusan.
      if (data.totalPages && page > data.totalPages) {
        setPage(data.totalPages);
        return;
      }

      setDaftar(Array.isArray(data.data) ? data.data : []);
      setRingkasan(
        data.ringkasan ?? { total: 0, siswa: 0, guru: 0, admin: 0, menunggu: 0 }
      );
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("Tidak dapat terhubung ke server.");
      setDaftar([]);
    } finally {
      setMemuat(false);
    }
  }, [page, perPage, cariDipakai, filter]);

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
  }, [page, perPage, filter, cariDipakai]);

  const jumlahFilter = [
    filter.role !== "semua",
    filter.jurusan !== "semua",
    filter.kelas !== "semua",
    filter.status !== "semua",
  ].filter(Boolean).length;
  const adaFilter = jumlahFilter > 0 || Boolean(cariDipakai);
  // Urutan bukan filter, tapi tombol Atur ulang juga mengembalikannya.
  const urutBerubah = filter.urut !== FILTER_AWAL.urut || filter.arah !== FILTER_AWAL.arah;

  const idHalaman = useMemo(() => daftar.map((d) => d.id), [daftar]);
  const semuaTerpilih = idHalaman.length > 0 && idHalaman.every((id) => terpilih.has(id));
  const sebagianTerpilih = idHalaman.some((id) => terpilih.has(id)) && !semuaTerpilih;

  const penggunaTerpilih = useMemo(
    () => daftar.filter((d) => terpilih.has(d.id)),
    [daftar, terpilih]
  );

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

  async function aksiMassal(aksi: "naikkan-kelas" | "hapus", ids: string[]) {
    setSibuk(true);
    try {
      const res = await fetch("/api/admin/pengguna", {
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
      tampilToast(data.message ?? "Aksi berhasil.");
      setTerpilih(new Set());
      setHapusTarget(null);
      await muat();
      return true;
    } catch {
      tampilToast("Tidak dapat terhubung ke server.");
      return false;
    } finally {
      setSibuk(false);
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

      {/* Ringkasan */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total pengguna", nilai: ringkasan.total, ikon: Users },
          { label: "Siswa", nilai: ringkasan.siswa, ikon: GraduationCap },
          { label: "Guru", nilai: ringkasan.guru, ikon: UserRound },
          { label: "Menunggu NISN", nilai: ringkasan.menunggu, ikon: ShieldCheck },
        ].map(({ label, nilai, ikon: Ikon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-3xl border border-[#021024]/10 bg-white p-5 shadow-sm"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#052659] text-[#C1E8FF]">
              <Ikon size={18} />
            </span>
            <span>
              <span className="block text-2xl font-bold tabular-nums text-[#021024]">{nilai}</span>
              <span className="block text-[11px] font-medium uppercase tracking-[.12em] text-[#021024]/45">
                {label}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Pencarian + filter */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#021024]/35"
          />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau NISN…"
            className="w-full rounded-full border border-[#021024]/12 bg-white py-3 pl-11 pr-4 text-sm text-[#021024] shadow-sm outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25"
          />
        </label>

        <button
          type="button"
          onClick={() => setFilterTerbuka(true)}
          aria-haspopup="dialog"
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            jumlahFilter > 0
              ? "border-[#052659] bg-[#052659] text-[#C1E8FF] hover:bg-[#021024] hover:text-white"
              : "border-[#021024]/12 bg-white text-[#021024]/70 hover:bg-[#021024]/5"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filter
          {jumlahFilter > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-[#C1E8FF] px-1.5 text-[10px] font-bold text-[#052659]">
              {jumlahFilter}
            </span>
          )}
        </button>

        {(jumlahFilter > 0 || urutBerubah) && (
          <button
            type="button"
            onClick={() => {
              setFilter(FILTER_AWAL);
              setPage(1);
            }}
            className="rounded-full px-3 py-2.5 text-xs font-semibold text-[#021024]/50 transition hover:bg-[#021024]/5 hover:text-[#021024]"
          >
            Atur ulang
          </button>
        )}

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

      {/* Aksi cepat */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#021024]/10 bg-white px-4 py-3 shadow-sm">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#021024]/55">
          <Check size={14} className="text-[#2F5F8F]" />
          {terpilih.size > 0
            ? `${terpilih.size} pengguna dipilih`
            : "Centang pengguna untuk memakai aksi cepat"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => aksiMassal("naikkan-kelas", Array.from(terpilih))}
            disabled={terpilih.size === 0 || sibuk}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#052659] px-4 py-2 text-xs font-semibold text-[#C1E8FF] transition hover:bg-[#021024] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp size={14} />
            Naikkan kelas
            {terpilih.size > 0 ? ` (${terpilih.size})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setHapusTarget(penggunaTerpilih)}
            disabled={terpilih.size === 0 || sibuk}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            Hapus
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
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#021024]/10 bg-[#F4F9FF]/80 text-[11px] uppercase tracking-[.12em] text-[#2F5F8F]/70">
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua pengguna di halaman ini"
                    checked={semuaTerpilih}
                    ref={(el) => {
                      if (el) el.indeterminate = sebagianTerpilih;
                    }}
                    onChange={(e) => pilihSemuaHalaman(e.target.checked)}
                    className="size-4 cursor-pointer accent-[#052659]"
                  />
                </th>
                <th scope="col" className="px-4 py-3 font-bold">Pengguna</th>
                <th scope="col" className="px-4 py-3 font-bold">Role</th>
                <th scope="col" className="px-4 py-3 font-bold">NISN</th>
                <th scope="col" className="px-4 py-3 font-bold">Jurusan</th>
                <th scope="col" className="px-4 py-3 font-bold">Kelas</th>
                <th scope="col" className="px-4 py-3 font-bold">Status NISN</th>
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
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 w-16 animate-pulse rounded bg-[#021024]/8" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : daftar.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#052659]/8 text-[#052659]">
                      <Users size={24} />
                    </span>
                    <p className="mt-4 text-lg font-bold text-[#021024]">
                      {adaFilter ? "Tidak ada pengguna yang cocok" : "Belum ada pengguna"}
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#021024]/55">
                      {adaFilter
                        ? "Coba kata kunci atau filter yang lain."
                        : "Pengguna akan muncul di sini setelah mereka mendaftar."}
                    </p>
                  </td>
                </tr>
              ) : (
                daftar.map((item) => {
                  const role = labelRole(item.role);
                  const status = labelVerifikasi(item.verification_status);
                  const inisial = (item.nama ?? item.email ?? "?").trim().charAt(0).toUpperCase() || "?";
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
                          aria-label={`Pilih ${item.nama ?? item.email ?? "pengguna"}`}
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
                            <span className="block max-w-[220px] truncate font-semibold text-[#021024]">
                              {item.nama ?? "Tanpa nama"}
                            </span>
                            <span className="flex max-w-[240px] items-center gap-1.5 truncate text-xs text-[#021024]/45">
                              <Mail size={11} className="shrink-0" />
                              {item.email ?? "—"}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${role.kelas}`}>
                          {role.teks}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tracking-[.1em] text-[#021024]/75">
                        {item.nisn ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#021024]/70">{item.jurusan ?? "—"}</td>
                      <td className="px-4 py-3 text-[#021024]/70">{item.kelas ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.kelas}`}>
                          {status.teks}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditTarget(item)}
                            aria-label={`Edit ${item.nama ?? "pengguna"}`}
                            title="Edit data"
                            className="grid size-8 place-items-center rounded-full text-[#052659] transition hover:bg-[#052659]/10"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setHapusTarget([item])}
                            aria-label={`Hapus ${item.nama ?? "pengguna"}`}
                            title="Hapus pengguna"
                            className="grid size-8 place-items-center rounded-full text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
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
            <strong className="text-[#021024]">{total}</strong> pengguna
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

      {/* Dialog filter & urutan */}
      {filterTerbuka && (
        <DialogFilter
          awal={filter}
          onTutup={() => setFilterTerbuka(false)}
          onTerapkan={(baru) => {
            setFilter(baru);
            setPage(1);
            setFilterTerbuka(false);
          }}
        />
      )}

      {/* Modal edit */}
      {editTarget && (
        <ModalEdit
          key={editTarget.id}
          item={editTarget}
          onTutup={() => setEditTarget(null)}
          onSukses={async (pesan) => {
            setEditTarget(null);
            tampilToast(pesan);
            await muat();
          }}
        />
      )}

      {/* Dua konfirmasi hapus */}
      {hapusTarget && hapusTarget.length > 0 && (
        <DialogHapus
          key={hapusTarget.map((h) => h.id).join("-")}
          target={hapusTarget}
          sibuk={sibuk}
          onTutup={() => !sibuk && setHapusTarget(null)}
          onHapus={async () => {
            const ids = hapusTarget.map((t) => t.id);
            await aksiMassal("hapus", ids);
          }}
        />
      )}
    </div>
  );
}

/* ==================== Dialog filter & urutan daftar ==================== */
function DialogFilter({
  awal,
  onTutup,
  onTerapkan,
}: {
  awal: FilterPengguna;
  onTutup: () => void;
  onTerapkan: (filter: FilterPengguna) => void;
}) {
  const [draf, setDraf] = useState<FilterPengguna>(awal);

  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, []);

  function ubah<K extends keyof FilterPengguna>(kunci: K, nilai: FilterPengguna[K]) {
    setDraf((lama) => ({ ...lama, [kunci]: nilai }));
  }

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
        aria-label="Filter dan urutan pengguna"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#2F5F8F]/70">
              Saring daftar
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#021024]">Filter pengguna</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#021024]/45">
              Pilih kriteria, lalu tekan Terapkan. Filter berlaku bersama pencarian.
            </p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="grid size-8 place-items-center rounded-full text-[#021024]/40 transition hover:bg-[#021024]/5"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onTerapkan(draf);
          }}
          className="mt-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <PilihanFilter label="Role" nilai={draf.role} onUbah={(v) => ubah("role", v)}>
              <option value="semua">Semua role</option>
              {ROLE.map((r) => (
                <option key={r.nilai} value={r.nilai}>
                  {r.label}
                </option>
              ))}
            </PilihanFilter>

            <PilihanFilter label="Jurusan" nilai={draf.jurusan} onUbah={(v) => ubah("jurusan", v)}>
              <option value="semua">Semua jurusan</option>
              {JURUSAN.map((j) => (
                <option key={j.kode} value={j.kode}>
                  {j.kode} — {j.nama}
                </option>
              ))}
              <option value="kosong">Belum diisi</option>
            </PilihanFilter>

            <PilihanFilter label="Kelas" nilai={draf.kelas} onUbah={(v) => ubah("kelas", v)}>
              <option value="semua">Semua kelas</option>
              {KELAS.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {k.nama}
                </option>
              ))}
              <option value="kosong">Belum diisi</option>
            </PilihanFilter>

            <PilihanFilter label="Status NISN" nilai={draf.status} onUbah={(v) => ubah("status", v)}>
              <option value="semua">Semua status</option>
              {STATUS_NISN.map((s) => (
                <option key={s.nilai} value={s.nilai}>
                  {s.label}
                </option>
              ))}
            </PilihanFilter>
          </div>

          <div className="mt-5 rounded-2xl border border-[#021024]/10 bg-[#F4F9FF] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#2F5F8F]/70">
              Urutan
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <PilihanFilter
                label="Urutkan berdasarkan"
                nilai={draf.urut}
                onUbah={(v) => ubah("urut", v === "terbaru" ? "terbaru" : "nama")}
              >
                <option value="nama">Alfabetis (nama)</option>
                <option value="terbaru">Terbaru (tanggal daftar)</option>
              </PilihanFilter>

              <PilihanFilter
                label="Arah"
                nilai={draf.arah}
                onUbah={(v) => ubah("arah", v === "desc" ? "desc" : "asc")}
              >
                {draf.urut === "terbaru" ? (
                  <>
                    <option value="asc">Naik (terlama dulu)</option>
                    <option value="desc">Turun (terbaru dulu)</option>
                  </>
                ) : (
                  <>
                    <option value="asc">Naik (A → Z)</option>
                    <option value="desc">Turun (Z → A)</option>
                  </>
                )}
              </PilihanFilter>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDraf(FILTER_AWAL)}
              className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5"
            >
              Atur ulang
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onTutup}
                className="rounded-full px-4 py-2.5 text-sm font-semibold text-[#021024]/60 transition hover:bg-[#021024]/5"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#052659] px-5 py-2.5 text-sm font-semibold text-[#C1E8FF] transition hover:bg-[#021024] hover:text-white"
              >
                Terapkan
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function PilihanFilter({
  label,
  nilai,
  onUbah,
  children,
}: {
  label: string;
  nilai: string;
  onUbah: (nilai: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
        {label}
      </span>
      <select
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-3 py-2.5 text-sm text-[#021024] outline-none transition focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25"
      >
        {children}
      </select>
    </label>
  );
}

/* ======================== Modal edit satu pengguna ======================== */
function ModalEdit({
  item,
  onTutup,
  onSukses,
}: {
  item: PenggunaItem;
  onTutup: () => void;
  onSukses: (pesan: string) => void;
}) {
  const [nama, setNama] = useState(item.nama ?? "");
  const [nisn, setNisn] = useState(item.nisn ?? "");
  const [jurusan, setJurusan] = useState(item.jurusan ?? "");
  const [kelas, setKelas] = useState(item.kelas ?? "");
  const [role, setRole] = useState(item.role ?? "siswa");
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (nisn.trim() && !/^\d{10}$/.test(nisn.replace(/\s+/g, ""))) {
      setError("NISN harus 10 angka (atau kosongkan).");
      return;
    }

    setMenyimpan(true);
    try {
      const res = await fetch("/api/admin/pengguna", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          nama: nama.trim(),
          nisn: nisn.trim(),
          jurusan,
          kelas,
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Gagal menyimpan perubahan.");
        return;
      }
      onSukses(data.message ?? "Data pengguna diperbarui.");
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm"
      onClick={() => !menyimpan && onTutup()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit data ${item.nama ?? "pengguna"}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#2F5F8F]/70">
              Edit pengguna
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#021024]">
              {item.nama ?? item.email ?? "Pengguna"}
            </h3>
            <p className="mt-1 text-xs text-[#021024]/45">{item.email ?? "Tanpa email"}</p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            disabled={menyimpan}
            aria-label="Tutup"
            className="grid size-8 place-items-center rounded-full text-[#021024]/40 transition hover:bg-[#021024]/5 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={simpan} noValidate className="mt-5">
          {error && (
            <p role="alert" className="mb-4 rounded-xl border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <label htmlFor="edit-nama" className="block text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
            Nama lengkap
          </label>
          <input
            id="edit-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            maxLength={120}
            disabled={menyimpan}
            className="mb-4 mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
          />

          <label htmlFor="edit-nisn" className="block text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
            NISN
          </label>
          <input
            id="edit-nisn"
            value={nisn}
            onChange={(e) => setNisn(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="10 angka, kosongkan bila belum ada"
            disabled={menyimpan}
            className="mb-4 mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 font-mono text-sm tracking-[.14em] text-[#021024] outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-jurusan" className="block text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
                Jurusan
              </label>
              <select
                id="edit-jurusan"
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
                disabled={menyimpan}
                className="mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
              >
                <option value="">— Belum diisi —</option>
                {JURUSAN.map((j) => (
                  <option key={j.kode} value={j.kode}>
                    {j.kode} — {j.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-kelas" className="block text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
                Kelas
              </label>
              <select
                id="edit-kelas"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                disabled={menyimpan}
                className="mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
              >
                <option value="">— Belum diisi —</option>
                {KELAS.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="edit-role" className="mt-4 block text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
            Role
          </label>
          <select
            id="edit-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={menyimpan}
            className="mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
          >
            {ROLE.map((r) => (
              <option key={r.nilai} value={r.nilai}>
                {r.label}
              </option>
            ))}
          </select>

          <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#F4F9FF] px-3 py-2.5 text-[11px] leading-relaxed text-[#021024]/50">
            <IdCard size={13} className="mt-0.5 shrink-0" />
            Kata sandi tidak dapat diubah dari panel ini. Mengubah role tidak menghapus data
            NISN, jurusan, atau kelas pengguna.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTutup}
              disabled={menyimpan}
              className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={menyimpan}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#052659] px-4 py-2.5 text-sm font-semibold text-[#C1E8FF] transition hover:bg-[#021024] hover:text-white disabled:opacity-50"
            >
              {menyimpan ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {menyimpan ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ==================== Dialog hapus dengan dua konfirmasi ================== */
function DialogHapus({
  target,
  sibuk,
  onTutup,
  onHapus,
}: {
  target: PenggunaItem[];
  sibuk: boolean;
  onTutup: () => void;
  onHapus: () => void;
}) {
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [ketik, setKetik] = useState("");
  const banyak = target.length > 1;
  const cocok = ketik.trim().toUpperCase() === "HAPUS";

  useEffect(() => {
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, []);

  const contohNama = target
    .slice(0, 3)
    .map((t) => t.nama ?? t.email ?? "Tanpa nama")
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-[96] flex items-center justify-center bg-[#021024]/65 p-4 backdrop-blur-sm"
      onClick={onTutup}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="alertdialog"
        aria-modal="true"
        aria-label="Konfirmasi hapus pengguna"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600">
          <CircleAlert size={22} />
        </span>

        {langkah === 1 ? (
          <>
            <h3 className="mt-4 text-center text-lg font-bold text-[#021024]">
              {banyak ? `Hapus ${target.length} pengguna?` : "Hapus pengguna ini?"}
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-[#021024]/55">
              {banyak ? "Akun berikut" : "Akun"}{" "}
              <strong className="text-[#021024]">{contohNama}</strong>
              {target.length > 3 ? ` dan ${target.length - 3} lainnya` : ""} akan dihapus dari
              tabel pengguna <em>dan</em> autentikasi Supabase.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onTutup}
                className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setLangkah(2)}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Lanjutkan
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="mt-4 text-center text-lg font-bold text-[#021024]">
              Konfirmasi terakhir
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-[#021024]/55">
              Tindakan ini <strong className="text-[#021024]">permanen</strong> dan tidak bisa
              dibatalkan. Ketik <strong className="text-[#021024]">HAPUS</strong> untuk
              melanjutkan.
            </p>
            <input
              value={ketik}
              onChange={(e) => setKetik(e.target.value)}
              placeholder="HAPUS"
              aria-label="Ketik HAPUS untuk konfirmasi"
              disabled={sibuk}
              className="mt-4 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-center font-mono text-sm uppercase tracking-[.2em] text-[#021024] outline-none transition placeholder:text-[#021024]/25 focus:border-red-400 focus:ring-2 focus:ring-red-300/40 disabled:opacity-50"
            />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLangkah(1)}
                disabled={sibuk}
                className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={onHapus}
                disabled={!cocok || sibuk}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {sibuk ? "Menghapus..." : "Hapus permanen"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
