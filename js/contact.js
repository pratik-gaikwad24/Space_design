/* =====================================================================
   SPACE DESIGN — Contact form
   Client-side validation & normalisation, honeypot, time-trap,
   client throttle, accessible error summary, success/error states.
   Server-side protections (constraints, consent check, hashed-IP rate
   limit, link-spam rule) are enforced in supabase/schema.sql.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;
  var cfg = window.SD_CONFIG || {};

  var CONSENT_TEXT = 'I have read and understood the Privacy Notice.';
  var THROTTLE_KEY = 'sd_enquiry_times';
  var EMAIL_RE = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i;

  function clean(s, max) {
    // strip control characters, collapse whitespace, trim, cap length
    return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);
  }

  function validPhone(raw) {
    var digits = raw.replace(/[^\d]/g, '');
    if (!/^\+?[0-9 ()\-]{7,20}$/.test(raw)) return false;
    // Indian mobile (10 digits starting 6-9, optional 91/0 prefix) or landline with STD code (10–11 digits)
    if (/^(?:91|0)?[6-9]\d{9}$/.test(digits)) return true;
    if (/^(?:91)?0?\d{10}$/.test(digits)) return true;
    // International numbers
    return raw.trim().charAt(0) === '+' && digits.length >= 8 && digits.length <= 15;
  }

  function throttled() {
    try {
      var hour = Date.now() - 3600e3;
      var t = JSON.parse(sessionStorage.getItem(THROTTLE_KEY) || '[]').filter(function (x) { return x > hour; });
      return t.length >= (cfg.CONTACT_MAX_PER_HOUR || 3);
    } catch (e) { return false; }
  }
  function recordSubmit() {
    try {
      var t = JSON.parse(sessionStorage.getItem(THROTTLE_KEY) || '[]');
      t.push(Date.now());
      sessionStorage.setItem(THROTTLE_KEY, JSON.stringify(t.slice(-10)));
    } catch (e) { /* ignore */ }
  }

  function init() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var wrap = document.querySelector('[data-form-wrap]');
    var summary = document.querySelector('[data-form-errors]');
    var submit = form.querySelector('[data-submit]');
    var submitLabel = form.querySelector('[data-submit-label]');
    var msg = form.elements.message;
    var counter = form.querySelector('[data-char-count]');
    var renderedAt = Date.now();

    // Prefill project type from ?type= (links on the services page).
    var type = U.param('type');
    if (type) {
      Array.prototype.forEach.call(form.elements.project_type.options, function (o) { if (o.value === type || o.text === type) o.selected = true; });
    }

    msg.addEventListener('input', function () { counter.textContent = msg.value.length + ' / 3000'; });

    function setError(name, text) {
      var field = form.elements[name];
      var out = form.querySelector('[data-error-for="' + name + '"]');
      if (out) out.textContent = text || '';
      if (field) {
        if (text) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
      }
    }

    function validate() {
      var v = {
        name: clean(form.elements.name.value, 120),
        email: clean(form.elements.email.value, 254).toLowerCase(),
        phone: clean(form.elements.phone.value, 20),
        project_type: clean(form.elements.project_type.value, 80),
        location: clean(form.elements.location.value, 120),
        message: String(msg.value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 3000),
        consent: form.elements.consent.checked
      };
      var errors = [];
      function check(name, cond, text) { if (!cond) { errors.push({ name: name, text: text }); setError(name, text); } else setError(name, ''); }
      check('name', v.name.length >= 2, 'Enter your name (at least 2 characters).');
      check('email', EMAIL_RE.test(v.email), 'Enter a valid email address, like name@example.com.');
      check('phone', validPhone(v.phone), 'Enter a valid phone number, for example 98xxx xxxxx.');
      check('message', v.message.length >= 10, 'Enter a message of at least 10 characters.');
      check('consent', v.consent, 'Please confirm you have read the Privacy Notice.');
      return { values: v, errors: errors };
    }

    function showSummary(errors, heading) {
      summary.innerHTML = '<h3>' + U.esc(heading) + '</h3>' + (errors.length ? '<ul>' + errors.map(function (e) {
        return '<li><a href="#f-' + (e.name === 'project_type' ? 'type' : e.name) + '">' + U.esc(e.text) + '</a></li>';
      }).join('') + '</ul>' : '');
      summary.classList.remove('alert--success');
      summary.hidden = false;
      summary.focus();
    }

    summary.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#f-"]');
      if (!a) return;
      e.preventDefault();
      var el = document.querySelector(a.getAttribute('href'));
      if (el) el.focus();
    });

    // Re-validate a field once the user has interacted with it after an error.
    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') validate();
    });

    function busy(on) {
      submit.disabled = on;
      submit.setAttribute('aria-disabled', on ? 'true' : 'false');
      submitLabel.textContent = on ? 'Sending…' : 'Send enquiry';
    }

    function success() {
      wrap.innerHTML =
        '<div class="form-success">' +
          '<p class="index mb-0">Sent</p>' +
          '<h2 tabindex="-1" data-success-title>Thank you.</h2>' +
          '<p class="lead mb-0">Your enquiry has been received.</p>' +
          '<p class="muted mb-0">If your project is time-sensitive, you can also call the Navi Mumbai office on <a class="text-link" href="tel:+912246043901">022-46043901</a> or the Pune office on <a class="text-link" href="tel:+912029910526">020-29910526</a>.</p>' +
          '<a class="link-arrow" href="portfolio.html">View selected work <span class="btn-arrow" aria-hidden="true">→</span></a>' +
        '</div>';
      wrap.querySelector('[data-success-title]').focus();
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      summary.hidden = true;

      var r = validate();
      if (r.errors.length) {
        showSummary(r.errors, 'Please correct ' + r.errors.length + (r.errors.length === 1 ? ' field' : ' fields') + ':');
        return;
      }

      // Spam signals: honeypot filled, or submitted implausibly fast. Show success without sending.
      var tooFast = (Date.now() - renderedAt) / 1000 < (cfg.CONTACT_MIN_FILL_SECONDS || 4);
      if (form.elements.website.value || tooFast) { success(); return; }

      if (throttled()) {
        showSummary([], 'You have sent several enquiries recently. Please wait a while, or call us directly.');
        return;
      }

      if (!SD.supabaseConfigured) {
        showSummary([], 'The enquiry form is not connected yet. Please email spacedesign1108@gmail.com or call 022-46043901.');
        return;
      }

      busy(true);
      var payload = {
        name: r.values.name,
        email: r.values.email,
        phone: r.values.phone,
        project_type: r.values.project_type || null,
        location: r.values.location || null,
        message: r.values.message,
        consent: true,
        consent_text: CONSENT_TEXT
      };
      try {
        var res = await SD.api.submitEnquiry(payload);
        if (res.ok) { recordSubmit(); success(); return; }
        showSummary([], res.rateLimited
          ? 'Too many enquiries have been sent recently. Please try again later, or call us directly.'
          : 'Your enquiry could not be sent. Please try again, or email spacedesign1108@gmail.com.');
      } catch (err) {
        showSummary([], 'Your enquiry could not be sent. Please check your connection and try again.');
      } finally {
        if (document.body.contains(submit)) busy(false);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
