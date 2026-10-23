"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Search, Plus, Filter, MessageSquare, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useForumGuard } from "@/lib/forum-auth";

interface ForumKelasClientProps {
  kelas: "X" | "XI" | "XII";
  label: string;
  deskripsi: string;
  warna: "emerald" | "blue" | "purple";
  warnaHex: string;
  warnaHover: string;
}

const warnaConfig = {
  emerald: { 
    buttonBg: "bg-emerald-600", 
    buttonHover: "hover:bg-emerald-700", 
    shadow: "shadow-emerald-600/20", 
    color: "text-emerald-600", 
    cardBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20" 
  },
  blue: { 
    buttonBg: "bg-blue-600", 
    buttonHover: "hover:bg-blue-700", 
    shadow: "shadow-blue-600/20", 
    color: "text-blue-600",
    cardBg: "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20"
  },
  purple: { 
    buttonBg: "bg-purple-600", 
    buttonHover: "hover:bg-purple-700", 
    shadow: "shadow-purple-600/20", 
    color: "text-purple-600",
    cardBg: "bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20"
  },
};

const KATEGORI = [
  { value: "all", label: "Semua Diskusi" },
  { value: "tugas", label: "Tugas" },
  { value: "project", label: "Project" },
  { value: "tanya-jawab", label: "Tanya Jawab" },
  { value: "pengalaman", label: "Berbagi Pengalaman" },
];

interface Diskusi {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  penulisNama: string;
  penulisInisial: string;
  createdAt: string;
  balasanCount: number;
  likeCount: number;
  userLiked: boolean;
}

const mockDiskusi: Diskusi[] = [
  {
    id: "1",
    judul: "Tugas PPLG Minggu Ini - Database Design",
    konten: "Siapa yang sudah selesai tugas PPLG minggu ini? Saya masih binggung di bagian database design, terutama untuk normalisasi tabel. Ada yang bisa bantu jelaskan 3NF?",
    kategori: "tugas",
    penulisNama: "Budi Santoso",
    penulisInisial: "BS",
    createdAt: "2026-01-15T08:30:00Z",
    balasanCount: 12,
    likeCount: 8,
    userLiked: false,
  },
  {
    id: "2",
    judul: "Project Akhir Semester - Ide Aplikasi",
    konten: "Kelas XI ada yang sudah punya ide project akhir semester? Saya mau bikin aplikasi manajemen tugas tapi binggung teknologinya. React Native vs Flutter?",
    kategori: "project",
    penulisNama: "Siti Rahma",
    penulisInisial: "SR",
    createdAt: "2026-01-14T14:20:00Z",
    balasanCount: 8,
    likeCount: 15,
    userLiked: true,
  },
  {
    id: "3",
    judul: "Tanya Jawab: Persiapan UKK PKK",
    konten: "Siapa yang sudah siap untuk UKK PKK minggu depan? Share tips belajarnya dong! Saya masih ragu di materi sistem operasi jaringan.",
    kategori: "tanya-jawab",
    penulisNama: "Ahmad Fauzi",
    penulisInisial: "AF",
    createdAt: "2026-01-14T09:15:00Z",
    balasanCount: 23,
    likeCount: 31,
    userLiked: false,
  },
  {
    id: "4",
    judul: "Pengalaman Magang di Industri - Tips & Trik",
    konten: "Baru selesai magang 3 bulan di software house. Mau share pengalaman: 1) Jangan takut tanya, 2) Catat semua hal baru, 3) Networking dengan senior. Semoga bermanfaat!",
    kategori: "pengalaman",
    penulisNama: "Dewi Sartika",
    penulisInisial: "DS",
    createdAt: "2026-01-13T16:45:00Z",
    balasanCount: 18,
    likeCount: 42,
    userLiked: true,
  },
];

