# Space Design: website

Website for **Space Design**: Architects · Planners · Interior Designers · Project Management Consultant.
Principal Architect: **Milind Fulzele**. 30 years of experience. Offices in **Navi Mumbai** and **Pune**.

- **Fully static:** raw HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step, no backend, no database.
- **Projects** come from `js/projects-data.js`; **enquiries** go to the office WhatsApp.
- **Fonts:** Roboto (300/400/500/700), self-hosted in `assets/fonts/` (SIL Open Font License; no Google Fonts requests). The older Inter Tight and Instrument Serif files are no longer used.
- **Theme:** `css/theme.css` (loaded after `style.css` and `responsive.css`) sets the monochrome look: #111 / #7E7D7D / #F2F2F2 / #ECECEC with logo blue as the accent. Home testimonials appear once quotes are added to `TESTIMONIALS` in `js/home.js`.
- **Hosting:** any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 and others).

> **Status:** the code is complete. Before it goes live it needs the real domain, real photography and a legal review. See §12.

---

## Contents
1. [Project setup](#1-project-setup)
2. [Folder structure](#2-folder-structure)
3. [Adding or editing projects](#3-adding-or-editing-projects)
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
│   ├── projects-data.js     the project list (SD.api)
│   ├── seo.js               meta updates + JSON-LD builders
│   ├── cookie-consent.js    consent banner/preferences (inactive until analytics is enabled)
│   ├── navigation.js        header, progress bar, accessible mobile menu
│   ├── main.js              reveal animations, lazy video, footer year
│   └── home.js  portfolio.js  project-detail.js  contact.js
├── assets/                  fonts, icons, images (projects in assets/img/projects/)
├── partials/                header.html, footer.html, scripts.html (shared markup source)
├── tools/sync-partials.py   optional: re-applies partials to every page
├── tools/build-service-art.py  regenerates the services page illustrations
├── _headers  vercel.json    security headers for Netlify/Cloudflare and Vercel
└── robots.txt  sitemap.xml  README.md
```

**Shared header and footer:** every page contains the header, footer and script tags as plain HTML between `<!-- PARTIAL:… -->` markers. That keeps them crawlable and working without JavaScript. To change them, edit `partials/*.html` and run `python tools/sync-partials.py`. You can also edit each page by hand.

## 3. Adding or editing projects

All projects live in the `P` list in `js/projects-data.js`. Each entry looks like this:

```js
{
  slug: 'pragati-icon', title: 'Pragati Icon', featured: true, sort_order: 20,
  subtitle: '…', category: 'Redevelopment', project_type: 'Residential', status: 'Completed',
  location: 'Pant Nagar, Ghatkopar, Mumbai', area: '852.50 sq m plot', client: '…',
  short_description: '…', description: '…', details: specs([...]),
  media: [render('pragati-icon', 639, 928, 'Alt text describing the image')]
}
```

- **slug:** lowercase letters, numbers and hyphens; it becomes the page address `portfolio-detail.html?slug=…`.
- **media:** `render(file, width, height, alt)` for renders/photos, `plan(file, alt)` for layout plans. `file` is the name of a `.webp` in `assets/img/projects/` without the extension. The first item is the cover image.
- **category** builds the filter tabs on the Portfolio page. **featured** projects are shown first on the home page; **sort_order** sets the order (lower first).
- Add the new project's URL to `sitemap.xml` (§10).

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

Before deploying, replace `https://your-domain.com` everywhere (§10), then test every page with the CSP active: open the browser console and look for "Refused to…" messages.

## 10. Domain configuration and sitemap

1. Point the domain's DNS to your host and enable HTTPS (all the hosts above do this automatically).
2. Find and replace `https://your-domain.com` with the real origin in: all `*.html` (canonical, OG and JSON-LD), `sitemap.xml`, `robots.txt` and `js/config.js` (`SITE_URL`).
3. Choose one canonical host (with or without `www`) and redirect the other one to it.
4. `sitemap.xml` lists the static pages. Add one `<url>` per project: `https://your-domain.com/portfolio-detail.html?slug=<slug>`.
5. Submit `https://your-domain.com/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools**. Also claim and verify the **Google Business Profile** for each office (Vashi and Shivaji Nagar) and use the exact same name, address and phone details as the website.

## 11. Security checklist

- [x] No backend, database, accounts or secrets: nothing to break into or leak.
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
- [ ] Domain placeholders replaced (§10)
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
