

begin;
-- 1. Tipe enum
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'forum_kategori'
  ) then
    create type public.forum_kategori as enum (
      'tugas',
      'project',
      'tanya_jawab',
      'pengalaman'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'forum_laporan_status'
  ) then
    create type public.forum_laporan_status as enum (
      'pending',
      'diproses',
      'selesai',
      'ditolak'
    );
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 2. Tabel
-- ----------------------------------------------------------------------------
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

-- Jaga kompatibilitas jika tabel sudah pernah dibuat versi lama/parsial.
alter table public.forum_topik
  add column if not exists updated_at timestamptz not null default now();
alter table public.forum_topik
  add column if not exists like_count integer not null default 0;
alter table public.forum_topik
  add column if not exists balasan_count integer not null default 0;

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

alter table public.forum_balasan
  add column if not exists updated_at timestamptz not null default now();
alter table public.forum_balasan
  add column if not exists like_count integer not null default 0;

create table if not exists public.forum_like (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topik_id uuid references public.forum_topik(id) on delete cascade,
  balasan_id uuid references public.forum_balasan(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint forum_like_one_target check (
    (topik_id is not null and balasan_id is null)
    or (topik_id is null and balasan_id is not null)
  ),
  constraint forum_like_unique_topik unique (user_id, topik_id),
  constraint forum_like_unique_balasan unique (user_id, balasan_id)
);

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
    (topik_id is not null and balasan_id is null)
    or (topik_id is null and balasan_id is not null)
  )
);

alter table public.forum_laporan
  add column if not exists status public.forum_laporan_status not null default 'pending';
alter table public.forum_laporan
  add column if not exists updated_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- 3. Index untuk query forum
-- ----------------------------------------------------------------------------
create index if not exists forum_topik_kelas_idx
  on public.forum_topik (kelas, created_at desc);

create index if not exists forum_topik_kelas_kategori_idx
  on public.forum_topik (kelas, kategori, created_at desc);

create index if not exists forum_topik_penulis_idx
  on public.forum_topik (penulis_id, created_at desc);

create index if not exists forum_balasan_topik_idx
  on public.forum_balasan (topik_id, created_at asc);

create index if not exists forum_balasan_parent_idx
  on public.forum_balasan (parent_id);

create index if not exists forum_like_topik_idx
  on public.forum_like (topik_id);

create index if not exists forum_like_balasan_idx
  on public.forum_like (balasan_id);

create index if not exists forum_like_user_idx
  on public.forum_like (user_id);

create index if not exists forum_laporan_topik_idx
  on public.forum_laporan (topik_id);

create index if not exists forum_laporan_balasan_idx
  on public.forum_laporan (balasan_id);

create index if not exists forum_laporan_status_idx
  on public.forum_laporan (status, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
alter table public.forum_topik enable row level security;
alter table public.forum_balasan enable row level security;
alter table public.forum_like enable row level security;
alter table public.forum_laporan enable row level security;

-- Helper: kelas milik siswa terverifikasi yang sedang login.
-- SECURITY DEFINER supaya policy tidak ikut terblokir RLS tabel public.users.
create or replace function public.forum_current_kelas()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u.kelas
  from public.users u
  where u.id = auth.uid()
    and u.role = 'siswa'
    and u.verification_status = 'terverifikasi'
  limit 1;
$$;

-- Helper: apakah pengguna yang login adalah admin.
create or replace function public.forum_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

revoke all on function public.forum_current_kelas() from public;
revoke all on function public.forum_is_admin() from public;
grant execute on function public.forum_current_kelas() to authenticated, service_role;
grant execute on function public.forum_is_admin() to authenticated, service_role;

-- Topik
drop policy if exists "Siswa baca topik kelas sendiri" on public.forum_topik;
create policy "Siswa baca topik kelas sendiri"
  on public.forum_topik
  for select
  to authenticated
  using (kelas = public.forum_current_kelas());

drop policy if exists "Siswa buat topik kelas sendiri" on public.forum_topik;
create policy "Siswa buat topik kelas sendiri"
  on public.forum_topik
  for insert
  to authenticated
  with check (
    penulis_id = auth.uid()
    and kelas = public.forum_current_kelas()
  );

drop policy if exists "Penulis edit topik sendiri" on public.forum_topik;
create policy "Penulis edit topik sendiri"
  on public.forum_topik
  for update
  to authenticated
  using (penulis_id = auth.uid())
  with check (
    penulis_id = auth.uid()
    and kelas = public.forum_current_kelas()
  );

drop policy if exists "Penulis hapus topik sendiri" on public.forum_topik;
create policy "Penulis hapus topik sendiri"
  on public.forum_topik
  for delete
  to authenticated
  using (penulis_id = auth.uid());

-- Balasan
drop policy if exists "Siswa baca balasan kelas sendiri" on public.forum_balasan;
create policy "Siswa baca balasan kelas sendiri"
  on public.forum_balasan
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.forum_topik t
      where t.id = forum_balasan.topik_id
        and t.kelas = public.forum_current_kelas()
    )
  );

