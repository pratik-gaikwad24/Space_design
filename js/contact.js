/* =====================================================================
   SPACE DESIGN — Contact form
   Client-side validation & normalisation, honeypot, accessible error
   summary. A valid enquiry opens WhatsApp with the details prefilled;
   nothing is stored on our side.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;

  var WHATSAPP_NO = '919833175033';
  var EMAIL_RE = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i;

  function clean(s, max) {
    // strip control characters, collapse whitespace, trim, cap length
    return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);
  }

  function validPhone(raw) {
    var digits = raw.replace(/[^\d]/g, '');
    if (!/^\+?[0-9 ()\-]{7,20}$/.test(raw)) return false;
    // Indian mobile (10 digits starting 6-9, optional 91/0 prefix) or landline with STD code (0 or 91, then 10 digits)
    var national = digits.replace(/^(?:91|0)(?=\d{10}$)/, '');
    if (/^(\d)\1+$/.test(national)) return false; // 0000000000, 9999999999…
    if (/^(?:91|0)?[6-9]\d{9}$/.test(digits)) return true;
    if (/^(?:0|91)[1-8]\d{9}$/.test(digits)) return true;
    // International numbers
    return raw.trim().charAt(0) === '+' && digits.length >= 8 && digits.length <= 15;
  }

  function init() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;
    var wrap = document.querySelector('[data-form-wrap]');
    var summary = document.querySelector('[data-form-errors]');
    var msg = form.elements.message;
    var counter = form.querySelector('[data-char-count]');

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
      check('email', !v.email || EMAIL_RE.test(v.email), 'Enter a valid email address, like name@example.com.');
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

    function waLink(v) {
      var lines = [
        'Hello Space Design, I would like to discuss a project.',
        '',
        'Name: ' + v.name,
        'Phone: ' + v.phone
      ];
      if (v.email) lines.push('Email: ' + v.email);
      if (v.project_type) lines.push('Project type: ' + v.project_type);
      if (v.location) lines.push('Location: ' + v.location);
      lines.push('', v.message);
      return 'https://wa.me/' + WHATSAPP_NO + '?text=' + encodeURIComponent(lines.join('\n'));
    }

    function success(url) {
      wrap.innerHTML =
        '<div class="form-success">' +
          '<p class="index mb-0">Almost done</p>' +
          '<h2 tabindex="-1" data-success-title>Thank you.</h2>' +
          '<p class="lead mb-0">Your enquiry is ready in WhatsApp. Tap <strong>Send</strong> there to reach us.</p>' +
          (url ? '<p class="mb-0">WhatsApp didn’t open? <a class="text-link" href="' + U.esc(url) + '" target="_blank" rel="noopener noreferrer">Open WhatsApp again</a>.</p>' : '') +
          '<p class="muted mb-0">If your project is time-sensitive, you can also call the Navi Mumbai office on <a class="text-link" href="tel:+912246043901">022-46043901</a> or the Pune office on <a class="text-link" href="tel:+912029910526">020-29910526</a>.</p>' +
          '<a class="link-arrow" href="portfolio.html">View selected work <span class="btn-arrow" aria-hidden="true">→</span></a>' +
        '</div>';
      wrap.querySelector('[data-success-title]').focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      summary.hidden = true;

      var r = validate();
      if (r.errors.length) {
        showSummary(r.errors, 'Please correct ' + r.errors.length + (r.errors.length === 1 ? ' field' : ' fields') + ':');
        return;
      }

      // Spam signal: honeypot filled. Show success without opening WhatsApp.
      if (form.elements.website.value) { success(); return; }

      // Hand the enquiry to WhatsApp; the visitor taps Send there.
      var url = waLink(r.values);
      // No 'noopener' feature here: with it, window.open always returns null.
      var win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url;
      success(url);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
