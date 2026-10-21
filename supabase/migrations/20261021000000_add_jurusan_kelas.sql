-- ============================================================================
-- 20261021000000_add_jurusan_kelas.sql
-- ----------------------------------------------------------------------------
-- Siswa wajib memilih jurusan (PPLG / TJKT / DKV / TKR) dan kelas (X / XI / XII)
-- setelah membuat akun, sebelum kode verifikasi email dikirim.
-- Jalankan sekali di Supabase SQL Editor (atau `supabase db push`).
-- ============================================================================

alter table public.users
  add column if not exists jurusan text;

alter table public.users
  add column if not exists kelas text;

-- Hanya empat jurusan dan tiga tingkat yang boleh tersimpan.
alter table public.users
  drop constraint if exists users_jurusan_check;

alter table public.users
  add constraint users_jurusan_check
  check (jurusan is null or jurusan in ('PPLG', 'TJKT', 'DKV', 'TKR'));

alter table public.users
  drop constraint if exists users_kelas_check;

alter table public.users
  add constraint users_kelas_check
  check (kelas is null or kelas in ('X', 'XI', 'XII'));

-- Mempermudah rekap "siswa per jurusan / per tingkat" nanti.
create index if not exists users_jurusan_kelas_idx
  on public.users (jurusan, kelas);
