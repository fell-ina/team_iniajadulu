"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Heart,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { useForumGuard } from "@/lib/forum-guard";
import {
  KATEGORI_SISWA,
  formatRelativeTime,
  getInitials,
  labelKategori,
  warnaKategori,
  type Balasan,
  type KelasForum,
  type Topik,
} from "@/lib/forum-types";

/**
 * src/components/forum/ForumKelas.tsx
 * ---------------------------------------------------------------------------
 * Forum satu kelas: daftar topik dari Supabase, form "Mulai Diskusi" yang
 * menulis ke forum_topik, dan modal utas untuk membaca/menulis balasan.
 * Dipakai oleh /forum/X, /forum/XI, dan /forum/XII.
 * ---------------------------------------------------------------------------
 */

interface ForumKelasProps {
  kelas: KelasForum;
  deskripsi: string;
}

const TEMA: Record<KelasForum, { tombol: string; cincin: string; badge: string }> = {
  X: {
    tombol: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20",
    cincin: "focus:border-emerald-500",
    badge: "bg-emerald-600",
  },
  XI: {
    tombol: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
    cincin: "focus:border-blue-500",
    badge: "bg-blue-600",
  },
  XII: {
    tombol: "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20",
    cincin: "focus:border-purple-500",
    badge: "bg-purple-600",
  },
};

const URUTAN = [
  { nilai: "terbaru", label: "Terbaru" },
  { nilai: "terlama", label: "Terlama" },
  { nilai: "terpopuler", label: "Terpopuler" },
  { nilai: "terbanyak-balasan", label: "Terbanyak Balasan" },
];

