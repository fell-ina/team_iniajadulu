'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import School3D from '@/components/School3D';
import Chatbot from '@/components/Chatbot';

const data: Record<string, { name: string; full: string; hero: string; activity: string; model: string; desc: string }> = {
  pplg: { name: 'PPLG', full: 'Pengembangan Perangkat Lunak dan Gim', hero: '/images/school/hero-lab.jpg', activity: '/images/school/hero-lab.jpg', model: '/models/gedung_lowpoly_v2.glb', desc: 'Belajar membangun software, website, aplikasi, gim, basis data, dan solusi digital yang relevan dengan industri.' },
  tjkt: { name: 'TJKT', full: 'Teknik Jaringan Komputer dan Telekomunikasi', hero: '/images/school/building-main.png', activity: '/images/school/hero-courtyard.jpg', model: '/models/tjkt.glb', desc: 'Mempelajari jaringan komputer, telekomunikasi, infrastruktur, dan teknologi konektivitas.' },
  dkv: { name: 'DKV', full: 'Desain Komunikasi Visual', hero: '/images/school/hero-courtyard.jpg', activity: '/images/school/hero-lab.jpg', model: '/models/dkv.glb', desc: 'Mengembangkan kemampuan visual, desain, komunikasi, dan karya kreatif untuk kebutuhan media.' },
  tkr: { name: 'TKR', full: 'Teknik Kendaraan Ringan', hero: '/images/school/building-secondary.png', activity: '/images/school/hero-courtyard.jpg', model: '/models/tkr.glb', desc: 'Mempelajari perawatan, perbaikan, diagnosis, dan teknologi kendaraan ringan.' },
};

export default function MajorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const d = data[slug] || data.pplg;

  return (
    <main className="overflow-x-hidden bg-[#021024] text-white">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-[#021024]/78 px-4 py-3 backdrop-blur-xl sm:px-6">
          <Link href="/jurusan" className="flex items-center gap-2 text-xs text-white/70"><ArrowLeft size={15} /> Semua jurusan</Link>
          <span className="text-xs font-semibold tracking-[.16em]">{d.name}</span>
          <a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="hidden rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024] sm:block">PPDB</a>
        </div>
      </header>

      <section className="relative min-h-[650px] overflow-hidden sm:min-h-[720px]">
        <img src={d.hero} alt={d.full} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#021024] via-[#021024]/72 to-[#021024]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#021024] via-transparent to-[#021024]/15" />
        <div className="relative z-10 mx-auto flex min-h-[650px] max-w-7xl items-end px-6 pb-16 pt-32 sm:min-h-[720px] sm:pb-20">
          <div className="max-w-4xl">
            <p className="eyebrow text-[#7DA0CA]">PROGRAM KEAHLIAN / {d.name}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl lg:text-8xl">{d.full}</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">{d.desc}</p>
          </div>
        </div>
      </section>

      <School3D model={d.model} title={d.name} description={d.desc} />

      <section className="bg-[#F4F9FF] px-6 py-24 text-[#021024] sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#2F5F8F]">04 / ABOUT THE MAJOR</p>
            <h2 className="mt-5 text-4xl font-medium tracking-tight sm:text-6xl">Belajar dengan konteks nyata.</h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#021024]/60">{d.desc} Pembelajaran dirancang untuk menghubungkan teori, praktik, karya, dan pengalaman industri.</p>
          </div>
          <div className="overflow-hidden rounded-[1.75rem]">
            <img src={d.activity} alt={`Aktivitas ${d.name}`} className="h-[320px] w-full object-cover transition duration-1000 hover:scale-105 sm:h-[440px]" />
          </div>
        </div>
      </section>

      <section className="bg-[#021024] px-6 py-24">
        <div className="mx-auto max-w-7xl border-t border-white/10 pt-10">
          <p className="eyebrow text-[#7DA0CA]">05 / NEXT</p>
          <h2 className="mt-5 max-w-4xl text-4xl font-medium tracking-tight sm:text-6xl">Kompetensi yang bisa dibawa ke dunia nyata.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {['Kompetensi', 'Fasilitas', 'Industri'].map((item) => <div key={item} className="rounded-3xl border border-white/10 bg-white/[.03] p-7"><p className="text-xl">{item}</p><p className="mt-2 text-sm leading-6 text-white/40">Konten detail dapat dihubungkan ke data backend nanti.</p></div>)}
          </div>
        </div>
      </section>

      <footer className="bg-[#021024] px-6 pb-10">
        <div className="mx-auto flex max-w-7xl justify-between border-t border-white/10 pt-7 text-xs text-white/30"><span>SMK Telekomunikasi Tunas Harapan</span><Link href="/">Kembali ke beranda <ArrowUpRight size={13} className="inline" /></Link></div>
      </footer>
      <Chatbot />
    </main>
  );
}
