/* =====================================================================
   SPACE DESIGN — Cookie & tracking consent
   ---------------------------------------------------------------------
   Default state: NO optional tracking is installed, so no banner is shown.
   The "Cookie preferences" link always opens a panel explaining what is
   (and is not) used.

   If SD_CONFIG.ANALYTICS.enabled is set to true:
     • a banner offers ACCEPT ALL / REJECT OPTIONAL / MANAGE PREFERENCES
     • nothing optional is pre-selected
     • the analytics script is injected ONLY after opt-in
     • consent can be withdrawn at any time from "Cookie preferences"
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var cfg = window.SD_CONFIG || {};
  var A = cfg.ANALYTICS || {};
  var analyticsAvailable = !!(A.enabled && A.scriptSrc);
  var KEY = 'sd_consent_v1';
  var VERSION = 1;

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && v.version === VERSION ? v : null;
    } catch (e) { return null; }
  }
  function write(analytics) {
    var v = { version: VERSION, analytics: !!analytics, updated: new Date().toISOString() };
    try { window.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage blocked */ }
    return v;
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded || !analyticsAvailable) return;
    var src = SD.utils ? SD.utils.safeUrl(A.scriptSrc) : A.scriptSrc;
    if (!src) return;
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.dataset.consent = 'analytics';
    Object.keys(A.scriptAttributes || {}).forEach(function (k) { s.setAttribute(k, A.scriptAttributes[k]); });
    document.head.appendChild(s);
    loaded = true;
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html) e.innerHTML = html;
    return e;
  }

  /* ---------- Banner (only when optional analytics is configured) ---------- */
  var banner;
  function showBanner() {
    if (banner) return;
    banner = el('section', { class: 'cookie-banner', 'aria-labelledby': 'cookie-banner-title' },
      '<h2 id="cookie-banner-title">Your privacy choices</h2>' +
      '<p>We would like to use optional analytics (' + esc(A.provider || 'analytics') + ') to understand how the website is used. It is off unless you choose to allow it. See our <a class="text-link" href="cookie-policy.html">Cookie Policy</a>.</p>' +
      '<div class="cookie-actions">' +
        '<button type="button" class="btn btn--sm" data-c="accept">Accept all</button>' +
        '<button type="button" class="btn btn--sm btn--ghost" data-c="reject">Reject optional</button>' +
        '<button type="button" class="btn btn--sm btn--ghost" data-c="manage">Manage preferences</button>' +
      '</div>');
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      var c = b.getAttribute('data-c');
      if (c === 'accept') { write(true); loadAnalytics(); hideBanner(); }
      if (c === 'reject') { write(false); hideBanner(); }
      if (c === 'manage') { openPreferences(); }
    });
    document.body.appendChild(banner);
  }
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }

  function esc(s) { return SD.utils ? SD.utils.esc(s) : String(s || ''); }

  /* ---------- Preferences dialog (always available) ---------- */
  var dialog;
  function openPreferences(trigger) {
    var state = read();
    if (dialog) dialog.remove();
    var trackerRows = (A.cookies || []).map(function (c) {
      return '<li><strong>' + esc(c.name) + '</strong>: ' + esc(c.purpose) + ' (' + esc(c.duration) + ')</li>';
    }).join('');

    dialog = el('dialog', { class: 'cookie-dialog', 'aria-labelledby': 'cookie-dialog-title' },
      '<form method="dialog" class="cookie-dialog-inner">' +
        '<h2 id="cookie-dialog-title">Cookie preferences</h2>' +
        '<p class="muted mb-0">This website does not use advertising or cross-site tracking. ' +
          (analyticsAvailable ? 'Optional analytics runs only if you switch it on below.' : 'No optional analytics or marketing tools are currently installed.') + '</p>' +
        '<div class="cookie-cat">' +
          '<h3>Strictly necessary</h3><span class="state">Always on</span>' +
          '<p>Your choice on this panel is remembered in your browser (localStorage key <code>sd_consent_v1</code>) only after you save a choice. The website administrator\'s sign-in session is stored only inside the private admin area. No strictly necessary cookies are set for visitors.</p>' +
        '</div>' +
        '<div class="cookie-cat">' +
          '<h3>Analytics</h3>' +
          (analyticsAvailable
            ? '<label class="switch"><input type="checkbox" name="analytics" ' + (state && state.analytics ? 'checked' : '') + '><span class="visually-hidden">Allow analytics</span></label>' +
              '<p>' + esc(A.provider) + ' helps us understand which pages are visited.' + (trackerRows ? '</p><ul class="muted">' + trackerRows + '</ul><p class="mb-0">' : '') + ' You can withdraw consent at any time here.</p>'
            : '<span class="state">Not in use</span><p>No analytics tool is installed on this website.</p>') +
        '</div>' +
        '<div class="cookie-cat">' +
          '<h3>Marketing</h3><span class="state">Not in use</span>' +
          '<p>No marketing, advertising or social-media tracking is used.</p>' +
        '</div>' +
        '<div class="cookie-actions">' +
          (analyticsAvailable
            ? '<button type="submit" class="btn btn--sm" value="save">Save preferences</button><button type="submit" class="btn btn--sm btn--ghost" value="reject">Reject optional</button>'
            : '<button type="submit" class="btn btn--sm" value="close">Close</button>') +
          '<a class="link-arrow" href="cookie-policy.html">Cookie policy <span class="btn-arrow" aria-hidden="true">→</span></a>' +
        '</div>' +
      '</form>');

    // Links inside the dialog must resolve correctly from /admin/ or 404 paths too.
    var base = document.querySelector('.brand') ? document.querySelector('.brand').getAttribute('href').replace(/index\.html$/, '') : '';
    dialog.querySelectorAll('a[href="cookie-policy.html"]').forEach(function (a) { a.setAttribute('href', base + 'cookie-policy.html'); });

    dialog.addEventListener('close', function () {
      var v = dialog.returnValue;
      if (analyticsAvailable && (v === 'save' || v === 'reject')) {
        var wasOn = !!(read() && read().analytics);
        var on = v === 'save' && dialog.querySelector('input[name="analytics"]').checked;
        write(on);
        hideBanner();
        if (on) loadAnalytics();
        else if (wasOn && loaded) window.location.reload(); // fully unload a running tracker
      }
      dialog.remove();
      dialog = null;
      if (trigger && trigger.focus) trigger.focus();
    });
    document.body.appendChild(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function init() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie-preferences]');
      if (t) { e.preventDefault(); openPreferences(t); }
    });
    if (!analyticsAvailable) return;
    var state = read();
    if (!state) showBanner();
    else if (state.analytics) loadAnalytics();
  }

  SD.consent = { get: read, open: openPreferences, analyticsAvailable: analyticsAvailable };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
