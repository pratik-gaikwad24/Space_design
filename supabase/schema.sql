-- =====================================================================
-- SPACE DESIGN — Supabase schema
-- Architects | Planners | Interior Designers | Project Management Consultant
--
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query.
-- It is idempotent where practical (safe to re-run for policies/buckets).
--
-- Contents
--   0. Extensions & private schema
--   1. Tables (profiles, projects, project_media, services, locations,
--      contact_submissions, site_settings)
--   2. Relationships & indexes
--   3. Triggers (updated_at, enquiry hardening, rate limiting)
--   4. Admin role helper (is_admin)
--   5. Row Level Security policies
--   6. Storage buckets & storage policies
--   7. Seed data (ONLY factual business data supplied by the client)
--   8. Admin user setup (manual step — see bottom of file)
--
-- No fake portfolio projects are inserted.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions & private schema
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- "private" is NOT exposed through the Data API (only "public" is by default).
create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- 1.1 Profiles: one row per authorised back-office user.
-- There is NO public sign-up. Rows are created manually (see section 8).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at  timestamptz not null default now()
);

-- 1.2 Projects
create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 1 and 200),
  slug               text not null unique
                       check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 120),
  subtitle           text check (char_length(subtitle) <= 300),
  category           text check (char_length(category) <= 80),        -- Architecture / Planning / Interior Design / Project Management
  project_type       text check (char_length(project_type) <= 80),    -- Residential / Commercial / Institutional / Hospitality
  location           text check (char_length(location) <= 160),
  year               text check (char_length(year) <= 20),            -- text so "2019–2021" or "Ongoing" is allowed
  area               text check (char_length(area) <= 80),
  status             text check (char_length(status) <= 80),          -- e.g. Completed / Under construction / Concept
  client             text check (char_length(client) <= 160),
  services           text[] not null default '{}',
  short_description  text check (char_length(short_description) <= 600),
  description        text check (char_length(description) <= 12000),
  concept            text check (char_length(concept) <= 8000),
  design_approach    text check (char_length(design_approach) <= 8000),
  details            text check (char_length(details) <= 8000),
  featured_media_id  uuid,
  featured_video_id  uuid,
  featured           boolean not null default false,
  published          boolean not null default false,
  sort_order         integer not null default 0,
  seo_title          text check (char_length(seo_title) <= 70),
  seo_description    text check (char_length(seo_description) <= 170),
  og_image           text check (char_length(og_image) <= 1000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 1.3 Project media (images, videos, drawings, plans)
create table if not exists public.project_media (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  media_type    text not null check (media_type in ('image', 'video', 'drawing', 'plan')),
  media_url     text not null check (char_length(media_url) <= 1000),
  bucket        text check (char_length(bucket) <= 64),
  storage_path  text check (char_length(storage_path) <= 500),
  poster_url    text check (char_length(poster_url) <= 1000),
  poster_path   text check (char_length(poster_path) <= 500),
  captions_url  text check (char_length(captions_url) <= 1000),   -- WebVTT subtitles for videos
  captions_path text check (char_length(captions_path) <= 500),
  mime_type     text check (char_length(mime_type) <= 100),
  width         integer,
  height        integer,
  alt_text      text check (char_length(alt_text) <= 300),
  caption       text check (char_length(caption) <= 500),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- 1.4 Services
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  number       text,
  title        text not null check (char_length(title) <= 120),
  summary      text check (char_length(summary) <= 600),
  description  text check (char_length(description) <= 6000),
  process      jsonb not null default '[]'::jsonb,   -- [{ "title": "...", "text": "..." }]
  category_key text,                                 -- matches projects.category for "related projects"
  image_url    text,
  image_alt    text check (char_length(image_alt) <= 300),
  sort_order   integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 1.5 Locations (offices)
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label       text not null,                -- e.g. "Head Office"
  city        text not null,
  address     text not null,
  phones      text[] not null default '{}',
  mobiles     text[] not null default '{}',
  emails      text[] not null default '{}',
  map_url     text,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1.6 Contact submissions (enquiries) — data minimisation: only what is needed to reply.
create table if not exists public.contact_submissions (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 2 and 120),
  email         text not null check (char_length(email) <= 254
                   and email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  phone         text not null check (phone ~ '^\+?[0-9 ()\-]{7,20}$'),
  project_type  text check (char_length(project_type) <= 80),
  location      text check (char_length(location) <= 120),
  message       text not null check (char_length(btrim(message)) between 10 and 3000),
  consent       boolean not null check (consent = true),
  consent_text  text check (char_length(consent_text) <= 300),
  status        text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at    timestamptz not null default now()
);

-- 1.7 Site settings (key/value). is_public controls anonymous read access.
create table if not exists public.site_settings (
  key         text primary key check (key ~ '^[a-z0-9_\.]+$'),
  value       jsonb not null default '{}'::jsonb,
  is_public   boolean not null default true,
  description text,
  updated_at  timestamptz not null default now()
);

-- 1.8 Private rate-limit log for the contact form (not exposed via API).
create table if not exists private.contact_rate_limits (
  id          bigint generated always as identity primary key,
  ip_hash     text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Relationships & indexes
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'projects_featured_media_fk') then
    alter table public.projects
      add constraint projects_featured_media_fk
      foreign key (featured_media_id) references public.project_media (id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_featured_video_fk') then
    alter table public.projects
      add constraint projects_featured_video_fk
      foreign key (featured_video_id) references public.project_media (id) on delete set null;
  end if;
end $$;

create index if not exists projects_slug_idx       on public.projects (slug);
create index if not exists projects_published_idx  on public.projects (published);
create index if not exists projects_featured_idx   on public.projects (featured) where featured;
create index if not exists projects_category_idx   on public.projects (category);
create index if not exists projects_location_idx   on public.projects (location);
create index if not exists projects_year_idx       on public.projects (year);
create index if not exists projects_sort_idx       on public.projects (sort_order, created_at desc);
create index if not exists project_media_project_idx on public.project_media (project_id, sort_order);
create index if not exists contact_submissions_created_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx  on public.contact_submissions (status);
create index if not exists contact_rate_limits_idx on private.contact_rate_limits (ip_hash, created_at);

-- ---------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------

-- 3.1 updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists locations_updated_at on public.locations;
create trigger locations_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- 3.2 Enquiry hardening + server-side rate limiting.
-- Runs as SECURITY DEFINER so it can write to the private rate-limit table.
create or replace function private.guard_contact_submission()
returns trigger
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  headers   json;
  client_ip text;
  ip_digest text;
  recent_ip int;
  recent_em int;
begin
  -- Normalise & force server-controlled fields (the public cannot set these).
  new.name         := btrim(new.name);
  new.email        := lower(btrim(new.email));
  new.phone        := btrim(new.phone);
  new.project_type := nullif(btrim(coalesce(new.project_type, '')), '');
  new.location     := nullif(btrim(coalesce(new.location, '')), '');
  new.message      := btrim(new.message);
  new.status       := 'new';
  new.created_at   := now();

  -- Reject obvious link spam (more than 3 URLs in the message).
  if (select count(*) from regexp_matches(new.message, 'https?://', 'gi')) > 3 then
    raise exception 'submission_rejected' using errcode = 'P0001';
  end if;

  -- Rate limit by hashed IP (raw IP is never stored).
  begin
    headers := current_setting('request.headers', true)::json;
  exception when others then
    headers := null;
  end;
  client_ip := split_part(coalesce(headers ->> 'x-forwarded-for', headers ->> 'x-real-ip', 'unknown'), ',', 1);
  ip_digest := encode(extensions.digest(btrim(client_ip) || ':space-design-enquiry', 'sha256'), 'hex');

  select count(*) into recent_ip
    from private.contact_rate_limits
   where ip_hash = ip_digest and created_at > now() - interval '1 hour';
  if recent_ip >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select count(*) into recent_em
    from public.contact_submissions
   where email = new.email and created_at > now() - interval '24 hours';
  if recent_em >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into private.contact_rate_limits (ip_hash) values (ip_digest);
  delete from private.contact_rate_limits where created_at < now() - interval '2 days';

  return new;
end $$;

drop trigger if exists contact_submissions_guard on public.contact_submissions;
create trigger contact_submissions_guard before insert on public.contact_submissions
  for each row execute function private.guard_contact_submission();

-- ---------------------------------------------------------------------
-- 4. Admin role helper
-- ---------------------------------------------------------------------
-- SECURITY DEFINER so policies can read profiles without recursive RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.project_media       enable row level security;
alter table public.services            enable row level security;
alter table public.locations           enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.site_settings       enable row level security;

-- Profiles: a signed-in user may read their own row; admins may read all.
-- No insert/update/delete policies → roles can only be changed via SQL editor / service role.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Projects
drop policy if exists "projects_public_read_published" on public.projects;
create policy "projects_public_read_published" on public.projects
  for select to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists "projects_admin_insert" on public.projects;
create policy "projects_admin_insert" on public.projects
  for insert to authenticated with check (public.is_admin());

drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects
  for delete to authenticated using (public.is_admin());

-- Project media: public can read media only of published projects.
drop policy if exists "media_public_read_published" on public.project_media;
create policy "media_public_read_published" on public.project_media
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.projects p where p.id = project_id and p.published = true)
  );

drop policy if exists "media_admin_insert" on public.project_media;
create policy "media_admin_insert" on public.project_media
  for insert to authenticated with check (public.is_admin());

drop policy if exists "media_admin_update" on public.project_media;
create policy "media_admin_update" on public.project_media
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media_admin_delete" on public.project_media;
create policy "media_admin_delete" on public.project_media
  for delete to authenticated using (public.is_admin());

-- Services
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select to anon, authenticated using (published = true or public.is_admin());

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Locations
drop policy if exists "locations_public_read" on public.locations;
create policy "locations_public_read" on public.locations
  for select to anon, authenticated using (published = true or public.is_admin());

drop policy if exists "locations_admin_write" on public.locations;
create policy "locations_admin_write" on public.locations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Site settings
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings
  for select to anon, authenticated using (is_public = true or public.is_admin());

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contact submissions: anyone may INSERT (consent required); only admins may read/update/delete.
drop policy if exists "enquiries_public_insert" on public.contact_submissions;
create policy "enquiries_public_insert" on public.contact_submissions
  for insert to anon, authenticated
  with check (consent = true);

drop policy if exists "enquiries_admin_select" on public.contact_submissions;
create policy "enquiries_admin_select" on public.contact_submissions
  for select to authenticated using (public.is_admin());

drop policy if exists "enquiries_admin_update" on public.contact_submissions;
create policy "enquiries_admin_update" on public.contact_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enquiries_admin_delete" on public.contact_submissions;
create policy "enquiries_admin_delete" on public.contact_submissions
  for delete to authenticated using (public.is_admin());

-- Defence in depth: the anonymous role never needs to read or change enquiries.
revoke select, update, delete on public.contact_submissions from anon;

-- ---------------------------------------------------------------------
-- 6. Storage buckets & policies
-- ---------------------------------------------------------------------
-- Buckets are PUBLIC-READ (files are served by public URL for fast delivery),
-- but listing, uploading, replacing and deleting are restricted to admins.
-- NOTE: a public bucket means a file's URL works even while its project is
-- unpublished. Do not upload confidential material.
-- File size limits must not exceed your project's global upload limit
-- (Free plan: 50 MB). Raise both in Dashboard → Storage → Settings if needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('portfolio-images',   'portfolio-images',   true, 15728640,
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('portfolio-videos',   'portfolio-videos',   true, 52428800,
     array['video/mp4','video/webm','text/vtt']),
  ('portfolio-drawings', 'portfolio-drawings', true, 26214400,
     array['image/jpeg','image/png','image/webp','application/pdf']),
  ('site-media',         'site-media',         true, 52428800,
     array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No public SELECT policy on storage.objects → anonymous users cannot LIST buckets.
-- Public files remain reachable via /storage/v1/object/public/<bucket>/<path>.
drop policy if exists "sd_admin_select_media" on storage.objects;
create policy "sd_admin_select_media" on storage.objects
  for select to authenticated
  using (bucket_id in ('portfolio-images','portfolio-videos','portfolio-drawings','site-media') and public.is_admin());

drop policy if exists "sd_admin_insert_media" on storage.objects;
create policy "sd_admin_insert_media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('portfolio-images','portfolio-videos','portfolio-drawings','site-media') and public.is_admin());

drop policy if exists "sd_admin_update_media" on storage.objects;
create policy "sd_admin_update_media" on storage.objects
  for update to authenticated
  using (bucket_id in ('portfolio-images','portfolio-videos','portfolio-drawings','site-media') and public.is_admin())
  with check (bucket_id in ('portfolio-images','portfolio-videos','portfolio-drawings','site-media') and public.is_admin());

drop policy if exists "sd_admin_delete_media" on storage.objects;
create policy "sd_admin_delete_media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('portfolio-images','portfolio-videos','portfolio-drawings','site-media') and public.is_admin());

-- ---------------------------------------------------------------------
-- 7. Seed data — factual business information supplied by the client only.
-- ---------------------------------------------------------------------
insert into public.locations (slug, label, city, address, phones, mobiles, emails, map_url, sort_order) values
  ('navi-mumbai', 'Head Office', 'Navi Mumbai',
   E'Office No. 1101 & 1108, 11th Floor, Satra Plaza,\nPlot No. 19 & 20, Palm Beach Road,\nSector – 19D, Vashi,\nNavi Mumbai – 400 703',
   array['022-46043901','022-45003902'],
   array['9833175033','9869076963'],
   array['spacedesign@rediffmail.com','spacedesign1108@gmail.com'],
   'https://www.google.com/maps/search/?api=1&query=Satra+Plaza+Palm+Beach+Road+Sector+19D+Vashi+Navi+Mumbai+400703',
   1),
  ('pune', 'Branch Office', 'Pune',
   E'Office No. 504, 5th Floor, "Conclave",\nCTS No. 1701/B, F.P. No. 100,\nBhamburda, Shivaji Nagar,\nPune – 411 005',
   array['020-29910526'],
   array['9833175033'],
   array['spacedesign504@gmail.com'],
   'https://www.google.com/maps/search/?api=1&query=Conclave+Shivaji+Nagar+Pune+411005',
   2)
on conflict (slug) do nothing;

insert into public.services (slug, number, title, summary, category_key, sort_order, process) values
  ('project-management', '01', 'Redevelopment PMC',
   'Independent project management consultancy for housing societies, from the first feasibility study to handover.',
   'Redevelopment', 1,
   '[{"title": "Society appointment", "text": "Society appoints PMC for redevelopment guidance."}, {"title": "Property study & feasibility", "text": "Land potential, FSI, rules and project feasibility."}, {"title": "Member consultation", "text": "Benefits and requirements explained; member inputs collected."}, {"title": "Tender & developer selection", "text": "Offers invited, proposals compared, developer selected."}, {"title": "Agreement & approvals", "text": "Legal documentation, planning and government approvals."}, {"title": "Project monitoring", "text": "Quality, timelines, construction progress and transparency."}, {"title": "Handover & completion", "text": "Possession, amenities and completion for society members."}]'),
  ('architecture', '02', 'Architecture',
   'Architecture for redevelopment and new buildings, with smart, efficient and affordable space planning.',
   'Redevelopment', 2,
   '[{"title": "Brief", "text": "Requirements, plot, FSI and applicable rules."}, {"title": "Planning", "text": "Efficient layouts for rehab and sale tenements."}, {"title": "Approvals", "text": "Drawings for planning and municipal approvals."}, {"title": "Execution", "text": "Working drawings and site supervision."}]'),
  ('planning', '03', 'Planning',
   'MHADA layout planning and layout revisions for large housing schemes.',
   'Layout Planning', 3,
   '[{"title": "Study", "text": "Existing layout, land areas and site conditions."}, {"title": "Framework", "text": "Residential, commercial, amenity and open-space areas."}, {"title": "Layout", "text": "Plots, roads and circulation."}, {"title": "Documentation", "text": "Area statements and drawings for approval."}]'),
  ('interior-design', '04', 'Interior Design',
   'Interiors that bring together space, light, material and detail.',
   'Interior Design', 4,
   '[{"title": "Brief", "text": "Needs, use patterns and character of the space."}, {"title": "Layout", "text": "Space planning and furniture arrangement."}, {"title": "Materials", "text": "Finishes, lighting and detailing."}, {"title": "Execution", "text": "Coordination on site through completion."}]')
on conflict (slug) do nothing;

insert into public.site_settings (key, value, is_public, description) values
  ('business', '{"name":"Space Design","tagline":"Architects | Planners | Interior Designers | Project Management Consultant","principal":"Milind Fulzele","principal_title":"Architect","experience_years":30}', true,
   'Core business entity information used across the site.'),
  ('home_hero', '{"image_url":"","image_alt":"","video_url":"","poster_url":""}', true,
   'Optional home hero media. Leave empty to use the default illustration. Video is never autoplayed on mobile, reduced-motion or data-saver.'),
  ('seo_pages', '{}', true,
   'Optional per-page SEO overrides: {"home":{"title":"","description":""}, "about":{...}}. Static HTML values remain the crawler default.'),
  ('enquiry_retention_days', '365', false,
   'How long enquiries are kept before the admin should delete them (shown in the admin; deletion is manual).')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 8. ADMIN USER SETUP (manual — run AFTER creating the user)
-- ---------------------------------------------------------------------
-- 1) Dashboard → Authentication → Sign In / Providers → Email:
--      turn OFF "Allow new users to sign up".
-- 2) Dashboard → Authentication → Users → "Add user" → "Create new user"
--      enter email + strong password, tick "Auto confirm user".
-- 3) Then run (replace the email):
--
-- insert into public.profiles (id, full_name, role)
-- select id, 'Site Administrator', 'admin'
--   from auth.users
--  where email = 'admin@example.com'
-- on conflict (id) do update set role = 'admin';
--
-- To revoke access:
-- update public.profiles set role = 'viewer' where id = (select id from auth.users where email = 'admin@example.com');
-- =====================================================================
