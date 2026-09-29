/* =====================================================================
   SPACE DESIGN — DEMO CONTENT (DEMO — REPLACE BEFORE LAUNCH)
   ---------------------------------------------------------------------
   Used ONLY when Supabase is not configured, so the layout can be reviewed.
   These are NOT Space Design projects. They carry no real names, dates,
   areas, clients or locations. Once Supabase keys are set in config.js this
   file is ignored. It can be deleted before launch (also remove its
   <script> tag from partials/scripts.html and re-run tools/sync-partials.py).
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var P = 'assets/img/placeholders/';

  function img(file, alt) {
    return { id: 'm-' + file, media_type: 'image', media_url: P + file, alt_text: alt + ' (illustration, demo)', caption: 'Illustration · demo placeholder', width: 1600, height: 1100 };
  }
  function drawing(file, alt) {
    return { id: 'd-' + file, media_type: 'drawing', media_url: P + file, alt_text: alt + ' (illustration, demo)', caption: 'Diagram · demo placeholder' };
  }

  var note = 'This is demonstration content used to preview the portfolio layout. It is not a Space Design project. Replace it by adding real projects in the admin (Admin → Projects → New project).';

  var defs = [
    ['demo-architecture-project', 'Demo · Architecture Project', 'Architecture', 'Residential', 'architecture.svg', 'Illustration of a building facade with vertical louvres', true],
    ['demo-interior-project', 'Demo · Interior Project', 'Interior Design', 'Residential', 'interiors.svg', 'Illustration of an interior with timber wall and full-height glazing', true],
    ['demo-planning-project', 'Demo · Planning Project', 'Planning', 'Institutional', 'planning.svg', 'Illustration of a site plan with building footprints', true],
    ['demo-commercial-project', 'Demo · Commercial Project', 'Architecture', 'Commercial', 'hero.svg', 'Illustration of a multi-storey building with cantilevered floors', true],
    ['demo-project-management', 'Demo · Project Management', 'Project Management', 'Commercial', 'project-management.svg', 'Illustration of a building structure under construction', true],
    ['demo-hospitality-interior', 'Demo · Hospitality Interior', 'Interior Design', 'Hospitality', 'approach-form.svg', 'Illustration of an axonometric massing study', false]
  ];

  SD.demo = {
    projects: defs.map(function (d, i) {
      var hero = img(d[4], d[5]);
      return {
        id: 'demo-' + i,
        is_demo: true,
        slug: d[0],
        title: d[1],
        subtitle: 'Demo placeholder. Replace before launch.',
        category: d[2],
        project_type: d[3],
        location: 'Location to be provided',
        year: null, area: null, status: null, client: null, services: [d[2]],
        short_description: note,
        description: note,
        concept: '[CLIENT TO PROVIDE] Project concept.',
        design_approach: '[CLIENT TO PROVIDE] Design approach.',
        details: null,
        featured: d[6],
        published: true,
        featured_media: hero,
        media: [
          hero,
          img('architecture.svg', 'Illustration of a building facade'),
          img('interiors.svg', 'Illustration of an interior space'),
          drawing('planning.svg', 'Illustration of a site plan'),
          drawing('approach-function.svg', 'Illustration of a plan diagram')
        ]
      };
    })
  };
})();
