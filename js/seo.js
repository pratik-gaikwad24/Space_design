/* =====================================================================
   SPACE DESIGN — SEO helpers: meta tags + reusable Schema.org JSON-LD
   Only facts supplied by the client are encoded here.
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var cfg = window.SD_CONFIG || {};
  var SITE = (cfg.SITE_URL || window.location.origin).replace(/\/$/, '');

  var BUSINESS = Object.freeze({
    name: 'Space Design',
    description: 'Architects, planners, interior designers and project management consultant specialising in housing-society redevelopment, with 30 years of experience. Offices in Navi Mumbai and Pune.',
    principal: 'Milind Fulzele',
    offices: [
      {
        id: 'office-navi-mumbai',
        name: 'Space Design, Head Office, Navi Mumbai',
        streetAddress: 'Office No. 1101 & 1108, 11th Floor, Satra Plaza, Plot No. 19 & 20, Palm Beach Road, Sector 19D, Vashi',
        locality: 'Navi Mumbai', postalCode: '400703',
        telephone: ['+91-22-46043901', '+91-22-45003902', '+91-9833175033', '+91-9869076963'],
        email: ['spacedesign@rediffmail.com', 'spacedesign1108@gmail.com']
      },
      {
        id: 'office-pune',
        name: 'Space Design, Branch Office, Pune',
        streetAddress: 'Office No. 504, 5th Floor, Conclave, CTS No. 1701/B, F.P. No. 100, Bhamburda, Shivaji Nagar',
        locality: 'Pune', postalCode: '411005',
        telephone: ['+91-20-29910526', '+91-9833175033'],
        email: ['spacedesign504@gmail.com']
      }
    ]
  });

  function abs(path) {
    if (!path) return SITE + '/';
    if (/^https?:\/\//i.test(path)) return path;
    return SITE + '/' + String(path).replace(/^\.?\//, '');
  }

  /* ---------- meta ---------- */
  function upsertMeta(attr, key, content) {
    if (content === undefined || content === null) return;
    var el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', content);
  }
  function setCanonical(url) {
    var link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = url;
  }

  /** Update title, description, canonical, Open Graph and Twitter tags. */
  function setMeta(o) {
    if (o.title) { document.title = o.title; upsertMeta('property', 'og:title', o.title); upsertMeta('name', 'twitter:title', o.title); }
    if (o.description) { upsertMeta('name', 'description', o.description); upsertMeta('property', 'og:description', o.description); upsertMeta('name', 'twitter:description', o.description); }
    if (o.canonical) { setCanonical(o.canonical); upsertMeta('property', 'og:url', o.canonical); }
    if (o.image) { upsertMeta('property', 'og:image', abs(o.image)); upsertMeta('name', 'twitter:image', abs(o.image)); }
    if (o.imageAlt) upsertMeta('property', 'og:image:alt', o.imageAlt);
    if (o.type) upsertMeta('property', 'og:type', o.type);
    if (o.noindex) upsertMeta('name', 'robots', 'noindex, follow');
  }

  /* ---------- JSON-LD builders ---------- */
  function organization() {
    return {
      '@type': 'Organization',
      '@id': SITE + '/#organization',
      name: BUSINESS.name,
      url: SITE + '/',
      logo: SITE + '/assets/icons/logo-mark.svg',
      description: BUSINESS.description,
      knowsAbout: ['Housing society redevelopment', 'Self-redevelopment', 'MHADA redevelopment', 'Project Management Consultancy', 'Architecture', 'Layout planning', 'Interior Design'],
      founder: { '@id': SITE + '/#milind-fulzele' },
      department: BUSINESS.offices.map(function (o) { return { '@id': SITE + '/#' + o.id }; })
    };
  }
  function offices() {
    return BUSINESS.offices.map(function (o) {
      return {
        '@type': 'ProfessionalService',
        '@id': SITE + '/#' + o.id,
        name: o.name,
        parentOrganization: { '@id': SITE + '/#organization' },
        url: SITE + '/contact.html',
        image: SITE + '/assets/img/og-default.jpg',
        address: { '@type': 'PostalAddress', streetAddress: o.streetAddress, addressLocality: o.locality, addressRegion: 'Maharashtra', postalCode: o.postalCode, addressCountry: 'IN' },
        telephone: o.telephone,
        email: o.email
      };
    });
  }
  function person() {
    return { '@type': 'Person', '@id': SITE + '/#milind-fulzele', name: BUSINESS.principal, honorificPrefix: 'Ar.', jobTitle: 'Founder and Principal Architect', worksFor: { '@id': SITE + '/#organization' }, alumniOf: { '@type': 'CollegeOrUniversity', name: 'Sir J.J. College of Architecture, University of Mumbai' }, memberOf: { '@type': 'Organization', name: 'The Indian Institute of Architects' } };
  }
  function webPage(o) {
    return {
      '@type': o.type || 'WebPage',
      '@id': o.url + '#webpage',
      url: o.url,
      name: o.name,
      description: o.description,
      isPartOf: { '@id': SITE + '/#website' },
      about: { '@id': SITE + '/#organization' },
      inLanguage: 'en-IN'
    };
  }
  /** items: [{ name, url }] */
  function breadcrumb(items) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map(function (it, i) { return { '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.url) }; })
    };
  }
  function imageObject(m) {
    return { '@type': 'ImageObject', contentUrl: abs(m.media_url), caption: m.caption || undefined, description: m.alt_text || undefined };
  }
  /** Portfolio project → CreativeWork (only fields that exist). */
  function project(p, url) {
    var o = {
      '@type': 'CreativeWork',
      '@id': url + '#project',
      name: p.title,
      url: url,
      description: p.seo_description || p.short_description || undefined,
      genre: p.category || undefined,
      keywords: [p.category, p.project_type, p.location].filter(Boolean).join(', ') || undefined,
      creator: { '@id': SITE + '/#organization' },
      locationCreated: p.location ? { '@type': 'Place', name: p.location } : undefined,
      dateCreated: /^\d{4}$/.test(p.year || '') ? p.year : undefined
    };
    var imgs = (p.media || []).filter(function (m) { return m.media_type === 'image'; }).slice(0, 6).map(imageObject);
    if (imgs.length) o.image = imgs;
    var vids = (p.media || []).filter(function (m) { return m.media_type === 'video'; }).map(function (m) {
      return { '@type': 'VideoObject', name: m.caption || p.title, description: m.alt_text || p.title, contentUrl: abs(m.media_url), thumbnailUrl: m.poster_url ? abs(m.poster_url) : undefined, uploadDate: m.created_at || undefined };
    }).filter(function (v) { return v.thumbnailUrl && v.uploadDate; });
    if (vids.length) o.video = vids;
    return JSON.parse(JSON.stringify(o)); // strip undefined
  }
  function faq(items) {
    return { '@type': 'FAQPage', mainEntity: items.map(function (q) { return { '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } }; }) };
  }

  /** Inject/replace a JSON-LD block. */
  function jsonLd(graph, id) {
    var el = id ? document.getElementById(id) : null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      if (id) el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': Array.isArray(graph) ? graph : [graph] });
  }

  /** Build a BreadcrumbList from the visible .breadcrumb nav, if present. */
  function breadcrumbFromDom() {
    var links = document.querySelectorAll('.breadcrumb li');
    if (!links.length) return null;
    var items = [];
    links.forEach(function (li) {
      var a = li.querySelector('a');
      items.push({ name: li.textContent.trim(), url: a ? a.getAttribute('href') : window.location.pathname.replace(/^\//, '') + window.location.search });
    });
    return breadcrumb(items);
  }

  /** Optional admin-editable overrides stored in site_settings.seo_pages. */
  async function applyPageOverrides() {
    var key = document.body && document.body.dataset.page;
    if (!key || !SD.api || !SD.supabaseConfigured || key === 'project' || key === 'admin') return;
    try {
      var res = await SD.api.getSettings(['seo_pages']);
      var o = res.data && res.data.seo_pages && res.data.seo_pages[key];
      if (o && (o.title || o.description)) setMeta({ title: o.title, description: o.description });
    } catch (e) { /* ignore */ }
  }

  function init() {
    var page = document.body && document.body.dataset.page;
    // Home and contact carry the full static entity graph; other pages get the
    // organisation reference + breadcrumbs so every page links to the entity.
    if (page && page !== 'home' && page !== 'project' && page !== 'admin') {
      var graph = [organization(), person()];
      var bc = breadcrumbFromDom();
      if (bc) graph.push(bc);
      jsonLd(graph, 'sd-entity-jsonld');
    }
    applyPageOverrides();
  }

  SD.seo = {
    SITE: SITE, BUSINESS: BUSINESS, abs: abs,
    setMeta: setMeta, jsonLd: jsonLd,
    organization: organization, offices: offices, person: person, webPage: webPage,
    breadcrumb: breadcrumb, project: project, imageObject: imageObject, faq: faq
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