export default function ForumKelas({ kelas, deskripsi }: ForumKelasProps) {
  const session = useForumGuard(kelas);

  const [topik, setTopik] = useState<Topik[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [cari, setCari] = useState("");
  const [kategori, setKategori] = useState("semua");
  const [urut, setUrut] = useState("terbaru");

  const [formTerbuka, setFormTerbuka] = useState(false);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [kategoriBaru, setKategoriBaru] = useState(KATEGORI_SISWA[0].nilai);
  const [mengirim, setMengirim] = useState(false);
  const [galatForm, setGalatForm] = useState<string | null>(null);

  const [terpilih, setTerpilih] = useState<Topik | null>(null);
  const [balasan, setBalasan] = useState<Balasan[]>([]);
  const [memuatBalasan, setMemuatBalasan] = useState(false);
  const [draftBalasan, setDraftBalasan] = useState("");
  const [mengirimBalasan, setMengirimBalasan] = useState(false);
  const [galatBalasan, setGalatBalasan] = useState<string | null>(null);

  const tema = TEMA[kelas];

  const muatTopik = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      const res = await fetch(`/api/forum/topik?kelas=${kelas}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setGalat(data.message ?? "Gagal memuat diskusi.");
        setTopik([]);
      } else {
        setTopik(data.topik ?? []);
      }
    } catch {
      setGalat("Gagal memuat diskusi. Periksa koneksi Anda.");
      setTopik([]);
    } finally {
      setMemuat(false);
    }
  }, [kelas]);

  useEffect(() => {
    if (!session) return;
    void muatTopik();
  }, [session, muatTopik]);

  const daftar = useMemo(() => {
    const kueri = cari.trim().toLowerCase();
    const hasil = topik.filter((t) => {
      const cocokKategori = kategori === "semua" || t.kategori === kategori;
      const cocokCari =
        !kueri ||
        `${t.judul} ${t.konten} ${t.penulisNama}`.toLowerCase().includes(kueri);
      return cocokKategori && cocokCari;
    });

    const tersalin = [...hasil];
    if (urut === "terlama") {
      tersalin.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    } else if (urut === "terpopuler") {
      tersalin.sort((a, b) => b.likeCount - a.likeCount);
    } else if (urut === "terbanyak-balasan") {
      tersalin.sort((a, b) => b.balasanCount - a.balasanCount);
    } else {
      tersalin.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return tersalin;
  }, [cari, kategori, topik, urut]);

  async function kirimTopik(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mengirim) return;

    setGalatForm(null);
    setMengirim(true);

    try {
      const res = await fetch("/api/forum/topik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul, konten: isi, kategori: kategoriBaru }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setGalatForm(data.message ?? "Gagal menyimpan diskusi.");
        return;
      }

      setTopik((sebelumnya) => [data.topik as Topik, ...sebelumnya]);
      setJudul("");
      setIsi("");
      setKategoriBaru(KATEGORI_SISWA[0].nilai);
      setFormTerbuka(false);
      setKategori("semua");
      setCari("");
      setUrut("terbaru");
    } catch {
      setGalatForm("Gagal menyimpan diskusi. Periksa koneksi Anda.");
    } finally {
      setMengirim(false);
    }
  }

  async function bukaUtas(topikDipilih: Topik) {
    setTerpilih(topikDipilih);
    setBalasan([]);
    setDraftBalasan("");
    setGalatBalasan(null);
    setMemuatBalasan(true);

    try {
      const res = await fetch(`/api/forum/topik/${topikDipilih.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setGalatBalasan(data.message ?? "Gagal memuat balasan.");
      } else {
        setBalasan(data.balasan ?? []);
        setTerpilih(data.topik as Topik);
      }
    } catch {
      setGalatBalasan("Gagal memuat balasan.");
    } finally {
      setMemuatBalasan(false);
    }
  }

  function tutupUtas() {
    setTerpilih(null);
    setBalasan([]);
    setDraftBalasan("");
    setGalatBalasan(null);
  }

  async function kirimBalasan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!terpilih || mengirimBalasan) return;

    const konten = draftBalasan.trim();
    if (!konten) return;

    setGalatBalasan(null);
    setMengirimBalasan(true);

    try {
      const res = await fetch("/api/forum/balasan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topikId: terpilih.id, konten }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setGalatBalasan(data.message ?? "Gagal menyimpan balasan.");
        return;
      }

      setBalasan((sebelumnya) => [...sebelumnya, data.balasan as Balasan]);
      setDraftBalasan("");
      setTopik((sebelumnya) =>
        sebelumnya.map((t) =>
          t.id === terpilih.id ? { ...t, balasanCount: t.balasanCount + 1 } : t
        )
      );
      setTerpilih((sebelumnya) =>
        sebelumnya ? { ...sebelumnya, balasanCount: sebelumnya.balasanCount + 1 } : sebelumnya
      );
    } catch {
      setGalatBalasan("Gagal menyimpan balasan. Periksa koneksi Anda.");
    } finally {
      setMengirimBalasan(false);
    }
  }

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F4F9FF] text-[#2F5F8F]">
        <div className="text-center">
          <Loader2 className="mx-auto size-6 animate-spin" />
          <p className="mt-3 text-sm">Memuat forum...</p>
        </div>
      </main>
    );
  }

  const inisial = getInitials(session.nama);

  return (
    <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
      <header className="border-b border-[#021024]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/forum"
            aria-label="Kembali ke forum"
            className="grid size-10 place-items-center rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div>
            <p className="text-sm font-bold tracking-wide">Forum Siswa</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
              Kelas {kelas}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`grid size-9 place-items-center rounded-full text-xs font-bold text-white ${tema.badge}`}
              title={session.nama}
            >
              {inisial}
            </span>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#052659] text-white">
        <div
          aria-hidden
          className="absolute -right-24 -top-36 size-96 rounded-full bg-[#5483B3]/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-44 left-1/3 size-96 rounded-full bg-[#7DA0CA]/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#C1E8FF]/70">
              Kelas {kelas}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">
              Forum Kelas {kelas}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#C1E8FF]/75 sm:text-base">
              {deskripsi}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
                Percakapan terbaru
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Diskusi Kelas {kelas}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setGalatForm(null);
                setFormTerbuka(true);
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold text-white shadow-lg transition ${tema.tombol}`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Mulai Diskusi
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#2F5F8F]/55"
                aria-hidden="true"
              />
              <input
                type="search"
                value={cari}
                onChange={(event) => setCari(event.target.value)}
                placeholder="Cari diskusi..."
                aria-label="Cari diskusi"
                className={`h-12 w-full rounded-xl border border-[#021024]/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#2F5F8F]/50 ${tema.cincin}`}
              />
            </label>

            <label className="relative">
              <select
                value={kategori}
                onChange={(event) => setKategori(event.target.value)}
                aria-label="Filter kategori"
                className={`h-12 w-full appearance-none rounded-xl border border-[#021024]/10 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none sm:hidden ${tema.cincin}`}
              >
                <option value="semua">Semua Diskusi</option>
                {KATEGORI_SISWA.map((k) => (
                  <option key={k.nilai} value={k.nilai}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="hidden items-center gap-2 sm:flex">
              <label
                htmlFor="urut-topik"
                className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70"
              >
                Urutkan:
              </label>
              <div className="relative">
                <select
                  id="urut-topik"
                  value={urut}
                  onChange={(event) => setUrut(event.target.value)}
                  className={`h-12 w-40 appearance-none rounded-xl border border-[#021024]/10 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none ${tema.cincin}`}
                >
                  {URUTAN.map((u) => (
                    <option key={u.nilai} value={u.nilai}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#2F5F8F]"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 hidden items-center gap-2 overflow-x-auto pb-2 sm:flex">
            <button
              type="button"
              onClick={() => setKategori("semua")}
              className={`whitespace-nowrap rounded-full border border-[#021024]/10 px-4 py-2 text-xs font-semibold transition-all ${
                kategori === "semua" ? "bg-[#052659] text-white" : "bg-white text-[#2F5F8F] hover:bg-[#021024]/5"
              }`}
            >
              Semua Diskusi
            </button>
            {KATEGORI_SISWA.map((k) => (
              <button
                key={k.nilai}
                type="button"
                onClick={() => setKategori(k.nilai)}
                className={`whitespace-nowrap rounded-full border border-[#021024]/10 px-4 py-2 text-xs font-semibold transition-all ${
                  kategori === k.nilai ? "bg-[#052659] text-white" : "bg-white text-[#2F5F8F] hover:bg-[#021024]/5"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {memuat ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#7DA0CA]/25 bg-white p-10 text-sm text-[#2F5F8F]/70">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Memuat diskusi...
            </div>
          ) : galat ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm font-semibold text-red-700">{galat}</p>
              <button
                type="button"
                onClick={() => void muatTopik()}
                className="mt-4 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                Coba lagi
              </button>
            </div>
          ) : daftar.length > 0 ? (
            <div className="space-y-4">
              {daftar.map((t) => (
                <article
                  key={t.id}
                  className="group relative rounded-2xl border border-[#021024]/8 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <div className="grid size-11 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
                        {getInitials(t.penulisNama)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.1em] ${warnaKategori(t.kategori)}`}
                        >
                          {labelKategori(t.kategori)}
                        </span>
                        <span className="text-[11px] text-[#2F5F8F]/60">
                          {formatRelativeTime(t.createdAt)}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-lg font-bold text-[#021024] transition-colors group-hover:text-[#052659]">
                        {t.judul}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm text-[#021024]/60">{t.konten}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2F5F8F]/60">
                        <span className="flex items-center gap-1 font-semibold text-[#021024]/70">
                          {t.penulisNama}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3.5" aria-hidden="true" />
                          {t.balasanCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart
                            className="size-3.5"
                            aria-hidden="true"
                            fill={t.userLiked ? "currentColor" : "none"}
                          />
                          {t.likeCount}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void bukaUtas(t)}
                    className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5483B3]"
                    aria-label={`Buka diskusi: ${t.judul}`}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#7DA0CA]/40 bg-white p-10 text-center">
              <Search className="mx-auto size-16 text-[#2F5F8F]/45" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Belum ada diskusi</h3>
              <p className="mt-1 text-sm text-[#2F5F8F]/65">
                {cari || kategori !== "semua"
                  ? "Tidak ada diskusi yang cocok dengan pencarian atau kategori ini."
                  : `Jadilah yang pertama memulai diskusi di Kelas ${kelas}!`}
              </p>
              <button
                type="button"
                onClick={() => setFormTerbuka(true)}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold text-white shadow-lg transition ${tema.tombol}`}
              >
                <Plus className="size-4" aria-hidden="true" />
                Buat Diskusi Pertama
              </button>
            </div>
          )}
        </div>
      </section>

      {formTerbuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Tutup form diskusi"
            onClick={() => setFormTerbuka(false)}
            className="absolute inset-0 bg-[#021024]/65 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-form-diskusi"
            className="relative z-10 w-full max-w-lg rounded-3xl border border-[#7DA0CA]/25 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="judul-form-diskusi" className="text-lg font-bold">
                  Mulai diskusi baru
                </h2>
                <p className="mt-1 text-xs text-[#2F5F8F]/70">
                  Diskusi ini tampil untuk seluruh siswa Kelas {kelas}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormTerbuka(false)}
                aria-label="Tutup"
                className="grid size-8 place-items-center rounded-full text-[#2F5F8F]/60 transition hover:bg-[#021024]/5 hover:text-[#021024]"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={kirimTopik} className="mt-5 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-[#052659]">Judul diskusi</span>
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={judul}
                  onChange={(event) => setJudul(event.target.value)}
                  placeholder="Misalnya: Cara memahami normalisasi 3NF"
                  className={`rounded-xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 ${tema.cincin}`}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-[#052659]">Isi diskusi</span>
                <textarea
                  required
                  rows={5}
                  maxLength={10000}
                  value={isi}
                  onChange={(event) => setIsi(event.target.value)}
                  placeholder="Ceritakan pertanyaan atau pengalamanmu..."
                  className={`resize-none rounded-xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 ${tema.cincin}`}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-[#052659]">Kategori</span>
                <select
                  value={kategoriBaru}
                  onChange={(event) => setKategoriBaru(event.target.value)}
                  className={`rounded-xl border border-[#021024]/12 bg-white px-4 py-3 text-sm outline-none ${tema.cincin}`}
                >
                  {KATEGORI_SISWA.map((k) => (
                    <option key={k.nilai} value={k.nilai}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>

              {galatForm && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {galatForm}
                </p>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormTerbuka(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#2F5F8F] transition hover:bg-[#021024]/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mengirim}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${tema.tombol}`}
                >
                  {mengirim ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="size-4" aria-hidden="true" />
                  )}
                  Publikasikan
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {terpilih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Tutup diskusi"
            onClick={tutupUtas}
            className="absolute inset-0 bg-[#021024]/65 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-utas"
            className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#7DA0CA]/25 bg-white p-5 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#021024]/8 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.1em] ${warnaKategori(terpilih.kategori)}`}
                  >
                    {labelKategori(terpilih.kategori)}
                  </span>
                  <span className="text-[11px] text-[#2F5F8F]/60">
                    {formatRelativeTime(terpilih.createdAt)}
                  </span>
                </div>
                <h2 id="judul-utas" className="mt-2 text-xl font-bold leading-snug">
                  {terpilih.judul}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#2F5F8F]/80">
                  {terpilih.konten}
                </p>
                <p className="mt-3 text-xs font-semibold text-[#021024]/70">
                  {terpilih.penulisNama}
                </p>
              </div>
              <button
                type="button"
                onClick={tutupUtas}
                aria-label="Tutup diskusi"
                className="grid size-9 shrink-0 place-items-center rounded-full text-[#2F5F8F]/60 transition hover:bg-[#021024]/5 hover:text-[#021024]"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {memuatBalasan ? (
                <p className="flex items-center justify-center gap-2 rounded-2xl bg-[#F4F9FF] px-4 py-5 text-sm text-[#2F5F8F]/70">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Memuat balasan...
                </p>
              ) : balasan.length ? (
                balasan.map((b) => (
                  <div key={b.id} className="flex gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E4F3FF] text-[10px] font-bold text-[#052659]">
                      {getInitials(b.penulisNama)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-[#F4F9FF] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-xs font-bold text-[#021024]">{b.penulisNama}</p>
                          <p className="text-[11px] text-[#2F5F8F]/60">
                            {formatRelativeTime(b.createdAt)}
                          </p>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#2F5F8F]">
                          {b.konten}
                        </p>
                      </div>

                      {b.balasanAnak.length > 0 && (
                        <div className="mt-2 space-y-2 border-l-2 border-[#C1E8FF] pl-4">
                          {b.balasanAnak.map((anak) => (
                            <div key={anak.id}>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <p className="text-xs font-bold text-[#021024]">
                                  {anak.penulisNama}
                                </p>
                                <p className="text-[11px] text-[#2F5F8F]/60">
                                  {formatRelativeTime(anak.createdAt)}
                                </p>
                              </div>
                              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#2F5F8F]">
                                {anak.konten}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-[#F4F9FF] px-4 py-5 text-center text-sm text-[#2F5F8F]/70">
                  Belum ada balasan. Jadilah yang pertama menanggapi.
                </p>
              )}
            </div>

            <form onSubmit={kirimBalasan} className="mt-6 flex gap-3 border-t border-[#021024]/8 pt-5">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#052659] text-[10px] font-bold text-[#C1E8FF]">
                {getInitials(session.nama)}
              </div>
              <div className="min-w-0 flex-1">
                <textarea
                  rows={3}
                  required
                  maxLength={5000}
                  value={draftBalasan}
                  onChange={(event) => setDraftBalasan(event.target.value)}
                  placeholder="Tulis balasanmu..."
                  aria-label="Tulis balasan"
                  className={`w-full resize-none rounded-2xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 ${tema.cincin}`}
                />

                {galatBalasan && (
                  <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                    {galatBalasan}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={mengirimBalasan || !draftBalasan.trim()}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#021024] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mengirimBalasan ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="size-4" aria-hidden="true" />
                  )}
                  Kirim balasan
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="bg-[#021024] py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Semua Kelas
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[.16em] text-white/25">
            © 2026 SMK Telekomunikasi Tunas Harapan
          </p>
        </div>
      </footer>
    </main>
  );
}
