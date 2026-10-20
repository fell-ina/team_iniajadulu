"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  IdCard,
  Loader2,
  Mail,
  RefreshCw,
  ShieldQuestion,
  X,
} from "lucide-react";

interface VerifikasiItem {
  id: string;
  nama: string | null;
  email: string | null;
  nisn: string | null;
  verification_status: string;
  verification_note: string | null;
  verification_submitted_at: string | null;
  verified_at: string | null;
}

type StatusTab = "menunggu" | "semua";

function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function labelStatus(status: string) {
  switch (status) {
    case "terverifikasi":
      return { teks: "Terverifikasi", kelas: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "ditolak":
      return { teks: "Ditolak", kelas: "bg-red-50 text-red-700 border-red-200" };
    case "menunggu":
      return { teks: "Menunggu", kelas: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { teks: "Belum kirim", kelas: "bg-[#021024]/5 text-[#021024]/55 border-[#021024]/10" };
  }
}

export default function DaftarVerifikasiNisn() {
  const [tab, setTab] = useState<StatusTab>("menunggu");
  const [daftar, setDaftar] = useState<VerifikasiItem[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [diproses, setDiproses] = useState<string | null>(null);
  const [tolakTarget, setTolakTarget] = useState<VerifikasiItem | null>(null);
  const [catatan, setCatatan] = useState("");

  const muat = useCallback(async (status: StatusTab) => {
    setMemuat(true);
    setError(null);
    try {
      const res = await fetch(`/api/verifikasi?status=${status}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Gagal memuat daftar verifikasi.");
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
    muat(tab);
  }, [tab, muat]);

  const jumlahMenunggu = useMemo(
    () => daftar.filter((d) => d.verification_status === "menunggu").length,
    [daftar]
  );

  function tampilToast(pesan: string) {
    setToast(pesan);
    window.setTimeout(() => setToast(null), 4000);
  }

  async function putuskan(item: VerifikasiItem, aksi: "verifikasi" | "tolak", alasan?: string) {
    setDiproses(item.id);
    try {
      const res = await fetch("/api/verifikasi", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, aksi, catatan: alasan ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        tampilToast(data.message ?? "Gagal menyimpan keputusan.");
        return;
      }
      tampilToast(data.message ?? "Keputusan tersimpan.");
      setTolakTarget(null);
      setCatatan("");
      muat(tab);
    } catch {
      tampilToast("Tidak dapat terhubung ke server.");
    } finally {
      setDiproses(null);
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Filter status verifikasi"
          className="flex overflow-hidden rounded-full border border-[#021024]/12 bg-white p-1 shadow-sm"
        >
          {(
            [
              { nilai: "menunggu", label: "Menunggu" },
              { nilai: "semua", label: "Semua" },
            ] as { nilai: StatusTab; label: string }[]
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
            </button>
          ))}
        </div>

        {tab === "menunggu" && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <ShieldQuestion size={13} />
            {jumlahMenunggu} pengajuan menunggu
          </span>
        )}

        <button
          type="button"
          onClick={() => muat(tab)}
          disabled={memuat}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#021024]/12 bg-white px-4 py-2.5 text-sm font-semibold text-[#021024]/70 shadow-sm transition hover:bg-[#021024]/5 disabled:opacity-50"
        >
          <RefreshCw size={15} className={memuat ? "animate-spin" : ""} />
          Muat ulang
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Daftar */}
      <div className="mt-5">
        {memuat ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl border border-[#021024]/10 bg-white p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-[#021024]/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-[#021024]/10" />
                    <div className="h-3 w-1/3 rounded bg-[#021024]/8" />
                  </div>
                </div>
                <div className="mt-4 h-9 w-full rounded-full bg-[#021024]/8" />
              </div>
            ))}
          </div>
        ) : daftar.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-[#5483B3]/40 bg-white/70 px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-[#052659]/8 text-[#052659]">
              <BadgeCheck size={24} />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#021024]">
              {tab === "menunggu" ? "Tidak ada pengajuan" : "Belum ada data verifikasi"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#021024]/55">
              {tab === "menunggu"
                ? "Semua pengajuan NISN sudah ditangani. Pengajuan baru akan muncul di sini."
                : "Pengajuan NISN dari siswa akan tampil di sini setelah mereka mengirimkannya."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {daftar.map((item, i) => {
              const status = labelStatus(item.verification_status);
              const inisial = (item.nama ?? "?").trim().charAt(0).toUpperCase() || "?";
              const menunggu = item.verification_status === "menunggu";
              const sibuk = diproses === item.id;

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="rounded-3xl border border-[#021024]/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#052659] text-base font-bold text-[#C1E8FF]">
                      {inisial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#021024]">
                        {item.nama ?? "Tanpa nama"}
                      </p>
                      {item.email && (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[#021024]/50">
                          <Mail size={12} />
                          {item.email}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.kelas}`}
                    >
                      {status.teks}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#F4F9FF] px-4 py-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-[#2F5F8F]/70">
                      <IdCard size={12} /> NISN
                    </p>
                    <p className="mt-1 font-mono text-lg tracking-[.18em] text-[#021024]">
                      {item.nisn ?? "—"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#021024]/45">
                      <CalendarDays size={12} />
                      Dikirim {formatWaktu(item.verification_submitted_at)}
                    </p>
                  </div>

                  {item.verification_note && (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      Catatan: {item.verification_note}
                    </p>
                  )}

                  {menunggu ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={sibuk}
                        onClick={() => putuskan(item, "verifikasi")}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Verifikasi
                      </button>
                      <button
                        type="button"
                        disabled={sibuk}
                        onClick={() => {
                          setCatatan("");
                          setTolakTarget(item);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={15} />
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[#021024]/45">
                      Diputuskan {formatWaktu(item.verified_at)}
                    </p>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog tolak */}
      {tolakTarget && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[#021024]/60 p-4 backdrop-blur-sm"
          onClick={() => !diproses && setTolakTarget(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Konfirmasi tolak verifikasi"
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600">
              <X size={20} />
            </span>
            <h3 className="mt-4 text-center text-lg font-bold text-[#021024]">
              Tolak verifikasi NISN?
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-[#021024]/55">
              NISN <span className="font-mono text-[#021024]">{tolakTarget.nisn}</span> milik{" "}
              {tolakTarget.nama ?? "pengguna ini"} akan ditandai ditolak.
            </p>
            <label
              htmlFor="catatan-tolak"
              className="mt-4 block text-xs font-bold uppercase tracking-[.12em] text-[#2F5F8F]"
            >
              Alasan (opsional)
            </label>
            <textarea
              id="catatan-tolak"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="cth: NISN tidak terdaftar di data sekolah."
              className="mt-2 w-full resize-none rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25"
            />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={Boolean(diproses)}
                onClick={() => setTolakTarget(null)}
                className="rounded-full border border-[#021024]/15 px-4 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(diproses)}
                onClick={() => putuskan(tolakTarget, "tolak", catatan)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {diproses ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                {diproses ? "Menyimpan..." : "Ya, tolak"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
