"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import SchoolBuilding3D from "@/components/jurusan/SchoolBuilding3D";
import Chatbot from "@/components/Chatbot";

type Slug = "pplg" | "tjkt" | "dkv" | "tkr";

type JurusanData = {
  name: string;
  full: string;
  hero: string;
  activity: string;
  model: string;
  desc: string;
  about: string;
  skills: string[];
};

const jurusan: Record<Slug, JurusanData> = {
  pplg: {
    name: "PPLG",
    full: "Pengembangan Perangkat Lunak dan Gim",
    hero: "/images/school/hero-lab.jpg",
    activity: "/images/school/hero-lab.jpg",
    model: "/models/pplg.glb",
    desc: "Belajar membangun software, website, aplikasi, gim, basis data, dan solusi digital yang relevan dengan industri.",
    about:
      "PPLG membekali siswa dengan kemampuan dalam pemrograman, pengembangan aplikasi, website, gim, basis data, serta teknologi digital.",
    skills: [
      "Pemrograman",
      "Pengembangan Website",
      "Pengembangan Aplikasi",
      "Basis Data",
      "Pengembangan Gim",
      "Pemodelan Perangkat Lunak",
    ],
  },

  tjkt: {
    name: "TJKT",
    full: "Teknik Jaringan Komputer dan Telekomunikasi",
    hero: "/images/school/building-main.png",
    activity: "/images/school/tkj1.jpg",
    model: "/models/pakjoko.glb",
    desc: "Mempelajari jaringan komputer, telekomunikasi, infrastruktur, dan teknologi konektivitas.",
    about:
      "TJKT mempelajari bagaimana perangkat komputer dan jaringan saling terhubung, mulai dari infrastruktur jaringan hingga teknologi telekomunikasi.",
    skills: [
      "Jaringan Komputer",
      "Administrasi Jaringan",
      "Teknologi Telekomunikasi",
      "Server",
      "Keamanan Jaringan",
      "Infrastruktur Jaringan",
    ],
  },

  dkv: {
    name: "DKV",
    full: "Desain Komunikasi Visual",
    hero: "/images/school/hero-courtyard.jpg",
    activity: "/images/school/dkv.jpg",
    model: "/models/miawww-miaw.glb",
    desc: "Mengembangkan kemampuan visual, desain, komunikasi, dan karya kreatif untuk kebutuhan media.",
    about:
      "DKV mengembangkan kemampuan siswa dalam menyampaikan pesan melalui visual, desain, ilustrasi, fotografi, dan berbagai media kreatif.",
    skills: [
      "Desain Grafis",
      "Ilustrasi",
      "Fotografi",
      "Tipografi",
      "Branding",
      "Media Visual",
    ],
  },

  tkr: {
    name: "TKR",
    full: "Teknik Kendaraan Ringan",
    hero: "/images/school/building-secondary.png",
    activity: "/images/school/tkr.jpg",
    model: "/models/Tkr_berwarna.glb",
    desc: "Mempelajari perawatan, perbaikan, diagnosis, dan teknologi kendaraan ringan.",
    about:
      "TKR membekali siswa dengan pengetahuan dan keterampilan dalam perawatan, pemeriksaan, diagnosis, serta perbaikan kendaraan ringan.",
    skills: [
      "Perawatan Kendaraan",
      "Perbaikan Mesin",
      "Sistem Kelistrikan",
      "Diagnosis Kendaraan",
      "Sistem Pemindah Tenaga",
      "Teknologi Otomotif",
    ],
  },
};

