"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Loader2, Send, X } from "lucide-react";

interface Props {
  terbuka: boolean;
  onTutup: () => void;
  onSukses?: (pesan: string) => void;
}

/**
 * ModalKirimNisn
 * ---------------------------------------------------------------------------
 * Popup pengiriman NISN untuk siswa. Desain mengikuti FormBeritaModal
 * (portal ke body, header biru, footer sticky) agar konsisten.
 * ---------------------------------------------------------------------------
 */
export default function ModalKirimNisn({ terbuka, onTutup, onSukses }: Props) {
  const [nisn, setNisn] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form setiap kali modal dibuka.
  useEffect(() => {
    if (!terbuka) return;
    setNisn("");
    setError(null);
    setMenyimpan(false);
  }, [terbuka]);

  // Kunci scroll + tutup dengan Escape.
  useEffect(() => {
    if (!terbuka || typeof document === "undefined") return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = asal;
    };
  }, [terbuka, onTutup]);

  const nisnValid = /^\d{10}$/.test(nisn);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nisn.trim()) return setError("NISN wajib diisi.");
    if (!nisnValid) return setError("NISN harus terdiri dari 10 angka.");

    setMenyimpan(true);
    try {
      const res = await fetch("/api/verifikasi", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nisn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Gagal mengirim NISN.");
        return;
      }
      onSukses?.(data.message ?? "NISN berhasil dikirim.");
      onTutup();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setMenyimpan(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {terbuka && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] overflow-y-auto bg-[#021024]/60 backdrop-blur-sm"
          onClick={() => !menyimpan && onTutup()}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Kirim NISN"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#F4F9FF] shadow-2xl"
            >
              {/* Header */}
              <div className="relative bg-[#052659] px-6 py-6 text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-[#5483B3]/30 blur-2xl"
                />
                <button
                  type="button"
                  onClick={() => !menyimpan && onTutup()}
                  aria-label="Tutup"
                  className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                >
                  <X size={16} />
                </button>
                <span className="relative grid size-11 place-items-center rounded-2xl bg-white/10 text-[#C1E8FF]">
                  <GraduationCap size={22} />
                </span>
                <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[.18em] text-[#C1E8FF]/70">
                  Verifikasi pelajar
                </p>
                <h3 className="relative mt-1.5 text-xl font-bold leading-tight">
                  Kirim NISN Anda.
                </h3>
                <p className="relative mt-2 text-xs leading-relaxed text-[#C1E8FF]/65">
                  NISN dipakai admin untuk memastikan Anda benar-benar siswa SMK Telekomunikasi
                  Tunas Harapan.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={submit} noValidate className="px-6 py-5">
                {error && (
                  <p
                    role="alert"
                    className="mb-4 rounded-xl border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <label
                  htmlFor="input-nisn"
                  className="text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]"
                >
                  Nomor Induk Siswa Nasional (NISN)
                </label>
                <input
                  id="input-nisn"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  disabled={menyimpan}
                  placeholder="cth: 0091234567"
                  className="mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 font-mono text-base tracking-[.2em] text-[#021024] outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
                  required
                />
                <p className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[#021024]/45">
                  <span>10 angka, tanpa spasi atau titik.</span>
                  <span className="tabular-nums">{nisn.length}/10</span>
                </p>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#021024]/10 pt-4">
                  <button
                    type="button"
                    onClick={onTutup}
                    disabled={menyimpan}
                    className="rounded-full border border-[#021024]/15 px-5 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={menyimpan || !nisnValid}
                    className="inline-flex items-center gap-2 rounded-full bg-[#052659] px-6 py-2.5 text-sm font-semibold text-[#C1E8FF] shadow-lg shadow-[#021024]/20 transition hover:bg-[#021024] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {menyimpan ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Kirim NISN
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
