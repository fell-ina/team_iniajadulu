"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useForumAuth, getForumAuthRedirect } from "@/lib/forum-auth";

const kelasInfo = [
  {
    kelas: "X" as const,
    label: "Kelas X",
    deskripsi: "Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar.",
    ikon: "🌱",
    warna: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20",
    warnaIkon: "text-emerald-500",
    href: "/forum/X",
    jumlahDiskusi: 0,
  },
  {
    kelas: "XI" as const,
    label: "Kelas XI",
    deskripsi: "Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman.",
    ikon: "📚",
    warna: "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20",
    warnaIkon: "text-blue-500",
    href: "/forum/XI",
    jumlahDiskusi: 0,
  },
  {
    kelas: "XII" as const,
    label: "Kelas XII",
    deskripsi: "Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja.",
    ikon: "🎓",
    warna: "bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20",
    warnaIkon: "text-purple-500",
    href: "/forum/XII",
    jumlahDiskusi: 0,
  },
];

function ForumLandingClient() {
  const router = useRouter();
  const auth = useForumAuth();
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Handle redirects in a single useEffect
  useEffect(() => {
    if (auth.loading) return;

    const redirect = getForumAuthRedirect(auth);
    if (redirect) {
      router.replace(redirect);
      return;
    }

    // If user is verified and has a valid class, redirect directly to their class forum
    if (auth.verificationStatus === "terverifikasi" && auth.kelas && ["X", "XI", "XII"].includes(auth.kelas)) {
      const kelasRoute = `/forum/${auth.kelas}`;
      router.replace(`/forum/${auth.kelas}`);
      return;
    }

    setRedirectChecked(true);
  }, [auth, router]);

  // Show loading while checking auth
  if (auth.loading) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#052659] border-t-transparent" />
          <p className="mt-4 text-[#021024]/60">Memuat forum...</p>
        </div>
      </main>
    );
  }

  // Render loading state while redirecting
  const shouldRedirect = 
    (!!getForumAuthRedirect({ ...auth, loading: false })) ||
    (auth.verificationStatus === "terverifikasi" && auth.kelas && ["X", "XI", "XII"].includes(auth.kelas));

  if (auth.loading || auth.verificationStatus === "terverifikasi" && auth.kelas && ["X", "XI", "XII"].includes(auth.kelas)) {
    const isRedirecting = !auth.loading && (
      !!getForumAuthRedirect({ ...auth, loading: false }) ||
      (auth.verificationStatus === "terverifikasi" && auth.kelas && ["X", "XI", "XII"].includes(auth.kelas))
    );

    if (isRedirecting) {
      return (
        <main className="min-h-screen bg-[#F4F9FF] text-[#021024] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#052659] border-t-transparent" />
            <p className="mt-4 text-[#021024]/60">Mengarahkan ke forum kelas Anda...</p>
          </div>
        </main>
      );
    }
  }

  // Show the forum landing page for unverified users or when no redirect needed
  return (
    <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#052659] text-white">
        <div aria-hidden className="absolute -right-24 -top-36 size-96 rounded-full bg-[#5483B3]/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-44 left-1/3 size-96 rounded-full bg-[#7DA0CA]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#C1E8FF]/70">
              Ruang Diskusi Siswa
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">
              Forum Siswa Tunas Harapan
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#C1E8FF]/75 sm:text-base">
              Ruang diskusi terbagi berdasarkan kelas. Pilih kelasmu untuk mulai berdiskusi, bertanya,
              dan saling berbagi pengalaman dengan teman sekelas.
            </p>
          </div>
        </div>
      </section>

      {/* Kartu Kelas */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="eyebrow text-[#2F5F8F]">01 / FORUM SISWA</p>
            <h2 className="mt-3 display text-4xl font-semibold tracking-tight sm:text-5xl">
              Pilih Kelasmu
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg leading-7 text-[#021024]/60">
              Setiap kelas punya ruang diskusi sendiri. Pilih kelasmu untuk mulai berdiskusi dengan
              teman sekelas.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {kelasInfo.map(function (kelas, i) {
              return (
                <article
                  key={kelas.kelas}
                  className={`group relative rounded-2xl border ${kelas.warna} bg-white p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/50"
                      aria-hidden="true"
                    >
                      <span className="text-3xl" aria-hidden="true">{kelas.ikon}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-[#021024]">{kelas.label}</h3>
                      <p className="mt-2 text-sm text-[#021024]/60 leading-relaxed">{kelas.deskripsi}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-[#021024]/50">
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      <span>{kelas.jumlahDiskusi} diskusi</span>
                    </div>
                    <a
                      href={kelas.href}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition hover:shadow-md"
                      style={{
                        backgroundColor: kelas.warna.includes("emerald") ? "#d1fae5" :
                                                   kelas.warna.includes("blue") ? "#dbeafe" : "#f3e8ff",
                        color: kelas.warna.includes("emerald") ? "#047857" :
                               kelas.warna.includes("blue") ? "#1d4ed8" : "#7c3aed",
                        borderColor: kelas.warna.includes("emerald") ? "#6ee7b7" :
                                                     kelas.warna.includes("blue") ? "#93c5fd" : "#d8b4fe",
                      }}
                      aria-label={"Masuk ke " + kelas.label}
                    >
                      Masuk
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2F5F8F] hover:text-[#052659] transition"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Kembali ke Beranda
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#021024] text-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs uppercase tracking-[.16em] text-white/25">
            © 2026 SMK Telekomunikasi Tunas Harapan
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function ForumLandingPage() {
  return <ForumLandingClient />;
}