-- =====================================================================
-- SPACE DESIGN — seed projects from the company profile (July 2026)
-- Run AFTER schema.sql (SQL Editor → New query → paste → Run).
-- Images are served from the website itself (assets/img/projects/).
-- Safe to re-run: existing slugs are skipped.
-- Generated from js/projects-data.js — edit there, then regenerate,
-- or manage projects in the admin after seeding.
-- =====================================================================

do $$
declare pid uuid; mid uuid;
begin
  if not exists (select 1 from public.projects where slug = 'tagore-nagar-building-18') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Building No. 18, Tagore Nagar', 'tagore-nagar-building-18', 'Three-wing redevelopment with a parking tower', 'Redevelopment', 'Residential', 'Tagore Nagar, Vikhroli, Mumbai', null,
      '1,241.53 sq m plot', 'Proposed', 'Nalanda Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Proposed redevelopment of Building No. 18, Tagore Nagar, Vikhroli: three wings of ground plus 22 upper floors with a parking tower.',
      'Proposed redevelopment of Building No. 18, Tagore Nagar, Vikhroli, for Nalanda Co-operative Housing Society Ltd. The scheme provides three wings of ground plus 22 upper floors, planned for maximum consumption of FSI, with a parking tower.',
      'Developer: M/s Haware Properties
Plot area: 1,241.53 sq m
FSI (including fungible): 8.46
Tenements: 32 rehab + 217 sale
Building: Wing A, Wing B and Wing C, each ground + 22 upper floors
Building with parking tower; maximum consumption of FSI
12 tenements per floor
Units: 1 BHK 375.00 sq ft · 2 BHK 650.00 sq ft',
      true, true, 10)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/tagore-nagar-building-18.webp', 'Rendering of a residential tower with angular facade, Building No. 18, Tagore Nagar, Vikhroli', 'Architectural rendering', 532, 900, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'pragati-icon') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Pragati Icon', 'pragati-icon', 'Redevelopment of Building No. 33, Pant Nagar', 'Redevelopment', 'Residential', 'Pant Nagar, Ghatkopar, Mumbai', null,
      '852.50 sq m plot', 'Completed', 'Gulmohar Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Redevelopment of Building No. 33, Pant Nagar, Ghatkopar: 79 tenements in a ground, stilt and 16-storey RCC building.',
      'Pragati Icon is the redevelopment of Building No. 33, Pant Nagar, Ghatkopar, for Gulmohar Co-operative Housing Society Ltd.',
      'Plot area: 852.50 sq m
FSI: 6.51
Tenements: 30 rehab + 49 sale (79)
Building: ground (part) + stilt + 16 upper floors
Structure: RCC
5 tenements per floor
Units (RCA): 2 BHK 584.00 sq ft · 2 BHK 895.00 sq ft · 3 BHK 674.00 sq ft',
      true, true, 20)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/pragati-icon.webp', 'Rendering of Pragati Icon, a residential tower with timber-toned balconies, Pant Nagar, Ghatkopar', 'Architectural rendering', 639, 928, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'haware-legacy') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Haware Legacy', 'haware-legacy', 'Redevelopment of Building No. 16, Dindoshi', 'Redevelopment', 'Residential', 'Dindoshi, Malad, Mumbai', null,
      '703.25 sq m plot', 'Completed', 'Abhishek Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Redevelopment of Building No. 16, Dindoshi, Malad: 110 tenements in a ground, stilt and 22-storey RCC tower.',
      'Haware Legacy is the redevelopment of Building No. 16, Dindoshi, Malad, for Abhishek Co-operative Housing Society Ltd.',
      'Plot area: 703.25 sq m
FSI: 7.97
Tenements: 40 rehab + 70 sale (110)
Building: ground (part) + stilt + 22 upper floors
Structure: RCC
5 tenements per floor
Units: 1 BHK 370.00 sq ft · 1 BHK 395.00 sq ft',
      true, true, 30)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/haware-legacy.webp', 'Rendering of Haware Legacy, a slender residential tower with curved balconies, Dindoshi, Malad', 'Architectural rendering', 519, 976, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'pant-nagar-building-3') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Building No. 3, Pant Nagar', 'pant-nagar-building-3', 'Mixed-use redevelopment with shops and a parking tower', 'Redevelopment', 'Residential', 'Pant Nagar, Ghatkopar, Mumbai', null,
      '1,089.33 sq m plot', 'Ongoing', 'Shree Sai Prasad Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Ongoing redevelopment of Building No. 3, Pant Nagar, Ghatkopar: shops on the first floor and 94 tenements above.',
      'Proposed redevelopment of Building No. 3, Pant Nagar, Ghatkopar, for Shree Sai Prasad Co-operative Housing Society Ltd., planned for maximum consumption of FSI with a parking tower.',
      'Developer: M/s Vardhman Developers
