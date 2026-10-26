"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Flag,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { useForumGuard } from "@/lib/forum-guard";
import { formatRelativeTime } from "@/lib/forum-client";

interface Balasan {
  id: string;
  topik_id: string;
  parent_id: string | null;
  konten: string;
  penulis_id: string;
  penulis_nama: string;
  penulis_inisial: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  user_liked: boolean;
  balasan_anak: Balasan[];
  isEditing?: boolean;
}

interface Topik {
  id: string;
  judul: string;
  konten: string;
  kategori: "tugas" | "project" | "tanya_jawab" | "pengalaman";
  kelas: "X" | "XI" | "XII";
  penulis_id: string;
  penulis_nama: string;
  penulis_inisial: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  balasan_count: number;
  user_liked: boolean;
}

const KATEGORI_LABEL: Record<Topik["kategori"], string> = {
  tugas: "Tugas",
  project: "Project",
  tanya_jawab: "Tanya Jawab",
  pengalaman: "Berbagi Pengalaman",
};

const KATEGORI_COLOR: Record<Topik["kategori"], string> = {
  tugas: "bg-emerald-100 text-emerald-700",
  project: "bg-blue-100 text-blue-700",
  tanya_jawab: "bg-purple-100 text-purple-700",
  pengalaman: "bg-orange-100 text-orange-700",
};

const WARNA_KELAS: Record<"X" | "XI" | "XII", { bg: string; text: string; border: string }> = {
  X: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  XI: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  XII: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" },
};

interface ForumDetailClientProps {
  kelas: "X" | "XI" | "XII";
  topikId: string;
}

