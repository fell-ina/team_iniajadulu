"use client";

/**
 * components/TombolTambahBerita.tsx
 * ---------------------------------------------------------------------------
 * Tombol "Tambah Berita" untuk dashboard admin & guru.
 *
 * Saat diklik, membuka modal berisi form:
 *   - Judul   (input teks)
 *   - Konten  (textarea)
 *   - Gambar  (opsional, JPG/PNG/WebP maks. 4 MB, dengan pratinjau)
 *
 * Saat disubmit, form mengirim POST (multipart/form-data) ke /api/berita.
 * Server-lah yang memverifikasi session + role, mengunggah gambar ke bucket
 * 'imageBerita', lalu menyimpan baris baru ke tabel 'berita'.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";

// Endpoint server untuk menyimpan berita.
const BERITA_ENDPOINT = "/api/berita";

// Aturan gambar (harus sama dengan yang ada di server).
const TIPE_GAMBAR_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];
const MAKS_UKURAN_GAMBAR = 4 * 1024 * 1024; // 4 MB

export default function TombolTambahBerita() {
  const router = useRouter();

  const [terbuka, setTerbuka] = useState(false); // modal terbuka / tertutup
  const [judul, setJudul] = useState("");
  const [konten, setKonten] = useState("");
  const [gambar, setGambar] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  // Buat URL pratinjau setiap kali gambar berganti, dan bersihkan setelahnya.
  useEffect(() => {
    if (!gambar) {
      setPratinjau(null);
      return;
    }
    const url = URL.createObjectURL(gambar);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [gambar]);

  // Pilih gambar dari perangkat -----------------------------------------------
  function handlePilihGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const berkas = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih ulang
    if (!berkas) return;

    if (!TIPE_GAMBAR_DIIZINKAN.includes(berkas.type)) {
      setError("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }
    if (berkas.size > MAKS_UKURAN_GAMBAR) {
      setError("Ukuran gambar terlalu besar (maksimal 4 MB).");
      return;
    }

    setError(null);
    setGambar(berkas);
  }

  // Kirim berita ke server ----------------------------------------------------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSukses(null);

    // Validasi ringan di client (hanya untuk UX, server memvalidasi ulang).
    if (!judul.trim() || !konten.trim()) {
      setError("Judul dan konten berita wajib diisi.");
      return;
    }

    // FormData dipakai karena ada file. JANGAN set header Content-Type
    // secara manual: browser mengisinya sendiri lengkap dengan boundary.
    const formData = new FormData();
    formData.append("judul", judul.trim());
    formData.append("konten", konten.trim());
    if (gambar) formData.append("gambar", gambar);

    setMenyimpan(true);
    try {
      const res = await fetch(BERITA_ENDPOINT, {
        method: "POST",
        credentials: "same-origin", // supaya cookie session ikut terkirim
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // `message` datang dari server (misal session habis / role ditolak).
        if (res.status === 401) {
          // Session habis -> paksa login ulang.
          router.push("/login");
          router.refresh();
          return;
        }
        setError(data.message ?? "Gagal menyimpan berita.");
        return;
      }

      // Berhasil -> tampilkan pesan, kosongkan form, tutup modal.
      setSukses(data.message ?? "Berita berhasil diunggah.");
      setJudul("");
      setKonten("");
      setGambar(null);
      setTerbuka(false);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi sebentar lagi.");
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <>
      {/* ---------- Tombol utama di kanan atas ---------- */}
      <button
        type="button"
        onClick={() => {
          setSukses(null);
          setError(null);
          setTerbuka(true);
        }}
        className="group inline-flex items-center gap-2 rounded-full bg-[#052659] px-4 py-2.5 text-sm font-semibold text-[#C1E8FF] shadow-lg shadow-[#021024]/20 transition hover:bg-[#021024] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5483B3] focus-visible:ring-offset-2"
      >
        <Plus
          size={16}
          className="transition-transform duration-300 group-hover:rotate-90"
        />
        Tambah Berita
      </button>

      {/* ---------- Pesan sukses setelah berita terunggah ---------- */}
      <AnimatePresence>
        {sukses && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            role="status"
            className="fixed right-4 top-20 z-[70] max-w-xs rounded-2xl border border-[#5483B3]/30 bg-[#021024]/95 px-4 py-3 text-sm text-[#C1E8FF] shadow-2xl backdrop-blur-xl sm:right-6"
          >
            {sukses}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Modal form Tambah Berita ---------- */}
      <AnimatePresence>
        {terbuka && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // flex + m-auto pada anak: modal tetap di tengah, dan jika lebih
            // tinggi dari layar, bagian atasnya tetap bisa di-scroll.
            className="fixed inset-0 z-[90] flex overflow-y-auto bg-[#021024]/60 p-4 backdrop-blur-sm"
            onClick={() => !menyimpan && setTerbuka(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-label="Form Tambah Berita"
              className="m-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-[#7DA0CA]/30 bg-[#F4F9FF] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header modal */}
              <div className="relative overflow-hidden border-b border-[#021024]/10 bg-[#052659] px-6 py-5">
                <div className="absolute -right-10 -top-16 size-36 rounded-full bg-[#5483B3]/30 blur-2xl pointer-events-none" />
                <div className="relative flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-[#F4F9FF]">
                      Tambah Berita
                    </h2>
                    <p className="mt-0.5 text-xs text-[#C1E8FF]/60">
                      Berita akan langsung tayang setelah diunggah.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !menyimpan && setTerbuka(false)}
                    aria-label="Tutup form"
                    className="ml-auto grid size-8 place-items-center rounded-full text-[#C1E8FF]/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Form isi berita */}
              <form onSubmit={handleSubmit} noValidate className="px-6 py-6">
                {/* Pesan error */}
                <div role="alert" aria-live="polite">
                  {error && (
                    <p className="mb-4 rounded-xl border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </div>

                {/* Input judul */}
                <label
                  htmlFor="judul-berita"
                  className="text-xs font-bold uppercase tracking-[.16em] text-[#2F5F8F]"
                >
                  Judul
                </label>
                <input
                  id="judul-berita"
                  name="judul"
                  type="text"
                  maxLength={200}
                  autoComplete="off"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  disabled={menyimpan}
                  placeholder="Tulis judul berita di sini..."
                  className="mt-2 mb-5 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
                  required
                />

                {/* Textarea konten */}
                <label
                  htmlFor="konten-berita"
                  className="text-xs font-bold uppercase tracking-[.16em] text-[#2F5F8F]"
                >
                  Konten
                </label>
                <textarea
                  id="konten-berita"
                  name="konten"
                  rows={8}
                  maxLength={20000}
                  value={konten}
                  onChange={(e) => setKonten(e.target.value)}
                  disabled={menyimpan}
                  placeholder="Tulis isi berita di sini..."
                  className="mt-2 mb-2 w-full resize-y rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm leading-relaxed text-[#021024] outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
                  required
                />
                <p className="mb-5 text-right text-[11px] text-[#021024]/40">
                  {konten.length.toLocaleString("id-ID")} / 20.000 karakter
                </p>

                {/* Gambar (opsional) */}
                <span className="text-xs font-bold uppercase tracking-[.16em] text-[#2F5F8F]">
                  Gambar{" "}
                  <span className="font-medium normal-case tracking-normal text-[#021024]/40">
                    (opsional)
                  </span>
                </span>

                {/* Input file asli disembunyikan; <label> di bawah jadi pemicunya */}
                <input
                  id="gambar-berita"
                  name="gambar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePilihGambar}
                  disabled={menyimpan}
                  className="sr-only"
                />

                {pratinjau ? (
                  <div className="relative mt-2 mb-6 overflow-hidden rounded-xl border border-[#021024]/15 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pratinjau}
                      alt="Pratinjau gambar berita"
                      className="h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setGambar(null)}
                      disabled={menyimpan}
                      aria-label="Hapus gambar"
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-[#021024]/75 text-white backdrop-blur transition hover:bg-[#021024] disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                    <p className="truncate border-t border-[#021024]/10 px-3 py-2 text-[11px] text-[#021024]/50">
                      {gambar?.name} ·{" "}
                      {gambar ? (gambar.size / 1024 / 1024).toFixed(2) : 0} MB
                    </p>
                  </div>
                ) : (
                  <label
                    htmlFor="gambar-berita"
                    className="mt-2 mb-6 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#5483B3]/40 bg-white/60 px-4 py-6 text-center transition hover:border-[#5483B3] hover:bg-white has-[:disabled]:opacity-50"
                  >
                    <ImagePlus size={22} className="text-[#5483B3]" />
                    <span className="text-sm font-medium text-[#021024]/70">
                      Klik untuk memilih gambar
                    </span>
                    <span className="text-[11px] text-[#021024]/40">
                      JPG, PNG, atau WebP · maksimal 4 MB
                    </span>
                  </label>
                )}

                {/* Aksi form */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTerbuka(false)}
                    disabled={menyimpan}
                    className="rounded-full border border-[#021024]/15 px-5 py-2.5 text-sm font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={menyimpan || !judul.trim() || !konten.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#052659] px-6 py-2.5 text-sm font-semibold text-[#C1E8FF] shadow-lg shadow-[#021024]/20 transition hover:bg-[#021024] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#052659] disabled:hover:text-[#C1E8FF]"
                  >
                    {menyimpan ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      "Unggah Berita"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