drop policy if exists "Siswa buat balasan" on public.forum_balasan;
create policy "Siswa buat balasan"
  on public.forum_balasan
  for insert
  to authenticated
  with check (
    penulis_id = auth.uid()
    and exists (
      select 1
      from public.forum_topik t
      where t.id = forum_balasan.topik_id
        and t.kelas = public.forum_current_kelas()
    )
  );

drop policy if exists "Penulis edit balasan sendiri" on public.forum_balasan;
create policy "Penulis edit balasan sendiri"
  on public.forum_balasan
  for update
  to authenticated
  using (penulis_id = auth.uid())
  with check (
    penulis_id = auth.uid()
    and exists (
      select 1
      from public.forum_topik t
      where t.id = forum_balasan.topik_id
        and t.kelas = public.forum_current_kelas()
    )
  );

drop policy if exists "Penulis hapus balasan sendiri" on public.forum_balasan;
create policy "Penulis hapus balasan sendiri"
  on public.forum_balasan
  for delete
  to authenticated
  using (penulis_id = auth.uid());

-- Like
drop policy if exists "User baca like sendiri" on public.forum_like;
create policy "User baca like sendiri"
  on public.forum_like
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "User tambah like" on public.forum_like;
create policy "User tambah like"
  on public.forum_like
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      (
        topik_id is not null
        and balasan_id is null
        and exists (
          select 1
          from public.forum_topik t
          where t.id = forum_like.topik_id
            and t.kelas = public.forum_current_kelas()
        )
      )
      or (
        balasan_id is not null
        and topik_id is null
        and exists (
          select 1
          from public.forum_balasan b
          join public.forum_topik t on t.id = b.topik_id
          where b.id = forum_like.balasan_id
            and t.kelas = public.forum_current_kelas()
        )
      )
    )
  );

drop policy if exists "User hapus like sendiri" on public.forum_like;
create policy "User hapus like sendiri"
  on public.forum_like
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Laporan
drop policy if exists "User baca laporan sendiri" on public.forum_laporan;
create policy "User baca laporan sendiri"
  on public.forum_laporan
  for select
  to authenticated
  using (user_id = auth.uid() or public.forum_is_admin());

drop policy if exists "User buat laporan" on public.forum_laporan;
create policy "User buat laporan"
  on public.forum_laporan
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      (
        topik_id is not null
        and balasan_id is null
        and exists (
          select 1
          from public.forum_topik t
          where t.id = forum_laporan.topik_id
            and t.kelas = public.forum_current_kelas()
        )
      )
      or (
        balasan_id is not null
        and topik_id is null
        and exists (
          select 1
          from public.forum_balasan b
          join public.forum_topik t on t.id = b.topik_id
          where b.id = forum_laporan.balasan_id
            and t.kelas = public.forum_current_kelas()
        )
      )
    )
  );

drop policy if exists "Admin ubah status laporan" on public.forum_laporan;
create policy "Admin ubah status laporan"
  on public.forum_laporan
  for update
  to authenticated
  using (public.forum_is_admin())
  with check (public.forum_is_admin());

-- ----------------------------------------------------------------------------
-- 5. Trigger updated_at
-- ----------------------------------------------------------------------------
create or replace function public.forum_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Jangan ubah updated_at hanya karena counter like/balasan berubah.
  if (to_jsonb(new) - 'updated_at' - 'like_count' - 'balasan_count')
     is distinct from
     (to_jsonb(old) - 'updated_at' - 'like_count' - 'balasan_count') then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Trigger penghitung like & balasan
