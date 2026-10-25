-- ============================================================================
-- 20261025000001_add_spmb_status.sql
-- ----------------------------------------------------------------------------
-- Status seleksi pendaftar SPMB / PPDB yang dipakai panel /dashboard/spmb:
--   menunggu  -> belum diputuskan (bawaan)
--   diterima  -> diterima panitia
--   ditolak   -> tidak diterima
--
-- Hanya ditulis lewat POST /api/admin/spmb (service role), jadi RLS pada tabel
-- tetap tanpa policy. Jalankan sekali di Supabase SQL Editor (atau
-- `supabase db push`).
-- ============================================================================

alter table public.spmb_pendaftar
  add column if not exists status text not null default 'menunggu';

-- Kapan keputusan terakhir diambil (null selama masih menunggu).
alter table public.spmb_pendaftar
  add column if not exists status_diubah_at timestamptz;

alter table public.spmb_pendaftar
  drop constraint if exists spmb_pendaftar_status_check;

alter table public.spmb_pendaftar
  add constraint spmb_pendaftar_status_check
  check (status in ('menunggu', 'diterima', 'ditolak'));

-- Menyaring "menunggu" / "diterima" / "ditolak" di panel admin.
create index if not exists spmb_pendaftar_status_idx
  on public.spmb_pendaftar (status, created_at desc);
