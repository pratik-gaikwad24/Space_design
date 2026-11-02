# Space Design: website

Website for **Space Design**: Architects · Planners · Interior Designers · Project Management Consultant.
Principal Architect: **Milind Fulzele**. 30 years of experience. Offices in **Navi Mumbai** and **Pune**.

- **Static front end:** raw HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step.
- **Projects** are managed in a small admin (`/admin/`) backed by **Supabase** (database, image storage, staff sign-in), with `js/projects-data.js` as the offline fallback (§3). **Enquiries** go to the office WhatsApp.
- **Fonts:** Roboto (300/400/500/700), self-hosted in `assets/fonts/` (SIL Open Font License; no Google Fonts requests). The older Inter Tight and Instrument Serif files are no longer used.
- **Theme:** `css/theme.css` (loaded after `style.css` and `responsive.css`) sets the monochrome look: #111 / #7E7D7D / #F2F2F2 / #ECECEC with logo blue as the accent. Home testimonials appear once quotes are added to `TESTIMONIALS` in `js/home.js`.
- **Hosting:** any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 and others).

> **Status:** the code is complete. Before it goes live it needs the real domain, real photography and a legal review. See §12.

---

## Contents
1. [Project setup](#1-project-setup)
2. [Folder structure](#2-folder-structure)
3. [Adding or editing projects (admin + Supabase)](#3-adding-or-editing-projects-admin--supabase)
4. [Images](#4-images)
5. [SEO](#5-seo)
6. [Contact enquiries](#6-contact-enquiries)
7. [Cookie preferences](#7-cookie-preferences)
8. [Analytics configuration](#8-analytics-configuration)
9. [Deployment](#9-deployment)
10. [Domain configuration and sitemap](#10-domain-configuration-and-sitemap)
11. [Security checklist](#11-security-checklist)
12. [Production checklist](#12-production-checklist)

---

## 1. Project setup

You don't need to install anything. To preview locally, serve the folder over HTTP. Opening files directly with `file://` breaks some browser features.

```bash
cd space_design
python -m http.server 8080        # or: npx serve .
# open http://localhost:8080
```

## 2. Folder structure

```
space_design/
├── index.html               Home
├── about.html               About
├── services.html            Services
├── portfolio.html           Portfolio (filters + search)
├── portfolio-detail.html    Project detail (?slug=…)
├── contact.html             Contact + WhatsApp enquiry form
├── privacy-policy.html  terms.html  cookie-policy.html  refund-policy.html  accessibility.html
├── 404.html
├── admin/index.html         projects admin (sign in, add/edit/delete, image upload)
├── css/
│   ├── style.css            design system + page styles
│   ├── responsive.css       1920 / 1440 / 1024 / 768 / 430 / 390 / 375 compositions
│   ├── theme.css            monochrome theme + slide/hero backgrounds
│   ├── services-art.css     animated service illustrations (generated)
│   └── accessibility.css    focus, reduced motion, forced colours, contrast
├── js/
│   ├── boot.js              sets .js class (sync, in <head>)
│   ├── config.js            site URL, analytics switch
│   ├── utils.js             escaping, URL safety, project card renderer
│   ├── projects-data.js     project data: Supabase REST + built-in fallback (SD.api)
│   ├── admin.js             projects admin (uses js/vendor/supabase.js)
│   ├── seo.js               meta updates + JSON-LD builders
│   ├── cookie-consent.js    consent banner/preferences (inactive until analytics is enabled)
│   ├── navigation.js        header, progress bar, accessible mobile menu
│   ├── main.js              reveal animations, lazy video, footer year
│   └── home.js  portfolio.js  project-detail.js  contact.js
├── assets/                  fonts, icons, images (projects in assets/img/projects/)
├── partials/                header.html, footer.html, scripts.html (shared markup source)
├── tools/sync-partials.py   optional: re-applies partials to every page
├── tools/build-service-art.py  regenerates the services page illustrations
├── tools/build-seed-sql.js  regenerates supabase/seed-projects.sql
├── supabase/                schema.sql (tables, security, storage), seed-projects.sql
├── _headers  vercel.json    security headers for Netlify/Cloudflare and Vercel
└── robots.txt  sitemap.xml  README.md
```

**Shared header and footer:** every page contains the header, footer and script tags as plain HTML between `<!-- PARTIAL:… -->` markers. That keeps them crawlable and working without JavaScript. To change them, edit `partials/*.html` and run `python tools/sync-partials.py`. You can also edit each page by hand.

## 3. Adding or editing projects (admin + Supabase)

Projects are stored in a Supabase database and managed at **`/admin/`** (for example `https://www.spacedesign.space/admin/`). Public pages read published projects through Supabase's REST API without loading the Supabase library, so they stay fast. If the database can't be reached, they fall back to the built-in list in `js/projects-data.js`.

### One-time setup
1. **Supabase project:** `https://wizpqcxrlancqcoymnsj.supabase.co` (Ireland, eu-west-1). The URL and the publishable key are in `js/config.js`. Both are public by design; never put the `service_role`/secret key or the database password in any file.
2. **Turn off sign-ups:** Authentication → Sign In / Providers → Email → switch off "Allow new users to sign up".
3. **Create the database:** SQL Editor → New query → paste all of `supabase/schema.sql` → Run.
4. **Load the starting projects:** SQL Editor → paste `supabase/seed-projects.sql` → Run (the 11 projects from the company profile).
5. **Create the admin login:** Authentication → Users → Add user → email + strong password, tick "Auto confirm user".
6. **Make it an admin:** in the SQL Editor run (with the real email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'admin@example.com'
   on conflict do nothing;
   ```
   Repeat steps 5–6 for each person who should edit projects. To remove someone: `delete from public.admins where user_id = (select id from auth.users where email = '…');`

### Using the admin
- **Sign in** at `/admin/`. Accounts without admin rights are refused.
- **Add / edit:** title, web address (slug, filled in from the title), subtitle, category, status, type, area, location, society, short and full description, and **Details**.
- **Details format** (one fact per line): `Label: value` lines appear under *Key facts*; lines without a colon appear under *Highlights*; a line starting `Units:` or `Units (RCA):` with sizes separated by `·` becomes the unit tiles, e.g. `Units (RCA): 1 BHK 409.00 sq ft · 2 BHK 508.00 sq ft`.
- **Images:** upload JPEG/PNG/WebP (resized to 2000 px and converted to WebP in the browser), add a short description (alt text) to each, choose *Photo/render* or *Plan/drawing*, and reorder; the first is the cover.
- **Show on the website** publishes or hides a project; **Featured** puts it first on the home page; **Sort order** sets the order (lower first). The list page has a quick on/off switch per project.
- **Category** builds the filter tabs on the Projects page. The six services always have a tab.
- **Delete** removes the project and its uploaded images.
- Add new project URLs to `sitemap.xml` (§10): `https://www.spacedesign.space/portfolio-detail.html?slug=<slug>`.

### Security
- Row Level Security in `schema.sql`: anyone can read **published** projects; only accounts listed in `public.admins` can add, edit or delete projects or upload images. This is enforced by the database, not the browser.
- The `project-images` storage bucket is public to view (10 MB limit, JPEG/PNG/WebP), admin-only to change.
- `tools/build-seed-sql.js` regenerates `supabase/seed-projects.sql` from `js/projects-data.js` if the built-in list changes.

## 4. Images

- Put project images in `assets/img/projects/` as **WebP**, ideally no wider than 2400 px.
- Write factual **alt text** for every image (e.g. "Residential tower with timber-toned balconies, Ghatkopar").
- **Tall renders and plans:** portrait images (towers) are shown whole on a sky gradient, and plans/drawings whole on white, instead of being cropped (`SD.utils.fitClass`). Photographs fill their frame as normal.
- **Services page illustrations:** each service has an animated illustration (inline SVG, animated with `css/services-art.css`). They are generated by `tools/build-service-art.py`: edit the drawing there and run `python tools/build-service-art.py` to update `services.html`. Each scene plays once when scrolled into view, then keeps a few gentle loops (crane, clouds, car, lamp, plant); visitors who prefer reduced motion see the finished scene.
- Project pages also support videos (`media_type: 'video'` with `media_url` and `poster_url`) and PDFs (`media_url` ending in `.pdf`); none are used yet.

## 5. SEO

- Each page has a static `<title>`, meta description, canonical URL and Open Graph tags in its HTML.
- **Structured data:** static JSON-LD is included for Organization, the two `ProfessionalService` offices, Person (Milind Fulzele), WebSite, WebPage/AboutPage/ContactPage/CollectionPage, Service list and FAQPage. `js/seo.js` injects BreadcrumbList on inner pages and CreativeWork and ImageObject on project pages.
- **Limitation:** project pages are rendered by JavaScript. Google renders JavaScript, but social-media link previews read only the static HTML, so they show the default share image for project URLs.

## 6. Contact enquiries

- The form sends enquiries **through WhatsApp**: on submit it opens `wa.me/919833175033` with the details prefilled (name, phone and message required; email, project type and location optional). Nothing is stored on the website; the visitor taps Send in WhatsApp.
- **Protections:** client-side validation and normalisation, length limits and a honeypot field.
- To change the number, edit `WHATSAPP_NO` in `js/contact.js` (and the WhatsApp links in the pages and `partials/footer.html`).

## 7. Cookie preferences

- **Current state:** no cookies and no optional tracking, so **no banner is shown**, which is correct when nothing optional is used.
- The footer's **Cookie preferences** link always opens a panel that explains this.
- Browser storage: `sd_consent_v1` is written only once analytics exists and a choice is saved. It is documented in `cookie-policy.html`.

## 8. Analytics configuration

**No analytics is installed.** There is no Google Analytics, GTM, Meta Pixel, Hotjar, Clarity or Facebook SDK. To add a tool later:

1. In `js/config.js` set `ANALYTICS.enabled: true`, `provider`, `scriptSrc`, any `scriptAttributes`, and list each cookie in `cookies`.
2. Add the provider's domains to `script-src` and `connect-src` in the CSP (`_headers` / `vercel.json`).
3. Document the tool in `cookie-policy.html` and `privacy-policy.html`.
4. The banner then appears with **Accept all / Reject optional / Manage preferences**. Nothing is pre-selected, and the script loads **only after opt-in**. Withdrawing consent reloads the page to unload the script.

## 9. Deployment

It's a static site, so upload the folder as-is (there's no build command).

- **Netlify / Cloudflare Pages:** publish directory = project root. `_headers` is applied automatically. Set the 404 page to `404.html` (Netlify does this by default).
- **Vercel:** framework preset "Other", no build command, output = root. `vercel.json` supplies the headers. Vercel serves `404.html` automatically.
- **Others (Apache/Nginx/S3):** copy the headers from `_headers` into the server configuration and set `404.html` as the error document.

The domain is set to `https://www.spacedesign.space` (§10). Before going live, test every page with the CSP active: open the browser console and look for "Refused to…" messages.

## 10. Domain configuration and sitemap

1. Point the domain's DNS to your host and enable HTTPS (all the hosts above do this automatically).
2. The site's address is `https://www.spacedesign.space`. If it ever changes, find and replace it in: all `*.html` (canonical, OG and JSON-LD), `sitemap.xml`, `robots.txt` and `js/config.js` (`SITE_URL`).
3. The site uses `www.spacedesign.space`: redirect `spacedesign.space` (without www) to it at your host.
4. `sitemap.xml` lists the static pages and all projects. When you add a project, add one `<url>`: `https://www.spacedesign.space/portfolio-detail.html?slug=<slug>`.
5. Submit `https://www.spacedesign.space/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools**. Also claim and verify the **Google Business Profile** for each office (Vashi and Shivaji Nagar) and use the exact same name, address and phone details as the website.

## 11. Security checklist

- [x] Only the public Supabase URL and publishable key are in the code; no secret key or password.
- [x] Row Level Security: visitors read published projects only; only listed admins can change projects or images. No public sign-up (turn it off in Supabase, §3).
- [x] Admin pages: `noindex`, `no-store`, `no-referrer`, and disallowed in robots.txt.
- [x] All dynamic content is HTML-escaped (`SD.utils.esc`), and URLs are filtered (`safeUrl`) to allow only http(s).
- [x] No inline scripts or style attributes, so the strict CSP (`script-src 'self'; style-src 'self'`) works.
- [x] External links use `rel="noopener noreferrer"`.
- [x] HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors `none` (`_headers` / `vercel.json`).

## 12. Production checklist

**Content**
- [ ] Studio description, sectors and team (about.html)
- [ ] Principal architect biography, qualifications and registrations (about.html). No portrait is used until one is supplied.
- [ ] Company history and milestones (about.html, "Our journey")
- [ ] Confirm the philosophy, approach and service-process wording (about.html, services.html)
- [ ] Real projects with verified details, photography and alt text (§3, §4)
- [ ] Confirm the legal details: 12-month enquiry retention, 30-day response time, grievance contact, Navi Mumbai jurisdiction, Vercel as host
- [ ] Confirm the brochure discrepancies listed under "Content sources" below

**Technical**
- [ ] Domain connected at the host, HTTPS on, and `spacedesign.space` redirecting to `www.spacedesign.space` (§10)
- [ ] Send a test enquiry from a phone and check it arrives on WhatsApp
- [ ] Lighthouse (Performance, Accessibility, SEO) on the key pages after real images are in place
- [ ] Keyboard-only and screen-reader pass (NVDA/VoiceOver) on Home, Portfolio, Project, Contact
- [ ] Sitemap updated and submitted (§10); Google Business Profiles aligned
- [ ] **Legal review of all legal pages before launch.** They are implementation templates, not legal advice or a guarantee of compliance.

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
