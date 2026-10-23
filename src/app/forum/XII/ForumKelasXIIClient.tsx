"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForumGuard } from "@/lib/forum-guard";

export default function ForumKelasXIIClient() {
  const session = useForumGuard("XII");

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
      <header className="border-b border-[#021024]/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/forum"
            aria-label="Kembali ke forum"
            className="grid size-10 place-items-center rounded-full border border-[#021024]/10 text-[#052659]/70 transition hover:bg-[#021024]/5"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-sm font-bold tracking-wide">Forum Siswa</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
              Kelas XII
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-[#052659] text-xs font-bold text-[#C1E8FF]">
              <span className="font-mono">
                {session.nama.charAt(0).toUpperCase()}
              </span>
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
              Kelas XII
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">
              Forum Kelas XII
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#C1E8FF]/75 sm:text-base">
              Persiapan ujian, wisuda, dan masa depan. Saling support menuju
              lulusan yang siap kerja.
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
                Diskusi Kelas XII
              </h2>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700">
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Mulai Diskusi
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <svg
                className="size-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#2F5F8F]/55"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Cari diskusi..."
                className="h-12 w-full rounded-xl border border-[#021024]/10 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-[#2F5F8F]/50 focus:border-[#5483B3]"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-dashed border-[#7DA0CA]/40 bg-white p-10 text-center">
            <svg
              className="size-24 mx-auto text-[#2F5F8F]/45"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <h3 className="mt-3 font-semibold">Belum ada diskusi</h3>
            <p className="mt-1 text-sm text-[#2F5F8F]/65">
              Jadilah yang pertama memulai diskusi di Kelas XII!
            </p>
            <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700">
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Buat Diskusi Pertama
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#021024] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
