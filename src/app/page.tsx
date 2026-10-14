'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, GraduationCap, Menu, UserRound, UsersRound, X, Handshake, Trophy } from 'lucide-react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import Chatbot from '@/components/Chatbot';

const nav = [['Profil','#profil'],['Jurusan','#jurusan'],['Berita','#berita'],['Fasilitas','#fasilitas'],['Mitra Industri','#industri'],['Prestasi','#prestasi']];

function Nav(){const [open,setOpen]=useState(false);return <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-[#021024]/78 px-4 py-3 text-white shadow-xl backdrop-blur-xl sm:px-6"><a href="#top" className="flex items-center gap-3"><span className="grid size-9 overflow-hidden rounded-full bg-white p-1"><img src="/images/school/logo-transparent.png" className="h-full w-full object-contain" alt="Logo"/></span><span className="hidden text-xs font-semibold tracking-[.15em] sm:block">TUNAS HARAPAN</span></a><nav className="hidden gap-1 md:flex">{nav.map(([n,h])=><a key={h} href={h} className="rounded-full px-4 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white">{n}</a>)}</nav><div className="hidden md:block"><a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024]">PPDB / SPMB</a></div><button className="grid size-9 place-items-center md:hidden" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:<Menu size={18}/>}</button></div>{open&&<div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white/10 bg-[#021024]/95 p-3 text-white backdrop-blur-xl md:hidden">{nav.map(([n,h])=><a key={h} href={h} onClick={()=>setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm text-white/70">{n}</a>)}<a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="mt-2 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-[#021024]">PPDB / SPMB</a></div>}</header>}

function Profile(){return <section id="profil" className="profile-grid-bg relative isolate overflow-hidden px-6 py-28 text-[#021024] sm:py-36"><div aria-hidden="true" className="profile-shards pointer-events-none absolute inset-0 z-0"><img src="/images/polygon/Group%2019.png" alt="" className="profile-shard absolute -left-5 top-[-30px] h-44 w-52 object-contain sm:left-4 sm:top-[-42px] sm:h-56 sm:w-64"/><img src="/images/polygon/Group%2018.png" alt="" className="profile-shard absolute left-[42%] top-[7%] h-16 w-24 object-contain sm:left-[44%] sm:top-[8%] sm:h-20 sm:w-32"/><img src="/images/polygon/Group%2034.png" alt="" className="profile-shard absolute left-[27%] top-[38%] h-12 w-16 object-contain sm:left-[29%] sm:top-[40%]"/><img src="/images/polygon/Group%2033.png" alt="" className="profile-shard absolute right-[8%] top-[5%] h-24 w-16 object-contain sm:right-[12%] sm:top-[7%] sm:h-32 sm:w-20"/><img src="/images/polygon/Group%2016.png" alt="" className="profile-shard absolute right-[2%] top-[38%] h-10 w-20 object-contain sm:right-[5%] sm:top-[36%] sm:h-12 sm:w-24"/><img src="/images/polygon/Group%209.png" alt="" className="profile-shard absolute bottom-[-34px] left-[7%] h-32 w-40 object-contain sm:bottom-[-42px] sm:left-[9%] sm:h-44 sm:w-52"/><img src="/images/polygon/Group%2015.png" alt="" className="profile-shard absolute bottom-[-14px] left-[37%] h-16 w-28 object-contain sm:bottom-[-20px] sm:left-[36%] sm:h-20 sm:w-36"/><img src="/images/polygon/Group%2017.png" alt="" className="profile-shard absolute bottom-[5%] right-[22%] h-12 w-16 object-contain sm:bottom-[8%] sm:right-[20%] sm:h-16 sm:w-20"/><img src="/images/polygon/Group%2010.png" alt="" className="profile-shard absolute bottom-[2%] -right-8 h-28 w-20 object-contain sm:bottom-[4%] sm:right-[-20px] sm:h-40 sm:w-28"/></div><div className="relative z-10 mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}}><p className="eyebrow text-[#2F5F8F]">01 / PROFIL</p><h2 className="display mt-5 max-w-xl text-4xl sm:text-6xl">Sekolah yang bergerak bersama masa depan.</h2></motion.div><motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="grid gap-8 sm:grid-cols-2"><div><p className="eyebrow text-[#2F5F8F]/60">TENTANG KAMI</p><p className="mt-4 text-lg leading-8 text-[#021024]/65">SMK Telekomunikasi Tunas Harapan membangun lingkungan belajar vokasi yang dekat dengan teknologi, karakter, dan kebutuhan industri.</p></div><div><p className="eyebrow text-[#2F5F8F]/60">ARAH</p><p className="mt-4 text-lg leading-8 text-[#021024]/65">Pembelajaran diarahkan untuk membentuk kompetensi, karya, dan kesiapan siswa menghadapi dunia nyata.</p></div></motion.div></div></section>}

const majors=[['01','PPLG','Pengembangan Perangkat Lunak dan Gim','/images/school/hero-lab.jpg','pplg','#BA0000'],['02','TJKT','Teknik Jaringan Komputer dan Telekomunikasi','/images/school/tkj1.jpg','tjkt','#939191'],['03','DKV','Desain Komunikasi Visual','/images/school/dkv.jpg','dkv','#152DA9'],['04','TKR','Teknik Kendaraan Ringan','/images/school/tkr.jpg','tkr','#C67219']];
function Majors(){return <section id="jurusan" className="bg-[#021024] px-6 py-28 text-white sm:py-36"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[#7DA0CA]">02 / PROGRAM KEAHLIAN</p><h2 className="display mt-5 text-4xl sm:text-6xl">Empat bidang.<br/><span className="text-white/35">Satu arah.</span></h2></div><p className="max-w-sm text-sm leading-7 text-white/45">Eksplorasi software, jaringan, desain, dan otomotif melalui pengalaman vokasi yang relevan.</p></div><div className="mt-16 divide-y divide-white/10 border-y border-white/10">{majors.map(([n,title,desc,img,slug,accent])=><Link href={`/jurusan/${slug}`} key={title} style={{'--major-accent':accent} as React.CSSProperties} className="major-link group relative grid grid-cols-[52px_1fr_auto] items-center gap-x-4 gap-y-2 overflow-hidden rounded-lg py-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C1E8FF] sm:rounded-none sm:grid-cols-[72px_1fr_1.2fr_auto] sm:gap-5 sm:py-8"><div className="relative col-start-1 row-start-2 h-12 w-[52px] overflow-hidden rounded-md sm:absolute sm:inset-y-3 sm:right-16 sm:col-auto sm:row-auto sm:h-20 sm:w-36 sm:rounded-xl sm:opacity-0 sm:transition sm:duration-500 sm:group-hover:opacity-20 lg:h-24 lg:w-44"><img src={img} alt="" className="h-full w-full object-cover"/></div><span className="col-start-1 row-start-1 font-mono text-xs text-white/45 sm:col-auto sm:row-auto sm:text-white/30">{n}</span><h3 className="relative z-10 col-start-2 row-start-1 text-2xl font-medium tracking-tight sm:col-auto sm:row-auto sm:text-3xl lg:text-5xl">{title}</h3><p className="relative z-10 col-start-2 row-start-2 max-w-md text-xs leading-5 text-white/60 sm:col-auto sm:row-auto sm:text-sm sm:leading-6 sm:text-white/45">{desc}</p><ArrowUpRight className="relative z-10 col-start-3 row-span-2 row-start-1 self-center text-white/55 transition group-active:translate-x-1 group-active:-translate-y-1 group-hover:-translate-y-1 group-hover:translate-x-1 sm:col-auto sm:row-auto sm:self-auto"/></Link>)}</div></div></section>}

const newsFallback=[['Belajar dari Dunia Industri','Kegiatan pembelajaran dan kolaborasi siswa yang dekat dengan kebutuhan dunia kerja.','12 Sep 2026','/images/school/hero-lab.jpg','belajar-dari-dunia-industri'],['Aktivitas Siswa Tunas Harapan','Potret aktivitas siswa dalam lingkungan belajar dan kegiatan sekolah.','08 Sep 2026','/images/school/hero-courtyard.jpg','aktivitas-siswa-tunas-harapan'],['Tunas Harapan dan Teknologi','Sekolah terus mengembangkan pengalaman belajar berbasis teknologi dan kompetensi.','02 Sep 2026','/images/school/building-main.png','tunas-harapan-dan-teknologi']];
type BeritaPublik={id:string|number;judul:string;subjudul?:string|null;konten:string;gambar_url?:string|null;created_at?:string|null};
function formatTanggalBerita(iso:string|null|undefined, fallback:string){if(!iso)return fallback;try{return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});}catch{return fallback;}}
function News(){
const [daftar,setDaftar]=useState<BeritaPublik[]|null>(null);
useEffect(()=>{let batal=false;fetch('/api/berita?limit=3').then(r=>r.json()).then(d=>{if(batal)return;if(d?.ok&&Array.isArray(d.data)&&d.data.length>0)setDaftar(d.data);}).catch(()=>{});return()=>{batal=true;};},[]);
const tampil:BeritaPublik[]=(daftar??[]).length>0?(daftar as BeritaPublik[]):newsFallback.map(([title,desc,_date,img,slug])=>({id:slug,judul:title,subjudul:desc,konten:desc,gambar_url:img,created_at:null}));
const tanggalFallback:Record<string,string>=Object.fromEntries(newsFallback.map(([, ,date,,slug])=>[slug,date]));
return <section id="berita" className="bg-[#F4F9FF] px-6 py-28 text-[#021024] sm:py-36"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow text-[#2F5F8F]">03 / BERITA</p><h2 className="display mt-5 text-4xl sm:text-6xl">Berita terbaru.</h2></div><Link href="/berita" className="hidden rounded-full border border-[#021024]/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] sm:inline-flex">Lihat semua berita <ArrowUpRight size={14}/></Link></div><div className="mt-14 grid gap-6 md:grid-cols-3">{tampil.slice(0,3).map((b,i)=>{const isDb=daftar!==null&&(daftar as BeritaPublik[]).length>0;const slug=String(b.id);const img=b.gambar_url||'/images/school/hero-lab.jpg';const date=isDb?formatTanggalBerita(b.created_at,'Baru saja'):(tanggalFallback[slug]??'');const desc=b.subjudul||b.konten.slice(0,120);return <motion.article key={slug} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}} className="group overflow-hidden rounded-[1.6rem] border border-[#021024]/8 bg-white"><Link href={`/berita/${slug}`}><div className="aspect-[16/10] overflow-hidden bg-[#052659]/5"><img src={img} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/></div><div className="p-6"><p className="eyebrow text-[#2F5F8F]/60">{date}</p><h3 className="mt-3 line-clamp-2 text-2xl font-medium tracking-tight">{b.judul}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[#021024]/55">{desc}</p></div></Link></motion.article>})}</div><Link href="/berita" className="mt-8 inline-flex rounded-full border border-[#021024]/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] sm:hidden">Lihat semua berita <ArrowUpRight size={14}/></Link></div></section>}

function Facilities(){
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [selected]);
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
      image: '/images/school/perpustakaan.jpeg',
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
      title: 'Asrama Putra',
      subtitle: 'Lingkungan tinggal siswa',
      detail: 'Asrama putra berupa gedung di lingkungan sekolah yang hijau dan asri. Dilengkapi ruang makan, pembinaan dan pengawasan ketat, serta kegiatan minat dan olahraga. Informasi biaya dapat ditanyakan langsung kepada pihak sekolah.',
      image: '/images/school/asrama.jpeg',
      imageAlt: 'Gedung asrama putra SMK Tunas Harapan',
    },
    {
      title: 'Asrama Putri',
      subtitle: 'Lingkungan tinggal siswi',
      detail: 'Asrama putri berbentuk komplek perumahan dengan banyak unit yang terbagi dalam beberapa ruangan. Dilengkapi ruang makan, pembinaan dan pengawasan ketat, serta kegiatan minat dan olahraga. Informasi biaya dapat ditanyakan langsung kepada pihak sekolah.',
      // TODO: ganti dengan foto asli komplek asrama putri
      image: '/images/facilities/placeholder.svg',
      imageAlt: 'Asrama putri (foto segera hadir)',
    },
    {
      title: 'Lapangan Basket Atap',
      subtitle: 'Area Olahraga',
      detail: 'Lapangan basket beratap yang dapat digunakan untuk latihan, pertandingan, dan kegiatan olahraga siswa dalam segala cuaca.',
      // TODO: ganti dengan foto asli lapangan basket beratap
      image: '/images/school/hero-lapangan.jpg',
      imageAlt: 'Lapangan basket beratap (foto sementara)',
    },
    {
      title: 'Lapangan Rumput',
      subtitle: 'Area Olahraga & Upacara',
      detail: 'Lapangan rumput serbaguna untuk sepak bola, upacara bendera, dan berbagai kegiatan luar ruang sekolah.',
      // TODO: ganti dengan foto asli lapangan rumput
      image: '/images/school/hero-courtyard.jpg',
      imageAlt: 'Lapangan rumput (foto sementara)',
    },
    {
      title: 'Masjid',
      subtitle: 'Tempat Ibadah',
      detail: 'Masjid sekolah sebagai pusat ibadah dan pembinaan rohani warga sekolah dalam lingkungan yang nyaman.',
      // TODO: ganti dengan foto asli masjid
      image: '/images/school/building-main.png',
      imageAlt: 'Masjid sekolah (foto sementara)',
    },
    {
      title: 'Toilet',
      subtitle: 'Sanitasi Siswa',
      detail: 'Fasilitas toilet yang bersih dan terawat untuk menunjang kenyamanan siswa selama beraktivitas di sekolah.',
      // TODO: ganti dengan foto asli toilet
      image: '/images/school/building-secondary.png',
      imageAlt: 'Toilet sekolah (foto sementara)',
    },
    {
      title: 'Parkiran',
      subtitle: 'Area Parkir',
      detail: 'Area parkir yang tertata untuk kendaraan siswa, guru, dan tamu di lingkungan sekolah.',
      // TODO: ganti dengan foto asli parkiran
      image: '/images/school/tkr.jpg',
      imageAlt: 'Parkiran sekolah (foto sementara)',
    },
    {
      title: 'Aula',
      subtitle: 'Gedung Serbaguna',
      detail: 'Ruang serbaguna untuk berbagai acara dan kegiatan besar sekolah, seperti wisuda, seminar, dan pentas seni.',
      // TODO: ganti dengan foto asli aula
      image: '/images/facilities/placeholder.svg',
      imageAlt: 'Aula sekolah (foto segera hadir)',
    },
    {
      title: 'Lab & Bengkel Praktik',
      subtitle: 'Praktik Kejuruan',
      detail: 'Ruang Praktik Siswa (RPS), bengkel/gedung TKR, dan GameLab untuk pembelajaran praktik sesuai bidang keahlian.',
      // TODO: ganti dengan foto asli lab/bengkel (saat ini foto lab komputer)
      image: '/images/school/hero-lab.jpg',
      imageAlt: 'Lab dan bengkel praktik (foto sementara)',
    },
    {
      title: 'Kantin',
      subtitle: 'Kuliner Sekolah',
      detail: 'Area kantin dengan beragam pilihan makanan dan minuman untuk siswa selama waktu istirahat.',
      // TODO: ganti dengan foto asli kantin
      image: '/images/facilities/placeholder.svg',
      imageAlt: 'Kantin sekolah (foto segera hadir)',
    },
    {
      title: 'UKS',
      subtitle: 'Kesehatan Siswa',
      detail: 'Layanan kesehatan dasar dan pertolongan pertama bagi siswa yang membutuhkan selama beraktivitas di sekolah.',
      // TODO: ganti dengan foto asli ruang UKS
      image: '/images/facilities/placeholder.svg',
      imageAlt: 'Ruang UKS (foto segera hadir)',
    },
  ];

  const count = items.length;
  const dragMoved = useRef(false);
  const goTo = (index: number, dir?: number) => {
    const next = ((index % count) + count) % count;
    setDirection(dir ?? (next > active ? 1 : -1));
    setActive(next);
  };
  const peekTo = (index: number) => { if (!dragMoved.current) goTo(index); };
  const goNext = () => goTo(active + 1, 1);
  const goPrev = () => goTo(active - 1, -1);

  return <section id="fasilitas" className="relative overflow-hidden bg-white px-6 py-28 text-[#021024] sm:py-36">
    <motion.div aria-hidden="true" className="pointer-events-none absolute -left-28 top-24 hidden w-80 opacity-90 lg:block xl:w-96" animate={{ y: [0, -12, 0], rotate: [-8, -5, -8] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 260 220" fill="none" className="h-auto w-full">
        <motion.path d="M-6 206 L118 30 L252 206" stroke="#A6D81C" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.path d="M48 206 L128 108 L196 206" stroke="#F04A3A" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
        <motion.path d="M-6 30 L118 206 L252 30" stroke="#2E9BD0" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }} />
      </svg>
    </motion.div>
    <motion.div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-6 hidden w-60 opacity-90 lg:block xl:w-72" animate={{ y: [0, 12, 0], rotate: [10, 7, 10] }} transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 260 220" fill="none" className="h-auto w-full -scale-x-100">
        <motion.path d="M-6 30 L118 206 L252 30" stroke="#2E9BD0" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }} />
        <motion.path d="M60 206 L132 116 L190 206" stroke="#A6D81C" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.path d="M150 206 L170 178 L190 206" stroke="#F04A3A" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }} />
      </svg>
    </motion.div>
    <motion.div aria-hidden="true" className="pointer-events-none absolute right-4 top-6 w-24 opacity-80 sm:w-28 lg:w-36" animate={{ y: [0, -8, 0], rotate: [14, 10, 14] }} transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 260 220" fill="none" className="h-auto w-full">
        <motion.path d="M-6 30 L118 206 L252 30" stroke="#F04A3A" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }} />
        <motion.path d="M96 206 L140 150 L176 206" stroke="#2E9BD0" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
      </svg>
    </motion.div>
    <motion.div aria-hidden="true" className="pointer-events-none absolute bottom-24 left-6 w-16 opacity-60 sm:w-20 lg:w-24" animate={{ y: [0, 8, 0], rotate: [-14, -10, -14] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
      <svg viewBox="0 0 260 220" fill="none" className="h-auto w-full">
        <motion.path d="M60 206 L132 116 L190 206" stroke="#A6D81C" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
        <motion.path d="M118 30 L148 70 L176 30" stroke="#2E9BD0" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0.25 }} animate={{ pathLength: 1, opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }} />
      </svg>
    </motion.div>
    <motion.div aria-hidden="true" className="pointer-events-none absolute left-[6%] top-[22%] hidden md:block" animate={{ y: [0, -18, 0], x: [0, 10, 0], rotate: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}>
      <div className="relative size-28">
        <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full opacity-50 blur-md" fill="url(#holoTri1)"><defs><linearGradient id="holoTri1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#67e8f9"/><stop offset=".4" stopColor="#c4b5fd"/><stop offset=".65" stopColor="#f9a8d4"/><stop offset="1" stopColor="#a3e635"/></linearGradient></defs><polygon points="50,4 96,88 4,88" /></svg>
        <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full" fill="rgba(255,255,255,.22)" stroke="rgba(255,255,255,.65)" strokeWidth="1.5"><polygon points="50,4 96,88 4,88" /><polygon points="50,4 96,88 4,88" fill="url(#holoTri1)" opacity=".55" /></svg>
        <motion.div className="absolute inset-x-5 top-6 h-6 bg-gradient-to-r from-transparent via-white/80 to-transparent" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} animate={{ opacity: [0.1, 0.7, 0.1], x: ['-30%', '30%', '-30%'] }} transition={{ duration: 3.7, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
    </motion.div>
    <motion.div aria-hidden="true" className="pointer-events-none absolute bottom-[14%] right-[7%] hidden md:block" animate={{ y: [0, 16, 0], x: [0, -12, 0], rotate: [0, -8, 0] }} transition={{ duration: 10.5, repeat: Infinity, ease: 'easeInOut' }}>
      <div className="relative h-24 w-20">
        <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full -scale-y-100 opacity-50 blur-md" fill="url(#holoTri2)"><defs><linearGradient id="holoTri2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a3e635"/><stop offset=".45" stopColor="#67e8f9"/><stop offset=".75" stopColor="#c4b5fd"/><stop offset="1" stopColor="#f9a8d4"/></linearGradient></defs><polygon points="50,4 96,88 4,88" /></svg>
        <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full -scale-y-100" fill="rgba(255,255,255,.18)" stroke="rgba(255,255,255,.6)" strokeWidth="1.5"><polygon points="50,4 96,88 4,88" /><polygon points="50,4 96,88 4,88" fill="url(#holoTri2)" opacity=".55" /></svg>
        <motion.div className="absolute inset-x-4 top-2 h-8 bg-gradient-to-b from-white/90 to-transparent" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} animate={{ opacity: [0.15, 0.8, 0.15] }} transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} />
      </div>
    </motion.div>
    <motion.div aria-hidden="true" className="pointer-events-none absolute right-[16%] top-[30%] hidden lg:block" animate={{ y: [0, -10, 0], rotate: [0, 12, 0], opacity: [0.35, 0.7, 0.35] }} transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
      <svg viewBox="0 0 100 92" className="size-14 opacity-70 blur-[1px]" fill="url(#holoTri3)"><defs><linearGradient id="holoTri3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f9a8d4"/><stop offset=".5" stopColor="#67e8f9"/><stop offset="1" stopColor="#a3e635"/></linearGradient></defs><polygon points="50,4 96,88 4,88" stroke="rgba(255,255,255,.5)" strokeWidth="2" /></svg>
    </motion.div>
    <div className="relative mx-auto max-w-7xl"><p className="eyebrow text-[#2F5F8F]">04 / FASILITAS</p>
    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <h2 className="display text-4xl sm:text-6xl">Ruang untuk<br/><span className="text-[#021024]/30">bertumbuh.</span></h2>
      <p className="max-w-md text-sm leading-7 text-[#021024]/55"></p>
    </div>
    <div className="mt-12 flex items-center gap-2 sm:gap-6">
      <button type="button" onClick={goPrev} aria-label="Kartu sebelumnya" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#021024]/15 bg-white text-[#021024] shadow-sm transition hover:bg-[#021024] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5F8F] active:scale-95 sm:size-14"><ArrowLeft size={20}/></button>
      <motion.div
        className="relative mx-auto h-[440px] w-full max-w-[520px] flex-1 touch-pan-y sm:h-[470px]"
        role="region" aria-roledescription="carousel" aria-label="Kartu fasilitas. Geser untuk pindah, ketuk kartu untuk detail."
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} dragMomentum={false}
        onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 10) { dragMoved.current = true; window.setTimeout(() => { dragMoved.current = false; }, 150); } if (info.offset.x < -60) goNext(); else if (info.offset.x > 60) goPrev(); }}
      >
        {items.map((item, index) => {
          const pos = ((index - active) % count + count) % count;
          const xMap = [0, 40, -40, 0];
          const yMap = [0, 18, 36, 54];
          const rotateMap = [0, 5, -5, 0];
          const x = xMap[Math.min(pos, 3)];
          const y = yMap[Math.min(pos, 3)];
          const rotate = rotateMap[Math.min(pos, 3)];
          const baseScale = 1 - Math.min(pos, 3) * 0.06;
          const isPeekable = pos === 1 || pos === 2;
          const peekX = pos === 1 ? -14 : 14;
          return <motion.article
            key={item.title}
            initial={false}
            animate={{ x, y, rotate, scale: baseScale, opacity: pos === 0 ? 1 : pos === 1 ? 0.85 : pos === 2 ? 0.7 : 0, filter: pos === 0 ? 'brightness(1)' : `brightness(${Math.max(0.72, 0.94 - pos * 0.08)})` }}
            whileHover={pos === 0 ? { y: -6, scale: 1.015 } : isPeekable ? { x: x + peekX, y: y - 6, scale: baseScale + 0.03, filter: 'brightness(1)' } : undefined}
            whileTap={pos <= 2 ? { scale: baseScale - 0.015 } : undefined}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            style={{ zIndex: count - pos }}
            aria-hidden={pos !== 0}
            onClick={isPeekable ? () => peekTo(index) : undefined}
            title={isPeekable ? `Tampilkan ${item.title}` : undefined}
            className={`absolute inset-x-1 top-0 overflow-hidden rounded-[1.75rem] border border-[#021024]/8 bg-[#F4F9FF] transition-shadow duration-300 sm:inset-x-12 ${pos === 0 ? 'shadow-[0_32px_70px_-28px_rgba(2,16,36,.4)] hover:shadow-[0_44px_90px_-28px_rgba(2,16,36,.55)]' : isPeekable ? 'cursor-pointer hover:shadow-[0_24px_50px_-24px_rgba(2,16,36,.45)]' : 'pointer-events-none'} ${pos > 2 ? 'invisible' : ''}`}
          >
            {pos === 0
              ? <button type="button" onClick={() => setSelected(index)} aria-label={`Lihat detail ${item.title}`} className="group block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F5F8F]">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#052659]/10">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.img key={item.image} src={item.image} alt={item.imageAlt} initial={{ opacity: 0, x: 48 * direction }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -48 * direction }} transition={{ duration: 0.35 }} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" draggable={false} />
                  </AnimatePresence>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                  <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 font-mono text-[11px] tracking-[.18em] text-[#021024] backdrop-blur transition-transform duration-300 group-hover:scale-105">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="relative p-6 sm:p-7">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={`text-${active}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      <p className="eyebrow text-[#2F5F8F]/70">{item.subtitle}</p>
                      <h3 className="mt-3 text-3xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-[#052659] sm:text-4xl">{item.title}</h3>
                      <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E86A17]/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#E86A17] transition-all duration-300 group-hover:border-[#E86A17] group-hover:bg-[#E86A17] group-hover:text-white">Ketuk untuk detail <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </button>
              : <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#052659]/10">
                  <img src={item.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                  <div aria-hidden="true" className="absolute inset-0 bg-[#F4F9FF]/55" />
                  <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 font-mono text-[11px] tracking-[.18em] text-[#021024] backdrop-blur">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="relative p-6 sm:p-7">
                  <div aria-hidden="true" className="absolute inset-0 bg-[#F4F9FF]/55" />
                  <p className="eyebrow text-[#2F5F8F]/60">{item.subtitle}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#021024]/80 sm:text-4xl">{item.title}</h3>
                </div>
              </div>}
          </motion.article>;
        })}
      </motion.div>
      <button type="button" onClick={goNext} aria-label="Kartu berikutnya" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#021024] text-white shadow-sm transition hover:bg-[#2F5F8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5F8F] focus-visible:ring-offset-2 active:scale-95 sm:size-14"><ArrowRight size={20}/></button>
    </div>
    <div className="mt-8 flex items-center justify-center gap-4 sm:mt-10">
      <span className="font-mono text-xs tracking-[.2em] text-[#021024]/50" aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
      <div className="flex gap-2" role="tablist" aria-label="Pilih fasilitas">
        {items.map((item, i) => <button key={item.title} role="tab" aria-selected={i === active} aria-label={item.title} type="button" onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-10 bg-[#021024]' : 'w-5 bg-[#021024]/15 hover:bg-[#021024]/30'}`} />)}
      </div>
    </div>
    <p className="mt-4 text-center text-xs text-[#021024]/40">Arahkan kursor ke kartu belakang, geser, atau ketuk kartu untuk menjelajah.</p>
  </div>
  <AnimatePresence>
    {selected !== null && items[selected] && <motion.div key="facility-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-end justify-center bg-[#021024]/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setSelected(null)}>
      <motion.div
        key={`facility-dialog-${selected}`}
        role="dialog" aria-modal="true" aria-label={`Detail ${items[selected].title}`}
        initial={{ y: 80, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragMomentum={false}
        onDragEnd={(_, info) => { if (info.offset.y > 90) setSelected(null); }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.5rem] bg-white text-left shadow-2xl sm:max-w-lg sm:rounded-[1.75rem]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#052659]/10">
          <img src={items[selected].image} alt={items[selected].imageAlt} className="h-full w-full object-cover" />
          <button type="button" onClick={() => setSelected(null)} aria-label="Tutup detail" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-[#021024]/70 text-white backdrop-blur transition hover:bg-[#021024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X size={18} /></button>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#021024]/10 sm:hidden" aria-hidden="true" />
          <p className="eyebrow text-[#2F5F8F]/70">{items[selected].subtitle}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{items[selected].title}</h3>
          <p className="mt-3 text-sm leading-7 text-[#021024]/60">{items[selected].detail}</p>
          {items[selected].href
            ? <a href={items[selected].href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#E86A17] hover:text-[#B64F0C]">Lihat informasi <ArrowUpRight size={14} /></a>
            : null}
          <button type="button" onClick={() => setSelected(null)} className="mt-7 w-full rounded-full bg-[#021024] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.15em] text-white transition hover:bg-[#2F5F8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F5F8F] focus-visible:ring-offset-2">Tutup</button>
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence></section>;
}

function Partners(){
  const partners=[
    { name: 'Sinarmas', file: '/images/partners/sinarmas.png' },
    { name: 'Bakti Barito', file: '/images/partners/bakti-barito.png' },
    { name: 'IFORTE', file: '/images/partners/iforte.png' },
    { name: 'Indofood', file: '/images/partners/indofood.png' },
    { name: 'Wings', file: '/images/partners/wings.png' },
    { name: 'Agung Sedayu Group', file: '/images/partners/agung-sedayu-group.png' },
    { name: 'Garudafood', file: '/images/partners/garudafood.png' },
    { name: 'Ciliandra Perkasa', file: '/images/partners/ciliandra-perkasa.png' },
    { name: 'Triputra Agro Persada', file: '/images/partners/triputra-agro-persada.png' },
  ];
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
        {logos.map((partner,index)=><div key={`${partner.name}-${index}`} title={partner.name} className="h-24 w-48 shrink-0 overflow-hidden rounded-2xl">
          <img src={partner.file} alt={`Logo ${partner.name}`} className="h-full w-full object-contain" loading="lazy" />
        </div>)}
      </div>
    </div>
    <div className="mx-auto max-w-7xl px-6"><p className="mt-5 text-[10px] uppercase tracking-[.16em] text-white/25">np.</p></div>
  </section>
}
function Achievements(){return <section id="prestasi" className="bg-[#F4F9FF] px-6 py-24 text-[#021024] sm:py-32"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[#2F5F8F]">06 / PRESTASI</p><h2 className="display mt-5 max-w-3xl text-4xl sm:text-6xl">Karya siswa yang<br/><span className="text-[#021024]/30">melangkah lebih jauh.</span></h2></div><Trophy className="text-[#052659]/30" size={42} strokeWidth={1.1}/></div><div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="overflow-hidden rounded-[1.75rem] bg-[#021024]"><img src="/images/achievements/students-achievement.jpg" alt="Prestasi siswa" className="h-[330px] w-full object-cover opacity-90 sm:h-[470px]"/></div><div className="grid gap-3">{[['01','Karya','Mendorong siswa menghasilkan karya yang dapat ditunjukkan di luar kelas.'],['02','Kompetensi','Mengasah kemampuan melalui praktik, proyek, dan pengalaman nyata.'],['03','Apresiasi','Memberi ruang bagi pencapaian siswa untuk terus berkembang.']].map(([n,title,desc])=><div key={n} className="flex gap-5 rounded-[1.5rem] border border-[#021024]/10 bg-white p-6 sm:p-7"><span className="font-mono text-xs text-[#2F5F8F]/50">{n}</span><div><p className="text-xl font-medium">{title}</p><p className="mt-2 text-sm leading-6 text-[#021024]/50">{desc}</p></div></div>)}</div></div></div></section>}

function AnimatedCounter({ value, suffix = '', isVisible }: { value: number; suffix?: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const startTime = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startTime) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [isVisible, value]);

  return <span>{`${count.toLocaleString('id-ID')}${suffix}`}</span>;
}

function AnimatedProgressBar({ value, color, metric, year }: { value: number; color: string; metric: string; year: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const startTime = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startTime) / 1250, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setProgress(value * eased);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [isVisible, value]);

  const decimals = Number.isInteger(value) ? 0 : 2;
  const displayValue = `${progress.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })}%`;

  return <motion.div className="grid grid-cols-[40px_minmax(0,1fr)_58px] items-center gap-3" onViewportEnter={() => setIsVisible(true)} viewport={{ once: true, amount: 0.25 }}>
    <span className="font-mono text-xs text-[#021024]/55">{year}</span>
    <div className="h-3 overflow-hidden rounded-full bg-[#021024]/8" role="progressbar" aria-label={`${metric}, tahun ${year}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100) / 100}>
      <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
    </div>
    <span className="text-right text-sm font-semibold tabular-nums">{displayValue}</span>
  </motion.div>;
}

function Future(){
  const [activeAlumni, setActiveAlumni] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const outcomes = [
    {
      title: 'Kawal Kerja',
      description: 'Pendampingan dan informasi untuk mempersiapkan langkah menuju dunia kerja.',
      metric: 'Bekerja',
      values: [43.69, 47.63, 48.94],
      color: '#2F5F8F',
    },
    {
      title: 'Kawal Kuliah',
      description: 'Ruang informasi dan pendampingan untuk melanjutkan pendidikan ke jenjang yang lebih tinggi.',
      metric: 'Melanjutkan Kuliah / Studi Lanjut',
      values: [20, 13.37, 20.40],
      color: '#168B7E',
    },
  ];
  const schoolStats = [
    { value: 4530, suffix: '+', label: 'Alumni', icon: GraduationCap },
    { value: 67, suffix: '', label: 'Staf PTK', icon: UserRound },
    { value: 911, suffix: '', label: 'Siswa aktif', icon: UsersRound },
    { value: 21, suffix: '', label: 'Tahun pengalaman', icon: Clock3 },
  ];
  const alumni = [
    {
      name: 'Visentius Agiola Stanlay',
      profession: 'Jaringan Senior TI & Infrastruktur',
      study: 'Alumni TKJ',
      image: '/images/school/visentius.jpg',
      imageAlt: 'Visentius Agiola Stanlay, alumni TKJ',
      text: 'Di SMK Telekomunikasi Tunas Harapan saya dibimbing menjadi yang terbaik di bidang Komputer Jaringan, dengan Guru yang berintegrasi tinggi dan sudah bersertifikasi Cisco saya dapat dengan mudah memahami apa yang di sampaikan, serta fasilitasnya pun mendukung selama pembelajaran. Oleh karena itu membuat saya siap dan percaya diri untuk bersaing dengan Lulusan SMK lainnya. Saat saya lulus saya langsung diterima di Perusahaan Hosting Terbesar di Jakarta. Dan saat ini saya bekerja sebagai IT Senior Network & Infrastruktur di situs Transcosmos Indonesia Semarang.',
      isDirectQuote: true,
    },
    {
      name: 'Desi Ramadina',
      profession: 'Dukungan IT',
      study: 'Alumni TKJ',
      image: '/images/school/desi.jpg',
      imageAlt: 'Desi Ramadina, alumni TKJ',
      text: 'Terimakasih untuk SMK TTH terutama untuk jurusan TKJ yang sudah memberikan ilmu dan pembelajaran selama saya sekolah disana. Suatu kebanggaan tersendiri bagi saya setelah lulus mendapatkan kontrak kerja sebagai IT Support di PT Kievit Indonesia. Kedepannya semoga SMK TTH semakin memberikan hardskill dan softskill secara optimal',
      isDirectQuote: true,
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveAlumni((current) => (current + 1) % alumni.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [alumni.length]);

  return <section className="bg-[#F4F9FF] px-6 py-28 text-[#021024] sm:py-36"><div className="mx-auto max-w-7xl rounded-[2rem] bg-[#C1E8FF] px-7 pb-0 pt-7 sm:px-12 sm:pt-12 lg:px-14 lg:pt-14"><p className="eyebrow text-[#052659]/60">07 / YOUR NEXT STEP</p><h2 className="display mt-5 max-w-4xl text-4xl sm:text-6xl">Kawal langkahmu setelah lulus.</h2><div className="mt-10 grid gap-4 sm:grid-cols-2">{outcomes.map((outcome) => <article key={outcome.title} className="rounded-3xl bg-white/75 p-6 sm:p-7"><h3 className="text-2xl font-semibold">{outcome.title}</h3><p className="mt-2 text-sm leading-6 text-[#021024]/55">{outcome.description}</p><div className="mt-7 border-t border-[#021024]/10 pt-5"><div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold">{outcome.metric}</p><span className="text-[10px] font-medium uppercase tracking-[.12em] text-[#021024]/40">Skala 0-100%</span></div><div className="mt-5 space-y-4" role="list" aria-label={`${outcome.metric} per tahun`}>{outcome.values.map((value, index) => <AnimatedProgressBar key={2023 + index} value={value} color={outcome.color} metric={outcome.metric} year={2023 + index} />)}</div></div></article>)}</div>
    <motion.div onViewportEnter={() => setStatsVisible(true)} viewport={{ once: true, amount: 0.25 }} className="mt-12 grid grid-cols-2 border-y border-[#052659]/20 py-7 sm:grid-cols-4 sm:py-8" aria-label="Statistik sekolah">
      {schoolStats.map(({ value, suffix, label, icon: Icon }, index) => <div key={label} className={`flex items-center gap-3 py-4 sm:justify-center sm:py-2 ${index % 2 === 0 ? 'pr-3' : 'pl-3'} ${index > 1 ? 'border-t border-[#052659]/15 sm:border-t-0' : ''} ${index > 0 && index % 2 === 1 ? 'border-l border-[#052659]/15' : ''} ${index > 0 ? 'sm:border-l sm:border-[#052659]/15' : ''}`}><Icon aria-hidden="true" size={32} strokeWidth={1.4} className="shrink-0 text-[#052659] sm:size-9"/><div><p className="text-2xl font-medium leading-none tabular-nums sm:text-3xl"><AnimatedCounter value={value} suffix={suffix} isVisible={statsVisible}/></p><p className="mt-1 text-xs text-[#021024]/60 sm:text-sm">{label}</p></div></div>)}
    </motion.div>
    <div className="mx-auto mt-12 h-[510px] max-w-5xl text-center sm:mt-14 sm:h-[390px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={activeAlumni} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex h-full flex-col items-center">
          <blockquote className="grid h-[340px] w-full shrink-0 place-items-center overflow-y-auto px-2 text-sm leading-7 text-[#021024]/65 sm:h-[210px] sm:text-base sm:leading-8">
            {alumni[activeAlumni].isDirectQuote ? `“${alumni[activeAlumni].text}”` : alumni[activeAlumni].text}
          </blockquote>
          <h3 className="mt-4 shrink-0 text-2xl font-semibold text-[#2F5F8F] sm:mt-5 sm:text-3xl">{alumni[activeAlumni].name}</h3>
          <p className="mt-1 shrink-0 text-sm text-[#021024]/60 sm:text-base">{alumni[activeAlumni].profession}</p>
        </motion.div>
      </AnimatePresence>
      <div className="relative mx-auto -mt-16 h-12 w-52" aria-label="Pilih profil alumni">
        {alumni.map((profile, index) => {
          const isActive = activeAlumni === index;
          return <button
            key={profile.name}
            type="button"
            aria-label={`Tampilkan testimoni ${profile.name}`}
            aria-pressed={isActive}
            onClick={() => setActiveAlumni(index)}
            className={`absolute overflow-hidden rounded-full border-4 border-[#C1E8FF] shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#052659] focus-visible:ring-offset-2 focus-visible:ring-offset-[#C1E8FF] ${isActive ? 'left-1/2 top-0 z-20 size-24 -translate-x-1/2' : 'left-2 top-2 z-10 size-20 opacity-90 hover:scale-105'}`}
          >
            <img src={profile.image} alt={profile.imageAlt} className="h-full w-full object-cover" />
          </button>;
        })}
      </div>
    </div>
  </div></section>;
}
function Footer(){return <footer className="bg-[#021024] px-6 py-16 text-white"><div className="mx-auto max-w-7xl"><div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-3"><div><p className="text-lg font-semibold">SMK TELEKOMUNIKASI<br/>TUNAS HARAPAN</p><p className="mt-4 max-w-sm text-sm leading-7 text-white/40">Jl. Umbul Senjoyo I, No. 3 Desa Bener, Kec. Tengaran, Kabupaten Semarang, Jawa Tengah.</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-3"><a href="https://www.facebook.com/smktelekomunikasitunasharapan/" target="_blank" rel="noreferrer" aria-label="Facebook SMK Telekomunikasi Tunas Harapan" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#C1E8FF]"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8h3.4Z"/></svg><span>@smktelekomunikasitunasharapan</span></a><a href="https://www.instagram.com/smk_tth?stkn=MWhua3ZxdjA1MWNmYw==" target="_blank" rel="noreferrer" aria-label="Instagram SMK Telekomunikasi Tunas Harapan" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#C1E8FF]"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none"/></svg><span>@smk_tth</span></a><a href="https://www.youtube.com/channel/UCiQWJxhNpa_mq_WxnvbEBQQ" target="_blank" rel="noreferrer" aria-label="YouTube Telsa TV SMKTTH" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#C1E8FF]"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg><span>@telsatv
</span></a></div></div><div><p className="eyebrow text-[#7DA0CA]">EXPLORE</p><div className="mt-4 space-y-3 text-sm text-white/45"><a className="block hover:text-white" href="#profil">Profil</a><a className="block hover:text-white" href="#jurusan">Jurusan</a><a className="block hover:text-white" href="#industri">Mitra Industri</a><Link className="block hover:text-white" href="/berita">Berita</Link></div></div><div><p className="eyebrow text-[#7DA0CA]">PPDB / ADMIN</p><a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024]">Buka SPMB <ArrowUpRight size={14}/></a><Link href="/login" className="mt-3 inline-flex rounded-full border border-white/15 px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-white/70 transition hover:border-white/30 hover:text-white">Login Admin <ArrowUpRight size={14}/></Link></div></div><p className="pt-7 text-[10px] uppercase tracking-[.18em] text-white/25">© 2026 SMK Telekomunikasi Tunas Harapan · Frontend concept</p></div></footer>}

export default function Home(){return <main id="top" className="overflow-x-hidden"><Nav/><HeroSection/><Profile/><Majors/><News/><Facilities/><Partners/><Achievements/><Future/><Footer/><Chatbot/></main>}
