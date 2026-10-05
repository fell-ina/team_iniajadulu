'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Clock3, GraduationCap, Menu, UserRound, UsersRound, X, Handshake, Trophy } from 'lucide-react';
import Link from 'next/link';
import HeroSection from '@/components/HeroSection';
import Chatbot from '@/components/Chatbot';

const nav = [['Profil','#profil'],['Jurusan','#jurusan'],['Berita','#berita'],['Fasilitas','#fasilitas'],['Mitra Industri','#industri'],['Prestasi','#prestasi']];

function Nav(){const [open,setOpen]=useState(false);return <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/15 bg-[#021024]/78 px-4 py-3 text-white shadow-xl backdrop-blur-xl sm:px-6"><a href="#top" className="flex items-center gap-3"><span className="grid size-9 overflow-hidden rounded-full bg-white p-1"><img src="/images/school/logo-transparent.png" className="h-full w-full object-contain" alt="Logo"/></span><span className="hidden text-xs font-semibold tracking-[.15em] sm:block">TUNAS HARAPAN</span></a><nav className="hidden gap-1 md:flex">{nav.map(([n,h])=><a key={h} href={h} className="rounded-full px-4 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white">{n}</a>)}</nav><div className="hidden md:block"><a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#021024]">PPDB / SPMB</a></div><button className="grid size-9 place-items-center md:hidden" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:<Menu size={18}/>}</button></div>{open&&<div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white/10 bg-[#021024]/95 p-3 text-white backdrop-blur-xl md:hidden">{nav.map(([n,h])=><a key={h} href={h} onClick={()=>setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm text-white/70">{n}</a>)}<a href="https://spmb.tunasharapan.info" target="_blank" rel="noreferrer" className="mt-2 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-[#021024]">PPDB / SPMB</a></div>}</header>}

function Profile(){return <section id="profil" className="profile-grid-bg relative isolate overflow-hidden px-6 py-28 text-[#021024] sm:py-36"><div aria-hidden="true" className="profile-shards pointer-events-none absolute inset-0 z-0"><img src="/images/polygon/Group%2019.png" alt="" className="profile-shard absolute -left-5 top-[-30px] h-44 w-52 object-contain sm:left-4 sm:top-[-42px] sm:h-56 sm:w-64"/><img src="/images/polygon/Group%2018.png" alt="" className="profile-shard absolute left-[42%] top-[7%] h-16 w-24 object-contain sm:left-[44%] sm:top-[8%] sm:h-20 sm:w-32"/><img src="/images/polygon/Group%2034.png" alt="" className="profile-shard absolute left-[27%] top-[38%] h-12 w-16 object-contain sm:left-[29%] sm:top-[40%]"/><img src="/images/polygon/Group%2033.png" alt="" className="profile-shard absolute right-[8%] top-[5%] h-24 w-16 object-contain sm:right-[12%] sm:top-[7%] sm:h-32 sm:w-20"/><img src="/images/polygon/Group%2016.png" alt="" className="profile-shard absolute right-[2%] top-[38%] h-10 w-20 object-contain sm:right-[5%] sm:top-[36%] sm:h-12 sm:w-24"/><img src="/images/polygon/Group%209.png" alt="" className="profile-shard absolute bottom-[-34px] left-[7%] h-32 w-40 object-contain sm:bottom-[-42px] sm:left-[9%] sm:h-44 sm:w-52"/><img src="/images/polygon/Group%2015.png" alt="" className="profile-shard absolute bottom-[-14px] left-[37%] h-16 w-28 object-contain sm:bottom-[-20px] sm:left-[36%] sm:h-20 sm:w-36"/><img src="/images/polygon/Group%2017.png" alt="" className="profile-shard absolute bottom-[5%] right-[22%] h-12 w-16 object-contain sm:bottom-[8%] sm:right-[20%] sm:h-16 sm:w-20"/><img src="/images/polygon/Group%2010.png" alt="" className="profile-shard absolute bottom-[2%] -right-8 h-28 w-20 object-contain sm:bottom-[4%] sm:right-[-20px] sm:h-40 sm:w-28"/></div><div className="relative z-10 mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}}><p className="eyebrow text-[#2F5F8F]">01 / PROFIL</p><h2 className="display mt-5 max-w-xl text-4xl sm:text-6xl">Sekolah yang bergerak bersama masa depan.</h2></motion.div><motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="grid gap-8 sm:grid-cols-2"><div><p className="eyebrow text-[#2F5F8F]/60">TENTANG KAMI</p><p className="mt-4 text-lg leading-8 text-[#021024]/65">SMK Telekomunikasi Tunas Harapan membangun lingkungan belajar vokasi yang dekat dengan teknologi, karakter, dan kebutuhan industri.</p></div><div><p className="eyebrow text-[#2F5F8F]/60">ARAH</p><p className="mt-4 text-lg leading-8 text-[#021024]/65">Pembelajaran diarahkan untuk membentuk kompetensi, karya, dan kesiapan siswa menghadapi dunia nyata.</p></div></motion.div></div></section>}

const majors=[['01','PPLG','Pengembangan Perangkat Lunak dan Gim','/images/school/hero-lab.jpg','pplg','#BA0000'],['02','TJKT','Teknik Jaringan Komputer dan Telekomunikasi','/images/school/building-main.png','tjkt','#939191'],['03','DKV','Desain Komunikasi Visual','/images/school/hero-courtyard.jpg','dkv','#152DA9'],['04','TKR','Teknik Kendaraan Ringan','/images/school/building-secondary.png','tkr','#C67219']];
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
