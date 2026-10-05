'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { kelasGambarInline, parseAltGambar } from '@/lib/gambarMarkdown';

const dataStatis: Record<string, { title: string; date: string; image: string; body: string }> = {
  'belajar-dari-dunia-industri': { title: 'Belajar dari Dunia Industri', date: '12 Sep 2026', image: '/images/school/hero-lab.jpg', body: 'Kegiatan pembelajaran dirancang agar siswa mengenal praktik, proses, dan kebutuhan dunia kerja melalui pengalaman yang relevan.' },
  'aktivitas-siswa-tunas-harapan': { title: 'Aktivitas Siswa Tunas Harapan', date: '08 Sep 2026', image: '/images/school/hero-courtyard.jpg', body: 'Beragam aktivitas siswa menjadi bagian dari lingkungan belajar yang mendorong kolaborasi, karakter, dan eksplorasi potensi.' },
  'tunas-harapan-dan-teknologi': { title: 'Tunas Harapan dan Teknologi', date: '02 Sep 2026', image: '/images/school/building-main.png', body: 'Teknologi digunakan sebagai bagian dari pengalaman belajar dan pengembangan kompetensi siswa.' }
};

type BeritaPublik = { id: string | number; judul: string; subjudul?: string | null; konten: string; gambar_url?: string | null; created_at?: string | null };

function formatTanggal(iso: string | null | undefined, fallback: string) { if (!iso) return fallback; try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return fallback; } }

export default function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [berita, setBerita] = useState<BeritaPublik | null>(null);
  const [memuat, setMemuat] = useState(true);
  useEffect(() => { let batal = false; fetch(`/api/berita?id=${encodeURIComponent(slug)}`).then(r => r.json()).then(d => { if (batal) return; if (d?.ok && Array.isArray(d.data) && d.data.length > 0) setBerita(d.data[0]); }).catch(() => { }).finally(() => { if (!batal) setMemuat(false); }); return () => { batal = true; }; }, [slug]);
  if (memuat) return <main className="min-h-screen bg-[#F4F9FF] text-[#021024]"><div className="mx-auto max-w-5xl px-6 py-24"><Link href="/berita" className="text-xs text-black/45">← Semua berita</Link><div className="mt-20 animate-pulse"><div className="h-4 w-32 rounded bg-[#021024]/10" /><div className="mt-5 h-12 w-3/4 rounded bg-[#021024]/10" /><div className="mt-12 aspect-[16/9] rounded-[2rem] bg-[#021024]/10" /></div></div></main>;
  if (berita) {
    return (
      <main className="min-h-screen bg-[#F4F9FF] text-[#021024]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <Link href="/berita" className="text-xs text-black/45">← Semua berita</Link>
          <p className="eyebrow mt-20 text-[#2F5F8F]">{formatTanggal(berita.created_at, 'Baru saja')}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">{berita.judul}</h1>
          {berita.subjudul ? <p className="mt-5 max-w-3xl text-xl leading-relaxed text-[#2F5F8F]">{berita.subjudul}</p> : null}
          {berita.gambar_url ? <div className="mt-12 overflow-hidden rounded-[2rem]"><img src={berita.gambar_url} alt={berita.judul} className="max-h-[620px] w-full object-cover" /></div> : null}
          <div className="mx-auto mt-12 max-w-3xl text-lg leading-9 text-black/65 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[#021024] [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#021024] [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#021024] [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-5">
            <ReactMarkdown
              components={{
                img: (props) => {
                  const { caption, ukuran } = parseAltGambar(props.alt);
                  return (
                    <img {...props} alt={caption || berita.judul} loading="lazy" className={kelasGambarInline(ukuran, "detail")} />
                  );
                },
                p: (props) => {
                  const anak = (props.node?.children?.[0] as { tagName?: string } | undefined);
                  if (props.node?.children?.length === 1 && anak?.tagName === "img") {
                    return <>{props.children}</>;
                  }
                  return <p {...props}>{props.children}</p>;
                },
                a: (props) => <a {...props} className="font-semibold text-[#2F5F8F] underline underline-offset-4" />,
              }}
            >
              {berita.konten}
            </ReactMarkdown>
            <div className="clear-both" />
          </div>
        </div>
      </main>
    );
  }
  const d = dataStatis[slug] || dataStatis['belajar-dari-dunia-industri'];
  return <main className="min-h-screen bg-[#F4F9FF] text-[#021024]"><div className="mx-auto max-w-5xl px-6 py-24"><Link href="/berita" className="text-xs text-black/45">← Semua berita</Link><p className="eyebrow mt-20 text-[#2F5F8F]">{d.date}</p><h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight sm:text-8xl">{d.title}</h1><div className="mt-12 overflow-hidden rounded-[2rem]"><img src={d.image} alt="" className="max-h-[620px] w-full object-cover" /></div><p className="mx-auto mt-12 max-w-3xl text-lg leading-9 text-black/65">{d.body}</p></div></main>;
}
