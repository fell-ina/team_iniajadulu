"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heading,
  ImagePlus,
  Loader2,
  Newspaper,
  Type,
  AlignLeft,
  X,
  Bold,
  Italic,
  List,
  Image as IkonGambar,
  Eye,
  PencilLine,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  buatMarkdownGambar,
  kelasGambarInline,
  parseAltGambar,
  type UkuranGambarInline,
} from "@/lib/gambarMarkdown";

export interface BeritaItem {
  id: string | number;
  judul: string;
  subjudul?: string | null;
  konten: string;
  gambar_url?: string | null;
  created_at?: string | null;
}

interface Props {
  terbuka: boolean;
  onTutup: () => void;
  /** Jika diisi -> mode edit. Jika kosong -> mode tambah. */
  awal?: BeritaItem | null;
  onSukses?: (pesan: string) => void;
}

const TIPE_DIIZINKAN = ["image/jpeg", "image/png", "image/webp"];
const MAKS = 4 * 1024 * 1024;

export default function FormBeritaModal({ terbuka, onTutup, awal, onSukses }: Props) {
  const modeEdit = Boolean(awal?.id);

  const [judul, setJudul] = useState("");
  const [subjudul, setSubjudul] = useState("");
  const [konten, setKonten] = useState("");
  const [gambar, setGambar] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [hapusGambarLama, setHapusGambarLama] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabPratinjau, setTabPratinjau] = useState(false);
  const [mengunggahInline, setMengunggahInline] = useState(false);
  const [ukuranInline, setUkuranInline] = useState<UkuranGambarInline>("besar");
  const areaKontenRef = useRef<HTMLTextAreaElement | null>(null);
  const inputGambarInlineRef = useRef<HTMLInputElement | null>(null);

  // Isi form saat modal dibuka / berita edit berganti.
  useEffect(() => {
    if (!terbuka) return;
    setJudul(awal?.judul ?? "");
    setSubjudul(awal?.subjudul ?? "");
    setKonten(awal?.konten ?? "");
    setGambar(null);
    setPratinjau(null);
    setHapusGambarLama(false);
    setError(null);
    setTabPratinjau(false);
    setMengunggahInline(false);
    setUkuranInline("besar");
  }, [terbuka, awal]);

  // Pratinjau file baru.
  useEffect(() => {
    if (!gambar) return;
    const url = URL.createObjectURL(gambar);
    setPratinjau(url);
    return () => URL.revokeObjectURL(url);
  }, [gambar]);

  // Kunci scroll halaman belakang saat modal terbuka.
  useEffect(() => {
    if (!terbuka || typeof document === "undefined") return;
    const asal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = asal;
    };
  }, [terbuka]);

  const gambarLama = awal?.gambar_url && !hapusGambarLama ? awal.gambar_url : null;
  const gambarTampil = pratinjau ?? gambarLama;

  /** Sisipkan teks markdown di posisi kursor textarea konten. */
  function sisipkanDiKursor(sebelum: string, sesudah = "", contoh = "") {
    const el = areaKontenRef.current;
    if (!el) {
      setKonten((lama) => `${lama}${sebelum}${contoh}${sesudah}`);
      return;
    }
    const mulai = el.selectionStart ?? konten.length;
    const akhir = el.selectionEnd ?? konten.length;
    const dipilih = konten.slice(mulai, akhir) || contoh;
    const baru = konten.slice(0, mulai) + sebelum + dipilih + sesudah + konten.slice(akhir);
    setKonten(baru);
    requestAnimationFrame(() => {
      el.focus();
      const pos = mulai + sebelum.length + dipilih.length + sesudah.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function bungkusBaris(awalan: string) {
    const el = areaKontenRef.current;
    if (!el) {
      setKonten((lama) => (lama ? `${lama}\n${awalan} ` : `${awalan} `));
      return;
    }
    const mulai = el.selectionStart ?? 0;
    const awalBaris = konten.lastIndexOf("\n", mulai - 1) + 1;
    const baru = `${konten.slice(0, awalBaris)}${awalan} ${konten.slice(awalBaris)}`;
    setKonten(baru);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(mulai + awalan.length + 1, mulai + awalan.length + 1);
    });
  }

  async function pilihGambarInline(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TIPE_DIIZINKAN.includes(f.type)) {
      setError("Gambar isi harus JPG, PNG, atau WebP.");
      return;
    }
    if (f.size > MAKS) {
      setError("Gambar isi terlalu besar (maksimal 4 MB).");
      return;
    }
    setError(null);
    setMengunggahInline(true);
    try {
      const fd = new FormData();
      fd.append("gambar", f);
      const res = await fetch("/api/berita/gambar", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setError(data.message ?? "Gagal mengunggah gambar isi.");
        return;
      }
      const nama = f.name.replace(/\.[^.]+$/, "").slice(0, 40) || "gambar";
      const markdown = buatMarkdownGambar(nama, data.url, ukuranInline);
      const el = areaKontenRef.current;
      if (!el) {
        setKonten((lama) => `${lama}${markdown}`);
        return;
      }
      const mulai = el.selectionStart ?? konten.length;
      const akhir = el.selectionEnd ?? konten.length;
      const baru = konten.slice(0, mulai) + markdown + konten.slice(akhir);
      setKonten(baru);
      requestAnimationFrame(() => {
        el.focus();
        const pos = mulai + markdown.length;
        el.setSelectionRange(pos, pos);
      });
    } catch {
      setError("Tidak dapat mengunggah gambar isi.");
    } finally {
      setMengunggahInline(false);
    }
  }

  function pilihGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TIPE_DIIZINKAN.includes(f.type)) {
      setError("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }
    if (f.size > MAKS) {
      setError("Ukuran gambar terlalu besar (maksimal 4 MB).");
      return;
    }
    setError(null);
    setGambar(f);
    setHapusGambarLama(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!judul.trim()) return setError("Judul berita wajib diisi.");
    if (!konten.trim()) return setError("Isi berita wajib diisi.");
    if (subjudul.trim().length > 300) return setError("Subjudul maksimal 300 karakter.");

    const fd = new FormData();
    fd.append("judul", judul.trim());
    fd.append("subjudul", subjudul.trim());
    fd.append("konten", konten.trim());
    if (gambar) fd.append("gambar", gambar);
    if (modeEdit && hapusGambarLama && !gambar) fd.append("hapus_gambar", "1");

    setMenyimpan(true);
    try {
      const url = modeEdit ? `/api/berita?id=${awal!.id}` : "/api/berita";
      const res = await fetch(url, {
        method: modeEdit ? "PUT" : "POST",
        credentials: "same-origin",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Gagal menyimpan berita.");
        return;
      }
      onSukses?.(data.message ?? (modeEdit ? "Berita diperbarui." : "Berita diunggah."));
      onTutup();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setMenyimpan(false);
    }
  }

  // Portal ke document.body agar `fixed inset-0` selalu relatif ke viewport.
  // Tanpa portal, modal yang di-render di dalam header dashboard
  // (yang memakai `backdrop-blur-xl`) akan terjebak di kotak header saja.
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {terbuka && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] overflow-y-auto bg-[#021024]/60 backdrop-blur-sm"
          onClick={() => !menyimpan && onTutup()}
        >
          <div className="flex min-h-full justify-center p-3 sm:p-6 md:items-center">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={modeEdit ? "Edit Berita" : "Tambah Berita"}
            onClick={(e) => e.stopPropagation()}
            className="mb-4 mt-2 grid w-full max-w-3xl grid-cols-1 overflow-visible rounded-[1.75rem] border border-white/10 bg-[#F4F9FF] shadow-2xl sm:mb-8 sm:mt-6 md:m-auto md:grid-cols-[300px_1fr] md:overflow-hidden md:max-h-[calc(100dvh-3rem)]"
          >
            {/* Panel kiri : upload gambar */}
            <div className="relative flex flex-col bg-[#052659] p-5 text-white md:min-h-0">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-12 -top-16 size-44 rounded-full bg-[#5483B3]/30 blur-2xl"
              />
              <div className="relative flex items-center gap-2 text-[#C1E8FF]">
                <Newspaper size={16} />
                <p className="text-[11px] font-bold uppercase tracking-[.18em]">
                  {modeEdit ? "Edit berita" : "Berita baru"}
                </p>
              </div>
              <h3 className="relative mt-3 text-xl font-bold leading-tight">
                {modeEdit ? "Perbarui kabar sekolah." : "Bagikan kabar terbaru."}
              </h3>
              <p className="relative mt-2 text-xs leading-relaxed text-[#C1E8FF]/60">
                Gambar sampul membuat berita terlihat menarik di halaman publik.
              </p>

              <input
                id="gambar-berita-modal"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={pilihGambar}
                disabled={menyimpan}
                className="sr-only"
              />

              <div className="relative mt-4 flex-1">
                {gambarTampil ? (
                  <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gambarTampil}
                      alt="Pratinjau gambar berita"
                      className="h-36 w-full object-cover md:h-56"
                    />
                    <div className="flex items-center gap-2 p-3">
                      <label
                        htmlFor="gambar-berita-modal"
                        className="flex-1 cursor-pointer rounded-full bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/20"
                      >
                        Ganti gambar
                      </label>
                      <button
                        type="button"
                        disabled={menyimpan}
                        onClick={() => {
                          setGambar(null);
                          setPratinjau(null);
                          if (awal?.gambar_url) setHapusGambarLama(true);
                        }}
                        className="rounded-full bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/35 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                    {gambar && (
                      <p className="truncate border-t border-white/10 px-3 py-2 text-[11px] text-white/50">
                        {gambar.name} · {(gambar.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="gambar-berita-modal"
                    className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#7DA0CA]/50 bg-white/5 px-4 text-center transition hover:border-[#C1E8FF] hover:bg-white/10 md:h-56"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-white/10">
                      <ImagePlus size={20} className="text-[#C1E8FF]" />
                    </span>
                    <span className="text-sm font-semibold">Upload gambar sampul</span>
                    <span className="text-[11px] text-[#C1E8FF]/55">
                      Klik / ketuk untuk memilih
                      <br />
                      JPG, PNG, WebP · maks 4 MB
                    </span>
                  </label>
                )}
              </div>
              <p className="relative mt-3 text-[11px] text-[#C1E8FF]/45">
                Gambar bersifat opsional. Rasio landscape 16:9 paling bagus.
              </p>
            </div>

            {/* Panel kanan : form */}
            <div className="relative flex min-h-0 flex-col md:max-h-[calc(100dvh-3rem)]">
              <button
                type="button"
                onClick={() => !menyimpan && onTutup()}
                aria-label="Tutup"
                className="absolute right-4 top-4 z-20 grid size-8 place-items-center rounded-full bg-[#F4F9FF]/90 text-[#021024]/40 backdrop-blur transition hover:bg-[#021024]/5 hover:text-[#021024]"
              >
                <X size={16} />
              </button>

              <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6">
                {/* Area konten yang bisa di-scroll; footer di luar area ini agar selalu terlihat */}
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                {error && (
                  <p role="alert" className="mb-4 rounded-xl border border-red-300/60 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
                  <Heading size={13} /> Judul <span className="text-red-500">*</span>
                </label>
                <input
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  maxLength={200}
                  disabled={menyimpan}
                  placeholder="cth: Prestasi Siswa di Lomba Robotik Nasional"
                  className="mb-4 mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm font-medium text-[#021024] outline-none transition placeholder:font-normal placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
                  required
                />

                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
                  <Type size={13} /> Subjudul
                </label>
                <input
                  value={subjudul}
                  onChange={(e) => setSubjudul(e.target.value)}
                  maxLength={300}
                  disabled={menyimpan}
                  placeholder="Ringkasan singkat 1–2 kalimat (tampil di kartu berita)"
                  className="mb-4 mt-2 w-full rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm text-[#021024] outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
                />

                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#2F5F8F]">
                    <AlignLeft size={13} /> Isi berita <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums text-[#021024]/40">
                      {konten.length.toLocaleString("id-ID")} / 20.000
                    </span>
                    <div className="flex overflow-hidden rounded-full border border-[#021024]/15 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setTabPratinjau(false)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 transition ${!tabPratinjau ? "bg-[#052659] text-white" : "bg-white text-[#021024]/60 hover:bg-[#021024]/5"}`}
                      >
                        <PencilLine size={12} /> Tulis
                      </button>
                      <button
                        type="button"
                        onClick={() => setTabPratinjau(true)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 transition ${tabPratinjau ? "bg-[#052659] text-white" : "bg-white text-[#021024]/60 hover:bg-[#021024]/5"}`}
                      >
                        <Eye size={12} /> Pratinjau
                      </button>
                    </div>
                  </div>
                </div>

                {/* Toolbar markdown */}
                {!tabPratinjau && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#021024]/10 bg-white px-2 py-1.5">
                    <button
                      type="button"
                      title="Tebal"
                      onClick={() => sisipkanDiKursor("**", "**", "teks tebal")}
                      className="grid size-8 place-items-center rounded-lg text-[#021024]/70 transition hover:bg-[#021024]/5"
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      title="Miring"
                      onClick={() => sisipkanDiKursor("*", "*", "teks miring")}
                      className="grid size-8 place-items-center rounded-lg text-[#021024]/70 transition hover:bg-[#021024]/5"
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      title="Subjudul"
                      onClick={() => bungkusBaris("###")}
                      className="grid size-8 place-items-center rounded-lg text-[#021024]/70 transition hover:bg-[#021024]/5"
                    >
                      <Heading size={15} />
                    </button>
                    <button
                      type="button"
                      title="Daftar poin"
                      onClick={() => bungkusBaris("-")}
                      className="grid size-8 place-items-center rounded-lg text-[#021024]/70 transition hover:bg-[#021024]/5"
                    >
                      <List size={15} />
                    </button>
                    <span className="mx-1 h-5 w-px bg-[#021024]/10" />
                    <input
                      ref={inputGambarInlineRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={pilihGambarInline}
                      disabled={menyimpan || mengunggahInline}
                      className="sr-only"
                    />
                    <div
                      role="group"
                      aria-label="Ukuran gambar isi"
                      className="flex flex-wrap overflow-hidden rounded-2xl border border-[#021024]/15 text-[11px] font-semibold"
                    >
                      {(
                        [
                          { nilai: "kecil", label: "Kecil", judul: "Tengah ~384px" },
                          { nilai: "sedang", label: "Sedang", judul: "Tengah ~576px" },
                          { nilai: "besar", label: "Besar", judul: "Full-width" },
                          { nilai: "kiri", label: "◧ Kiri", judul: "Mengambang kiri, teks di kanan (seperti Word)" },
                          { nilai: "kanan", label: "◨ Kanan", judul: "Mengambang kanan, teks di kiri (seperti Word)" },
                        ] as { nilai: UkuranGambarInline; label: string; judul: string }[]
                      ).map((o) => (
                        <button
                          key={o.nilai}
                          type="button"
                          onClick={() => setUkuranInline(o.nilai)}
                          title={o.judul}
                          className={`px-2.5 py-1.5 transition ${ukuranInline === o.nilai ? "bg-[#052659] text-white" : "bg-white text-[#021024]/60 hover:bg-[#021024]/5"}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => inputGambarInlineRef.current?.click()}
                      disabled={menyimpan || mengunggahInline}
                      title={`Sisipkan gambar ${ukuranInline} di posisi kursor`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#052659]/5 px-3 py-1.5 text-xs font-semibold text-[#052659] transition hover:bg-[#052659]/10 disabled:opacity-50"
                    >
                      {mengunggahInline ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <IkonGambar size={14} />
                      )}
                      {mengunggahInline ? "Mengunggah..." : `Sisip ${ukuranInline}`}
                    </button>
                  </div>
                )}

                {tabPratinjau ? (
                  <div className="mb-5 mt-2 min-h-[140px] flex-1 rounded-xl border border-[#021024]/15 bg-white px-4 py-3">
                    {konten.trim() ? (
                      <div className="prose max-w-none text-sm leading-relaxed text-[#021024] prose-img:rounded-xl prose-img:shadow">
                        <ReactMarkdown
                          components={{
                            img: (props) => {
                              const { caption, ukuran } = parseAltGambar(props.alt);
                              return (
                                <img
                                  {...props}
                                  alt={caption || "Gambar isi berita"}
                                  loading="lazy"
                                  className={kelasGambarInline(ukuran, "pratinjau")}
                                />
                              );
                            },
                            p: (props) => {
                              const anak = (props.node?.children?.[0] as { tagName?: string } | undefined);
                              if (props.node?.children?.length === 1 && anak?.tagName === "img") {
                                return <>{props.children}</>;
                              }
                              return <p {...props}>{props.children}</p>;
                            },
                          }}
                        >
                          {konten}
                        </ReactMarkdown>
                        <div className="clear-both" />
                      </div>
                    ) : (
                      <p className="text-sm text-[#021024]/35">Belum ada isi untuk dipratinjau.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={areaKontenRef}
                    value={konten}
                    onChange={(e) => setKonten(e.target.value)}
                    rows={6}
                    maxLength={20000}
                    disabled={menyimpan}
                    placeholder={"Tulis isi lengkap berita di sini...\n\nPilih ukuran lalu klik Sisip:\nBesar = full • Sedang/Kecil = tengah\nKiri/Kanan = teks mengalir di samping (spt Word)\n\n![Foto kegiatan|kiri](otomatis terisi)"}
                    className="mb-1 mt-2 min-h-[140px] w-full flex-1 resize-y rounded-xl border border-[#021024]/15 bg-white px-4 py-3 text-sm leading-relaxed text-[#021024] outline-none transition placeholder:text-[#021024]/35 focus:border-[#5483B3] focus:ring-2 focus:ring-[#5483B3]/25 disabled:opacity-50"
                    required
                  />
                )}
                {!tabPratinjau && (
                  <p className="mb-5 text-[11px] leading-relaxed text-[#021024]/45">
                    Mendukung <strong>tebal</strong>, <em>miring</em>, daftar, dan gambar opsional.
                    Pilih <strong>Kecil / Sedang / Besar / Kiri / Kanan</strong> sebelum sisip — bisa
                    juga edit manual <code className="rounded bg-[#021024]/5 px-1">|kecil</code> /{" "}
                    <code className="rounded bg-[#021024]/5 px-1">|sedang</code> /{" "}
                    <code className="rounded bg-[#021024]/5 px-1">|kiri</code> /{" "}
                    <code className="rounded bg-[#021024]/5 px-1">|kanan</code> di dalam{" "}
                    <code className="rounded bg-[#021024]/5 px-1">![...]</code>.
                  </p>
                )}
                {tabPratinjau && <div className="mb-5" />}
                </div>

                <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-[#021024]/10 bg-[#F4F9FF] px-5 py-4 sm:-mx-6 sm:px-6">
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
                    disabled={menyimpan || !judul.trim() || !konten.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#052659] px-6 py-2.5 text-sm font-semibold text-[#C1E8FF] shadow-lg shadow-[#021024]/20 transition hover:bg-[#021024] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {menyimpan ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {modeEdit ? "Menyimpan..." : "Mengunggah..."}
                      </>
                    ) : modeEdit ? (
                      "Simpan Perubahan"
                    ) : (
                      "Unggah Berita"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
