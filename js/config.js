/* =====================================================================
   SPACE DESIGN — Public runtime configuration
   ===================================================================== */
window.SD_CONFIG = Object.freeze({
  /* Canonical production origin, no trailing slash. If it changes, also update
     it in the HTML files, sitemap.xml and robots.txt. */
  SITE_URL: 'https://www.spacedesign.space',

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
