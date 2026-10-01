/* =====================================================================
   SPACE DESIGN — Public runtime configuration
   ---------------------------------------------------------------------
   This is a static site: there is no server to read a .env file, so the
   PUBLIC Supabase values live here. See .env.example and README §4–5.

   SAFE to expose:   SUPABASE_URL, SUPABASE_ANON_KEY (publishable key).
                     Access is enforced by Row Level Security in schema.sql.
   NEVER put here:   the service_role / secret key, database password,
                     or any other secret.
   ===================================================================== */
window.SD_CONFIG = Object.freeze({
  /* Supabase → Project Settings → Data API / API Keys */
  SUPABASE_URL: '',          // e.g. 'https://abcdefghijklmnop.supabase.co'
  SUPABASE_ANON_KEY: '',     // the "anon" / "publishable" key

  /* Canonical production origin, no trailing slash. Also replace
     "https://your-domain.com" in the HTML files, sitemap.xml and robots.txt. */
  SITE_URL: 'https://your-domain.com',

  /* While Supabase is NOT configured, show the built-in projects from the
     company profile (js/projects-data.js). Ignored once Supabase is configured. */
  SHOW_DEMO_CONTENT_WHEN_UNCONFIGURED: true,

  /* Supabase Image Transformations (paid plans). When true, portfolio images
     are requested at responsive widths via /render/image/. */
  IMAGE_TRANSFORMS: false,

  /* Optional analytics. NOTHING is installed by default.
     If enabled, the script is loaded ONLY after the visitor opts in via the
     cookie banner. Document every tracker in cookie-policy.html first.
     Remember to add the provider's domains to the Content-Security-Policy. */
  ANALYTICS: Object.freeze({
    enabled: false,
    provider: '',            // e.g. 'Plausible' / 'Google Analytics 4'
    scriptSrc: '',           // e.g. 'https://plausible.io/js/script.js'
    scriptAttributes: {},    // e.g. { 'data-domain': 'your-domain.com' }
    cookies: []              // e.g. [{ name: '_ga', purpose: 'Distinguishes users', duration: '2 years' }]
  }),

  /* Client-side contact-form throttle (server-side limits live in schema.sql). */
  CONTACT_MAX_PER_HOUR: 3,
  CONTACT_MIN_FILL_SECONDS: 4
});
