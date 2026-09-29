/* =====================================================================
   SPACE DESIGN — Supabase client + data access layer
   Uses the self-hosted UMD build in js/vendor/supabase.js (window.supabase).
   Only the public anon key is used in the browser; all authorisation is
   enforced server-side by Row Level Security (supabase/schema.sql).
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var cfg = window.SD_CONFIG || {};

  var configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$|^https:\/\/[a-z0-9.-]+$/i.test(cfg.SUPABASE_URL.replace(/\/$/, '')));
  var isAdminArea = /\/admin\//.test(window.location.pathname);
  var client = null;

  if (configured && window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(cfg.SUPABASE_URL.replace(/\/$/, ''), cfg.SUPABASE_ANON_KEY, {
      auth: {
        // Public pages never need a session → nothing is written to browser storage.
        persistSession: isAdminArea,
        autoRefreshToken: isAdminArea,
        detectSessionInUrl: false,
        storageKey: 'sd-admin-auth'
      }
    });
  }

  var useDemo = !client && cfg.SHOW_DEMO_CONTENT_WHEN_UNCONFIGURED !== false && !isAdminArea;

  var CARD_FIELDS = 'id,title,slug,subtitle,category,project_type,location,year,services,short_description,featured,sort_order,created_at,' +
    'featured_media:project_media!projects_featured_media_fk(id,media_type,media_url,poster_url,alt_text,width,height)';

  function demo() { return (SD.demo && SD.demo.projects) || []; }

  /** Generic, non-revealing error for the UI (the raw error is only logged). */
  function fail(error, context) {
    if (window.console && error) console.warn('[Space Design] ' + (context || 'request') + ' failed:', error.message || error);
    return { data: null, error: { message: 'Something went wrong while loading content. Please try again later.' } };
  }

  var api = {
    /** Published projects for listings. opts: { featured, limit } */
    listProjects: async function (opts) {
      opts = opts || {};
      if (!client) {
        if (!useDemo) return { data: [], error: null, demo: false };
        var list = demo().filter(function (p) { return !opts.featured || p.featured; });
        return { data: opts.limit ? list.slice(0, opts.limit) : list, error: null, demo: true };
      }
      var q = client.from('projects').select(CARD_FIELDS)
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (opts.featured) q = q.eq('featured', true);
      if (opts.category) q = q.eq('category', opts.category);
      if (opts.limit) q = q.limit(opts.limit);
      var res = await q;
      if (res.error) return fail(res.error, 'listProjects');
      return { data: res.data || [], error: null, demo: false };
    },

    /** Single published project + its media, by slug. */
    getProject: async function (slug) {
      if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { data: null, error: null };
      if (!client) {
        if (!useDemo) return { data: null, error: null };
        var p = demo().filter(function (d) { return d.slug === slug; })[0] || null;
        return { data: p, error: null, demo: true };
      }
      var res = await client.from('projects').select('*').eq('slug', slug).eq('published', true).maybeSingle();
      if (res.error) return fail(res.error, 'getProject');
      if (!res.data) return { data: null, error: null };
      var media = await client.from('project_media').select('*')
        .eq('project_id', res.data.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (media.error) return fail(media.error, 'getProjectMedia');
      res.data.media = media.data || [];
      res.data.featured_media = res.data.media.filter(function (m) { return m.id === res.data.featured_media_id; })[0] || null;
      res.data.featured_video = res.data.media.filter(function (m) { return m.id === res.data.featured_video_id; })[0] || null;
      return { data: res.data, error: null, demo: false };
    },

    /** Related projects: same category (fallback: any), excluding one id. */
    relatedProjects: async function (category, excludeId, limit) {
      var all = await api.listProjects({});
      if (all.error || !all.data) return all;
      var others = all.data.filter(function (p) { return p.id !== excludeId; });
      var same = others.filter(function (p) { return category && p.category === category; });
      var rest = others.filter(function (p) { return same.indexOf(p) === -1; });
      return { data: same.concat(rest).slice(0, limit || 3), error: null, demo: all.demo };
    },

    /** Public site settings by key → object map. */
    getSettings: async function (keys) {
      if (!client) return { data: {}, error: null };
      var q = client.from('site_settings').select('key,value');
      if (keys && keys.length) q = q.in('key', keys);
      var res = await q;
      if (res.error) return fail(res.error, 'getSettings');
      var map = {};
      (res.data || []).forEach(function (row) { map[row.key] = row.value; });
      return { data: map, error: null };
    },

    /** Insert an enquiry. Returns { ok, rateLimited }. Never surfaces DB errors. */
    submitEnquiry: async function (payload) {
      if (!client) return { ok: false, notConfigured: true };
      var res = await client.from('contact_submissions').insert(payload);
      if (res.error) {
        var rl = /rate_limited/.test(res.error.message || '');
        if (window.console) console.warn('[Space Design] enquiry rejected');
        return { ok: false, rateLimited: rl };
      }
      return { ok: true };
    }
  };

  SD.db = client;
  SD.api = api;
  SD.supabaseConfigured = !!client;
  SD.demoMode = useDemo;
})();
