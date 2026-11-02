-- =====================================================================
-- SPACE DESIGN — projects database (Supabase)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: it only creates what is missing and resets the policies.
--
-- What it sets up
--   1. public.projects        one row per project (shown on the website)
--   2. public.admins          which login accounts may edit projects
--   3. Row Level Security     visitors read published projects only;
--                             only admins can add, edit or delete
--   4. Storage bucket         'project-images' for uploaded photos/plans
--
-- After running it, load the starting projects with seed-projects.sql,
-- then make your login an admin (step 5 at the bottom of this file).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title             text not null check (char_length(title) between 2 and 160),
  subtitle          text check (char_length(subtitle) <= 300),
  category          text check (char_length(category) <= 80),     -- Redevelopment, Self-Redevelopment, Development, Architecture, Planning, Interior Design
  project_type      text check (char_length(project_type) <= 80), -- e.g. Residential, Housing Layout
  status            text check (char_length(status) <= 40),       -- e.g. Completed, Ongoing, Proposed
  location          text check (char_length(location) <= 160),
  area              text check (char_length(area) <= 120),
  client            text check (char_length(client) <= 200),      -- the housing society
  short_description text check (char_length(short_description) <= 600),
  description       text check (char_length(description) <= 6000),
  details           text check (char_length(details) <= 6000),    -- one fact per line, "Label: value"
  images            jsonb not null default '[]'::jsonb             -- [{ url, kind: image|plan, alt, width, height }]
                    check (jsonb_typeof(images) = 'array'),
  featured          boolean not null default false,
  sort_order        integer not null default 100,
  published         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists projects_published_order_idx on public.projects (published, sort_order, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. Admins (accounts allowed to edit projects)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- True when the signed-in user is an admin. SECURITY DEFINER so the check
-- works inside policies without exposing the admins table.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.admins   enable row level security;

drop policy if exists "projects: read published"  on public.projects;
drop policy if exists "projects: admin insert"    on public.projects;
drop policy if exists "projects: admin update"    on public.projects;
drop policy if exists "projects: admin delete"    on public.projects;
drop policy if exists "admins: read own row"      on public.admins;

-- Anyone can read published projects; admins also see hidden (draft) ones.
create policy "projects: read published" on public.projects
  for select to anon, authenticated
  using (published or public.is_admin());

create policy "projects: admin insert" on public.projects
  for insert to authenticated with check (public.is_admin());

create policy "projects: admin update" on public.projects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "projects: admin delete" on public.projects
  for delete to authenticated using (public.is_admin());

-- A signed-in user can see only their own admin row (used by the admin page
-- to check access). There are no write policies: admins are added in SQL only.
create policy "admins: read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant select on public.admins to authenticated;

-- ---------------------------------------------------------------------
-- 4. Storage: project images (public to view, admins to change)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project-images: admin insert" on storage.objects;
drop policy if exists "project-images: admin update" on storage.objects;
drop policy if exists "project-images: admin delete" on storage.objects;

create policy "project-images: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images' and public.is_admin());

create policy "project-images: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images' and public.is_admin())
  with check (bucket_id = 'project-images' and public.is_admin());

create policy "project-images: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- 5. Make your login an admin
--    First create the user in Authentication → Users → Add user
--    (tick "Auto confirm user"), then put that email below and run
--    just this statement. Repeat for each person who should edit projects.
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'admin@example.com'
-- on conflict do nothing;
