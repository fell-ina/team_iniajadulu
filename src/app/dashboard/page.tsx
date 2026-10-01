import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import TombolTambahBerita from "@/components/TombolTambahBerita";

/**
 * app/dashboard/page.tsx
 * ---------------------------------------------------------------------------
 * Halaman dashboard untuk pengguna dengan peran (role) 'admin' atau 'guru'.
 *
 * Halaman ini adalah Server Component. Alurnya:
 *   1. Baca cookie session Supabase yang ditulis oleh app/api/auth/login/route.ts
 *      (client anon + cookie, hanya untuk mengenali siapa user-nya)
 *   2. Ambil kolom 'role' dan 'nama' dari tabel 'users' memakai client
 *      service role (tanpa cookie) supaya tidak terhalang RLS
 *   3. Jika belum login -> /login. Jika role bukan 'admin'/'guru' -> /
 *   4. Tampilkan dashboard dengan tombol "Tambah Berita" di kanan atas
 *
 * Tabel 'berita' di Supabase (jalankan di SQL Editor Supabase sekali saja):
 *
 *   create table public.berita (
 *     id uuid primary key default gen_random_uuid(),
 *     judul text not null,
 *     konten text not null,
 *     penulis_id uuid references auth.users(id) on delete set null,
 *     created_at timestamptz not null default now()
 *   );
 *
 *   alter table public.berita enable row level security;
 *
 *   create policy "Berita bisa dibaca semua orang"
 *     on public.berita for select
 *     using (true);
 *
 * Catatan: penulisan baris (insert) TIDAK diberi policy supaya hanya bisa
 * dilakukan lewat server ini (route handler) yang memakai service role key.
 * ---------------------------------------------------------------------------
 */

export default async function DashboardPage() {
  // 1. Client session (anon key + cookie): hanya untuk mengenali user -------
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Di Server Component cookie tidak boleh ditulis saat render;
            // abaikan saja.
          }
        },
      },
    }
  );

  // 2. Ambil user yang sedang login -----------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?alasan=tidak-ada-session");
  }

  // 3. Ambil role & nama dengan client service role (tanpa cookie) ----------
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

  // Hanya admin dan guru yang boleh masuk.
  if (role !== "admin" && role !== "guru") {
    redirect("/?alasan=role-ditolak");
  }

  // 4. Tampilkan dashboard ---------------------------------------------------
  return (
    <main className="min-h-dvh bg-[var(--pale)]">
      {/* ---------- Navigasi atas ---------- */}
      {/* CATATAN: backdrop-blur TIDAK boleh dipasang langsung di <header>.
          backdrop-filter membuat elemen menjadi "containing block" bagi
          anak ber-position:fixed, sehingga pop-up "Tambah Berita" terjebak
          di dalam tinggi header. Latar blur dipisah ke layer sendiri di bawah. */}
      <header className="sticky top-0 z-40 border-b border-[#021024]/10">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[var(--pale)]/85 backdrop-blur-xl"
        />
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Image
            src="/images/school/logo-transparent.png"
            alt="Logo SMK Telekomunikasi Tunas Harapan"
            width={40}
            height={40}
            className="rounded-full bg-white/90 p-1"
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

          {/* Tombol "Tambah Berita" di kanan atas */}
          <div className="ml-auto">
            <TombolTambahBerita />
          </div>
        </div>
      </header>

      {/* ---------- Isi dashboard ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow text-[#2F5F8F]/70">Selamat datang kembali</p>
        <h1 className="display mt-3 text-4xl text-[#021024] sm:text-5xl">
          {profil?.nama ? `Halo, ${profil.nama}.` : "Halo."}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#021024]/60">
          Anda masuk sebagai <strong className="capitalize">{role}</strong>.
          Gunakan tombol <strong>Tambah Berita</strong> di kanan atas untuk
          mengunggah pengumuman atau kabar terbaru sekolah.
        </p>
      </section>
    </main>
  );
}
