/* =====================================================================
   SPACE DESIGN — Built-in project data
   ---------------------------------------------------------------------
   Source: Space Design company profile (PDF, July 2026), supplied by the
   client. Figures are transcribed from the profile; obvious typing errors
   were corrected (see README → "Content sources").

   Used when Supabase is NOT configured, so the site shows real work from
   day one. Once Supabase is connected, the same projects are loaded from the
   database instead (supabase/seed-projects.sql inserts them).
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var IMG = 'assets/img/projects/';

  function render(file, w, h, alt) {
    return { id: 'img-' + file, media_type: 'image', media_url: IMG + file + '.webp', alt_text: alt, caption: 'Architectural rendering', width: w, height: h };
  }
  function plan(file, alt) {
    return { id: 'plan-' + file, media_type: 'plan', media_url: IMG + file + '.webp', alt_text: alt, caption: 'Layout plan', width: 1600, height: 1200 };
  }
  function specs(rows) { return rows.filter(Boolean).join('\n'); }

  var P = [
    {
      slug: 'tagore-nagar-building-18', title: 'Building No. 18, Tagore Nagar', featured: true, sort_order: 10,
      subtitle: 'Three-wing redevelopment with a parking tower',
      category: 'Redevelopment', project_type: 'Residential', status: 'Proposed',
      location: 'Tagore Nagar, Vikhroli, Mumbai', area: '1,241.53 sq m plot',
      client: 'Nalanda Co-op. Hsg. Soc. Ltd.',
      short_description: 'Proposed redevelopment of Building No. 18, Tagore Nagar, Vikhroli: three wings of ground plus 22 upper floors with a parking tower.',
      description: 'Proposed redevelopment of Building No. 18, Tagore Nagar, Vikhroli, for Nalanda Co-operative Housing Society Ltd. The scheme provides three wings of ground plus 22 upper floors, planned for maximum consumption of FSI, with a parking tower.',
      details: specs(['Developer: M/s Haware Properties', 'Plot area: 1,241.53 sq m', 'FSI (including fungible): 8.46', 'Tenements: 32 rehab + 217 sale', 'Building: Wing A, Wing B and Wing C, each ground + 22 upper floors', 'Building with parking tower; maximum consumption of FSI', '12 tenements per floor', 'Units: 1 BHK 375.00 sq ft · 2 BHK 650.00 sq ft']),
      media: [render('tagore-nagar-building-18', 532, 900, 'Rendering of a residential tower with angular facade, Building No. 18, Tagore Nagar, Vikhroli')]
    },
    {
      slug: 'pragati-icon', title: 'Pragati Icon', featured: true, sort_order: 20,
      subtitle: 'Redevelopment of Building No. 33, Pant Nagar',
      category: 'Redevelopment', project_type: 'Residential', status: 'Completed',
      location: 'Pant Nagar, Ghatkopar, Mumbai', area: '852.50 sq m plot',
      client: 'Gulmohar Co-op. Hsg. Soc. Ltd.',
      short_description: 'Redevelopment of Building No. 33, Pant Nagar, Ghatkopar: 79 tenements in a ground, stilt and 16-storey RCC building.',
      description: 'Pragati Icon is the redevelopment of Building No. 33, Pant Nagar, Ghatkopar, for Gulmohar Co-operative Housing Society Ltd.',
      details: specs(['Plot area: 852.50 sq m', 'FSI: 6.51', 'Tenements: 30 rehab + 49 sale (79)', 'Building: ground (part) + stilt + 16 upper floors', 'Structure: RCC', '5 tenements per floor', 'Units (RCA): 2 BHK 584.00 sq ft · 2 BHK 895.00 sq ft · 3 BHK 674.00 sq ft']),
      media: [render('pragati-icon', 639, 928, 'Rendering of Pragati Icon, a residential tower with timber-toned balconies, Pant Nagar, Ghatkopar')]
    },
    {
      slug: 'haware-legacy', title: 'Haware Legacy', featured: true, sort_order: 30,
      subtitle: 'Redevelopment of Building No. 16, Dindoshi',
      category: 'Redevelopment', project_type: 'Residential', status: 'Completed',
      location: 'Dindoshi, Malad, Mumbai', area: '703.25 sq m plot',
      client: 'Abhishek Co-op. Hsg. Soc. Ltd.',
      short_description: 'Redevelopment of Building No. 16, Dindoshi, Malad: 110 tenements in a ground, stilt and 22-storey RCC tower.',
      description: 'Haware Legacy is the redevelopment of Building No. 16, Dindoshi, Malad, for Abhishek Co-operative Housing Society Ltd.',
      details: specs(['Plot area: 703.25 sq m', 'FSI: 7.97', 'Tenements: 40 rehab + 70 sale (110)', 'Building: ground (part) + stilt + 22 upper floors', 'Structure: RCC', '5 tenements per floor', 'Units: 1 BHK 370.00 sq ft · 1 BHK 395.00 sq ft']),
      media: [render('haware-legacy', 519, 976, 'Rendering of Haware Legacy, a slender residential tower with curved balconies, Dindoshi, Malad')]
    },
    {
      slug: 'pant-nagar-building-3', title: 'Building No. 3, Pant Nagar', featured: true, sort_order: 40,
      subtitle: 'Mixed-use redevelopment with shops and a parking tower',
      category: 'Redevelopment', project_type: 'Residential', status: 'Ongoing',
      location: 'Pant Nagar, Ghatkopar, Mumbai', area: '1,089.33 sq m plot',
      client: 'Shree Sai Prasad Co-op. Hsg. Soc. Ltd.',
      short_description: 'Ongoing redevelopment of Building No. 3, Pant Nagar, Ghatkopar: shops on the first floor and 94 tenements above.',
      description: 'Proposed redevelopment of Building No. 3, Pant Nagar, Ghatkopar, for Shree Sai Prasad Co-operative Housing Society Ltd., planned for maximum consumption of FSI with a parking tower.',
      details: specs(['Developer: M/s Vardhman Developers', 'Plot area: 1,089.33 sq m', 'FSI (including fungible): 5.95', 'Tenements: 30 rehab + 64 sale (94)', 'Building: ground + 1st floor shops + 2nd to 15th upper floors', 'Structure: RCC', 'Building with parking tower; maximum consumption of FSI', '7 tenements per floor', 'Units: 1 BHK 473.00 sq ft · 2 BHK 620.00 sq ft · 2 BHK 630.00 sq ft']),
      media: [render('pant-nagar-building-3', 617, 970, 'Rendering of a residential tower with flowing gold-toned bands, Building No. 3, Pant Nagar, Ghatkopar')]
    },
    {
      slug: 'maharshi-nagar-colony-pune', title: 'Maharshi Nagar Colony, Pune', featured: true, sort_order: 50,
      subtitle: 'MHADA layout planning',
      category: 'Layout Planning', project_type: 'Housing Layout', status: 'Ongoing',
      location: 'Maharshi Nagar, Pune', area: '33,834.38 sq m plot',
      client: null,
      short_description: 'Revision of the MHADA layout at Maharshi Nagar, Pune: residential, commercial, amenity and recreational plots across a 33,834 sq m site.',
      description: 'Space Design is the MHADA layout architect for Maharshi Nagar, Pune, and is revising the colony layout.',
      details: specs(['Plot area: 33,834.38 sq m', 'Net plot area: 30,068.24 sq m', 'Road area: 5,657.37 sq m', 'Residential plot area: 9,532.71 sq m', 'Recreational ground (RG): 2,556.58 sq m', 'Commercial plot area: 4,317.49 sq m', 'Amenity: 1,696.82 sq m', 'Shop area: 209.36 sq m']),
      media: [plan('maharshi-nagar-layout', 'Layout plan of Maharshi Nagar Colony, Pune, showing building blocks and roads')]
    },
    {
      slug: 'tagore-nagar-building-17', title: 'Building No. 17, Tagore Nagar', featured: true, sort_order: 60,
      subtitle: 'Redevelopment with a parking tower',
      category: 'Redevelopment', project_type: 'Residential', status: 'Ongoing',
      location: 'Tagore Nagar, Vikhroli, Mumbai', area: '832.50 sq m plot',
      client: 'Nandadeep Co-op. Hsg. Soc. Ltd.',
      short_description: 'Ongoing redevelopment of Building No. 17, Tagore Nagar, Vikhroli: 128 tenements in a 22-storey RCC tower with a parking tower.',
      description: 'Proposed redevelopment of Building No. 17, Tagore Nagar, Vikhroli, for Nandadeep Co-operative Housing Society Ltd., planned for maximum consumption of FSI with a parking tower.',
      details: specs(['Developer: M/s Priti Infra Builders LLP', 'Plot area: 832.50 sq m', 'FSI (including fungible): 8.57', 'Tenements: 32 rehab + 96 sale (128)', 'Building: ground (part) + stilt (part) + 22 upper floors', 'Structure: RCC', 'Building with parking tower; maximum consumption of FSI', '6 tenements per floor', 'Units (RCA): 1 BHK 409.00 sq ft · 1 BHK 443.00 sq ft · 2 BHK 508.00 sq ft · 2 BHK 587.00 sq ft · 2 BHK 608.00 sq ft']),
      media: [render('tagore-nagar-building-17', 565, 1047, 'Rendering of a residential tower with a commercial podium, Building No. 17, Tagore Nagar, Vikhroli')]
    },
    {
      slug: 'pragati-reventa', title: 'Pragati Reventa', featured: false, sort_order: 70,
      subtitle: 'Redevelopment of Building No. 48, Pant Nagar',
      category: 'Redevelopment', project_type: 'Residential', status: 'Completed',
      location: 'Pant Nagar, Ghatkopar, Mumbai', area: '867.00 sq m plot',
      client: 'Sindhudurga Co-op. Hsg. Soc. Ltd.',
      short_description: 'Redevelopment of Building No. 48, Pant Nagar, Ghatkopar: 79 tenements in a 16-storey RCC building.',
      description: 'Pragati Reventa is the redevelopment of Building No. 48, Pant Nagar, Ghatkopar, for Sindhudurga Co-operative Housing Society Ltd.',
      details: specs(['Plot area: 867.00 sq m', 'FSI (including fungible): 6.51', 'Tenements: 30 rehab + 49 sale (79)', 'Building: ground (part) + stilt (part) + 16 upper floors', 'Structure: RCC', '6 tenements per floor', 'Units (RCA): 1 BHK 369.00 sq ft · 1 BHK 541.00 sq ft · 2 BHK 719.00 sq ft · 2 BHK 657.00 sq ft · 2 BHK 574.00 sq ft']),
      media: [render('pragati-reventa', 565, 940, 'Rendering of Pragati Reventa, a pale residential tower, Pant Nagar, Ghatkopar')]
    },
    {
      slug: 'tagore-nagar-building-38', title: 'Building No. 38, Tagore Nagar', featured: false, sort_order: 80,
      subtitle: 'Redevelopment for V.P. Realty',
      category: 'Redevelopment', project_type: 'Residential', status: 'Completed',
      location: 'Tagore Nagar, Vikhroli, Mumbai', area: '1,058.29 sq m plot',
      client: 'Shree Dhanlaxmi Co-op. Hsg. Soc. Ltd.',
      short_description: 'Redevelopment of Building No. 38, Tagore Nagar, Vikhroli: 171 tenements in a 30-storey RCC tower.',
      description: 'Redevelopment of Building No. 38, Tagore Nagar, Vikhroli, for Shree Dhanlaxmi Co-operative Housing Society Ltd., with V.P. Realty as developer.',
      details: specs(['Developer: M/s V.P. Realty', 'Plot area: 1,058.29 sq m', 'FSI: 8.66', 'Tenements: 32 rehab + 139 sale (171)', 'Building: ground + 1st to 30th upper floors', 'Structure: RCC', '6 tenements per floor', 'Units (RCA): 1 BHK 399.00 sq ft · 1 BHK 376.00 sq ft · 1 BHK 470.00 sq ft · 2 BHK 575.00 sq ft · 2 BHK 595.00 sq ft']),
      media: [render('vp-realty-tagore-nagar', 763, 1320, 'Rendering of a 30-storey residential tower, Building No. 38, Tagore Nagar, Vikhroli')]
    },
    {
      slug: 'kannamwar-nagar-building-80', title: 'Building No. 80, Kannamwar Nagar', featured: false, sort_order: 90,
      subtitle: 'Redevelopment with a commercial ground floor',
      category: 'Redevelopment', project_type: 'Residential', status: 'Ongoing',
      location: 'Kannamwar Nagar, Vikhroli, Mumbai', area: '771.81 sq m plot',
      client: 'Sai Ganesh Co-op. Hsg. Soc. Ltd.',
      short_description: 'Ongoing redevelopment of Building No. 80, Kannamwar Nagar, Vikhroli: 126 tenements above a commercial ground floor.',
      description: 'Proposed redevelopment of Building No. 80, Kannamwar Nagar, Vikhroli, for Sai Ganesh Co-operative Housing Society Ltd., planned for maximum consumption of FSI with a parking tower.',
      details: specs(['Developer: M/s Vardhman Developers', 'Plot area: 771.81 sq m', 'FSI (including fungible): 7.13', 'Tenements: 32 rehab + 94 sale (126)', 'Building: ground (commercial) + 1st to 22nd upper floors', 'Structure: RCC', 'Building with parking tower; maximum consumption of FSI', '6 tenements per floor', 'Units: 1 BHK 375.00 sq ft · 1 BHK 387.00 sq ft · 2 BHK 586.00 sq ft']),
      media: [render('kannamwar-nagar-building-80', 639, 1008, 'Rendering of a residential tower, Building No. 80, Kannamwar Nagar, Vikhroli')]
    },
    {
      slug: 'saint-tukaram-nagar-pune', title: 'Saint Tukaram Nagar, Pune', featured: false, sort_order: 100,
      subtitle: 'MHADA layout planning',
      category: 'Layout Planning', project_type: 'Housing Layout', status: null,
      location: 'Saint Tukaram Nagar, Pune', area: '40.50 ha',
      client: null,
      short_description: 'MHADA layout at Saint Tukaram Nagar, Pune: a 40.5-hectare scheme of residential, commercial, amenity and open-space areas.',
      description: 'Space Design is the MHADA layout architect for Saint Tukaram Nagar, Pune.',
      details: specs(['Total area of land: 40.50 ha', 'Net area under scheme: 35.5307 ha', 'Area under residence: 19.3021 ha', 'Area under amenity: 4.8990 ha', 'Area under open space: 2.3556 ha', 'Area under commercial: 1.2837 ha', 'Area under DP road: 5.2966 ha', 'Area under scheme road: 7.6483 ha']),
      media: [plan('saint-tukaram-nagar-layout', 'Existing layout plan of Saint Tukaram Nagar, Pune, with open spaces, schools and commercial plots')]
    },
    {
      slug: 'titwala-layout-kalyan', title: 'Titwala Layout, Kalyan', featured: false, sort_order: 110,
      subtitle: 'MHADA layout planning',
      category: 'Layout Planning', project_type: 'Housing Layout', status: 'Ongoing',
      location: 'Titwala, Kalyan', area: '11.6701 ha housing scheme',
      client: null,
      short_description: 'Revision of the MHADA layout at Titwala, Kalyan: an 11.67-hectare housing scheme with roads, open space, a primary school and commercial complex.',
      description: 'Space Design is the MHADA layout architect for the Titwala layout and is revising it.',
      details: specs(['Area under housing scheme: 11.6701 ha', 'Area under residence: 7.5906 ha', 'Area under scheme road: 1.9480 ha', 'Area under open space: 1.2459 ha', 'Area under commercial complex: 0.6367 ha', 'Area under primary school: 0.2509 ha']),
      media: [plan('titwala-layout', 'Layout plan of the Titwala housing scheme, Kalyan, with plots, roads and a nalla')]
    }
  ];

  P.forEach(function (p, i) {
    p.id = 'builtin-' + i;
    p.published = true;
    p.year = null;
    p.services = p.category === 'Layout Planning' ? ['Planning'] : [];
    p.featured_media = p.media[0];
  });

  SD.builtin = { projects: P };
})();
