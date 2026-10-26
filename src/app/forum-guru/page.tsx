"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { useForumAuth } from "@/lib/forum-auth";
import {
  KATEGORI_GURU,
  formatRelativeTime,
  getInitials,
  labelKategori,
  warnaKategori,
  type Balasan,
  type Topik,
} from "@/lib/forum-types";

/**
 * src/app/forum-guru/page.tsx
 * ---------------------------------------------------------------------------
 * Forum guru: daftar topik (forum_topik dengan kelas NULL) dimuat dari
 * Supabase, "Mulai diskusi" menulis topik baru, dan balasan menulis ke
 * forum_balasan lewat /api/forum/*.
 * ---------------------------------------------------------------------------
 */

const URUTAN = ["Terbaru", "Terpopuler"];

export default function ForumGuruPage() {
  const auth = useForumAuth();

  const [topik, setTopik] = useState<Topik[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState("semua");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(URUTAN[0]);

  const [showComposer, setShowComposer] = useState(false);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [kategoriBaru, setKategoriBaru] = useState(KATEGORI_GURU[3].nilai);
  const [mengirim, setMengirim] = useState(false);
  const [galatForm, setGalatForm] = useState<string | null>(null);

  const [terpilih, setTerpilih] = useState<Topik | null>(null);
  const [balasan, setBalasan] = useState<Balasan[]>([]);
  const [memuatBalasan, setMemuatBalasan] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [mengirimBalasan, setMengirimBalasan] = useState(false);
  const [galatBalasan, setGalatBalasan] = useState<string | null>(null);

  const bolehMasuk = !auth.loading && !!auth.userId && (auth.role === "guru" || auth.role === "admin");

  const muatTopik = useCallback(async () => {
    setMemuat(true);
    setGalat(null);
    try {
      const res = await fetch("/api/forum/topik?lingkup=guru", { cache: "no-store" });
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
  }, []);

  useEffect(() => {
    if (!bolehMasuk) return;
    void muatTopik();
  }, [bolehMasuk, muatTopik]);

  const visibleTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = topik.filter((t) => {
      const matchesCategory = activeCategory === "semua" || t.kategori === activeCategory;
      const matchesSearch =
        !query || `${t.judul} ${t.konten} ${t.penulisNama}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    return sort === "Terpopuler"
      ? [...filtered].sort((a, b) => b.likeCount - a.likeCount)
      : [...filtered].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [activeCategory, search, sort, topik]);

  const jumlahBalasan = useMemo(
    () => topik.reduce((total, t) => total + t.balasanCount, 0),
    [topik]
  );

  async function createTopic(event: FormEvent<HTMLFormElement>) {
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

      setTopik((current) => [data.topik as Topik, ...current]);
      setActiveCategory("semua");
      setSearch("");
      setSort(URUTAN[0]);
      setShowComposer(false);
      setJudul("");
      setIsi("");
      setKategoriBaru(KATEGORI_GURU[3].nilai);
    } catch {
      setGalatForm("Gagal menyimpan diskusi. Periksa koneksi Anda.");
    } finally {
      setMengirim(false);
    }
  }

  async function bukaUtas(topikDipilih: Topik) {
    setTerpilih(topikDipilih);
    setBalasan([]);
    setReplyDraft("");
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
    setReplyDraft("");
    setGalatBalasan(null);
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!terpilih || mengirimBalasan) return;

    const konten = replyDraft.trim();
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

      setBalasan((current) => [...current, data.balasan as Balasan]);
      setTopik((current) =>
        current.map((t) =>
          t.id === terpilih.id ? { ...t, balasanCount: t.balasanCount + 1 } : t
        )
      );
      setTerpilih((current) =>
        current ? { ...current, balasanCount: current.balasanCount + 1 } : current
      );
      setReplyDraft("");
    } catch {
      setGalatBalasan("Gagal menyimpan balasan. Periksa koneksi Anda.");
    } finally {
      setMengirimBalasan(false);
    }
  }

  if (auth.loading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F4F9FF] text-[#2F5F8F]">
        <div className="text-center">
          <Loader2 className="mx-auto size-6 animate-spin" />
          <p className="mt-3 text-sm">Memuat forum guru...</p>
        </div>
      </main>
    );
  }

  if (!bolehMasuk) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F4F9FF] p-6 text-[#021024]">
        <div className="max-w-md rounded-3xl border border-[#7DA0CA]/30 bg-white p-8 text-center shadow-sm">
          <Users className="mx-auto size-8 text-[#5483B3]" />
          <h1 className="mt-4 text-xl font-bold">Forum guru khusus guru &amp; admin</h1>
          <p className="mt-2 text-sm leading-6 text-[#2F5F8F]/75">
            Masuk dengan akun guru untuk membuka ruang kolaborasi ini.
          </p>
          <Link
            href={auth.userId ? "/dashboard" : "/login"}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#052659] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#021024]"
          >
            {auth.userId ? "Ke dashboard" : "Masuk"}
          </Link>
        </div>
      </main>
    );
  }

  const inisial = getInitials(auth.nama ?? "Guru");

  return (
    <main className="min-h-dvh bg-[#F4F9FF] text-[#021024]">
      <header className="border-b border-[#021024]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard"
            className="grid size-10 place-items-center rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-sm font-bold tracking-wide">Ruang Guru</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
              Forum kolaborasi
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Notifikasi"
              className="grid size-10 place-items-center rounded-full text-[#2F5F8F] transition hover:bg-[#021024]/5"
            >
              <Bell size={18} />
            </button>
            <span
              className="grid size-9 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]"
              title={auth.nama ?? undefined}
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
              Belajar bersama
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">
              Forum Guru Tunas Harapan
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#C1E8FF]/75 sm:text-base">
              Ruang aman untuk bertanya, berbagi praktik baik, dan saling mendukung demi
              pembelajaran yang lebih bermakna.
            </p>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3 sm:gap-5">
            {[
              [String(topik.length), "Diskusi aktif"],
              ["67", "Guru terhubung"],
              [String(jumlahBalasan), "Balasan"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#C1E8FF]/65">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-10">
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
                Percakapan terbaru
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Diskusi guru</h2>
            </div>
            <button
              onClick={() => {
                setGalatForm(null);
                setShowComposer((current) => !current);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#C2410C]/20 transition hover:bg-[#9A3412]"
            >
              <Plus size={16} /> Mulai diskusi
            </button>
          </div>

          {showComposer && (
            <form
              onSubmit={createTopic}
              className="mt-6 rounded-3xl border border-[#7DA0CA]/25 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold">Mulai topik baru</h3>
                  <p className="mt-1 text-xs text-[#2F5F8F]/70">
                    Bagikan pertanyaan atau pengalaman Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="text-xs font-semibold text-[#2F5F8F]"
                >
                  Batal
                </button>
              </div>
              <div className="mt-5 grid gap-4">
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={judul}
                  onChange={(event) => setJudul(event.target.value)}
                  placeholder="Judul diskusi"
                  className="rounded-xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 focus:border-[#5483B3]"
                />
                <textarea
                  required
                  maxLength={10000}
                  value={isi}
                  onChange={(event) => setIsi(event.target.value)}
                  placeholder="Ceritakan yang ingin Anda diskusikan..."
                  rows={3}
                  className="resize-none rounded-xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 focus:border-[#5483B3]"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={kategoriBaru}
                    onChange={(event) => setKategoriBaru(event.target.value)}
                    className="rounded-xl border border-[#021024]/12 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3]"
                  >
                    {KATEGORI_GURU.map((k) => (
                      <option key={k.nilai} value={k.nilai}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={mengirim}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#052659] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#021024] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {mengirim ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    Publikasikan
                  </button>
                </div>
                {galatForm && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                    {galatForm}
                  </p>
                )}
              </div>
            </form>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]/55"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari diskusi..."
                aria-label="Cari diskusi"
                className="h-12 w-full rounded-xl border border-[#021024]/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#2F5F8F]/50 focus:border-[#5483B3]"
              />
            </label>
            <label className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Urutkan diskusi"
                className="h-12 w-full appearance-none rounded-xl border border-[#021024]/10 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none sm:w-40"
              >
                {URUTAN.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory("semua")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeCategory === "semua"
                  ? "bg-[#052659] text-white"
                  : "bg-white text-[#2F5F8F] hover:bg-[#C1E8FF]/50"
              }`}
            >
              Semua diskusi
            </button>
            {KATEGORI_GURU.map((k) => (
              <button
                key={k.nilai}
                onClick={() => setActiveCategory(k.nilai)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === k.nilai
                    ? "bg-[#052659] text-white"
                    : "bg-white text-[#2F5F8F] hover:bg-[#C1E8FF]/50"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {memuat ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#7DA0CA]/25 bg-white p-10 text-sm text-[#2F5F8F]/70">
                <Loader2 size={16} className="animate-spin" /> Memuat diskusi...
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
            ) : (
              visibleTopics.map((topic) => (
                <article
                  key={topic.id}
                  className="group rounded-2xl border border-[#021024]/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#C1E8FF] text-xs font-bold text-[#052659]">
                      {getInitials(topic.penulisNama)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#2F5F8F]/65">
                        <span className={warnaKategori(topic.kategori)}>
                          {labelKategori(topic.kategori)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold leading-snug text-[#021024] transition group-hover:text-[#2F5F8F] sm:text-lg">
                        {topic.judul}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#2F5F8F]/75">
                        {topic.konten}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2F5F8F]/60">
                        <span className="font-semibold text-[#021024]/70">
                          {topic.penulisNama}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={13} /> {formatRelativeTime(topic.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle size={13} /> {topic.balasanCount} balasan
                        </span>
                        <span>{topic.likeCount} disukai</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void bukaUtas(topic)}
                        className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#052659] transition hover:text-[#C2410C]"
                      >
                        <MessageCircle size={14} /> Buka diskusi dan balas
                      </button>
                    </div>
                    <button
                      aria-label={`Simpan diskusi ${topic.judul}`}
                      className="hidden self-start text-[#2F5F8F]/45 transition hover:text-[#052659] sm:block"
                    >
                      <Bookmark size={17} />
                    </button>
                  </div>
                </article>
              ))
            )}
            {!memuat && !galat && !visibleTopics.length && (
              <div className="rounded-2xl border border-dashed border-[#7DA0CA]/40 bg-white p-10 text-center">
                <Search size={24} className="mx-auto text-[#2F5F8F]/45" />
                <p className="mt-3 font-semibold">Diskusi tidak ditemukan</p>
                <p className="mt-1 text-sm text-[#2F5F8F]/65">
                  Coba kata kunci atau kategori lain.
                </p>
              </div>
            )}
          </div>

          {terpilih && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                aria-label="Tutup pop-up diskusi"
                onClick={tutupUtas}
                className="absolute inset-0 bg-[#021024]/65 backdrop-blur-sm"
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={`discussion-title-${terpilih.id}`}
                className="relative z-10 h-[92vh] max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-3xl border border-[#7DA0CA]/25 bg-white p-5 shadow-2xl sm:p-8"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#021024]/8 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2F5F8F]/65">
                      Thread diskusi
                    </p>
                    <h2 id={`discussion-title-${terpilih.id}`} className="mt-2 text-xl font-bold leading-snug">
                      {terpilih.judul}
                    </h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#2F5F8F]/75">
                      {terpilih.konten}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-[#021024]/70">
                      {terpilih.penulisNama} · {formatRelativeTime(terpilih.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={tutupUtas}
                    aria-label="Tutup diskusi"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[#2F5F8F]/60 transition hover:bg-[#021024]/5 hover:text-[#021024]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {memuatBalasan ? (
                    <p className="flex items-center justify-center gap-2 rounded-2xl bg-[#F4F9FF] px-4 py-5 text-sm text-[#2F5F8F]/70">
                      <Loader2 size={14} className="animate-spin" /> Memuat balasan...
                    </p>
                  ) : balasan.length ? (
                    balasan.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E4F3FF] text-[10px] font-bold text-[#052659]">
                          {getInitials(reply.penulisNama)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="rounded-2xl bg-[#F4F9FF] px-4 py-3">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <p className="text-xs font-bold text-[#021024]">{reply.penulisNama}</p>
                              <p className="text-[11px] text-[#2F5F8F]/60">
                                {formatRelativeTime(reply.createdAt)}
                              </p>
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#2F5F8F]">
                              {reply.konten}
                            </p>
                          </div>

                          {reply.balasanAnak.length > 0 && (
                            <div className="mt-2 space-y-2 border-l-2 border-[#C1E8FF] pl-4">
                              {reply.balasanAnak.map((anak) => (
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

                <form
                  onSubmit={sendReply}
                  className="mt-6 flex gap-3 border-t border-[#021024]/8 pt-5"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#052659] text-[10px] font-bold text-[#C1E8FF]">
                    {inisial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <textarea
                      rows={3}
                      required
                      maxLength={5000}
                      value={replyDraft}
                      onChange={(event) => setReplyDraft(event.target.value)}
                      placeholder="Tulis balasan Anda..."
                      aria-label="Tulis balasan"
                      className="w-full resize-none rounded-2xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 focus:border-[#5483B3]"
                    />
                    {galatBalasan && (
                      <p
                        role="alert"
                        className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700"
                      >
                        {galatBalasan}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={mengirimBalasan || !replyDraft.trim()}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#021024] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {mengirimBalasan ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Kirim balasan
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-[#E4F3FF] p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-white text-[#052659]">
                <Users size={19} />
              </div>
              <h2 className="font-bold">Panduan ruang guru</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#2F5F8F]">
              Jaga forum tetap nyaman, relevan, dan bermanfaat untuk semua rekan pendidik.
            </p>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-[#2F5F8F]">
              <li className="flex gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#5483B3]" /> Gunakan judul
                yang jelas dan spesifik.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#5483B3]" /> Hormati
                pengalaman dan pendapat rekan.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#5483B3]" /> Tandai jawaban
                yang paling membantu.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-[#021024]/8 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Dokumen bersama</h2>
              <FileText size={18} className="text-[#5483B3]" />
            </div>
            <p className="mt-2 text-sm leading-6 text-[#2F5F8F]/70">
              Tempat berbagi perangkat ajar dan referensi sekolah.
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#052659]"
            >
              Buka perpustakaan <MoreHorizontal size={15} />
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