export function ForumKelasClient({ kelas, label, deskripsi, warna, warnaHex, warnaHover }: ForumKelasClientProps) {
  const session = useForumGuard(kelas);

  if (!session) return null;

  const wc = warnaConfig[warna];

  const buttonBg = warna === 'emerald' ? 'bg-emerald-600' : warna === 'blue' ? 'bg-blue-600' : 'bg-purple-600';
  const buttonHover = warna === 'emerald' ? 'hover:bg-emerald-700' : warna === 'blue' ? 'hover:bg-blue-700' : 'hover:bg-purple-700';
  const buttonShadow = warna === 'emerald' ? 'shadow-emerald-600/20' : warna === 'blue' ? 'shadow-blue-600/20' : 'shadow-purple-600/20';
  const buttonBgClass = `inline-flex items-center justify-center gap-2 rounded-full ${buttonBg} ${buttonHover} px-5 py-3 text-xs font-bold text-white shadow-lg ${warna === 'emerald' ? 'shadow-emerald-600/20' : warna === 'blue' ? 'shadow-blue-600/20' : 'shadow-purple-600/20'} transition ${warna === 'emerald' ? 'hover:bg-emerald-700' : warna === 'blue' ? 'hover:bg-blue-700' : 'hover:bg-purple-700'}`;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeKategori, setActiveKategori] = useState("all");
  const [sortBy, setSortBy] = useState("terbaru");

  // Filter diskusi
  const filteredDiskusi = mockDiskusi.filter((d) => {
    const matchKategori = activeKategori === "all" || d.kategori === activeKategori;
    const matchSearch = searchQuery === "" || 
      d.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.konten.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.penulisNama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKategori && matchSearch;
  });

  // Sort
  const sortedDiskusi = [...filteredDiskusi].sort((a, b) => {
    if (sortBy === "terbaru") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "terlama") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "terpopuler") return b.likeCount - a.likeCount;
    if (sortBy === "terbanyak-balasan") return b.balasanCount - a.balasanCount;
    return 0;
  });

  const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
      <header className="border-b border-[#021024]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/forum"
            aria-label="Kembali ke forum"
            className="grid size-10 place-items-center rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-sm font-bold tracking-wide">Forum Siswa</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Kelas {kelas}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
              <span className="font-mono">{session.nama?.charAt(0).toUpperCase()}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#052659] text-white py-8 sm:py-12">
        <div aria-hidden className="absolute -right-24 -top-36 size-96 rounded-full bg-[#5483B3]/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-44 left-1/3 size-96 rounded-full bg-[#7DA0CA]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#C1E8FF]/70">Kelas {kelas}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">Forum Kelas {kelas}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#C1E8FF]/75 sm:text-base">
              {deskripsi}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-3xl">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Percakapan terbaru</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Diskusi Kelas {kelas}</h2>
            </div>
            <button className={`inline-flex items-center justify-center gap-2 rounded-full ${warna === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : warna === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700`}>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Mulai Diskusi
            </button>
          </div>

          {/* Search & Filter */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center gap-3">
            <label className="relative flex-1">
              <svg className="size-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Cari diskusi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#021024]/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#2F5F8F]/50 focus:border-[#5483B3]"
              />
            </label>
            
            <div className="flex items-center gap-2 sm:hidden">
              <select
                value={activeKategori}
                onChange={(e) => setActiveKategori(e.target.value)}
                className="flex-1 h-12 rounded-xl border border-[#021024]/10 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNiA5bDYgNiA2LTZ6IiBzdHJva2U9IiMwMjEwMjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-right-3 bg-no-repeat bg-center"
              >
                {KATEGORI.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>
            
            <div className="hidden sm:flex items-center gap-2">
              <label className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Urutkan:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 w-40 rounded-xl border border-[#021024]/10 bg-white py-3 pl-4 pr-10 text-sm font-semibold outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNiA5bDYgNiA2LTZ6IiBzdHJva2U9IiMwMjEwMjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-right-3 bg-no-repeat bg-center focus:border-[#5483B3]"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
                <option value="terpopuler">Terpopuler</option>
                <option value="terbanyak-balasan">Terbanyak Balasan</option>
              </select>
            </div>
          </div>

          {/* Kategori Filter - Desktop */}
          <div className="hidden sm:flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {KATEGORI.map((k) => (
              <button
                key={k.value}
                onClick={() => setActiveKategori(k.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all ${activeKategori === k.value ? "bg-[#052659] text-white" : "bg-white text-[#2F5F8F] hover:bg-[#021024]/5"} border border-[#021024]/10`}
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Thread List */}
          <div className="space-y-4">
            {sortedDiskusi.length > 0 ? (
              sortedDiskusi.map((diskusi) => (
                <article
                  key={diskusi.id}
                  className={`group relative rounded-2xl border border-[#021024]/8 bg-white p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${diskusi.userLiked ? "ring-2 ring-emerald-500/30" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="grid size-11 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
                        {diskusi.penulisInisial}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[.1em] ${diskusi.kategori === 'tugas' ? 'bg-emerald-100 text-emerald-700' : diskusi.kategori === 'project' ? 'bg-blue-100 text-blue-700' : diskusi.kategori === 'tanya-jawab' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {KATEGORI.find(k => k.value === diskusi.kategori)?.label || diskusi.kategori}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#2F5F8F]/60">
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          {formatRelativeTime(diskusi.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#021024] group-hover:text-[#052659] transition-colors line-clamp-2">{diskusi.judul}</h3>
                      <p className="mt-1.5 text-sm text-[#021024]/60 line-clamp-2">{diskusi.konten}</p>
                      
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2F5F8F]/60">
                        <span className="flex items-center gap-1 font-semibold text-[#021024]/70">{diskusi.penulisNama}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3.5" aria-hidden="true" />
                          {diskusi.balasanCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="size-3.5" aria-hidden="true" fill={diskusi.userLiked ? "currentColor" : "none"} stroke="currentColor" />
                          {diskusi.likeCount}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto flex-shrink-0 flex flex-col items-end gap-1">
                      <button className="opacity-0 group-hover:opacity-100 text-[#2F5F8F]/40 hover:text-[#052659] transition-colors p-1.5 rounded-lg hover:bg-[#021024]/5">
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  </div>
                  <Link
                    href={`/forum/${kelas}/${diskusi.id}`}
                    className="absolute inset-0 -z-10"
                    aria-label={`Baca diskusi: ${diskusi.judul}`}
                  />
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#7DA0CA]/40 bg-white p-10 text-center">
                <svg className="size-24 mx-auto text-[#2F5F8F]/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <h3 className="mt-3 font-semibold">Belum ada diskusi</h3>
                <p className="mt-1 text-sm text-[#2F5F8F]/65">{activeKategori !== "all" ? `Belum ada diskusi di kategori ini.` : `Jadilah yang pertama memulai diskusi di Kelas ${kelas}!`}</p>
                <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Buat Diskusi Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-[#021024] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
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

export default async function ForumKelasPage({ params }: { params: Promise<{ kelas: string }> }) {
  const { kelas } = await params;
  
  const kelasConfig = {
    X: { label: "Kelas X", deskripsi: "Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar.", warna: "emerald" as const, warnaHex: "#10b981", warnaHover: "#059669" },
    XI: { label: "Kelas XI", deskripsi: "Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman.", warna: "blue" as const, warnaHex: "#3b82f6", warnaHover: "#2563eb" },
    XII: { label: "Kelas XII", deskripsi: "Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja.", warna: "purple" as const, warnaHex: "#a855f7", warnaHover: "#9333ea" },
  };

  const config = kelasConfig[kelas as "X" | "XI" | "XII"];
  if (!config) return <div className="min-h-screen flex items-center justify-center">Kelas tidak valid</div>;

  return <ForumKelasClient kelas={kelas as "X" | "XI" | "XII"} {...config} />;
}