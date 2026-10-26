-- ============================================================================
-- 20261026000000_add_forum_tables.sql
-- ----------------------------------------------------------------------------
-- Tabel untuk Forum Siswa: topik, balasan, like, laporan
-- Jalankan sekali di Supabase SQL Editor (atau `supabase db push`).
-- ============================================================================

-- Enum untuk kategori topik
create type public.forum_kategori as enum (
  'tugas',
  'project', 
  'tanya_jawab',
  'pengalaman'
);

-- Enum untuk status laporan
create type public.forum_laporan_status as enum (
  'pending',
  'diproses',
  'selesai',
  'ditolak'
);

-- Tabel topik diskusi
create table if not exists public.forum_topik (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  konten text not null,
  kategori public.forum_kategori not null,
  kelas text not null check (kelas in ('X', 'XI', 'XII')),
  penulis_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  like_count integer not null default 0,
  balasan_count integer not null default 0
);

-- Index untuk query umum
create index if not exists forum_topik_kelas_idx on public.forum_topik (kelas, created_at desc);
create index if not exists forum_topik_penulis_idx on public.forum_topik (penulis_id, created_at desc);
create index if not exists forum_topik_kategori_idx on public.forum_topik (kelas, kategori, created_at desc);

-- Tabel balasan
create table if not exists public.forum_balasan (
  id uuid primary key default gen_random_uuid(),
  topik_id uuid not null references public.forum_topik(id) on delete cascade,
  parent_id uuid references public.forum_balasan(id) on delete cascade,
  konten text not null,
  penulis_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  like_count integer not null default 0
);

create index if not exists forum_balasan_topik_idx on public.forum_balasan (topik_id, created_at asc);
create index if not exists forum_balasan_parent_idx on public.forum_balasan (parent_id);

-- Tabel like (untuk topik dan balasan)
create table if not exists public.forum_like (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topik_id uuid references public.forum_topik(id) on delete cascade,
  balasan_id uuid references public.forum_balasan(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint forum_like_one_target check (
    (topik_id is not null and balasan_id is null) or 
    (topik_id is null and balasan_id is not null)
  ),
  constraint forum_like_unique_topik unique (user_id, topik_id),
  constraint forum_like_unique_balasan unique (user_id, balasan_id)
);

create index if not exists forum_like_topik_idx on public.forum_like (topik_id);
create index if not exists forum_like_balasan_idx on public.forum_like (balasan_id);
create index if not exists forum_like_user_idx on public.forum_like (user_id);

-- Tabel laporan
create table if not exists public.forum_laporan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topik_id uuid references public.forum_topik(id) on delete cascade,
  balasan_id uuid references public.forum_balasan(id) on delete cascade,
  alasan text not null,
  status public.forum_laporan_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forum_laporan_one_target check (
    (topik_id is not null and balasan_id is null) or 
    (topik_id is null and balasan_id is not null)
  )
);

create index if not exists forum_laporan_topik_idx on public.forum_laporan (topik_id);
create index if not exists forum_laporan_balasan_idx on public.forum_laporan (balasan_id);
create index if not exists forum_laporan_status_idx on public.forum_laporan (status);

-- RLS Policies
alter table public.forum_topik enable row level security;
alter table public.forum_balasan enable row level security;
alter table public.forum_like enable row level security;
alter table public.forum_laporan enable row level security;

-- Semua siswa terverifikasi bisa baca topik di kelasnya
create policy "Siswa baca topik kelas sendiri" on public.forum_topik
  for select using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.kelas = forum_topik.kelas
      and users.verification_status = 'terverifikasi'
      and users.role = 'siswa'
    )
  );

-- Siswa terverifikasi bisa buat topik di kelasnya
create policy "Siswa buat topik kelas sendiri" on public.forum_topik
  for insert with check (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.kelas = forum_topik.kelas
      and users.verification_status = 'terverifikasi'
      and users.role = 'siswa'
    )
    and penulis_id = auth.uid()
  );

-- Penulis bisa edit/hapus topik sendiri
create policy "Penulis edit topik sendiri" on public.forum_topik
  for update using (penulis_id = auth.uid())
  with check (penulis_id = auth.uid());

create policy "Penulis hapus topik sendiri" on public.forum_topik
  for delete using (penulis_id = auth.uid());

-- Semua siswa terverifikasi bisa baca balasan di kelasnya
create policy "Siswa baca balasan kelas sendiri" on public.forum_balasan
  for select using (
    exists (
      select 1 from public.forum_topik ft
      join public.users u on u.id = auth.uid()
      where ft.id = forum_balasan.topik_id
      and ft.kelas = u.kelas
      and u.verification_status = 'terverifikasi'
      and u.role = 'siswa'
    )
  );