Plot area: 1,089.33 sq m
FSI (including fungible): 5.95
Tenements: 30 rehab + 64 sale (94)
Building: ground + 1st floor shops + 2nd to 15th upper floors
Structure: RCC
Building with parking tower; maximum consumption of FSI
7 tenements per floor
Units: 1 BHK 473.00 sq ft · 2 BHK 620.00 sq ft · 2 BHK 630.00 sq ft',
      true, true, 40)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/pant-nagar-building-3.webp', 'Rendering of a residential tower with flowing gold-toned bands, Building No. 3, Pant Nagar, Ghatkopar', 'Architectural rendering', 617, 970, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'maharshi-nagar-colony-pune') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Maharshi Nagar Colony, Pune', 'maharshi-nagar-colony-pune', 'MHADA layout planning', 'Layout Planning', 'Housing Layout', 'Maharshi Nagar, Pune', null,
      '33,834.38 sq m plot', 'Ongoing', null, array['Planning']::text[],
      'Revision of the MHADA layout at Maharshi Nagar, Pune: residential, commercial, amenity and recreational plots across a 33,834 sq m site.',
      'Space Design is the MHADA layout architect for Maharshi Nagar, Pune, and is revising the colony layout.',
      'Plot area: 33,834.38 sq m
Net plot area: 30,068.24 sq m
Road area: 5,657.37 sq m
Residential plot area: 9,532.71 sq m
Recreational ground (RG): 2,556.58 sq m
Commercial plot area: 4,317.49 sq m
Amenity: 1,696.82 sq m
Shop area: 209.36 sq m',
      true, true, 50)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'plan', '/assets/img/projects/maharshi-nagar-layout.webp', 'Layout plan of Maharshi Nagar Colony, Pune, showing building blocks and roads', 'Layout plan', 1600, 1200, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'tagore-nagar-building-17') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Building No. 17, Tagore Nagar', 'tagore-nagar-building-17', 'Redevelopment with a parking tower', 'Redevelopment', 'Residential', 'Tagore Nagar, Vikhroli, Mumbai', null,
      '832.50 sq m plot', 'Ongoing', 'Nandadeep Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Ongoing redevelopment of Building No. 17, Tagore Nagar, Vikhroli: 128 tenements in a 22-storey RCC tower with a parking tower.',
      'Proposed redevelopment of Building No. 17, Tagore Nagar, Vikhroli, for Nandadeep Co-operative Housing Society Ltd., planned for maximum consumption of FSI with a parking tower.',
      'Developer: M/s Priti Infra Builders LLP
Plot area: 832.50 sq m
FSI (including fungible): 8.57
Tenements: 32 rehab + 96 sale (128)
Building: ground (part) + stilt (part) + 22 upper floors
Structure: RCC
Building with parking tower; maximum consumption of FSI
6 tenements per floor
Units (RCA): 1 BHK 409.00 sq ft · 1 BHK 443.00 sq ft · 2 BHK 508.00 sq ft · 2 BHK 587.00 sq ft · 2 BHK 608.00 sq ft',
      true, true, 60)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/tagore-nagar-building-17.webp', 'Rendering of a residential tower with a commercial podium, Building No. 17, Tagore Nagar, Vikhroli', 'Architectural rendering', 565, 1047, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'pragati-reventa') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Pragati Reventa', 'pragati-reventa', 'Redevelopment of Building No. 48, Pant Nagar', 'Redevelopment', 'Residential', 'Pant Nagar, Ghatkopar, Mumbai', null,
      '867.00 sq m plot', 'Completed', 'Sindhudurga Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Redevelopment of Building No. 48, Pant Nagar, Ghatkopar: 79 tenements in a 16-storey RCC building.',
      'Pragati Reventa is the redevelopment of Building No. 48, Pant Nagar, Ghatkopar, for Sindhudurga Co-operative Housing Society Ltd.',
      'Plot area: 867.00 sq m
FSI (including fungible): 6.51
Tenements: 30 rehab + 49 sale (79)
Building: ground (part) + stilt (part) + 16 upper floors
Structure: RCC
6 tenements per floor
Units (RCA): 1 BHK 369.00 sq ft · 1 BHK 541.00 sq ft · 2 BHK 719.00 sq ft · 2 BHK 657.00 sq ft · 2 BHK 574.00 sq ft',
      false, true, 70)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/pragati-reventa.webp', 'Rendering of Pragati Reventa, a pale residential tower, Pant Nagar, Ghatkopar', 'Architectural rendering', 565, 940, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'tagore-nagar-building-38') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Building No. 38, Tagore Nagar', 'tagore-nagar-building-38', 'Redevelopment for V.P. Realty', 'Redevelopment', 'Residential', 'Tagore Nagar, Vikhroli, Mumbai', null,
      '1,058.29 sq m plot', 'Completed', 'Shree Dhanlaxmi Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Redevelopment of Building No. 38, Tagore Nagar, Vikhroli: 171 tenements in a 30-storey RCC tower.',
      'Redevelopment of Building No. 38, Tagore Nagar, Vikhroli, for Shree Dhanlaxmi Co-operative Housing Society Ltd., with V.P. Realty as developer.',
      'Developer: M/s V.P. Realty
