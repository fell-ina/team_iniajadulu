-- Forum guru ---------------------------------------------------------------
-- Topik siswa menyimpan kelasnya di forum_topik.kelas ("X" | "XI" | "XII").
-- Forum guru tidak terikat kelas, jadi kolom itu harus boleh NULL. Kategori
-- guru juga ditambahkan ke enum forum_kategori yang sudah ada.
--
-- Jalankan sekali di Supabase SQL Editor (atau lewat CLI) sebelum memakai
-- tombol "Mulai diskusi" di /forum-guru.

alter table public.forum_topik alter column kelas drop not null;

alter table public.forum_topik drop constraint if exists forum_topik_kelas_check;
alter table public.forum_topik
  add constraint forum_topik_kelas_check
  check (kelas is null or kelas in ('X', 'XI', 'XII'));

alter type public.forum_kategori add value if not exists 'kurikulum';
alter type public.forum_kategori add value if not exists 'kesiswaan';
alter type public.forum_kategori add value if not exists 'teknologi';
alter type public.forum_kategori add value if not exists 'berbagi_praktik';
