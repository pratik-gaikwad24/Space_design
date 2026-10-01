# Space Design: website and portfolio CMS

Website for **Space Design**: Architects · Planners · Interior Designers · Project Management Consultant.
Principal Architect: **Milind Fulzele**. 30 years of experience. Offices in **Navi Mumbai** and **Pune**.

- **Frontend:** raw HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step, no Node backend.
- **Backend:** Supabase (PostgreSQL, Auth, Storage) through the Supabase JS client, served from this site (`js/vendor/supabase.js`, v2.117.2).
- **Fonts:** Inter Tight + Instrument Serif, self-hosted in `assets/fonts/` (SIL Open Font License; no Google Fonts requests).
- **Hosting:** any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 and others).

> **Status:** the code is complete. Before it goes live it needs the Supabase project, real photography, the `[CLIENT TO PROVIDE]` items and a legal review. See §23.

---

## Contents
1. [Project setup](#1-project-setup)
2. [Folder structure](#2-folder-structure)
3. [Supabase project creation](#3-supabase-project-creation)
4. [Supabase URL setup](#4-supabase-url-setup)
5. [Anon key setup](#5-anon-key-setup)
6. [Database SQL](#6-database-sql)
7. [Row Level Security](#7-row-level-security-rls)
8. [Storage buckets](#8-storage-buckets)
9. [Storage policies](#9-storage-policies)
10. [Admin user setup](#10-admin-user-setup)
11. [Admin role setup](#11-admin-role-setup)
12. [Portfolio management](#12-portfolio-management)
13. [Image uploads](#13-image-uploads)
14. [Video uploads](#14-video-uploads)
15. [SEO editing](#15-seo-editing)
16. [Contact enquiries](#16-contact-enquiries)
17. [Cookie preferences](#17-cookie-preferences)
18. [Analytics configuration](#18-analytics-configuration)
19. [Deployment](#19-deployment)
20. [Domain configuration](#20-domain-configuration)
21. [Sitemap submission](#21-sitemap-submission)
22. [Security checklist](#22-security-checklist)
23. [Production checklist](#23-production-checklist)

---

## 1. Project setup

You don't need to install anything. To preview locally, serve the folder over HTTP. Opening files directly with `file://` breaks some browser features.

```bash
cd space_design
python -m http.server 8080        # or: npx serve .
# open http://localhost:8080
```

Until Supabase is configured, the site shows the **11 real projects from the company profile**, built into `js/projects-data.js` (renders and layout plans in `assets/img/projects/`). Once Supabase is connected, projects come from the database instead; `supabase/seed-projects.sql` loads the same 11 projects there (§6).
- The contact form validates, but it tells the visitor to email or call instead of submitting.
- The admin shows a "Supabase is not configured" notice.

## 2. Folder structure

```
space_design/
├── index.html               Home
├── about.html               About
├── services.html            Services
├── portfolio.html           Portfolio (dynamic, filters + search)
├── portfolio-detail.html    Project detail (?slug=…)
├── contact.html             Contact + enquiry form
├── privacy-policy.html  terms.html  cookie-policy.html  refund-policy.html  accessibility.html
├── 404.html
├── admin/
│   ├── login.html  dashboard.html  projects.html  project-editor.html
│   ├── media.html  enquiries.html  services.html  locations.html  settings.html
│   └── index.html           → redirects to dashboard
├── css/
│   ├── style.css            design system + public styles
│   ├── responsive.css       1920 / 1440 / 1024 / 768 / 430 / 390 / 375 compositions
│   ├── accessibility.css    focus, reduced motion, forced colours, contrast
│   └── admin.css            CMS styles
├── js/
│   ├── boot.js              sets .js class (sync, in <head>)
│   ├── config.js            PUBLIC config: Supabase URL + anon key, analytics switch
│   ├── vendor/supabase.js   Supabase JS client (self-hosted)
│   ├── supabase.js          client + data-access layer (SD.api)
│   ├── utils.js             escaping, URL safety, shared renderers
│   ├── projects-data.js     built-in projects from the company profile (used until Supabase is connected)
│   ├── seo.js               meta updates + reusable JSON-LD builders
│   ├── cookie-consent.js    consent banner/preferences (inactive until analytics is enabled)
│   ├── navigation.js        header, progress bar, accessible mobile menu
│   ├── main.js              reveal animations, lazy video, cursor label
│   ├── home.js  portfolio.js  project-detail.js  contact.js  services.js
│   ├── auth.js              admin sign-in + guard
│   ├── admin.js             admin shell, dashboard, projects list, media library, settings
│   ├── project-editor.js    project editor + media manager
│   ├── enquiries.js  locations.js
├── assets/
│   ├── icons/favicon.svg
│   └── img/og-default.jpg (+ .svg source), placeholders/*.svg (illustrations, replace)
├── partials/                header.html, footer.html, scripts.html (shared markup source)
├── tools/sync-partials.py   optional: re-applies partials to every page
├── supabase/schema.sql      tables, indexes, triggers, RLS, storage policies, seed data
├── _headers  vercel.json    security headers for Netlify/Cloudflare and Vercel
├── robots.txt  sitemap.xml  .env.example  README.md
```

**Shared header and footer:** every page contains the header, footer and script tags as plain HTML between `<!-- PARTIAL:… -->` markers. That keeps them crawlable and working without JavaScript. To change them, edit `partials/*.html` and run `python tools/sync-partials.py`. You can also edit each page by hand.

## 3. Supabase project creation

1. Sign in at <https://supabase.com> and click **New project**.
2. **Region:** choose the region closest to your users. Mumbai (`ap-south-1`) is the natural choice for India. Put the region in the Privacy Notice ("Where data is stored").
3. Set a strong database password and store it in a password manager. The website never needs it.

## 4. Supabase URL setup

1. Go to **Project Settings → Data API** and copy the **Project URL** (`https://<ref>.supabase.co`).
2. Paste it into `js/config.js` → `SUPABASE_URL`.

## 5. Anon key setup

1. Go to **Project Settings → API Keys** and copy the **anon / publishable** key.
2. Paste it into `js/config.js` → `SUPABASE_ANON_KEY`.

The anon key is **meant to be public**: Row Level Security decides what it can do. **Never** put the `service_role` or secret key, or the database password, in any file in this project. The site does not need them. `.env.example` documents the variables. Static hosting cannot read `.env`, which is why the public values go in `config.js`.

## 6. Database SQL

1. Go to **SQL Editor → New query**.
2. Paste the whole of `supabase/schema.sql` and click **Run**.

The script creates:
- **Tables:** `profiles`, `projects`, `project_media`, `services`, `locations`, `contact_submissions`, `site_settings`, plus `private.contact_rate_limits`.
- **Relationships:** `project_media.project_id → projects` (cascade delete); `projects.featured_media_id` and `featured_video_id → project_media` (set null on delete).
- **Indexes:** `projects.slug`, `published`, `featured`, `category`, `location`, `year`; `project_media.project_id`; `contact_submissions.created_at`.
- **Triggers:** `updated_at` timestamps; an enquiry guard that normalises input, forces `status='new'`, rejects link spam and rate-limits by hashed IP (5/hour) and by email (3/day).
- **Seed data:** only facts you supplied: the two offices, the four services and default settings. **No portfolio projects are inserted.**

**Then load the projects:** paste and run `supabase/seed-projects.sql`. It inserts the 11 projects from the company profile (skipping any slug that already exists), with their images served from `assets/img/projects/`.

The script is safe to re-run: it uses `if not exists` and drops and recreates policies. It was syntax-checked with PostgreSQL's parser (libpg_query) but has **not** yet been run against a live Supabase project, so run it on a fresh project first and check for errors.

## 7. Row Level Security (RLS)

RLS is enabled on every public table. Summary:

| Table | Public (anon) | Admin |
|---|---|---|
| projects | SELECT where `published = true` | full CRUD |
| project_media | SELECT if its project is published | full CRUD |
| services / locations | SELECT where `published = true` | full CRUD |
| site_settings | SELECT where `is_public = true` | full CRUD |
| contact_submissions | **INSERT only** (consent must be true); no SELECT/UPDATE/DELETE | SELECT / UPDATE / DELETE |
| profiles | none | read own / all (roles cannot be changed through the API) |

"Admin" means a signed-in user whose `profiles.role = 'admin'`, checked by the `public.is_admin()` security-definer function. Hiding things in the browser is only a convenience; **the database enforces access**.

To check, sign out and run this in the browser console on the site:
`await SD.db.from('contact_submissions').select('*')` → returns no rows or an error.

## 8. Storage buckets

`schema.sql` creates these buckets. They are public-read, admin-write.

| Bucket | Allowed types | Size limit |
|---|---|---|
| `portfolio-images` | JPEG, PNG, WebP, AVIF (also video posters) | 15 MB |
| `portfolio-videos` | MP4, WebM, WebVTT captions | 50 MB |
| `portfolio-drawings` | JPEG, PNG, WebP, PDF | 25 MB |
| `site-media` | images + MP4/WebM (home hero) | 50 MB |

The Free plan caps any single upload at **50 MB** globally. To allow larger videos, raise the limit in **Storage → Settings** and in the bucket, and update `LIMITS` in `js/project-editor.js`. For long films, compress them (H.264 MP4, around 1080p, 4–8 Mbps) before uploading.

## 9. Storage policies

The policies on `storage.objects`, created by `schema.sql`, let **only admins** list, upload, update and delete in the four buckets. Visitors cannot list bucket contents; they can only fetch files by their public URL. Because the buckets are public, a file's URL works even while its project is unpublished, so never upload confidential material.

## 10. Admin user setup

There is **no public sign-up**.

1. Go to **Authentication → Sign In / Providers → Email** and **turn off "Allow new users to sign up"**. Keep email + password enabled.
2. Go to **Authentication → Users → Add user → Create new user**. Enter the email and a strong password (12+ characters) and tick **Auto confirm user**.
3. Under **Authentication → URL Configuration**, set **Site URL** to your production domain.

## 11. Admin role setup

A new user is **not** an admin until you grant the role. In the SQL Editor:

```sql
insert into public.profiles (id, full_name, role)
select id, 'Site Administrator', 'admin' from auth.users where email = 'admin@example.com'
on conflict (id) do update set role = 'admin';
```

To revoke access: `update public.profiles set role = 'viewer' where id = (select id from auth.users where email = '…');`
Sign in at `/admin/login.html`. Signed-in users without the admin role are signed out straight away.
**Password changes:** go to Admin → Settings → Change password. For a forgotten password, send a reset from **Authentication → Users → ⋯ → Send password recovery**.

## 12. Portfolio management

Go to **Admin → Projects**.
- **New project:** enter the title (the slug is generated automatically and can be edited), category, type, location, year, area, status, client, services, descriptions, concept, design approach and details. Only fill in facts you can verify, because empty fields are hidden on the site.
- **Save** first, then the **Media** panel appears.
- **Publish / Unpublish** and **Feature / Unfeature** are available in the editor sidebar and in the project list. Featured, published projects appear in "Selected work" on the home page, in an editorial rhythm of five.
- **Sort order:** lower numbers show first.
- **Delete** removes the project, its media rows **and** its stored files.
- Filters on the Portfolio page are built from the categories and types actually in use.

## 13. Image uploads

In the editor's **Media** panel:
1. Choose **Images**, **Drawings** or **Plans**, select files (multiple allowed) or drag them in, then click **Upload**.
2. **Optimise to WebP** is on by default. JPEG and PNG files are resized to a maximum of 2400 px and converted to WebP in the browser. The original is kept if WebP would be larger.
3. The first image becomes the **cover** automatically. Use **Set as cover** to change it.
4. For every item, add **alt text** (a factual description, e.g. "Residential building exterior in Pune") and an optional **caption**, then click **Save text**. Items without alt text are flagged, and publishing asks for confirmation if any are missing.
5. **↑ / ↓** reorder items (the order is saved immediately). **Replace file** swaps the file in place. **Delete** removes the row and the stored file.
6. PDFs uploaded as drawings or plans appear as "Open PDF" cards; image drawings open in the accessible lightbox.

**Remaining placeholder:** only the Interior Design service still uses an illustration (`assets/img/placeholders/interiors.svg`, tagged "replace with interior photography") on the home and services pages. Replace it with interior photography and delete the matching `<span class="demo-tag">`. The home hero can be changed from **Admin → Settings → Home hero** without editing code.

**Tall renders and plans:** portrait images (towers) are shown whole on a sky gradient, and plans/drawings whole on white, instead of being cropped (`SD.utils.fitClass`). Photographs fill their frame as normal.

## 14. Video uploads

1. In **Media**, choose **Videos** (MP4 or WebM, up to 50 MB by default).
2. **Create a poster image from the video** is on by default: a frame is captured in the browser and uploaded as a WebP poster. You can replace it with **Add/Replace poster**.
3. **Add captions (.vtt):** upload a WebVTT file for any video with speech. The file must start with `WEBVTT`.
4. **Set featured video:** on desktop, it plays muted and looped in the project hero, with a pause button. It never autoplays on mobile, with reduced motion or with data-saver on.
5. Videos in the Video section use native `<video controls>` with `preload="none"` and a poster, so nothing downloads until the visitor presses play. Sound never autoplays.

## 15. SEO editing

- **Per project:** the editor's *SEO & sharing* panel has the SEO title (≤ 60–70), SEO description (≤ 160), the OG image (with **Use cover image**) and a live search-result preview.
- **Per page (optional):** **Admin → Settings → SEO** overrides titles and descriptions for Home, About, Services, Portfolio and Contact. The static `<title>` and meta description in each HTML file remain the default that non-JavaScript crawlers see. For permanent changes, update them in the HTML too.
- **Structured data:** static JSON-LD is included for Organization, the two `ProfessionalService` offices, Person (Milind Fulzele), WebSite, WebPage/AboutPage/ContactPage/CollectionPage, Service list and FAQPage. `js/seo.js` provides reusable builders (`SD.seo.organization()`, `.offices()`, `.person()`, `.breadcrumb()`, `.project()`, `.faq()`…) and injects BreadcrumbList on inner pages and CreativeWork, ImageObject and VideoObject on project pages.
- **Limitation:** project pages are rendered by JavaScript. Google renders JavaScript, but social-media link previews read only the static HTML, so they show the default share image for project URLs. If per-project previews matter, add a prerender step or edge function later. See §23.

## 16. Contact enquiries

- The form collects **name, email, phone, message (required), project type and location (optional), and consent** (never pre-ticked). The consent wording and time are stored.
- **Protections:** client-side validation and normalisation, length limits, a honeypot field, a minimum fill time, a per-tab throttle, database CHECK constraints, a consent check in RLS, a hashed-IP and per-email rate limit, and link-spam rejection. Database errors are never shown to visitors.
- **Admin → Enquiries:** search, filter by status, and read the message (opening a new enquiry marks it *read*). You can set status (new, read, replied, archived), reply by email, delete, and **export CSV** (formula-injection safe).
- **Retention:** set the period in Settings (default 365 days). Older enquiries are flagged, and **Delete enquiries past retention** removes them.
- **Email notifications** are not included, because a static site cannot send email securely. Options: a Supabase **Database Webhook** or **Edge Function** on `contact_submissions` INSERT that calls an email API (Resend, SES, Postmark), with the API key kept in Supabase secrets.

## 17. Cookie preferences

- **Current state:** no visitor cookies and no optional tracking, so **no banner is shown**, which is correct when nothing optional is used.
- The footer's **Cookie preferences** link always opens a panel that explains this.
- Browser storage used: `sd_enquiry_times` (sessionStorage, form throttle) and `sd-admin-auth` (admin area only). `sd_consent_v1` is written only once analytics exists and a choice is saved. All are documented in `cookie-policy.html`.

## 18. Analytics configuration

**No analytics is installed.** There is no Google Analytics, GTM, Meta Pixel, Hotjar, Clarity or Facebook SDK. To add a tool later:

1. In `js/config.js` set `ANALYTICS.enabled: true`, `provider`, `scriptSrc`, any `scriptAttributes`, and list each cookie in `cookies`.
2. Add the provider's domains to `script-src` and `connect-src` in the CSP (`_headers` / `vercel.json`).
3. Document the tool in `cookie-policy.html` and `privacy-policy.html`.
4. The banner then appears with **Accept all / Reject optional / Manage preferences**. Nothing is pre-selected, and the script loads **only after opt-in**. Withdrawing consent reloads the page to unload the script.

## 19. Deployment

It's a static site, so upload the folder as-is (there's no build command).

- **Netlify / Cloudflare Pages:** publish directory = project root. `_headers` is applied automatically. Set the 404 page to `404.html` (Netlify does this by default).
- **Vercel:** framework preset "Other", no build command, output = root. `vercel.json` supplies the headers. Vercel serves `404.html` automatically.
- **Others (Apache/Nginx/S3):** copy the headers from `_headers` into the server configuration and set `404.html` as the error document.

Before deploying:
1. Fill in `js/config.js` (URL + anon key).
2. Replace `YOUR-PROJECT-REF` in `_headers` / `vercel.json` with your Supabase project ref.
3. Replace `https://your-domain.com` everywhere (see §20).
4. Test **every** page with the CSP active: open the browser console and look for "Refused to…" messages.

## 20. Domain configuration

1. Point the domain's DNS to your host and enable HTTPS (all the hosts above do this automatically).
2. Find and replace `https://your-domain.com` with the real origin in: all `*.html` (canonical, OG and JSON-LD), `sitemap.xml`, `robots.txt` and `js/config.js` (`SITE_URL`).
3. Choose one canonical host (with or without `www`) and redirect the other one to it.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to the domain.

## 21. Sitemap submission

`sitemap.xml` lists the static pages. Add one `<url>` for each published project. To generate the lines, run this in the SQL Editor:

```sql
select '<url><loc>https://your-domain.com/portfolio-detail.html?slug=' || slug ||
       '</loc><lastmod>' || to_char(updated_at, 'YYYY-MM-DD') || '</lastmod><priority>0.7</priority></url>'
from public.projects where published order by sort_order;
```

Paste the output into `sitemap.xml`, deploy, then submit `https://your-domain.com/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools**. Also claim and verify the **Google Business Profile** for each office (Vashi and Shivaji Nagar) and use the exact same name, address and phone details as the website.

## 22. Security checklist

- [x] No service-role or secret key in the frontend; only the anon key.
- [x] RLS enabled on every table, with admin checked server-side via `is_admin()`.
- [x] Enquiries are insert-only for the public, with SELECT revoked from `anon`.
- [x] Storage writes and listing are admin-only.
- [x] No public sign-up UI (you must also **disable sign-ups in the dashboard**, §10).
- [x] All dynamic content is HTML-escaped (`SD.utils.esc`), and URLs are filtered (`safeUrl`) to allow only http(s).
- [x] No inline scripts or style attributes, so the strict CSP (`script-src 'self'; style-src 'self'`) works.
- [x] External links use `rel="noopener noreferrer"`.
- [x] Admin pages: `noindex`, `no-store` and `no-referrer`, and disallowed in robots.txt.
- [x] Open-redirect protection on the login `next` parameter.
- [x] CSV export neutralises spreadsheet formulas.
- [x] HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors `none` (§19).
- [ ] Enable **MFA** for admin accounts (Supabase Auth → MFA), and use strong, unique passwords.
- [ ] Turn on Supabase **leaked-password protection** and review the **Security Advisor** in the dashboard.
- [ ] Rotate the anon key if it is ever misused (Project Settings → API Keys).

## 23. Production checklist

**Content ([CLIENT TO PROVIDE])**
- [ ] Studio description, sectors and team (about.html)
- [ ] Principal architect biography, qualifications and registrations (about.html). No portrait is used until one is supplied.
- [ ] Company history and milestones (about.html, "Our journey")
- [ ] Confirm the philosophy, approach and service-process wording (about.html, services.html)
- [ ] Real projects with verified details, photography, alt text and captions
- [ ] Interior photography to replace `placeholders/interiors.svg`, then remove its `demo-tag` spans
- [ ] Legal placeholders: hosting provider, Supabase region, retention period, response time, grievance contact, court jurisdiction
- [ ] Confirm the brochure discrepancies listed under "Content sources" below

**Technical**
- [ ] `js/config.js` filled in; `schema.sql` run; sign-ups disabled; admin created and given the role
- [ ] Domain placeholders replaced (§20); CSP project ref set (§19)
- [ ] Test a real enquiry end to end, then delete it
- [ ] Upload a test project with image, video and PDF; publish it, check it, then delete it
- [ ] Lighthouse (Performance, Accessibility, SEO) on the key pages after real images are in place
- [ ] Keyboard-only and screen-reader pass (NVDA/VoiceOver) on Home, Portfolio, Project, Contact
- [ ] Sitemap updated and submitted (§21); Google Business Profiles aligned
- [ ] **Legal review of all legal pages before launch.** They are implementation templates, not legal advice or a guarantee of compliance.
- [ ] Optional: email notification for enquiries (§16); prerendering for per-project social previews (§15)

---

## Content sources

Company content comes from the client's **company profile PDF (July 2026)**: About Us, team, consultants, empanelments, completed, ongoing and pipeline project lists, project data sheets, developer client base and contact details. Original brief items (four disciplines, 30 years, offices) are unchanged.

Not used from the brochure: the MHADA logo (a government mark, so empanelment is stated in text only), stock photos and clip-art icons, and the personal names and addresses of developers' directors (only firm names are listed). The puffery line about "inspiring industry-wide adoption" was left out.

Typing errors corrected silently: fungible, consumption, hectare, Vikhroli, Dindoshi, "Bldg NP/NOP" → "No.".

**Discrepancies to confirm with the client** (the site currently uses the value in bold):

| Item | Brochure says | Site uses |
|---|---|---|
| Navi Mumbai second landline | 022-45003902 (cover) and 022-46043902 (contact page) | **022-45003902** (original brief) |
| Second mobile | 9867416273 (cover), 9869556926 (contact page) | **9869076963** (original brief). Three different numbers; confirm which is current |
| Completed projects | "125+" (About Us) vs "more than 100" (project list) | **125+** |
| Milind Fulzele's experience | 30 years (team page) vs 25+ years (partners page) | **30 years** |
| Pragati Reventa (Bldg 48, Pant Nagar) | Listed as completed, but described as "proposed" | **Completed** |
| Bldg 18, Tagore Nagar tenements | 32 + 217 = 249, but total printed as 243 | **32 rehab + 217 sale** (total omitted) |
| Bldg 80, Kannamwar Nagar 1 BHK | "3750.00 sq ft" | **375.00 sq ft** (assumed typo) |
| Haware Legacy 1 BHK | "370 00 sq ft" | **370.00 sq ft** |
| Saint Tukaram Nagar status | Not in the ongoing/revision list | **No status shown** |
| Completed list numbering | Skips No. 13 | Renumbered 1–18 |

Brand colours: the website accent is `#3F7196`, the logo's blue (`#44789F`) deepened one step so small text meets WCAG AA contrast. The logo mark itself keeps `#44789F`.
