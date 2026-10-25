"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Edit2, Save, X, AlertCircle, CheckCircle, User, Mail, Shield, BookOpen, GraduationCap, Lock, Eye, EyeOff } from "lucide-react";

interface Profil {
  id: string;
  nama: string;
  email: string;
  role: string | null;
  nisn: string | null;
  jurusan: string | null;
  kelas: string | null;
  verification_status: string;
  created_at: string;
}

export function ProfilClient() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProfil = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profil", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memuat profil");
      }
      const data = await res.json();
      setProfil(data);
      setEditNama(data.nama);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfil();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!editNama.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: editNama.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan profil");
      }

      const data = await res.json();
      setProfil(data);
      setEditing(false);
      showToast("success", "Profil berhasil diperbarui");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditNama(profil?.nama ?? "");
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getRoleLabel = (role: string | null): string => {
    switch (role) {
      case "admin": return "Administrator";
      case "guru": return "Guru";
      case "siswa": return "Siswa";
      default: return "Pengguna";
    }
  };

  const getVerificationLabel = (status: string): string => {
    switch (status) {
      case "terverifikasi": return "Terverifikasi";
      case "menunggu": return "Menunggu Verifikasi";
      case "ditolak": return "Ditolak";
      default: return "Belum Verifikasi";
    }
  };

  const getVerificationColor = (status: string): string => {
    switch (status) {
      case "terverifikasi": return "bg-emerald-100 text-emerald-700";
      case "menunggu": return "bg-yellow-100 text-yellow-700";
      case "ditolak": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#052659]" />
      </main>
    );
  }

  if (error || !profil) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="size-12 mx-auto text-red-500" />
          <h2 className="mt-3 text-lg font-semibold">Gagal memuat profil</h2>
          <p className="mt-1 text-sm text-[#2F5F8F]/60">{error || "Profil tidak ditemukan"}</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700">
            Kembali ke Beranda
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
            href="/"
            aria-label="Kembali ke beranda"
            className="grid size-10 place-items-center rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-sm font-bold tracking-wide">Profil Saya</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">Pengaturan Akun</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Profile Card */}
          <div className="rounded-2xl border border-[#021024]/8 bg-white shadow-sm overflow-hidden">
            <div className="bg-[#052659] px-6 py-8 sm:px-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid size-20 place-items-center rounded-full bg-white/10 text-2xl font-bold text-white">
                    {profil.nama?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">{profil.nama}</h1>
                    <p className="text-white/70">{profil.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[.1em] ${getVerificationColor(profil.verification_status)}`}>
                    {getVerificationLabel(profil.verification_status)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[.1em] bg-white/10 text-white/80">
                    {getRoleLabel(profil.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Basic Info */}
              <section>
                <h2 className="text-lg font-semibold text-[#021024] flex items-center gap-2">
                  <User className="size-5 text-[#052659]" />
                  Informasi Dasar
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Nama Lengkap</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        className="w-full rounded-xl border border-[#021024]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#5483B3]"
                        autoFocus
                      />
                    ) : (
                      <p className="text-[#021024]">{profil.nama}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Email</label>
                    <p className="text-[#021024]/60 flex items-center gap-2">
                      <Mail className="size-4" />
                      {profil.email}
                      <span className="text-[10px] text-[#2F5F8F]/50">(tidak bisa diubah)</span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Role & Verification */}
              <section>
                <h2 className="text-lg font-semibold text-[#021024] flex items-center gap-2">
                  <Shield className="size-5 text-[#052659]" />
                  Role & Verifikasi
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                    <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Peran</label>
                    <p className="text-[#021024] flex items-center gap-2">
                      <Shield className="size-4 text-[#052659]" />
                      {getRoleLabel(profil.role)}
                      <span className="text-[10px] text-[#2F5F8F]/50">(ditetapkan admin)</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                    <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Status Verifikasi</label>
                    <p className="text-[#021024] flex items-center gap-2">
                      <Shield className="size-4 text-[#052659]" />
                      {getVerificationLabel(profil.verification_status)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Student Info (only for siswa) */}
              {(profil.role === "siswa" || profil.nisn || profil.jurusan || profil.kelas) && (
                <section>
                  <h2 className="text-lg font-semibold text-[#021024] flex items-center gap-2">
                    <GraduationCap className="size-5 text-[#052659]" />
                    Data Siswa
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                      <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">NISN</label>
                      <p className="text-[#021024] flex items-center gap-2">
                        <BookOpen className="size-4 text-[#052659]" />
                        {profil.nisn ?? "-"}
                        {profil.nisn && <span className="text-[10px] text-[#2F5F8F]/50">(tidak bisa diubah)</span>}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                      <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Jurusan</label>
                      <p className="text-[#021024] flex items-center gap-2">
                        <BookOpen className="size-4 text-[#052659]" />
                        {profil.jurusan ?? "-"}
                        {profil.jurusan && <span className="text-[10px] text-[#2F5F8F]/50">(tidak bisa diubah)</span>}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                      <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Kelas</label>
                      <p className="text-[#021024] flex items-center gap-2">
                        <GraduationCap className="size-4 text-[#052659]" />
                        {profil.kelas ? `Kelas ${profil.kelas}` : "-"}
                        {profil.kelas && <span className="text-[10px] text-[#2F5F8F]/50">(tidak bisa diubah)</span>}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Account Info */}
              <section>
                <h2 className="text-lg font-semibold text-[#021024] flex items-center gap-2">
                  <Lock className="size-5 text-[#052659]" />
                  Keamanan Akun
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                    <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">Dibuat pada</label>
                    <p className="text-[#021024] flex items-center gap-2">
                      <Eye className="size-4 text-[#052659]" />
                      {formatDate(profil.created_at)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#021024]/8 bg-[#F4F9FF] p-4">
                    <label className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70 mb-1">ID Akun</label>
                    <p className="text-[#021024]/60 font-mono text-xs">{profil.id}</p>
                  </div>
                </div>
              </section>

              {/* Edit Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#021024]/8">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#021024]/10 px-5 py-3 text-sm font-semibold text-[#2F5F8F] hover:bg-[#021024]/5"
                    >
                      <X className="size-4" />
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !editNama.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      <Save className="size-4" />
                      Simpan Perubahan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    <Edit2 className="size-4" />
                    Edit Profil
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info Notice */}
          <div className="mt-6 rounded-xl border border-[#7DA0CA]/40 bg-white p-5">
            <div className="flex gap-3">
              <AlertCircle className="size-5 mt-0.5 text-[#052659] shrink-0" />
              <div>
                <h3 className="font-semibold text-[#021024]">Informasi</h3>
                <p className="mt-1 text-sm text-[#2F5F8F]/70">
                  Hanya nama yang dapat diubah melalui halaman ini. Email, NISN, jurusan, kelas, role, dan status verifikasi
                  dikelola oleh administrator dan tidak dapat diubah oleh pengguna.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#021024] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
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

export default function ProfilPage() {
  return <ProfilClient />;
}