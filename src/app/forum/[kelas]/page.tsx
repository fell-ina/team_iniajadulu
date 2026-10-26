"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, Plus, Filter, MessageSquare, Heart, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useForumGuard } from "@/lib/forum-guard";

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
  { value: "tanya_jawab", label: "Tanya Jawab" },
  { value: "pengalaman", label: "Berbagi Pengalaman" },
];

const KATEGORI_LABEL: Record<string, string> = {
  all: "Semua Diskusi",
  tugas: "Tugas",
  project: "Project",
  tanya_jawab: "Tanya Jawab",
  pengalaman: "Berbagi Pengalaman",
};

const KATEGORI_COLOR: Record<string, string> = {
  tugas: "bg-emerald-100 text-emerald-700",
  project: "bg-blue-100 text-blue-700",
  tanya_jawab: "bg-purple-100 text-purple-700",
  pengalaman: "bg-orange-100 text-orange-700",
};

interface Diskusi {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  penulis_id: string;
  penulis_nama: string;
  penulis_inisial: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  balasan_count: number;
  user_liked: boolean;
}

interface PaginatedResult {
  data: Diskusi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "terlama", label: "Terlama" },
  { value: "terpopuler", label: "Terpopuler" },
  { value: "terbanyak_balasan", label: "Terbanyak Balasan" },
];

