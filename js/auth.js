/* =====================================================================
   SPACE DESIGN — Admin authentication (Supabase Auth)
   • Email + password sign-in only. There is NO sign-up UI; disable public
     sign-ups in Supabase (Authentication → Providers → Email).
   • After sign-in the user's role is read from public.profiles. Non-admins
     are signed out immediately.
   • This page-level guard is a UX layer. The real protection is Row Level
     Security: without an admin profile, every write/read of private data is
     rejected by the database regardless of what the browser does.
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});

  var ADMIN_PAGES = ['dashboard', 'projects', 'project-editor', 'media', 'enquiries', 'services', 'locations', 'settings'];

  function safeNext(next) {
    // Only allow redirecting to known admin pages (prevents open redirects).
    var m = /^([a-z\-]+)\.html(\?id=[0-9a-f\-]{36})?$/.exec(next || '');
    return m && ADMIN_PAGES.indexOf(m[1]) > -1 ? next : 'dashboard.html';
  }

  async function getAdminProfile(user) {
    var res = await SD.db.from('profiles').select('id, full_name, role').eq('id', user.id).maybeSingle();
    if (res.error || !res.data || res.data.role !== 'admin') return null;
    return res.data;
  }

  /** Guard for every admin page except login. Resolves { user, profile } or redirects. */
  async function requireAdmin() {
    if (!SD.db) return { notConfigured: true };
    var here = window.location.pathname.split('/').pop() + window.location.search;
    var s = await SD.db.auth.getSession();
    var session = s.data && s.data.session;
    if (!session) {
      window.location.replace('login.html?next=' + encodeURIComponent(here));
      return null;
    }
    // Verify the user with the Auth server (not only the locally stored token).
    var u = await SD.db.auth.getUser();
    if (u.error || !u.data || !u.data.user) {
      await SD.db.auth.signOut();
      window.location.replace('login.html?next=' + encodeURIComponent(here));
      return null;
    }
    var profile = await getAdminProfile(u.data.user);
    if (!profile) {
      await SD.db.auth.signOut();
      window.location.replace('login.html?error=unauthorized');
      return null;
    }
    SD.db.auth.onAuthStateChange(function (event) {
      if (event === 'SIGNED_OUT') window.location.replace('login.html');
    });
    return { user: u.data.user, profile: profile };
  }

  async function logout() {
    if (SD.db) await SD.db.auth.signOut();
    window.location.replace('login.html');
  }

  /* ---------- Login page ---------- */
  function initLogin() {
    var form = document.querySelector('[data-login-form]');
    if (!form) return;
    var alertBox = document.querySelector('[data-login-alert]');
    var submit = form.querySelector('button[type="submit"]');
    var params = new URLSearchParams(window.location.search);
    var failures = 0, lockedUntil = 0;

    function show(msg, ok) {
      alertBox.textContent = msg;
      alertBox.classList.toggle('alert--success', !!ok);
      alertBox.hidden = false;
      alertBox.focus();
    }

    if (!SD.db) {
      document.querySelector('[data-config-warning]').hidden = false;
      submit.disabled = true;
      return;
    }
    if (params.get('error') === 'unauthorized') show('This account does not have administrator access.');

    // Already signed in as admin → go straight to the dashboard.
    SD.db.auth.getSession().then(async function (s) {
      if (s.data && s.data.session) {
        var u = await SD.db.auth.getUser();
        if (u.data && u.data.user && await getAdminProfile(u.data.user)) window.location.replace(safeNext(params.get('next')));
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (Date.now() < lockedUntil) {
        show('Too many attempts. Please wait ' + Math.ceil((lockedUntil - Date.now()) / 1000) + ' seconds.');
        return;
      }
      var email = form.elements.email.value.trim();
      var password = form.elements.password.value;
      if (!email || !password) { show('Enter your email and password.'); return; }

      submit.disabled = true;
      submit.querySelector('[data-label]').textContent = 'Signing in…';
      var res = await SD.db.auth.signInWithPassword({ email: email, password: password });
      if (res.error || !res.data.user) {
        failures += 1;
        if (failures >= 5) { lockedUntil = Date.now() + 30000; failures = 0; }
        show('Sign-in failed. Check your email and password.');
      } else if (!(await getAdminProfile(res.data.user))) {
        await SD.db.auth.signOut();
        show('This account does not have administrator access.');
      } else {
        form.elements.password.value = '';
        window.location.replace(safeNext(params.get('next')));
        return;
      }
      submit.disabled = false;
      submit.querySelector('[data-label]').textContent = 'Sign in';
    });
  }

  SD.auth = { requireAdmin: requireAdmin, logout: logout, initLogin: initLogin };

  if (document.body && document.body.dataset.adminPage === 'login') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLogin);
    else initLogin();
  }
})();
