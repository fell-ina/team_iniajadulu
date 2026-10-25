"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import SchoolBuilding3D from "@/components/jurusan/SchoolBuilding3D";
import MajorDecor from "@/components/jurusan/MajorDecor";
import CompetencyShowcase from "@/components/jurusan/CompetencyShowcase";
import Chatbot from "@/components/Chatbot";

type Slug = "pplg" | "tjkt" | "dkv" | "tkr";

const nextInfo: Record<
  Slug,
  { karier: string[]; belajar: string; sertifikasi: string }
> = {
  pplg: {
    karier: [
      "Web Programmer",
      "Mobile Programmer",
      "Front End Developer",
      "Back End Developer",
      "Digital Marketer",
      "Wirausahawan Bisnis Digital",
    ],
    belajar:
      "Menggunakan metode Teaching Factory (TEFA) dan Deep Learning; kurikulum disinkronkan langsung dengan perusahaan; guru rutin mengikuti program upskill/reskill.",
    sertifikasi:
      "Sertifikasi Junior Web Developer dari LSP Teknologi Digital di akhir pendidikan. SMK TTH bertindak sebagai Tempat Uji Kompetensi (TUK) Mandiri LSP Teknologi Digital. Berkolaborasi dengan PT Universal Big Data (UBIG) Malang untuk TEFA FullStack Developers dan Game Developer.",
  },
  tjkt: {
    karier: [
      "Operator Komputer",
      "Teknisi Komputer",
      "Teknisi Jaringan",
      "Help Desk",
      "IT Support",
      "Network Engineer",
      "Administrator Jaringan",
    ],
    belajar:
      "Terintegrasi dengan Cisco Networking Academy dan Mikrotik Academy; siswa kelas XII wajib mengikuti program Mikrotik Academy.",
    sertifikasi:
      "Sertifikasi meliputi MikroTik Certified Network Associate (MTCNA), CCNA, TOEIC, Junior Network Administrator dari LSP-P3, serta Network Administrator Muda dari LSP Teknologi Digital.",
  },
  dkv: {
    karier: [
      "Graphic Designer",
      "Illustrator",
      "Brand Designer",
      "Content Creator",
      "Photographer",
      "Videographer",
      "Motion Graphic Designer",
      "UI/UX Designer",
      "Social Media Designer",
      "Visual Designer",
      "Creativepreneur",
      "Freelancer",
    ],
    belajar:
      "Membentuk generasi kreatif yang menggabungkan ide, teknologi, estetika, dan strategi komunikasi. Proses belajar berbasis praktik dan proyek nyata (brief, deadline, revisi, dan standar profesional).",
    sertifikasi:
      "Kerja sama industri dengan UKSW, UDINUS Semarang, Rumah Mesin Jogjakarta, TVKU Semarang, Cakra TV Semarang, Busuma Vision Salatiga, dan institusi lainnya.",
  },
  tkr: {
    karier: [
      "Wirausahawan bisnis otomotif",
      "Teknisi/mekanik bengkel umum maupun resmi",
      "Operator kendaraan",
      "Modifikator",
      "Operator/teknisi perakitan dan produksi di industri",
    ],
    belajar:
      "Pembelajaran berbasis TEFA berstandar dunia kerja; kurikulum diselaraskan dengan perusahaan otomotif nasional; didukung fasilitas Ruang Praktik Siswa (RPS) dan Ruang Pembelajaran Umum (RPU).",
    sertifikasi:
      "Sertifikasi profesi dari LSP TOP Indonesia, LSP Global Otomotif, TOEIC, serta LSP-P3. SMK TTH merupakan TUK Mandiri untuk bidang otomotif. Fasilitas penunjang: gedung khusus TKR dan bengkel praktik lengkap.",
  },
};

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
    model: "/models/pakjoko2.glb",
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
    model: "/models/Tkr_berwarna2.glb",
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

          <Link
            href="/spmb"
            className="hidden rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024] transition hover:bg-[#C1E8FF] sm:block"
          >
            PPDB
          </Link>
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
      <section className="relative overflow-hidden bg-[#F4F9FF] px-6 py-24 text-[#021024] sm:py-32">
        <MajorDecor slug={data ? slug : "pplg"} tone="light" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-[#F4F9FF]" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="eyebrow text-[#2F5F8F]">04 / ABOUT THE MAJOR</p>
            <h2 className="mt-5 max-w-md text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl">
              Belajar dengan konteks nyata.
            </h2>
            <div className="mt-6 h-px w-16 bg-[#052659]/20" />
            <p className="mt-6 max-w-lg text-base leading-8 text-[#021024]/65">
              {d.about}
            </p>
            <p className="mt-5 max-w-lg text-base leading-8 text-[#021024]/65">
              Pembelajaran dirancang untuk menghubungkan teori, praktik, karya,
              dan pengalaman industri.
            </p>
            <p className="mt-7 font-mono text-[11px] uppercase tracking-[.2em] text-[#2F5F8F]/60">
              {d.name} — {d.full}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-[#021024]/10 bg-white shadow-[0_30px_70px_-30px_rgba(2,16,36,.35)]">
              <img
                src={d.activity}
                alt={`Aktivitas ${d.name}`}
                className="aspect-[16/10] w-full object-cover transition duration-1000 hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[.18em] text-[#021024]/45">
              <span>Praktik {d.name}</span>
              <span className="font-mono">04 / {d.name}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= KOMPETENSI ================= */}
      <CompetencyShowcase
        slug={data ? slug : "pplg"}
        name={d.name}
        desc={d.desc}
        about={d.about}
        skills={d.skills}
        activity={d.activity}
      />

      {/* ================= NEXT ================= */}
      <section className="relative overflow-hidden bg-[#052659] px-6 py-24 sm:py-32">
        <MajorDecor slug={data ? slug : "pplg"} tone="dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#021024]/60 via-transparent to-[#021024]/40" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="border-t border-white/15 pt-10"
          >
            <p className="eyebrow text-[#C1E8FF]">06 / NEXT</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-medium tracking-tight sm:text-6xl">
              Kompetensi yang bisa dibawa ke dunia nyata.
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="rounded-[1.75rem] border border-white/12 bg-white/[.05] p-7 backdrop-blur-sm sm:p-9"
            >
              <p className="eyebrow text-[#C1E8FF]/70">Prospek karier {d.name}</p>
              <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {(nextInfo[data ? slug : "pplg"]?.karier ?? []).map((k, i) => (
                  <div key={k} className="flex items-baseline gap-4 py-3.5">
                    <span className="font-mono text-[11px] text-[#7DA0CA]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-base text-white/85 sm:text-lg">{k}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="grid gap-5">
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="rounded-[1.75rem] border border-white/12 bg-[#021024]/55 p-7 sm:p-8"
              >
                <p className="eyebrow text-[#C1E8FF]/70">Fasilitas & pembelajaran</p>
                <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
                  {nextInfo[data ? slug : "pplg"]?.belajar}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.14 }}
                className="rounded-[1.75rem] border border-white/12 bg-[#021024]/55 p-7 sm:p-8"
              >
                <p className="eyebrow text-[#C1E8FF]/70">Sertifikasi & industri</p>
                <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
                  {nextInfo[data ? slug : "pplg"]?.sertifikasi}
                </p>
              </motion.div>
            </div>
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
