"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  X,
  Users,
} from "lucide-react";

type Topic = {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  initials: string;
  time: string;
  replies: number;
  views: number;
  pinned?: boolean;
  solved?: boolean;
};

type Reply = {
  id: number;
  author: string;
  initials: string;
  time: string;
  message: string;
};

const categories = ["Semua diskusi", "Kurikulum", "Kesiswaan", "Teknologi", "Berbagi praktik"];

const initialTopics: Topic[] = [];

const initialReplies: Record<number, Reply[]> = {};

export default function ForumGuruPage() {
  const [topics, setTopics] = useState(initialTopics);
  const [activeCategory, setActiveCategory] = useState("Semua diskusi");
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [sort, setSort] = useState("Terbaru");
  const [replies, setReplies] = useState(initialReplies);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const visibleTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = topics.filter((topic) => {
      const matchesCategory = activeCategory === "Semua diskusi" || topic.category === activeCategory;
      const matchesSearch = !query || `${topic.title} ${topic.excerpt} ${topic.author}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    return sort === "Terpopuler" ? [...filtered].sort((a, b) => b.views - a.views) : filtered;
  }, [activeCategory, search, sort, topics]);

  function createTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const excerpt = String(form.get("excerpt") ?? "").trim();
    const category = String(form.get("category") ?? "Berbagi praktik");

    if (!title || !excerpt) return;

    const newTopicId = Date.now();
    setTopics((current) => [
      {
        id: newTopicId,
        title,
        excerpt,
        category,
        author: "Anda",
        initials: "AN",
        time: "Baru saja",
        replies: 0,
        views: 0,
      },
      ...current,
    ]);
    setSelectedTopicId(newTopicId);
    setShowComposer(false);
    event.currentTarget.reset();
  }

  function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = replyDraft.trim();
    if (!message || selectedTopicId === null) return;

    setReplies((current) => ({
      ...current,
      [selectedTopicId]: [
        ...(current[selectedTopicId] ?? []),
        {
          id: Date.now(),
          author: "Anda",
          initials: "AN",
          time: "Baru saja",
          message,
        },
      ],
    }));
    setTopics((current) => current.map((topic) => topic.id === selectedTopicId ? { ...topic, replies: topic.replies + 1 } : topic));
    setReplyDraft("");
  }

  const selectedTopic = selectedTopicId === null ? null : topics.find((topic) => topic.id === selectedTopicId) ?? null;

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
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Forum kolaborasi</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="Notifikasi" className="grid size-10 place-items-center rounded-full text-[#2F5F8F] transition hover:bg-[#021024]/5">
              <Bell size={18} />
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">AN</span>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#052659] text-white">
        <div aria-hidden className="absolute -right-24 -top-36 size-96 rounded-full bg-[#5483B3]/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-44 left-1/3 size-96 rounded-full bg-[#7DA0CA]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#C1E8FF]/70">Belajar bersama</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">Forum Guru Tunas Harapan</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#C1E8FF]/75 sm:text-base">
              Ruang aman untuk bertanya, berbagi praktik baik, dan saling mendukung demi pembelajaran yang lebih bermakna.
            </p>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3 sm:gap-5">
            {[
              [String(topics.length), "Diskusi aktif"],
              ["68", "Guru terhubung"],
              [String(topics.filter((topic) => topic.solved).length), "Topik terjawab"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#C1E8FF]/65">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-10">
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Percakapan terbaru</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Diskusi guru</h2>
            </div>
            <button onClick={() => setShowComposer((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-[#C2410C]/20 transition hover:bg-[#9A3412]">
              <Plus size={16} /> Mulai diskusi
            </button>
          </div>

          {showComposer && (
            <form onSubmit={createTopic} className="mt-6 rounded-3xl border border-[#7DA0CA]/25 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold">Mulai topik baru</h3>
                  <p className="mt-1 text-xs text-[#2F5F8F]/70">Bagikan pertanyaan atau pengalaman Anda.</p>
                </div>
                <button type="button" onClick={() => setShowComposer(false)} className="text-xs font-semibold text-[#2F5F8F]">Batal</button>
              </div>
              <div className="mt-5 grid gap-4">
                <input name="title" required placeholder="Judul diskusi" className="rounded-xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 focus:border-[#5483B3]" />
                <textarea name="excerpt" required placeholder="Ceritakan yang ingin Anda diskusikan..." rows={3} className="resize-none rounded-xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 focus:border-[#5483B3]" />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select name="category" defaultValue="Berbagi praktik" className="rounded-xl border border-[#021024]/12 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3]">
                    {categories.slice(1).map((category) => <option key={category}>{category}</option>)}
                  </select>
                  <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#052659] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#021024]"><Send size={15} /> Publikasikan</button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]/55" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari diskusi..." className="h-12 w-full rounded-xl border border-[#021024]/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#2F5F8F]/50 focus:border-[#5483B3]" />
            </label>
            <label className="relative">
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[#021024]/10 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none sm:w-40">
                <option>Terbaru</option>
                <option>Terpopuler</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]" />
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${activeCategory === category ? "bg-[#052659] text-white" : "bg-white text-[#2F5F8F] hover:bg-[#C1E8FF]/50"}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {visibleTopics.map((topic) => (
              <article key={topic.id} className="group rounded-2xl border border-[#021024]/8 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
                <div className="flex gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#C1E8FF] text-xs font-bold text-[#052659]">{topic.initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#2F5F8F]/65">
                      {topic.pinned && <span className="text-[#C2410C]">Disematkan</span>}
                      <span>{topic.category}</span>
                      {topic.solved && <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={12} /> Terjawab</span>}
                    </div>
                    <h3 className="mt-2 text-base font-bold leading-snug text-[#021024] transition group-hover:text-[#2F5F8F] sm:text-lg">{topic.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#2F5F8F]/75">{topic.excerpt}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2F5F8F]/60">
                      <span className="font-semibold text-[#021024]/70">{topic.author}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {topic.time}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> {topic.replies} balasan</span>
                      <span>{topic.views} dilihat</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTopicId(topic.id)}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#052659] transition hover:text-[#C2410C]"
                    >
                      <MessageCircle size={14} /> Buka diskusi dan balas
                    </button>
                  </div>
                  <button aria-label={`Simpan diskusi ${topic.title}`} className="hidden self-start text-[#2F5F8F]/45 transition hover:text-[#052659] sm:block"><Bookmark size={17} /></button>
                </div>
              </article>
            ))}
            {!visibleTopics.length && <div className="rounded-2xl border border-dashed border-[#7DA0CA]/40 bg-white p-10 text-center"><Search size={24} className="mx-auto text-[#2F5F8F]/45" /><p className="mt-3 font-semibold">Diskusi tidak ditemukan</p><p className="mt-1 text-sm text-[#2F5F8F]/65">Coba kata kunci atau kategori lain.</p></div>}
          </div>

          {selectedTopic && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              role="presentation"
            >
              <button
                type="button"
                aria-label="Tutup pop-up diskusi"
                onClick={() => setSelectedTopicId(null)}
                className="absolute inset-0 bg-[#021024]/65 backdrop-blur-sm"
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={`discussion-title-${selectedTopic.id}`}
                className="relative z-10 flex h-[92vh] max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-[#7DA0CA]/25 bg-white p-5 shadow-2xl sm:p-8"
              >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#021024]/8 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2F5F8F]/65">
                      Thread diskusi
                    </p>
                    <h2
                      id={`discussion-title-${selectedTopic.id}`}
                      className="mt-2 text-xl font-bold leading-snug"
                    >
                      {selectedTopic.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#2F5F8F]/75">
                      {selectedTopic.excerpt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTopicId(null)}
                    aria-label="Tutup diskusi"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[#2F5F8F]/60 transition hover:bg-[#021024]/5 hover:text-[#021024]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  {(replies[selectedTopic.id] ?? []).length ? (
                    (replies[selectedTopic.id] ?? []).map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#E4F3FF] text-[10px] font-bold text-[#052659]">
                          {reply.initials}
                        </div>
                        <div className="min-w-0 flex-1 rounded-2xl bg-[#F4F9FF] px-4 py-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-xs font-bold text-[#021024]">{reply.author}</p>
                            <p className="text-[11px] text-[#2F5F8F]/60">{reply.time}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#2F5F8F]">{reply.message}</p>
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
                  className="mt-6 flex shrink-0 gap-3 border-t border-[#021024]/8 bg-white pb-1 pt-5"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#052659] text-[10px] font-bold text-[#C1E8FF]">
                    AN
                  </div>
                  <div className="min-w-0 flex-1">
                    <textarea
                      value={replyDraft}
                      onChange={(event) => setReplyDraft(event.target.value)}
                      placeholder="Tulis balasan Anda..."
                      rows={3}
                      required
                      className="w-full resize-none rounded-2xl border border-[#021024]/12 px-4 py-3 text-sm outline-none transition placeholder:text-[#2F5F8F]/45 focus:border-[#5483B3]"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={!replyDraft.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#052659] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#021024] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={14} /> Kirim balasan
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-[#E4F3FF] p-6">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-white text-[#052659]"><Users size={19} /></div><h2 className="font-bold">Panduan ruang guru</h2></div>
            <p className="mt-4 text-sm leading-6 text-[#2F5F8F]">Jaga forum tetap nyaman, relevan, dan bermanfaat untuk semua rekan pendidik.</p>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-[#2F5F8F]">
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#5483B3]" /> Gunakan judul yang jelas dan spesifik.</li>
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#5483B3]" /> Hormati pengalaman dan pendapat rekan.</li>
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#5483B3]" /> Tandai jawaban yang paling membantu.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-[#021024]/8 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="font-bold">Dokumen bersama</h2><FileText size={18} className="text-[#5483B3]" /></div>
            <p className="mt-2 text-sm leading-6 text-[#2F5F8F]/70">Tempat berbagi perangkat ajar dan referensi sekolah.</p>
            <button className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#052659]">Buka perpustakaan <MoreHorizontal size={15} /></button>
          </div>
        </aside>
      </div>
    </main>
  );
}
