import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  GraduationCap,
  Newspaper,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ambilProfilDashboard, buatAdmin } from "@/lib/dashboard";

/**
 * /dashboard — ringkasan untuk admin & guru.
 * Detail pekerjaan ada di halaman masing-masing lewat sidebar.
 */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profil = await ambilProfilDashboard();

  if (!profil) {
    redirect("/login?alasan=tidak-ada-session");
  }

  const admin = buatAdmin();

  const [hasilPengguna, hasilMenunggu, hasilBerita, hasilSiswa] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }),
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "menunggu"),
    admin.from("berita").select("id", { count: "exact", head: true }),
    admin.from("users").select("id", { count: "exact", head: true }).eq("role", "siswa"),
  ]);

  const totalPengguna = hasilPengguna.error ? 0 : hasilPengguna.count ?? 0;
  const menungguNisn = hasilMenunggu.error ? 0 : hasilMenunggu.count ?? 0;
  const totalBerita = hasilBerita.error ? 0 : hasilBerita.count ?? 0;
  const totalSiswa = hasilSiswa.error ? 0 : hasilSiswa.count ?? 0;

  const adalahAdmin = profil.role === "admin";
  const inisial = (profil.nama ?? profil.email ?? "A").trim().charAt(0).toUpperCase() || "A";

  const kartu: {
    href: string;
    label: string;
    nilai: number;
    satuan: string;
    ikon: typeof Users;
    catatan: string;
  }[] = [];

  if (adalahAdmin) {
    kartu.push({
      href: "/dashboard/pengguna",
      label: "Data pengguna",
      nilai: totalPengguna,
      satuan: "akun terdaftar",
      ikon: Users,
      catatan: `${totalSiswa} siswa`,
    });
  }

  kartu.push(
    {
      href: "/dashboard/verifikasi",
      label: "Verifikasi NISN",
      nilai: menungguNisn,
      satuan: "menunggu keputusan",
      ikon: ShieldCheck,
      catatan: menungguNisn > 0 ? "Perlu ditinjau" : "Semua beres",
    },
    {
      href: "/dashboard/berita",
      label: "Berita",
      nilai: totalBerita,
      satuan: "berita terbit",
      ikon: Newspaper,
      catatan: "Tambah / edit lewat popup",
    }
  );

  const panduan: { ikon: typeof Users; judul: string; isi: string }[] = [
    ...(adalahAdmin
      ? [
          {
            ikon: GraduationCap,
            judul: "Naikkan kelas",
            isi: "Di Data Pengguna, centang siswa lalu klik Naikkan kelas. X menjadi XI, XI menjadi XII; XII dilewati.",
          },
        ]
      : []),
    {
      ikon: ShieldCheck,
      judul: "Verifikasi NISN",
      isi: "Tinjau pengajuan NISN siswa di halaman Verifikasi NISN. Keputusan langsung tersimpan.",
    },
    {
      ikon: Newspaper,
      judul: "Tulis berita",
      isi: "Halaman Berita memakai popup yang sama: unggah gambar, tulis judul, subjudul, dan isi.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Sambutan */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#052659] px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[#5483B3]/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-10 size-64 rounded-full bg-[#7DA0CA]/20 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start gap-5">
          <Image
            src="/images/school/logo-transparent.png"
            alt="Logo SMK Telekomunikasi Tunas Harapan"
            width={56}
            height={56}
            className="rounded-full bg-white p-1.5 shadow-sm"
            priority
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#C1E8FF]/70">
              Selamat datang kembali
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Halo, {profil.nama ?? inisial}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#C1E8FF]/70">
              Anda masuk sebagai{" "}
              <strong className="capitalize text-white">{profil.role ?? "pengguna"}</strong>.
              Pilih menu di sidebar untuk mengelola pengguna, memverifikasi NISN, atau menulis
              berita sekolah.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#C1E8FF] transition hover:bg-white/20 hover:text-white"
          >
            Lihat situs
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>

      {/* Pintasan */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
              Ringkasan
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#021024]">
              Kondisi hari ini
            </h2>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {kartu.map(({ href, label, nilai, satuan, ikon: Ikon, catatan }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-3xl border border-[#021024]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#5483B3]/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#052659] text-[#C1E8FF]">
                  <Ikon size={18} />
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-[#021024]/25 transition group-hover:text-[#2F5F8F]"
                />
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums text-[#021024]">{nilai}</p>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#021024]/45">
                {satuan}
              </p>
              <p className="mt-3 border-t border-[#021024]/8 pt-3 text-sm font-semibold text-[#052659]">
                {label}
                <span className="ml-2 font-normal text-[#021024]/45">{catatan}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Panduan singkat */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {panduan.map(({ ikon: Ikon, judul, isi }) => (
          <div
            key={judul}
            className="rounded-3xl border border-[#021024]/10 bg-white/70 p-5"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#E4F3FF] text-[#052659]">
              <Ikon size={16} />
            </span>
            <h3 className="mt-3 text-base font-bold text-[#021024]">{judul}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#021024]/55">{isi}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