-- Siswa terverifikasi bisa buat balasan
create policy "Siswa buat balasan" on public.forum_balasan
  for insert with check (
    exists (
      select 1 from public.forum_topik ft
      join public.users u on u.id = auth.uid()
      where ft.id = forum_balasan.topik_id
      and ft.kelas = u.kelas
      and u.verification_status = 'terverifikasi'
      and u.role = 'siswa'
    )
    and penulis_id = auth.uid()
  );

-- Penulis bisa edit/hapus balasan sendiri
create policy "Penulis edit balasan sendiri" on public.forum_balasan
  for update using (penulis_id = auth.uid())
  with check (penulis_id = auth.uid());

create policy "Penulis hapus balasan sendiri" on public.forum_balasan
  for delete using (penulis_id = auth.uid());

-- Like: user bisa baca/tambah/hapus like miliknya
create policy "User baca like sendiri" on public.forum_like
  for select using (user_id = auth.uid());

create policy "User tambah like" on public.forum_like
  for insert with check (user_id = auth.uid());

create policy "User hapus like sendiri" on public.forum_like
  for delete using (user_id = auth.uid());

-- Laporan: user bisa baca/buat laporan miliknya, admin bisa baca semua
create policy "User baca laporan sendiri" on public.forum_laporan
  for select using (user_id = auth.uid());

create policy "User buat laporan" on public.forum_laporan
  for insert with check (user_id = auth.uid());

-- Trigger untuk update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists forum_topik_updated_at on public.forum_topik;
create trigger forum_topik_updated_at
  before update on public.forum_topik
  for each row execute function public.update_updated_at();

drop trigger if exists forum_balasan_updated_at on public.forum_balasan;
create trigger forum_balasan_updated_at
  before update on public.forum_balasan
  for each row execute function public.update_updated_at();

drop trigger if exists forum_laporan_updated_at on public.forum_laporan;
create trigger forum_laporan_updated_at
  before update on public.forum_laporan
  for each row execute function public.update_updated_at();

-- Fungsi untuk increment/decrement counter like
create or replace function public.forum_increment_like_count(target_table text, target_id uuid, delta int)
returns void language plpgsql as $$
begin
  execute format('update %s set like_count = like_count + %s where id = $1', target_table, delta)
  using target_id;
end $$;

-- Fungsi untuk increment/decrement counter balasan
create or replace function public.forum_increment_balasan_count(topik_id uuid, delta int)
returns void language plpgsql as $$
begin
  update public.forum_topik
  set balasan_count = balasan_count + delta
  where id = topik_id;
end $$;

-- Trigger untuk like count pada topik
create or replace function public.forum_topik_like_trigger()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    perform public.forum_increment_like_count('public.forum_topik', NEW.topik_id, 1);
  elsif TG_OP = 'DELETE' then
    perform public.forum_increment_like_count('public.forum_topik', OLD.topik_id, -1);
  end if;
  return NEW;
end $$;

drop trigger if exists forum_topik_like_count on public.forum_like;
create trigger forum_topik_like_count
  after insert or delete on public.forum_like
  for each row
  when (pg_trigger_depth() = 0 and NEW.topik_id is not null)
  execute function public.forum_topik_like_trigger();

-- Trigger untuk like count pada balasan
create or replace function public.forum_balasan_like_trigger()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    perform public.forum_increment_like_count('public.forum_balasan', NEW.balasan_id, 1);
  elsif TG_OP = 'DELETE' then
    perform public.forum_increment_like_count('public.forum_balasan', OLD.balasan_id, -1);
  end if;
  return NEW;
end $$;

drop trigger if exists forum_balasan_like_count on public.forum_like;
create trigger forum_balasan_like_count
  after insert or delete on public.forum_like
  for each row
  when (pg_trigger_depth() = 0 and NEW.balasan_id is not null)
  execute function public.forum_balasan_like_trigger();

-- Trigger untuk balasan count pada topik
create or replace function public.forum_balasan_count_trigger()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    perform public.forum_increment_balasan_count(NEW.topik_id, 1);
  elsif TG_OP = 'DELETE' then
    perform public.forum_increment_balasan_count(OLD.topik_id, -1);
  end if;
  return NEW;
end $$;

drop trigger if exists forum_balasan_count on public.forum_balasan;
create trigger forum_balasan_count
  after insert or delete on public.forum_balasan
  for each row
  when (pg_trigger_depth() = 0)
  execute function public.forum_balasan_count_trigger();

-- Grant permissions
grant select, insert, update, delete on public.forum_topik to authenticated;
grant select, insert, update, delete on public.forum_balasan to authenticated;
grant select, insert, delete on public.forum_like to authenticated;
grant select, insert on public.forum_laporan to authenticated;