export function ForumKelasClient({ kelas, label, deskripsi, warna, warnaHex, warnaHover }: ForumKelasClientProps) {
  const session = useForumGuard(kelas);
  const wc = warnaConfig[warna];

  const [diskusiList, setDiskusiList] = useState<Diskusi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKategori, setActiveKategori] = useState("all");
  const [sortBy, setSortBy] = useState("terbaru");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJudul, setNewJudul] = useState("");
  const [newKonten, setNewKonten] = useState("");
  const [newKategori, setNewKategori] = useState("tugas");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchDiskusi = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        kelas,
        kategori: activeKategori,
        sort: sortBy,
        page: page.toString(),
        limit: "20",
      });
      
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/forum/topik?${params}`, { cache: "no-store" });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memuat diskusi");
      }

      const result: PaginatedResult = await res.json();
      setDiskusiList(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [kelas, activeKategori, sortBy, page, searchQuery]);

  useEffect(() => {
    fetchDiskusi();
  }, [fetchDiskusi]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [activeKategori, sortBy, searchQuery]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateTopik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim() || !newKonten.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/forum/topik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: newJudul.trim(),
          konten: newKonten.trim(),
          kategori: newKategori,
          kelas,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat diskusi");
      }

      const newTopik = await res.json();
      setDiskusiList(prev => [newTopik, ...prev]);
      setTotal(prev => prev + 1);
      setNewJudul("");
      setNewKonten("");
      setShowCreateForm(false);
      showToast("success", "Diskusi berhasil dibuat");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal membuat diskusi");
    } finally {
      setSubmitting(false);
    }
  };

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
  };

  const buttonBg = warna === 'emerald' ? 'bg-emerald-600' : warna === 'blue' ? 'bg-blue-600' : 'bg-purple-600';
  const buttonHover = warna === 'emerald' ? 'hover:bg-emerald-700' : warna === 'blue' ? 'hover:bg-blue-700' : 'hover:bg-purple-700';

  // Render loading state while session is being fetched or user is not authorized
  if (!session) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#052659] border-t-transparent" />
          <p className="mt-4 text-[#021024]/60">Memuat forum...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
      <header className="border-b border-[#021024]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Kembali ke beranda"
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
            <button
              onClick={() => setShowCreateForm(true)}
              className={`inline-flex items-center justify-center gap-2 rounded-full ${buttonBg} ${buttonHover} px-5 py-3 text-xs font-bold text-white shadow-lg ${warna === 'emerald' ? 'shadow-emerald-600/20' : warna === 'blue' ? 'shadow-blue-600/20' : 'shadow-purple-600/20'} transition`}
            >
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
                onKeyDown={(e) => e.key === "Enter" && fetchDiskusi()}
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
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
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
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <article key={i} className="rounded-2xl border border-[#021024]/8 bg-white p-5 sm:p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="grid size-11 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-[#021024]/10 rounded w-3/4 mb-2" />
                      <div className="h-6 bg-[#021024]/10 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-[#021024]/10 rounded w-full mb-1" />
                      <div className="h-4 bg-[#021024]/10 rounded w-3/4" />
                      <div className="mt-4 h-4 bg-[#021024]/10 rounded w-1/3" />
                    </div>
                  </div>
                </article>
              ))
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <svg className="size-12 mx-auto text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3 className="mt-3 font-semibold text-red-700">Gagal memuat diskusi</h3>
                <p className="mt-1 text-sm text-red-600">{error}</p>
                <button onClick={fetchDiskusi} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Coba Lagi
                </button>
              </div>
            ) : diskusiList.length > 0 ? (
              diskusiList.map((diskusi) => (
                <article
                  key={diskusi.id}
                  className={`group relative rounded-2xl border border-[#021024]/8 bg-white p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${diskusi.user_liked ? "ring-2 ring-emerald-500/30" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="grid size-11 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
                        {diskusi.penulis_inisial}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[.1em] ${KATEGORI_COLOR[diskusi.kategori] || "bg-gray-100 text-gray-700"}`}>
                          {KATEGORI_LABEL[diskusi.kategori] || diskusi.kategori}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#2F5F8F]/60">
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          {formatRelativeTime(diskusi.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#021024] group-hover:text-[#052659] transition-colors line-clamp-2">{diskusi.judul}</h3>
                      <p className="mt-1.5 text-sm text-[#021024]/60 line-clamp-2">{diskusi.konten}</p>
                      
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#2F5F8F]/60">
                        <span className="flex items-center gap-1 font-semibold text-[#021024]/70">{diskusi.penulis_nama}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3.5" aria-hidden="true" />
                          {diskusi.balasan_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="size-3.5" aria-hidden="true" fill={diskusi.user_liked ? "currentColor" : "none"} stroke="currentColor" />
                          {diskusi.like_count}
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
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Buat Diskusi Pertama
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && !error && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center justify-center size-10 rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="text-sm font-medium text-[#021024]/70">
                  Halaman {page} dari {totalPages} ({total} diskusi)
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center justify-center size-10 rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-[#021024] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition">
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

      {/* Create Topic Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/65 backdrop-blur-sm" onClick={() => setShowCreateForm(false)}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold">Mulai Diskusi Baru</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-[#2F5F8F]/60 hover:text-[#021024]">
                <X className="size-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTopik} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#021024] mb-1">Kategori</label>
                <select
                  value={newKategori}
                  onChange={(e) => setNewKategori(e.target.value)}
                  className="w-full rounded-xl border border-[#021024]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3]"
                >
                  <option value="tugas">Tugas</option>
                  <option value="project">Project</option>
                  <option value="tanya_jawab">Tanya Jawab</option>
                  <option value="pengalaman">Berbagi Pengalaman</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#021024] mb-1">Judul <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  placeholder="Masukkan judul diskusi (min 5 karakter, max 200)"
                  maxLength={200}
                  className="w-full rounded-xl border border-[#021024]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#021024] mb-1">Konten <span className="text-red-500">*</span></label>
                <textarea
                  value={newKonten}
                  onChange={(e) => setNewKonten(e.target.value)}
                  placeholder="Tulis isi diskusi Anda (min 10 karakter, max 10000)"
                  maxLength={10000}
                  rows={6}
                  className="w-full resize-none rounded-xl border border-[#021024]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3] placeholder:text-[#2F5F8F]/50"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#021024]/10 px-5 py-3 text-sm font-semibold text-[#2F5F8F] hover:bg-[#021024]/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newJudul.trim() || !newKonten.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Buat Diskusi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
            {toast.type === "success" ? (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
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