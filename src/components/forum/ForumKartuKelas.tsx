"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, Users, MessageCircle, ArrowRight } from "lucide-react";

interface KelasKartuProps {
  kelas: "X" | "XI" | "XII";
  label: string;
  deskripsi: string;
  ikon: string;
  warna: string;
  href: string;
  jumlahDiskusi?: number;
}

const kelasData = {
  X: { 
    label: "Kelas X", 
    deskripsi: "Ruang diskusi untuk angkatan terbaru. Kenalan, tanya jawab, dan belajar bersama dari dasar.",
    ikon: "🌱",
    warna: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20",
    warnaIkon: "text-emerald-500",
    href: "/forum/X",
  },
  XI: { 
    label: "Kelas XI", 
    deskripsi: "Diskusi tingkat lanjut: project, magang, dan persiapan kelulusan. Saling berbagi pengalaman.",
    ikon: "📚",
    warna: "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20",
    warnaIkon: "text-blue-500",
    href: "/forum/XI",
  },
  XII: { 
    label: "Kelas XII", 
    deskripsi: "Persiapan ujian, wisuda, dan masa depan. Saling support menuju lulusan yang siap kerja.",
    ikon: "🎓",
    warna: "bg-purple-500/10 border-purple-500/20 text-purple-600 hover:bg-purple-500/20",
    warnaIkon: "text-purple-500",
    href: "/forum/XII",
  },
};

export default function ForumKartuKelas({ 
  kelas, 
  jumlahDiskusi = 0 
}: KelasKartuProps) {
  const data = kelasData[kelas];
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: ({ X: 0, XI: 0.1, XII: 0.2 })[kelas] }}
      className={`group relative rounded-2xl border ${data.warna} bg-white p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
    >
      <div className="flex items-start gap-4">
        <span 
          className="grid size-14 shrink-0 place-items-center rounded-xl bg-white/50"
          aria-hidden="true"
        >
          <span className="text-3xl" aria-hidden="true">{data.ikon}</span>
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-[#021024]">{data.label}</h3>
          <p className="mt-2 text-sm text-[#021024]/60 leading-relaxed">{data.deskripsi}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#021024]/50">
          <Users className="size-4" aria-hidden="true" />
          <span>{jumlahDiskusi} diskusi</span>
        </div>
        <Link
          href={data.href}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition ${data.warna.replace("bg-", "bg-").replace("hover:bg-", "hover:bg-").replace("text-", "text-").replace("border-", "border-")}`}
          aria-label={`Masuk ke ${data.label}`}
        >
          <span className={data.warnaIkon}>Masuk</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  );
}