Plot area: 1,058.29 sq m
FSI: 8.66
Tenements: 32 rehab + 139 sale (171)
Building: ground + 1st to 30th upper floors
Structure: RCC
6 tenements per floor
Units (RCA): 1 BHK 399.00 sq ft · 1 BHK 376.00 sq ft · 1 BHK 470.00 sq ft · 2 BHK 575.00 sq ft · 2 BHK 595.00 sq ft',
      false, true, 80)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/vp-realty-tagore-nagar.webp', 'Rendering of a 30-storey residential tower, Building No. 38, Tagore Nagar, Vikhroli', 'Architectural rendering', 763, 1320, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'kannamwar-nagar-building-80') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Building No. 80, Kannamwar Nagar', 'kannamwar-nagar-building-80', 'Redevelopment with a commercial ground floor', 'Redevelopment', 'Residential', 'Kannamwar Nagar, Vikhroli, Mumbai', null,
      '771.81 sq m plot', 'Ongoing', 'Sai Ganesh Co-op. Hsg. Soc. Ltd.', '{}'::text[],
      'Ongoing redevelopment of Building No. 80, Kannamwar Nagar, Vikhroli: 126 tenements above a commercial ground floor.',
      'Proposed redevelopment of Building No. 80, Kannamwar Nagar, Vikhroli, for Sai Ganesh Co-operative Housing Society Ltd., planned for maximum consumption of FSI with a parking tower.',
      'Developer: M/s Vardhman Developers
Plot area: 771.81 sq m
FSI (including fungible): 7.13
Tenements: 32 rehab + 94 sale (126)
Building: ground (commercial) + 1st to 22nd upper floors
Structure: RCC
Building with parking tower; maximum consumption of FSI
6 tenements per floor
Units: 1 BHK 375.00 sq ft · 1 BHK 387.00 sq ft · 2 BHK 586.00 sq ft',
      false, true, 90)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'image', '/assets/img/projects/kannamwar-nagar-building-80.webp', 'Rendering of a residential tower, Building No. 80, Kannamwar Nagar, Vikhroli', 'Architectural rendering', 639, 1008, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'saint-tukaram-nagar-pune') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Saint Tukaram Nagar, Pune', 'saint-tukaram-nagar-pune', 'MHADA layout planning', 'Layout Planning', 'Housing Layout', 'Saint Tukaram Nagar, Pune', null,
      '40.50 ha', null, null, array['Planning']::text[],
      'MHADA layout at Saint Tukaram Nagar, Pune: a 40.5-hectare scheme of residential, commercial, amenity and open-space areas.',
      'Space Design is the MHADA layout architect for Saint Tukaram Nagar, Pune.',
      'Total area of land: 40.50 ha
Net area under scheme: 35.5307 ha
Area under residence: 19.3021 ha
Area under amenity: 4.8990 ha
Area under open space: 2.3556 ha
Area under commercial: 1.2837 ha
Area under DP road: 5.2966 ha
Area under scheme road: 7.6483 ha',
      false, true, 100)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'plan', '/assets/img/projects/saint-tukaram-nagar-layout.webp', 'Existing layout plan of Saint Tukaram Nagar, Pune, with open spaces, schools and commercial plots', 'Layout plan', 1600, 1200, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
  if not exists (select 1 from public.projects where slug = 'titwala-layout-kalyan') then
    insert into public.projects (title, slug, subtitle, category, project_type, location, year, area, status, client, services,
      short_description, description, details, featured, published, sort_order)
    values ('Titwala Layout, Kalyan', 'titwala-layout-kalyan', 'MHADA layout planning', 'Layout Planning', 'Housing Layout', 'Titwala, Kalyan', null,
      '11.6701 ha housing scheme', 'Ongoing', null, array['Planning']::text[],
      'Revision of the MHADA layout at Titwala, Kalyan: an 11.67-hectare housing scheme with roads, open space, a primary school and commercial complex.',
      'Space Design is the MHADA layout architect for the Titwala layout and is revising it.',
      'Area under housing scheme: 11.6701 ha
Area under residence: 7.5906 ha
Area under scheme road: 1.9480 ha
Area under open space: 1.2459 ha
Area under commercial complex: 0.6367 ha
Area under primary school: 0.2509 ha',
      false, true, 110)
    returning id into pid;
    insert into public.project_media (project_id, media_type, media_url, alt_text, caption, width, height, mime_type, sort_order)
    values (pid, 'plan', '/assets/img/projects/titwala-layout.webp', 'Layout plan of the Titwala housing scheme, Kalyan, with plots, roads and a nalla', 'Layout plan', 1600, 1200, 'image/webp', 10)
    returning id into mid;
    update public.projects set featured_media_id = mid where id = pid;
  end if;
end $$;
