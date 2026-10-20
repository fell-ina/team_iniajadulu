-- ============================================================================
-- 20261020000000_add_verifikasi_nisn.sql
-- ----------------------------------------------------------------------------
-- Fitur verifikasi pelajar: siswa mengirim NISN, admin/guru memverifikasi.
-- Jalankan sekali di Supabase SQL Editor (atau `supabase db push`).
-- ============================================================================

alter table public.users
  add column if not exists nisn text;

-- 'belum'        -> belum pernah mengirim NISN
-- 'menunggu'     -> sudah mengirim NISN, menunggu admin
-- 'terverifikasi'-> disetujui admin
-- 'ditolak'      -> ditolak admin (bisa kirim ulang)
alter table public.users
  add column if not exists verification_status text not null default 'belum';

alter table public.users
  add column if not exists verification_note text;

alter table public.users
  add column if not exists verification_submitted_at timestamptz;

alter table public.users
  add column if not exists verified_at timestamptz;

alter table public.users
  add column if not exists verified_by uuid;

-- Batasi nilai status agar tidak ada data aneh.
alter table public.users
  drop constraint if exists users_verification_status_check;

alter table public.users
  add constraint users_verification_status_check
  check (verification_status in ('belum', 'menunggu', 'terverifikasi', 'ditolak'));

-- Baris lama yang masih null dianggap belum mengirim.
update public.users
set verification_status = 'belum'
where verification_status is null;

-- Mempercepat daftar "menunggu verifikasi" di dashboard admin.
create index if not exists users_verification_status_idx
  on public.users (verification_status, verification_submitted_at desc);

-- Satu NISN hanya boleh dipakai satu akun (cek juga dilakukan di API).
create unique index if not exists users_nisn_unique_idx
  on public.users (nisn)
  where nisn is not null;
