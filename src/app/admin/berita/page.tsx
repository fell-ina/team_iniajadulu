"use client";

import Link from "next/link";
import DaftarBeritaAdmin from "@/components/DaftarBeritaAdmin";

/**
 * Halaman /admin/berita — tampilan kelola berita yang sama dengan dashboard.
 * API tetap memverifikasi session + role, jadi user yang belum login akan
 * melihat pesan error saat daftar dimuat dan diarahkan login bila perlu.
 */
export default function AdminBerita() {
  return (
    <main className="min-h-screen bg-[#F4F9FF] px-4 py-10 text-[#021024] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link href="/" className="text-[#021024]/45 transition hover:text-[#021024]">
            ← Beranda
          </Link>
          <span className="text-[#021024]/25">/</span>
          <Link href="/dashboard" className="text-[#021024]/45 transition hover:text-[#021024]">
            Dashboard
          </Link>
          <span className="text-[#021024]/25">/</span>
          <span className="font-semibold text-[#2F5F8F]">Berita</span>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[2rem] bg-[#052659] px-6 py-8 text-white shadow-xl sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[#5483B3]/30 blur-3xl"
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#C1E8FF]/70">
              Admin / Berita
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Kelola berita.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C1E8FF]/70">
              Unggah berita baru lengkap dengan <strong className="text-white">gambar</strong>,{" "}
              <strong className="text-white">judul</strong>,{" "}
              <strong className="text-white">subjudul</strong>, dan{" "}
              <strong className="text-white">isi berita</strong>. Semua berita yang sudah diunggah
              tampil di bawah dan bisa diedit atau dihapus.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <DaftarBeritaAdmin />
        </div>
      </div>
    </main>
  );
}
