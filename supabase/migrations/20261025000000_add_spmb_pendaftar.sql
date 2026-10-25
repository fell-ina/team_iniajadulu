-- ============================================================================
-- 20261025000000_add_spmb_pendaftar.sql
-- ----------------------------------------------------------------------------
-- Tabel pendaftar SPMB / PPDB mandiri (pengganti Google Form sekolah).
--
-- Diisi hanya lewat POST /api/spmb yang memakai service role, jadi RLS
-- diaktifkan tanpa policy: anon & authenticated tidak bisa membaca atau
-- menulis langsung. Jalankan sekali di Supabase SQL Editor (atau
-- `supabase db push`).
-- ============================================================================

create table if not exists public.spmb_pendaftar (
  id uuid primary key default gen_random_uuid(),

  -- Data calon siswa
  nama text not null,
  email text not null,
  jenis_kelamin text not null,
  tempat_lahir text not null,
  tanggal_lahir date not null,

  -- Asal sekolah & kontak
  asal_sekolah text not null,
  alamat text not null,
  no_hp text not null,

  -- Dua pilihan jurusan (tidak boleh sama)
  jurusan_1 text not null,
  jurusan_2 text not null,

  -- Orang tua / wali
  nama_wali text not null,
  no_hp_wali text not null,

  created_at timestamptz not null default now(),

  constraint spmb_pendaftar_jenis_kelamin_check
    check (jenis_kelamin in ('laki-laki', 'perempuan')),
  constraint spmb_pendaftar_jurusan_1_check
    check (jurusan_1 in ('PPLG', 'TJKT', 'DKV', 'TKR')),
  constraint spmb_pendaftar_jurusan_2_check
    check (jurusan_2 in ('PPLG', 'TJKT', 'DKV', 'TKR')),
  constraint spmb_pendaftar_jurusan_beda_check
    check (jurusan_1 <> jurusan_2),
  constraint spmb_pendaftar_nama_check
    check (char_length(nama) between 2 and 120),
  constraint spmb_pendaftar_email_check
    check (char_length(email) between 3 and 254),
  constraint spmb_pendaftar_no_hp_check
    check (no_hp ~ '^08[0-9]{8,12}$'),
  constraint spmb_pendaftar_no_hp_wali_check
    check (no_hp_wali ~ '^08[0-9]{8,12}$')
);

-- Satu email hanya boleh dipakai untuk satu pendaftaran (tidak peduli besar
-- kecil hurufnya). Ini juga mencegah kiriman ganda saat tombol ditekan dua kali.
create unique index if not exists spmb_pendaftar_email_key
  on public.spmb_pendaftar (lower(email));

-- Daftar terbaru di panel admin nanti.
create index if not exists spmb_pendaftar_created_at_idx
  on public.spmb_pendaftar (created_at desc);

-- Rekap peminat per jurusan.
create index if not exists spmb_pendaftar_jurusan_idx
  on public.spmb_pendaftar (jurusan_1, jurusan_2);

alter table public.spmb_pendaftar enable row level security;