export function ForumDetailClient({ kelas, topikId }: ForumDetailClientProps) {
  const session = useForumGuard(kelas);
  const router = useRouter();

  if (!session) return null;

  const wc = WARNA_KELAS[kelas];

  const [topik, setTopik] = useState<Topik | null>(null);
  const [balasanList, setBalasanList] = useState<Balasan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBalasan, setNewBalasan] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: "topik" | "balasan"; id: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [topikRes, balasanRes] = await Promise.all([
        fetch(`/api/forum/topik/${topikId}`, { cache: "no-store" }),
        fetch(`/api/forum/balasan?topik_id=${topikId}`, { cache: "no-store" }),
      ]);

      if (!topikRes.ok) {
        const err = await topikRes.json();
        throw new Error(err.error || "Gagal memuat topik");
      }
      if (!balasanRes.ok) {
        const err = await balasanRes.json();
        throw new Error(err.error || "Gagal memuat balasan");
      }

      const topikData = await topikRes.json();
      const balasanData = await balasanRes.json();

      setTopik(topikData);
      setBalasanList(balasanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [topikId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLikeTopik = async () => {
    if (!topik) return;
    try {
      const res = await fetch("/api/forum/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topik_id: topik.id }),
      });
      if (!res.ok) throw new Error("Gagal like");
      const data = await res.json();
      setTopik({ ...topik, like_count: data.likeCount, user_liked: data.liked });
    } catch {
      showToast("error", "Gagal memberi like");
    }
  };

  const handleLikeBalasan = async (balasanId: string) => {
    try {
      const res = await fetch("/api/forum/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balasan_id: balasanId }),
      });
      if (!res.ok) throw new Error("Gagal like");
      const data = await res.json();
      updateBalasanLike(balasanId, data.likeCount, data.liked);
    } catch {
      showToast("error", "Gagal memberi like");
    }
  };

  const updateBalasanLike = (id: string, count: number, liked: boolean) => {
    setBalasanList(prev => prev.map(b => {
      if (b.id === id) return { ...b, like_count: count, user_liked: liked };
      if (b.balasan_anak.length > 0) {
        return { ...b, balasan_anak: updateBalasanLikeRecursive(b.balasan_anak, id, count, liked) };
      }
      return b;
    }));
  };

  const updateBalasanLikeRecursive = (list: Balasan[], id: string, count: number, liked: boolean): Balasan[] => {
    return list.map(b => {
      if (b.id === id) return { ...b, like_count: count, user_liked: liked };
      if (b.balasan_anak.length > 0) {
        return { ...b, balasan_anak: updateBalasanLikeRecursive(b.balasan_anak, id, count, liked) };
      }
      return b;
    });
  };

  const handleCreateBalasan = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = replyingTo ? replyContent : newBalasan;
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/forum/balasan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik_id: topikId,
          konten: content.trim(),
          parent_id: replyingTo,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat balasan");
      }
      const newBalasanData = await res.json();
      
      if (replyingTo) {
        // Add as child reply
        setBalasanList(prev => addChildReply(prev, replyingTo, newBalasanData));
      } else {
        // Add as root reply
        setBalasanList(prev => [...prev, newBalasanData]);
      }
      
      // Update topik balasan count
      if (topik) {
        setTopik({ ...topik, balasan_count: topik.balasan_count + 1 });
      }
      
      setNewBalasan("");
      setReplyContent("");
      setReplyingTo(null);
      showToast("success", "Balasan berhasil dikirim");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal mengirim balasan");
    } finally {
      setSubmitting(false);
    }
  };

  const addChildReply = (list: Balasan[], parentId: string, newReply: Balasan): Balasan[] => {
    return list.map(b => {
      if (b.id === parentId) {
        return { ...b, balasan_anak: [...b.balasan_anak, newReply] };
      }
      if (b.balasan_anak.length > 0) {
        return { ...b, balasan_anak: addChildReply(b.balasan_anak, parentId, newReply) };
      }
      return b;
    });
  };

  const handleDeleteTopik = async () => {
    if (!showDeleteConfirm || showDeleteConfirm.type !== "topik") return;
    try {
      const res = await fetch(`/api/forum/topik/${showDeleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus topik");
      showToast("success", "Topik berhasil dihapus");
      router.push(`/forum/${kelas}`);
    } catch {
      showToast("error", "Gagal menghapus topik");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteBalasan = async () => {
    if (!showDeleteConfirm || showDeleteConfirm.type !== "balasan") return;
    try {
      const res = await fetch(`/api/forum/balasan/${showDeleteConfirm.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus balasan");
      
      // Remove from list
      setBalasanList(prev => removeBalasan(prev, showDeleteConfirm!.id));
      
      // Update topik count
      if (topik) {
        setTopik({ ...topik, balasan_count: Math.max(0, topik.balasan_count - 1) });
      }
      
      showToast("success", "Balasan berhasil dihapus");
    } catch {
      showToast("error", "Gagal menghapus balasan");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const removeBalasan = (list: Balasan[], id: string): Balasan[] => {
    return list.filter(b => {
      if (b.id === id) return false;
      if (b.balasan_anak.length > 0) {
        b.balasan_anak = removeBalasan(b.balasan_anak, id);
      }
      return true;
    });
  };

  const handleReport = async (type: "topik" | "balasan", targetId: string) => {
    const alasan = prompt("Masukkan alasan laporan (minimal 10 karakter):");
    if (!alasan || alasan.length < 10) {
      if (alasan !== null) showToast("error", "Alasan minimal 10 karakter");
      return;
    }
    try {
      const res = await fetch("/api/forum/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type === "topik" ? "topik_id" : "balasan_id"]: targetId,
          alasan,
        }),
      });
      if (!res.ok) throw new Error("Gagal melaporkan");
      showToast("success", "Laporan berhasil dikirim");
    } catch {
      showToast("error", "Gagal mengirim laporan");
    }
  };

  const renderBalasan = (balasan: Balasan, depth: number = 0): React.ReactNode => {
    const isOwn = balasan.penulis_id === session.userId;
    const maxDepth = 3;

    return (
      <div
        key={balasan.id}
        className={`ml-${depth * 4} mb-4 ${depth > 0 ? "border-l-2 border-[#021024]/5 pl-4" : ""}`}
      >
        <article className={`rounded-2xl border border-[#021024]/8 bg-white p-5 transition hover:shadow-md ${balasan.isEditing ? "ring-2 ring-[#052659]/20" : ""}`}>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="grid size-10 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
                {balasan.penulis_inisial}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-[#021024]">{balasan.penulis_nama}</span>
                <span className="text-[11px] text-[#2F5F8F]/60">{formatRelativeTime(balasan.created_at)}</span>
                {balasan.updated_at !== balasan.created_at && (
                  <span className="text-[10px] text-[#2F5F8F]/50">(diedit)</span>
                )}
              </div>
              {balasan.isEditing ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const konten = formData.get("konten") as string;
                  updateBalasan(balasan.id, konten);
                }}>
                  <textarea
                    name="konten"
                    defaultValue={balasan.konten}
                    rows={3}
                    className="w-full rounded-xl border border-[#021024]/10 bg-white px-4 py-2 text-sm outline-none focus:border-[#5483B3] resize-none"
                    required
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="submit" className="inline-flex items-center gap-1 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white hover:bg-[#021024]">
                      <CheckCircle size={14} /> Simpan
                    </button>
                    <button type="button" onClick={() => cancelEditBalasan(balasan.id)} className="inline-flex items-center gap-1 rounded-xl border border-[#021024]/10 px-4 py-2 text-xs font-semibold text-[#2F5F8F] hover:bg-[#021024]/5">
                      <X size={14} /> Batal
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm leading-6 text-[#021024]/80 whitespace-pre-wrap">{balasan.konten}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  onClick={() => handleLikeBalasan(balasan.id)}
                  className={`inline-flex items-center gap-1 text-xs transition ${balasan.user_liked ? "text-emerald-600" : "text-[#2F5F8F]/60 hover:text-[#052659]"} disabled:opacity-50`}
                  disabled={submitting}
                >
                  <Heart className={`size-4 ${balasan.user_liked ? "fill-current" : ""}`} />
                  {balasan.like_count}
                </button>
                <button
                  onClick={() => setReplyingTo(balasan.id)}
                  className="inline-flex items-center gap-1 text-xs text-[#2F5F8F]/60 hover:text-[#052659] transition"
                >
                  <MessageSquare className="size-3.5" />
                  Balas
                </button>
                {isOwn && (
                  <React.Fragment>
                    <button
                      onClick={() => startEditBalasan(balasan.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#2F5F8F]/60 hover:text-[#052659] transition"
                    >
                      <Edit2 className="size-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: "balasan", id: balasan.id })}
                      className="inline-flex items-center gap-1 text-xs text-red-500/70 hover:text-red-600 transition"
                    >
                      <Trash2 className="size-3.5" />
                      Hapus
                    </button>
                  </React.Fragment>
                )}
                <button
                  onClick={() => handleReport("balasan", balasan.id)}
                  className="inline-flex items-center gap-1 text-xs text-[#2F5F8F]/60 hover:text-red-500 transition"
                >
                  <Flag className="size-3.5" />
                  Laporkan
                </button>
              </div>
            </div>
          </div>

          {/* Reply form for this balasan */}
          {replyingTo === balasan.id && (
            <form onSubmit={handleCreateBalasan} className="mt-3 ml-4 mb-4">
              <div className="flex gap-2">
                <div className="grid size-8 place-items-center rounded-full bg-[#052659] text-[10px] font-bold text-[#C1E8FF]">
                  {session.nama?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tulis balasan..."
                    rows={2}
                    className="w-full rounded-xl border border-[#021024]/10 bg-white px-4 py-2 text-sm outline-none focus:border-[#5483B3] resize-none"
                    required
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="text-xs font-semibold text-[#2F5F8F]">Batal</button>
                    <button type="submit" disabled={submitting || !replyContent.trim()} className="inline-flex items-center gap-1 rounded-xl bg-[#052659] px-4 py-2 text-xs font-bold text-white hover:bg-[#021024] disabled:opacity-50">
                      <Send size={14} /> Balas
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Nested replies */}
          {balasan.balasan_anak.length > 0 && depth < maxDepth && (
            <div className="mt-3 space-y-3">
              {balasan.balasan_anak.map(child => renderBalasan(child, depth + 1))}
            </div>
          )}

          {balasan.balasan_anak.length > 0 && depth >= maxDepth && (
            <button className="mt-2 text-xs text-[#2F5F8F]/60 hover:text-[#052659]">
              Lihat {balasan.balasan_anak.length} balasan lanjutan...
            </button>
          )}
        </article>
      </div>
    );
  };

  const startEditBalasan = (id: string) => {
    setBalasanList(prev => prev.map(b => {
      if (b.id === id) return { ...b, isEditing: true };
      if (b.balasan_anak.length > 0) {
        return { ...b, balasan_anak: b.balasan_anak.map(c => c.id === id ? { ...c, isEditing: true } : c) };
      }
      return b;
    }));
  };

  const cancelEditBalasan = (id: string) => {
    setBalasanList(prev => prev.map(b => {
      if (b.id === id) return { ...b, isEditing: false };
      if (b.balasan_anak.length > 0) {
        return { ...b, balasan_anak: b.balasan_anak.map(c => c.id === id ? { ...c, isEditing: false } : c) };
      }
      return b;
    }));
  };

  const updateBalasan = async (id: string, konten: string) => {
    try {
      const res = await fetch(`/api/forum/balasan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ konten }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui balasan");
      const updated = await res.json();
      
      setBalasanList(prev => prev.map(b => {
        if (b.id === id) return { ...b, ...updated, isEditing: false };
        if (b.balasan_anak.length > 0) {
          return { ...b, balasan_anak: b.balasan_anak.map(c => c.id === id ? { ...c, ...updated, isEditing: false } : c) };
        }
        return b;
      }));
      
      showToast("success", "Balasan diperbarui");
    } catch {
      showToast("error", "Gagal memperbarui balasan");
    }
  };

  const canManageTopik = topik && topik.penulis_id === session.userId;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#052659]" />
      </main>
    );
  }

  if (error || !topik) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="size-12 mx-auto text-red-500" />
          <h2 className="mt-3 text-lg font-semibold">Gagal memuat diskusi</h2>
          <p className="mt-1 text-sm text-[#2F5F8F]/60">{error || "Topik tidak ditemukan"}</p>
          <Link href={`/forum/${kelas}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700">
            <ArrowLeft className="size-4" /> Kembali
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
      <header className="border-b border-[#021024]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={`/forum/${kelas}`}
            aria-label="Kembali ke forum"
            className="grid size-10 place-items-center rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tracking-wide truncate">Forum Siswa</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Kelas {kelas}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
              <span className="font-mono">{session.nama?.charAt(0).toUpperCase()}</span>
            </span>
          </div>
        </div>
      </header>

      <section className={`${wc.bg} ${wc.border} text-white py-6 sm:py-8`}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[.1em] ${KATEGORI_COLOR[topik.kategori]}`}>
              {KATEGORI_LABEL[topik.kategori]}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/70">
              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {formatRelativeTime(topik.created_at)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{topik.judul}</h1>
          <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <div className="grid size-8 place-items-center rounded-full bg-white/20 text-xs font-bold">
                {topik.penulis_inisial}
              </div>
              <span className="font-semibold">{topik.penulis_nama}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <article className="rounded-2xl border border-[#021024]/8 bg-white p-6 sm:p-8 shadow-sm">
          <div className="prose prose-sm max-w-none text-[#021024]/80 whitespace-pre-wrap">
            {topik.konten}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#021024]/8 pt-6">
            <button
              onClick={handleLikeTopik}
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition ${topik.user_liked ? "text-emerald-600" : "text-[#2F5F8F]/60 hover:text-[#052659]"} disabled:opacity-50`}
              disabled={submitting}
            >
              <Heart className={`size-5 ${topik.user_liked ? "fill-current" : ""}`} />
              <span>{topik.like_count}</span> Suka
            </button>
            <span className="flex items-center gap-1.5 text-sm text-[#2F5F8F]/60">
              <MessageSquare className="size-5" />
              <span>{topik.balasan_count}</span> Balasan
            </span>
            {canManageTopik && (
              <React.Fragment>
                <button
                  onClick={() => router.push(`/forum/${kelas}/${topik.id}/edit`)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2F5F8F]/60 hover:text-[#052659] transition"
                >
                  <Edit2 className="size-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm({ type: "topik", id: topik.id })}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500/70 hover:text-red-600 transition"
                >
                  <Trash2 className="size-4" />
                  Hapus
                </button>
              </React.Fragment>
            )}
            <button
              onClick={() => handleReport("topik", topik.id)}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#2F5F8F]/60 hover:text-red-500 transition"
            >
              <Flag className="size-4" />
              Laporkan
            </button>
          </div>
        </article>

        {/* Replies Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Balasan ({topik.balasan_count})</h2>
          </div>

          {/* Create Reply Form */}
          <form onSubmit={handleCreateBalasan} className="mb-8 rounded-2xl border border-[#021024]/8 bg-white p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="grid size-10 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
                  {session.nama?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={newBalasan}
                  onChange={(e) => setNewBalasan(e.target.value)}
                  placeholder="Tulis balasan Anda..."
                  rows={3}
                  className="w-full rounded-xl border border-[#021024]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3] resize-none placeholder:text-[#2F5F8F]/50"
                  required
                />
                <div className="mt-3 flex justify-end">
                  <button type="submit" disabled={submitting || !newBalasan.trim()} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50">
                    <Send className="size-4" />
                    Kirim Balasan
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Replies List */}
          <div className="space-y-4">
            {balasanList.length > 0 ? (
              balasanList.map(balasan => renderBalasan(balasan))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#7DA0CA]/40 bg-white p-10 text-center">
                <MessageSquare className="size-24 mx-auto text-[#2F5F8F]/45" />
                <h3 className="mt-3 font-semibold">Belum ada balasan</h3>
                <p className="mt-1 text-sm text-[#2F5F8F]/65">Jadilah yang pertama menanggapi diskusi ini!</p>
              </div>
            )}
          </div>
        </section>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
            {toast.type === "success" ? <CheckCircle className="size-5" /> : <AlertCircle className="size-5" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021024]/65 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold">
              {showDeleteConfirm.type === "topik" ? "Hapus Topik" : "Hapus Balasan"}
            </h3>
            <p className="mt-2 text-sm text-[#021024]/60">
              {showDeleteConfirm.type === "topik"
                ? "Apakah Anda yakin ingin menghapus topik ini? Semua balasan di dalamnya juga akan terhapus. Tindakan ini tidak dapat dibatalkan."
                : "Apakah Anda yakin ingin menghapus balasan ini? Tindakan ini tidak dapat dibatalkan."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#021024]/10 px-4 py-2 text-sm font-semibold text-[#2F5F8F] hover:bg-[#021024]/5"
              >
                Batal
              </button>
              <button
                onClick={showDeleteConfirm.type === "topik" ? handleDeleteTopik : handleDeleteBalasan}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
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