export default function JurusanDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next.js versi baru: params harus di-unwrapping dengan use()
  const { slug: rawSlug } = use(params);

  const slug = rawSlug.toLowerCase() as Slug;

  const data = jurusan[slug];

  // Kalau URL tidak sesuai, kembali menggunakan PPLG
  const d = data || jurusan.pplg;

  return (
    <main className="overflow-x-hidden bg-[#021024] text-white">
      {/* ================= HEADER ================= */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-[#021024]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Link
            href="/#jurusan"
            className="flex items-center gap-2 text-xs text-white/70 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Semua jurusan
          </Link>

          <span className="text-xs font-semibold tracking-[.16em]">
            {d.name}
          </span>

          <a
            href="https://spmb.tunasharapan.info"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024] transition hover:bg-[#C1E8FF] sm:block"
          >
            PPDB
          </a>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative min-h-[650px] overflow-hidden sm:min-h-[720px]">
        <img
          src={d.hero}
          alt={d.full}
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#021024] via-[#021024]/75 to-[#021024]/30" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#021024] via-transparent to-[#021024]/15" />

        <div className="relative z-10 mx-auto flex min-h-[650px] max-w-7xl items-end px-6 pb-16 pt-32 sm:min-h-[720px] sm:pb-20">
          <div className="max-w-4xl">
            <p className="eyebrow text-[#7DA0CA]">
              PROGRAM KEAHLIAN / {d.name}
            </p>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl lg:text-8xl">
              {d.full}
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
              {d.desc}
            </p>
          </div>
        </div>
      </section>

      {/* ================= 3D ================= */}
      <section className="bg-[#021024] px-6 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
          <SchoolBuilding3D model={d.model} />
          <div className="pb-10 lg:py-12">
            <p className="eyebrow text-[#7DA0CA]">03 / MENGENAL {d.name}</p>
            <h2 className="mt-5 max-w-xl text-3xl font-medium leading-tight sm:text-5xl">
              Kompetensi untuk berkarya.
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
              {d.about}
            </p>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[.2em] text-[#7DA0CA]">
              Yang dipelajari
            </p>
            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {d.skills.map((skill) => (
                <li
                  key={skill}
                  className="border-t border-white/10 pt-3 text-sm text-white/75"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section className="bg-[#F4F9FF] px-6 py-24 text-[#021024] sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#2F5F8F]">04 / ABOUT THE MAJOR</p>

            <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-6xl">
              Belajar dengan konteks nyata.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-[#021024]/60">
              {d.about}
            </p>

            <p className="mt-5 max-w-lg text-base leading-8 text-[#021024]/60">
              Pembelajaran dirancang untuk menghubungkan teori, praktik, karya,
              dan pengalaman industri.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.75rem]">
            <img
              src={d.activity}
              alt={`Aktivitas ${d.name}`}
              className="h-[320px] w-full object-cover transition duration-1000 hover:scale-105 sm:h-[440px]"
            />
          </div>
        </div>
      </section>

      {/* ================= KOMPETENSI ================= */}
      <section className="bg-[#021024] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="border-t border-white/10 pt-10">
            <p className="eyebrow text-[#7DA0CA]">05 / KOMPETENSI</p>

            <h2 className="mt-5 max-w-4xl text-4xl font-medium tracking-tight sm:text-6xl">
              Yang dipelajari di {d.name}.
            </h2>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d.skills.map((skill, index) => (
                <div
                  key={skill}
                  className="rounded-3xl border border-white/10 bg-white/[.03] p-7 transition hover:bg-white/[.06]"
                >
                  <span className="text-xs text-[#7DA0CA]">0{index + 1}</span>

                  <p className="mt-4 text-xl">{skill}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEXT ================= */}
      <section className="bg-[#021024] px-6 pb-24">
        <div className="mx-auto max-w-7xl border-t border-white/10 pt-10">
          <p className="eyebrow text-[#7DA0CA]">06 / NEXT</p>

          <h2 className="mt-5 max-w-4xl text-4xl font-medium tracking-tight sm:text-6xl">
            Kompetensi yang bisa dibawa ke dunia nyata.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {["Kompetensi", "Fasilitas", "Industri"].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/[.03] p-7"
              >
                <p className="text-xl">{item}</p>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  Informasi detail dapat dikembangkan dan dihubungkan dengan
                  data sekolah nantinya.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#021024] px-6 pb-10">
        <div className="mx-auto flex max-w-7xl justify-between border-t border-white/10 pt-7 text-xs text-white/30">
          <span>SMK Telekomunikasi Tunas Harapan</span>

          <Link href="/" className="transition hover:text-white">
            Kembali ke beranda <ArrowUpRight size={13} className="inline" />
          </Link>
        </div>
      </footer>

      <Chatbot />
    </main>
  );
}
