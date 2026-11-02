/* =====================================================================
   SPACE DESIGN — Public runtime configuration
   ===================================================================== */
window.SD_CONFIG = Object.freeze({
  /* Canonical production origin, no trailing slash. If it changes, also update
     it in the HTML files, sitemap.xml and robots.txt. */
  SITE_URL: 'https://www.spacedesign.space',

  /* Supabase (projects database + admin login). Both values are PUBLIC by
     design: the database's security rules decide what they can do.
     NEVER put the service_role / secret key or the database password here. */
  SUPABASE_URL: 'https://wizpqcxrlancqcoymnsj.supabase.co',
  SUPABASE_KEY: 'sb_publishable_scG2-vpp0Jtb0kfFS6VFiQ_-GTXih5R',
  PROJECT_IMAGES_BUCKET: 'project-images',

  /* Optional analytics. NOTHING is installed by default.
     If enabled, the script is loaded ONLY after the visitor opts in via the
     cookie banner. Document every tracker in cookie-policy.html first.
     Remember to add the provider's domains to the Content-Security-Policy. */
  ANALYTICS: Object.freeze({
    enabled: false,
    provider: '',            // e.g. 'Plausible' / 'Google Analytics 4'
    scriptSrc: '',           // e.g. 'https://plausible.io/js/script.js'
    scriptAttributes: {},    // e.g. { 'data-domain': 'www.spacedesign.space' }
    cookies: []              // e.g. [{ name: '_ga', purpose: 'Distinguishes users', duration: '2 years' }]
  })
});
