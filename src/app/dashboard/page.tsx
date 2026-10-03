import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import TombolTambahBerita from "@/components/TombolTambahBerita";
import DaftarBeritaAdmin from "@/components/DaftarBeritaAdmin";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // abaikan
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?alasan=tidak-ada-session");
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profil } = await admin
    .from("users")
    .select("role, nama")
    .eq("id", user.id)
    .maybeSingle();

  const role = profil?.role;

  if (role !== "admin" && role !== "guru") {
    redirect("/?alasan=role-ditolak");
  }

  const inisial = (profil?.nama ?? "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <main className="min-h-dvh bg-[#F4F9FF]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#021024]/10 bg-[#F4F9FF]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Image
            src="/images/school/logo-transparent.png"
            alt="Logo SMK Telekomunikasi Tunas Harapan"
            width={40}
            height={40}
            className="rounded-full bg-white p-1 shadow-sm"
            priority
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-[#021024]">
              Tunas Harapan
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[.18em] text-[#2F5F8F]/70">
              Dashboard Admin &amp; Guru
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-full border border-[#021024]/12 bg-white px-4 py-2 text-xs font-semibold text-[#021024]/70 transition hover:bg-[#021024]/5 sm:inline-block"
            >
              ← Lihat situs
            </Link>
            <span
              title={profil?.nama ?? user.email ?? ""}
              className="grid size-9 place-items-center rounded-full bg-[#052659] text-sm font-bold text-[#C1E8FF]"
            >
              {inisial}
            </span>
            <TombolTambahBerita />
          </div>
        </div>
      </header>

      {/* Hero sambutan */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#052659] px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[#5483B3]/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-10 size-64 rounded-full bg-[#7DA0CA]/20 blur-3xl"
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#C1E8FF]/70">
              Selamat datang kembali
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              {profil?.nama ? `Halo, ${profil.nama}.` : "Halo."}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#C1E8FF]/70">
              Anda masuk sebagai <strong className="capitalize text-white">{role}</strong>.
              Kelola berita sekolah di bawah ini — unggah gambar sampul, tulis{" "}
              <strong className="text-white">judul</strong>,{" "}
              <strong className="text-white">subjudul</strong>, dan{" "}
              <strong className="text-white">isi berita</strong>, lalu edit atau hapus kapan pun.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              {["1. Upload gambar", "2. Tulis judul + subjudul", "3. Tulis isi berita", "4. Edit / hapus"].map(
                (langkah) => (
                  <span
                    key={langkah}
                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[#C1E8FF]"
                  >
                    {langkah}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Daftar berita */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#2F5F8F]/70">
              Kelola konten
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#021024] sm:text-3xl">
              Berita yang sudah diunggah
            </h2>
          </div>
        </div>
        <DaftarBeritaAdmin />
      </section>
    </main>
  );
}
