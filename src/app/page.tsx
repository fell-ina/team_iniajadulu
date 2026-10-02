'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Menu, X, Handshake, Trophy } from 'lucide-react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import Chatbot from '@/components/Chatbot';

const nav = [['Profil','#profil'],['Jurusan','#jurusan'],['Berita','#berita'],['Fasilitas','#fasilitas'],['Mitra Industri','#industri'],['Prestasi','#prestasi']];

function Nav(){const [open,setOpen]=useState(false);return <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-[#021024]/78 px-4 py-3 text-white shadow-xl backdrop-blur-xl sm:px-6"><a href="#top" className="flex items-center gap-3"><span className="grid size-9 overflow-hidden rounded-full bg-white p-1"><img src="/images/school/logo-transparent.png" className="h-full w-full object-contain" alt="Logo"/></span><span className="hidden text-xs font-semibold tracking-[.15em] sm:block">TUNAS HARAPAN</span></a><nav className="hidden gap-1 md:flex">{nav.map(([n,h])=><a key={h} href={h} className="rounded-full px-4 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white">{n}</a>)}</nav><div className="hidden md:block"><a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024]">PPDB / SPMB</a></div><button className="grid size-9 place-items-center md:hidden" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:<Menu size={18}/>}</button></div>{open&&<div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white/10 bg-[#021024]/95 p-3 text-white backdrop-blur-xl md:hidden">{nav.map(([n,h])=><a key={h} href={h} onClick={()=>setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm text-white/70">{n}</a>)}<a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="mt-2 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-[#021024]">PPDB / SPMB</a></div>}</header>}

function Profile(){return <section id="profil" className="profile-grid-bg relative isolate overflow-hidden px-6 py-28 text-[#021024] sm:py-36"><div className="relative z-10 mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}}><p className="eyebrow text-[#2F5F8F]">01 / PROFIL</p><h2 className="display mt-5 max-w-xl text-4xl sm:text-6xl">Sekolah yang bergerak bersama masa depan.</h2></motion.div><motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="grid gap-8 sm:grid-cols-2"><div><p className="eyebrow text-[#2F5F8F]/60">TENTANG KAMI</p><p className="mt-4 text-lg leading-8 text-[#021024]/65">SMK Telekomunikasi Tunas Harapan membangun lingkungan belajar vokasi yang dekat dengan teknologi, karakter, dan kebutuhan industri.</p></div><div><p className="eyebrow text-[#2F5F8F]/60">ARAH</p><p className="mt-4 text-lg leading-8 text-[#021024]/65">Pembelajaran diarahkan untuk membentuk kompetensi, karya, dan kesiapan siswa menghadapi dunia nyata.</p></div></motion.div></div></section>}

const majors=[['01','PPLG','Pengembangan Perangkat Lunak dan Gim','/images/school/hero-lab.jpg','pplg'],['02','TJKT','Teknik Jaringan Komputer dan Telekomunikasi','/images/school/building-main.png','tjkt'],['03','DKV','Desain Komunikasi Visual','/images/school/hero-courtyard.jpg','dkv'],['04','TKR','Teknik Kendaraan Ringan','/images/school/building-secondary.png','tkr']];
function Majors(){return <section id="jurusan" className="bg-[#021024] px-6 py-28 text-white sm:py-36"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[#7DA0CA]">02 / PROGRAM KEAHLIAN</p><h2 className="display mt-5 text-4xl sm:text-6xl">Empat bidang.<br/><span className="text-white/35">Satu arah.</span></h2></div><p className="max-w-sm text-sm leading-7 text-white/45">Eksplorasi software, jaringan, desain, dan otomotif melalui pengalaman vokasi yang relevan.</p></div><div className="mt-16 divide-y divide-white/10 border-y border-white/10">{majors.map(([n,title,desc,img,slug])=><Link href={`/jurusan/${slug}`} key={title} className="group relative grid grid-cols-[52px_1fr_auto] items-center gap-x-4 gap-y-2 overflow-hidden rounded-lg py-5 transition-colors active:bg-white/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C1E8FF] sm:rounded-none sm:grid-cols-[72px_1fr_1.2fr_auto] sm:gap-5 sm:py-8"><div className="relative col-start-1 row-start-2 h-12 w-[52px] overflow-hidden rounded-md sm:absolute sm:inset-y-3 sm:right-16 sm:col-auto sm:row-auto sm:h-20 sm:w-36 sm:rounded-xl sm:opacity-0 sm:transition sm:duration-500 sm:group-hover:opacity-20 lg:h-24 lg:w-44"><img src={img} alt="" className="h-full w-full object-cover"/></div><span className="col-start-1 row-start-1 font-mono text-xs text-white/45 sm:col-auto sm:row-auto sm:text-white/30">{n}</span><h3 className="relative z-10 col-start-2 row-start-1 text-2xl font-medium tracking-tight sm:col-auto sm:row-auto sm:text-3xl lg:text-5xl">{title}</h3><p className="relative z-10 col-start-2 row-start-2 max-w-md text-xs leading-5 text-white/60 sm:col-auto sm:row-auto sm:text-sm sm:leading-6 sm:text-white/45">{desc}</p><ArrowUpRight className="relative z-10 col-start-3 row-span-2 row-start-1 self-center text-white/55 transition group-active:translate-x-1 group-active:-translate-y-1 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white sm:col-auto sm:row-auto sm:self-auto sm:text-white/35"/></Link>)}</div></div></section>}

const news=[['Belajar dari Dunia Industri','Kegiatan pembelajaran dan kolaborasi siswa yang dekat dengan kebutuhan dunia kerja.','12 Sep 2026','/images/school/hero-lab.jpg','belajar-dari-dunia-industri'],['Aktivitas Siswa Tunas Harapan','Potret aktivitas siswa dalam lingkungan belajar dan kegiatan sekolah.','08 Sep 2026','/images/school/hero-courtyard.jpg','aktivitas-siswa-tunas-harapan'],['Tunas Harapan dan Teknologi','Sekolah terus mengembangkan pengalaman belajar berbasis teknologi dan kompetensi.','02 Sep 2026','/images/school/building-main.png','tunas-harapan-dan-teknologi']];
function News(){return <section id="berita" className="bg-[#F4F9FF] px-6 py-28 text-[#021024] sm:py-36"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow text-[#2F5F8F]">03 / BERITA</p><h2 className="display mt-5 text-4xl sm:text-6xl">Berita terbaru.</h2></div><Link href="/berita" className="hidden rounded-full border border-[#021024]/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] sm:inline-flex">Lihat semua berita <ArrowUpRight size={14}/></Link></div><div className="mt-14 grid gap-6 md:grid-cols-3">{news.map(([title,desc,date,img,slug],i)=><motion.article key={slug} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}} className="group overflow-hidden rounded-[1.6rem] border border-[#021024]/8 bg-white"><Link href={`/berita/${slug}`}><div className="aspect-[16/10] overflow-hidden"><img src={img} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/></div><div className="p-6"><p className="eyebrow text-[#2F5F8F]/60">{date}</p><h3 className="mt-3 text-2xl font-medium tracking-tight">{title}</h3><p className="mt-3 text-sm leading-6 text-[#021024]/55">{desc}</p></div></Link></motion.article>)}</div><Link href="/berita" className="mt-8 inline-flex rounded-full border border-[#021024]/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] sm:hidden">Lihat semua berita <ArrowUpRight size={14}/></Link></div></section>}

function Facilities(){
  const [expanded, setExpanded] = useState<number | null>(null);
  const items = [
    {
      title: 'TEFA',
      subtitle: 'Teaching Factory',
      detail: 'Model belajar yang menggabungkan teori dengan praktik produksi nyata. Program ini didukung kolaborasi industri untuk mengembangkan kompetensi guru dan karya siswa.',
      image: '/images/school/tefa.jpeg',
      imageAlt: 'Kegiatan Teaching Factory di SMK Tunas Harapan',
    },
    {
      title: 'Perpustakaan',
      subtitle: 'Pusat Sumber Belajar',
      detail: 'Ruang untuk membaca, mencari referensi, dan mendukung kegiatan belajar mandiri siswa.',
      image: '/images/school/perpustakaan.JPEG',
      imageAlt: 'Perpustakaan SMK Tunas Harapan',
    },
    {
      title: 'Telsa TV',
      subtitle: 'Televisi Sekolah',
      detail: 'Kanal media sekolah yang membagikan karya dan kegiatan warga SMK Telekomunikasi Tunas Harapan.',
      href: 'https://www.youtube.com/channel/UCiQWJxhNpa_mq_WxnvbEBQQ',
      image: '/images/school/tv.png',
      imageAlt: 'Telsa TV, televisi sekolah',
    },
    {
      title: 'Asrama',
      subtitle: 'Lingkungan tinggal siswa',
      detail: 'Asrama berada di lingkungan sekolah, dengan area putra dan putri terpisah, ruang makan, pembinaan, serta kegiatan minat dan olahraga. Informasi biaya dapat ditanyakan langsung kepada pihak sekolah.',
      image: '/images/school/asrama.jpeg',
      imageAlt: 'Asrama siswa SMK Tunas Harapan',
    },
  ];

  return <section id="fasilitas" className="bg-white px-6 py-28 text-[#021024] sm:py-36"><div className="mx-auto max-w-7xl"><p className="eyebrow text-[#2F5F8F]">04 / FASILITAS</p><div className="mt-5 grid gap-10 lg:grid-cols-[1fr_1.2fr]"><h2 className="display text-4xl sm:text-6xl">Ruang untuk<br/><span className="text-[#021024]/30">bertumbuh.</span></h2><motion.div layout className="overflow-hidden rounded-3xl bg-[#021024]/10">
        <AnimatePresence mode="wait" initial={false}>
          {expanded === null ? (
            <motion.div key="facility-grid" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-px sm:grid-cols-2">
              {items.map((item, index) => (
                <motion.button
                  layout
                  key={item.title}
                  type="button"
                  aria-expanded={false}
                  onClick={() => setExpanded(index)}
                  className="min-h-36 bg-[#F4F9FF] p-7 text-left transition-colors hover:bg-[#EAF4FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F5F8F] active:bg-[#E1EFFA] sm:p-8"
                >
                  <span className="block text-3xl font-semibold">{item.title}</span>
                  <span className="mt-3 block text-sm text-[#021024]/50">{item.subtitle}</span>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#2F5F8F]">
                    Lihat informasi <ArrowUpRight size={13} />
                  </span>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div key={`facility-detail-${expanded}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid bg-[#F4F9FF] md:h-[328px] md:grid-cols-[1.05fr_.95fr]">
              <div className="relative min-h-56 overflow-hidden sm:min-h-72 md:min-h-0">
                <img src={items[expanded].image} alt={items[expanded].imageAlt} className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="flex flex-col items-start justify-center p-7 sm:p-10">
                <button type="button" aria-expanded="true" aria-controls="facility-detail" onClick={() => setExpanded(null)} className="flex w-full items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5F8F]">
                  <span>
                    <span className="block text-3xl font-semibold">{items[expanded].title}</span>
                    <span className="mt-2 block text-sm text-[#021024]/50">{items[expanded].subtitle}</span>
                  </span>
                  <ChevronDown size={19} aria-hidden="true" className="mt-1 shrink-0 rotate-180 text-[#2F5F8F]" />
                </button>
                <div id="facility-detail">
                  <p className="mt-6 text-sm leading-7 text-[#021024]/70">{items[expanded].detail}</p>
                  {items[expanded].href && <a href={items[expanded].href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#2F5F8F] hover:text-[#021024]">Kunjungi kanal <ArrowUpRight size={14} /></a>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div></div></div></section>;
}

function Partners(){
  const partners=['Sinarmas','Bakti Barito','IFORTE','Indofood','Wings','Agung Sedayu Group','Garudafood','Ciliandra Perkasa','Triputra Agro Persada'];
  const logos=[...partners,...partners];
  return <section id="industri" className="overflow-hidden bg-[#052659] py-24 text-white sm:py-32">
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow text-[#C1E8FF]/60">05 / MITRA INDUSTRI</p><h2 className="display mt-5 max-w-3xl text-4xl sm:text-6xl">Terhubung dengan dunia nyata.</h2></div>
        <Handshake className="hidden text-[#C1E8FF]/35 sm:block" size={34} strokeWidth={1.2} />
      </div>
    </div>
    <div className="relative mt-12 overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#052659] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#052659] to-transparent" />
      <div className="partner-marquee flex w-max gap-4">
        {logos.map((name,index)=><div key={`${name}-${index}`} title={name} className="grid h-24 w-48 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.035] px-8">
          <div className="grid h-12 w-full place-items-center rounded-xl border border-white/10 bg-white/[.025]">
            <span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/30">Logo</span>
          </div>
        </div>)}
      </div>
    </div>
    <div className="mx-auto max-w-7xl px-6"><p className="mt-5 text-[10px] uppercase tracking-[.16em] text-white/25">Slot logo mitra siap diganti dengan aset logo resmi.</p></div>
  </section>
}
function Achievements(){return <section id="prestasi" className="bg-[#F4F9FF] px-6 py-24 text-[#021024] sm:py-32"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[#2F5F8F]">06 / PRESTASI</p><h2 className="display mt-5 max-w-3xl text-4xl sm:text-6xl">Karya siswa yang<br/><span className="text-[#021024]/30">melangkah lebih jauh.</span></h2></div><Trophy className="text-[#052659]/30" size={42} strokeWidth={1.1}/></div><div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="overflow-hidden rounded-[1.75rem] bg-[#021024]"><img src="/images/achievements/students-achievement.jpg" alt="Prestasi siswa" className="h-[330px] w-full object-cover opacity-90 sm:h-[470px]"/></div><div className="grid gap-3">{[['01','Karya','Mendorong siswa menghasilkan karya yang dapat ditunjukkan di luar kelas.'],['02','Kompetensi','Mengasah kemampuan melalui praktik, proyek, dan pengalaman nyata.'],['03','Apresiasi','Memberi ruang bagi pencapaian siswa untuk terus berkembang.']].map(([n,title,desc])=><div key={n} className="flex gap-5 rounded-[1.5rem] border border-[#021024]/10 bg-white p-6 sm:p-7"><span className="font-mono text-xs text-[#2F5F8F]/50">{n}</span><div><p className="text-xl font-medium">{title}</p><p className="mt-2 text-sm leading-6 text-[#021024]/50">{desc}</p></div></div>)}</div></div></div></section>}
function Future(){return <section className="bg-[#F4F9FF] px-6 py-28 text-[#021024] sm:py-36"><div className="mx-auto max-w-7xl rounded-[2rem] bg-[#C1E8FF] p-8 sm:p-14"><p className="eyebrow text-[#052659]/60">07 / YOUR NEXT STEP</p><h2 className="display mt-5 max-w-4xl text-4xl sm:text-6xl">Kawal langkahmu setelah lulus.</h2><div className="mt-10 grid gap-4 sm:grid-cols-2"><div className="rounded-3xl bg-white/65 p-7"><p className="text-2xl font-semibold">Kawal Kerja</p><p className="mt-2 text-sm leading-6 text-[#021024]/55">Pendampingan dan informasi untuk mempersiapkan langkah menuju dunia kerja.</p></div><div className="rounded-3xl bg-white/65 p-7"><p className="text-2xl font-semibold">Kawal Kuliah</p><p className="mt-2 text-sm leading-6 text-[#021024]/55">Ruang informasi dan pendampingan untuk melanjutkan pendidikan.</p></div></div></div></section>}
function Footer(){return <footer className="bg-[#021024] px-6 py-16 text-white"><div className="mx-auto max-w-7xl"><div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-3"><div><p className="text-lg font-semibold">SMK TELEKOMUNIKASI<br/>TUNAS HARAPAN</p><p className="mt-4 max-w-sm text-sm leading-7 text-white/40">Jl. Umbul Senjoyo I, No. 3 Desa Bener, Kec. Tengaran, Kabupaten Semarang, Jawa Tengah.</p><a href="https://www.instagram.com/smk_tth?stkn=MWhua3ZxdjA1MWNmYw==" target="_blank" rel="noreferrer" aria-label="Instagram SMK Telekomunikasi Tunas Harapan" className="mt-4 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#C1E8FF]"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/></svg><span>@smk_tth</span></a></div><div><p className="eyebrow text-[#7DA0CA]">EXPLORE</p><div className="mt-4 space-y-3 text-sm text-white/45"><a className="block hover:text-white" href="#profil">Profil</a><a className="block hover:text-white" href="#jurusan">Jurusan</a><a className="block hover:text-white" href="#industri">Mitra Industri</a><Link className="block hover:text-white" href="/berita">Berita</Link></div></div><div><p className="eyebrow text-[#7DA0CA]">PPDB / ADMIN</p><a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024]">Buka SPMB <ArrowUpRight size={14}/></a><Link href="/admin/berita" className="mt-3 inline-flex rounded-full border border-white/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-white/70 transition hover:border-white/30 hover:text-white">Login Admin <ArrowUpRight size={14}/></Link></div></div><p className="pt-7 text-[10px] uppercase tracking-[.18em] text-white/25">© 2026 SMK Telekomunikasi Tunas Harapan · Frontend concept</p></div></footer>}

export default function Home(){return <main id="top" className="overflow-x-hidden"><Nav/><HeroSection/><Profile/><Majors/><News/><Facilities/><Partners/><Achievements/><Future/><Footer/><Chatbot/></main>}