-- ----------------------------------------------------------------------------
-- Fungsi ini sengaja SECURITY DEFINER agar update counter tetap berhasil
-- walaupun RLS forum_topik membatasi update hanya untuk penulis topik.
create or replace function public.forum_sync_like_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_topik_id uuid;
  v_balasan_id uuid;
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    v_topik_id := new.topik_id;
    v_balasan_id := new.balasan_id;
    v_delta := 1;
  else
    v_topik_id := old.topik_id;
    v_balasan_id := old.balasan_id;
    v_delta := -1;
  end if;

  if v_topik_id is not null then
    update public.forum_topik
    set like_count = greatest(like_count + v_delta, 0)
    where id = v_topik_id;
  end if;

  if v_balasan_id is not null then
    update public.forum_balasan
    set like_count = greatest(like_count + v_delta, 0)
    where id = v_balasan_id;
  end if;

  return null;
end;
$$;

create or replace function public.forum_sync_balasan_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_topik_id uuid;
  v_delta integer;
begin
  if tg_op = 'INSERT' then
    v_topik_id := new.topik_id;
    v_delta := 1;
  else
    v_topik_id := old.topik_id;
    v_delta := -1;
  end if;

  update public.forum_topik
  set balasan_count = greatest(balasan_count + v_delta, 0)
  where id = v_topik_id;

  return null;
end;
$$;

-- Bersihkan trigger versi lama (kalau migrasi ini pernah dijalankan sebagian).
drop trigger if exists forum_topik_like_count on public.forum_like;
drop trigger if exists forum_balasan_like_count on public.forum_like;
drop trigger if exists forum_balasan_count on public.forum_balasan;

drop function if exists public.forum_topik_like_trigger();
drop function if exists public.forum_balasan_like_trigger();
drop function if exists public.forum_balasan_count_trigger();
drop function if exists public.forum_increment_like_count(text, uuid, integer);
drop function if exists public.forum_increment_balasan_count(uuid, integer);

drop trigger if exists forum_like_sync_count on public.forum_like;
create trigger forum_like_sync_count
  after insert or delete on public.forum_like
  for each row
  execute function public.forum_sync_like_count();

drop trigger if exists forum_balasan_sync_count on public.forum_balasan;
create trigger forum_balasan_sync_count
  after insert or delete on public.forum_balasan
  for each row
  execute function public.forum_sync_balasan_count();

-- Lepas trigger updated_at lama sebelum backfill agar timestamp tidak berubah.
drop trigger if exists forum_topik_updated_at on public.forum_topik;
drop trigger if exists forum_balasan_updated_at on public.forum_balasan;
drop trigger if exists forum_laporan_updated_at on public.forum_laporan;

-- Samakan counter dengan data yang sudah ada (aman untuk tabel kosong).
update public.forum_topik t
set like_count = (
      select count(*)::integer
      from public.forum_like l
      where l.topik_id = t.id
    ),
    balasan_count = (
      select count(*)::integer
      from public.forum_balasan b
      where b.topik_id = t.id
    );

update public.forum_balasan b
set like_count = (
  select count(*)::integer
  from public.forum_like l
  where l.balasan_id = b.id
);

create trigger forum_topik_updated_at
  before update on public.forum_topik
  for each row
  execute function public.forum_touch_updated_at();

create trigger forum_balasan_updated_at
  before update on public.forum_balasan
  for each row
  execute function public.forum_touch_updated_at();

create trigger forum_laporan_updated_at
  before update on public.forum_laporan
  for each row
  execute function public.forum_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Hak akses
-- ----------------------------------------------------------------------------
revoke all on public.forum_topik from public, anon;
revoke all on public.forum_balasan from public, anon;
revoke all on public.forum_like from public, anon;
revoke all on public.forum_laporan from public, anon;

grant select, insert, update, delete on public.forum_topik to authenticated;
grant select, insert, update, delete on public.forum_balasan to authenticated;
grant select, insert, delete on public.forum_like to authenticated;
grant select, insert, update on public.forum_laporan to authenticated;

grant all on public.forum_topik to service_role;
grant all on public.forum_balasan to service_role;
grant all on public.forum_like to service_role;
grant all on public.forum_laporan to service_role;

-- Supabase/PostgREST: muat ulang cache skema agar tabel langsung dikenali.
notify pgrst, 'reload schema';

commit;
