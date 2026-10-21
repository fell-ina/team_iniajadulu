import DaftarBeritaAdmin from "@/components/DaftarBeritaAdmin";

/**
 * /dashboard/berita — kelola berita (admin & guru).
 * Tombol "Tambah Berita" dan modal edit sudah ada di dalam DaftarBeritaAdmin.
 */
export const dynamic = "force-dynamic";

export default function HalamanBerita() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
            Kelola konten
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#021024] sm:text-4xl">
            Berita sekolah.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#021024]/55">
            Unggah berita baru lengkap dengan gambar, judul, subjudul, dan isi berita lewat popup
            yang sama. Semua berita yang sudah terbit tampil di bawah dan bisa diedit atau dihapus.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <DaftarBeritaAdmin />
      </div>
    </div>
  );
}
