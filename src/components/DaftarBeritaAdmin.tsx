"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ImageOff,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import FormBeritaModal, { type BeritaItem } from "./FormBeritaModal";
import TombolTambahBerita from "./TombolTambahBerita";

function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function potong(teks: string, maks = 120): string {
  if (teks.length <= maks) return teks;
  return teks.slice(0, maks).trimEnd() + "…";
}

export default function DaftarBeritaAdmin() {
  const [daftar, setDaftar] = useState<BeritaItem[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cari, setCari] = useState("");
  const [editTarget, setEditTarget] = useState<BeritaItem | null>(null);
  const [hapusTarget, setHapusTarget] = useState<BeritaItem | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const muat = useCallback(async (keyword?: string) => {
    setMemuat(true);
    setError(null);
    try {
      const url = keyword?.trim()
        ? `/api/berita?q=${encodeURIComponent(keyword.trim())}`
        : "/api/berita";
      const res = await fetch(url, { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Gagal memuat berita.");
        setDaftar([]);
        return;
      }
      setDaftar(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("Tidak dapat terhubung ke server.");
      setDaftar([]);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  // Debounce pencarian.
  useEffect(() => {
    const t = window.setTimeout(() => muat(cari), 450);
    return () => window.clearTimeout(t);
  }, [cari, muat]);

  const statistik = useMemo(() => {
    const total = daftar.length;
    const bergambar = daftar.filter((b) => b.gambar_url).length;
    const bulanIni = daftar.filter((b) => {
      if (!b.created_at) return false;
      const d = new Date(b.created_at);
      const kini = new Date();
      return d.getMonth() === kini.getMonth() && d.getFullYear() === kini.getFullYear();
    }).length;
    return { total, bergambar, bulanIni };
  }, [daftar]);

  function tampilToast(pesan: string) {
    setToast(pesan);
    window.setTimeout(() => setToast(null), 4000);
  }

  async function konfirmasiHapus() {
    if (!hapusTarget) return;
    setMenghapus(true);
    try {
      const res = await fetch(`/api/berita?id=${hapusTarget.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        tampilToast(data.message ?? "Gagal menghapus berita.");
        return;
      }
      tampilToast(data.message ?? "Berita dihapus.");
      setHapusTarget(null);
      muat(cari);
    } catch {
      tampilToast("Tidak dapat terhubung ke server.");
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="fixed right-4 top-20 z-[70] max-w-xs rounded-2xl border border-emerald-300/30 bg-[#021024]/95 px-4 py-3 text-sm text-emerald-200 shadow-2xl backdrop-blur-xl sm:right-6"
        >
          {toast}
        </motion.div>
      )}

      {/* Kartu statistik */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total berita", nilai: statistik.total, ikon: Newspaper },
          { label: "Terbit bulan ini", nilai: statistik.bulanIni, ikon: CalendarDays },
          { label: "Dengan gambar", nilai: statistik.bergambar, ikon: Plus },
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
              <span className="block text-xs font-medium uppercase tracking-[.12em] text-[#021024]/45">
                {label}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar: cari + refresh + tambah */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#021024]/35" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari judul berita…"
            className="w-full rounded-full border border-[#021024]/12 bg-white py-3 pl-11 pr-4 text-sm text-[#021024] shadow-sm outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25"
          />
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => muat(cari)}
            disabled={memuat}
            className="inline-flex items-center gap-2 rounded-full border border-[#021024]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#021024]/70 shadow-sm transition hover:bg-[#021024]/5 disabled:opacity-50"
          >
            <RefreshCw size={15} className={memuat ? "animate-spin" : ""} />
            Muat ulang
          </button>
          <TombolTambahBerita onBerhasil={() => muat(cari)} />
        </div>
      </div>

      {/* Status */}
      {error && (
        <p role="alert" className="mt-5 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Daftar */}
      <div className="mt-6">
        {memuat ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-3xl border border-[#021024]/10 bg-white">
                <div className="aspect-[16/9] bg-[#021024]/8" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-2/3 rounded bg-[#021024]/10" />
                  <div className="h-3 w-full rounded bg-[#021024]/8" />
                  <div className="h-3 w-1/2 rounded bg-[#021024]/8" />
                </div>
              </div>
            ))}
          </div>
        ) : daftar.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[#5483B3]/40 bg-white/70 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-[#052659]/8 text-[#052659]">
              <Newspaper size={24} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#021024]">
              {cari ? "Tidak ada hasil" : "Belum ada berita"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#021024]/55">
              {cari
                ? `Tidak ditemukan berita dengan kata kunci “${cari}”. Coba kata kunci lain.`
                : "Klik Tambah Berita untuk mengunggah berita pertama: gambar sampul, judul, subjudul, dan isi berita."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {daftar.map((b, i) => (
              <motion.article
                key={String(b.id)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-[#021024]/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#052659]/8">
                  {b.gambar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.gambar_url}
                      alt={b.judul}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[#052659]/30">
                      <ImageOff size={32} />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#021024]/80 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                    <CalendarDays size={12} />
                    {formatTanggal(b.created_at)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#021024]">
                    {b.judul}
                  </h3>
                  {b.subjudul ? (
                    <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#2F5F8F]">
                      {b.subjudul}
                    </p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#021024]/55">
                    {potong(b.konten)}
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-[#021024]/8 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditTarget(b)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#052659] px-4 py-2 text-[13px] font-semibold text-[#C1E8FF] transition hover:bg-[#021024] hover:text-white"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setHapusTarget(b)}
                      aria-label={`Hapus ${b.judul}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Modal edit */}
      <FormBeritaModal
        terbuka={Boolean(editTarget)}
        awal={editTarget}
        onTutup={() => setEditTarget(null)}
        onSukses={(pesan) => {
          tampilToast(pesan);
          setEditTarget(null);
          muat(cari);
        }}
      />

      {/* Konfirmasi hapus */}
      {hapusTarget && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm"
          onClick={() => !menghapus && setHapusTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Konfirmasi hapus berita"
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={20} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#021024]">Hapus berita ini?</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#021024]/55">
              “{hapusTarget.judul}” akan dihapus permanen beserta gambarnya. Tindakan ini tidak bisa
              dibatalkan.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={menghapus}
                onClick={() => setHapusTarget(null)}
                className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={menghapus}
                onClick={konfirmasiHapus}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {menghapus ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {menghapus ? "Menghapus..." : "Ya, hapus"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
