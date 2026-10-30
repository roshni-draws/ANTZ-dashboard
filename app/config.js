/* ═══════════════════════════════════════════════════════════════════════
   ANTZ HOME · CONFIG
   Everything the app shows lives here. app.js only reads this object, so
   most changes (a new module, new stats, a different dashboard layout) are edits
   to this file and nothing else. See README.md for step-by-step recipes.
   Plain script (no ES modules) so index.html works by double-clicking it.
   ═══════════════════════════════════════════════════════════════════════ */
window.ANTZ_CONFIG = {

  /* ── The signed-in user ─────────────────────────────────────────────── */
  user: { first: 'Roshni', full: 'Roshni Shenoy', initials: 'RS', role: 'Curator', date: 'Thursday 29 October' },

  /* ── Appearance: 'system' follows the device; 'light' or 'dark' forces one.
     A person's own choice (header toggle / avatar menu) is saved and wins over this. ── */
  theme: 'system',

  /* ── Sites: shown in the header site switcher. data.js gives each one its own
     sample numbers; "All sites" (always first in the switcher) is their sum. ── */
  sites: ['Crimson Frosted', 'Clearspring', 'Hollowpine', 'Foxglen', 'Ambergrove', 'Silverbrook', 'Redcliff', 'Mistvale', 'Larkspur'],

  /* ── Images: drop files into assets/img/ and map them here (see assets/img/CREDITS.md).
     Keys: species names, animal IDs, 'collectionsHero', 'announcement:<index>', 'avatar:<initials>'.
     Anything without an entry shows the grey placeholder, so the app never loads a missing file. ── */
  images: {
    'Persian Leopard': 'assets/img/leopard.jpg',
    'PL-014': 'assets/img/cubs.jpg',      /* Zara and Kian are 6-month cubs */
    'PL-015': 'assets/img/cubs.jpg',
    'African Wild Dog': 'assets/img/wild-dog.jpg',
    'Asiatic Lion': 'assets/img/lion.jpg',
    'Indian Rhinoceros': 'assets/img/rhino.jpg',
    'Great Hornbill': 'assets/img/hornbill.jpg',
    'Gharial': 'assets/img/gharial.jpg',
    'Indian Star Tortoise': 'assets/img/tortoise.jpg',
    'Purple Frog': 'assets/img/purple-frog.jpg',
    collectionsHero: 'assets/img/savannah.jpg',
    dashHero: 'assets/img/savannah.jpg',
    'announcement:0': 'assets/img/cubs.jpg',
    'announcement:1': 'assets/img/wild-dog-pack.jpg'
    /* No 'avatar:RS' photo: the header avatar shows initials. */
  },

  /* ── Photo credits: shown under Profile menu > Photo credits. One row per bundled
     photo; CC BY / CC BY-SA licences require this attribution. ── */
  credits: [
    { file: 'leopard.jpg', subject: 'Indian leopard, Jawai', author: 'Tisha Mukherjee', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Indian_leopard_in_Jawai_Bandh_April_2025_by_Tisha_Mukherjee_02.jpg' },
    { file: 'wild-dog.jpg', subject: 'African wild dog', author: 'Mathias Appel', licence: 'CC0 1.0', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'https://commons.wikimedia.org/wiki/File:African_wild_dog_(25130605669).jpg' },
    { file: 'lion.jpg', subject: 'Asiatic lion, Gir National Park', author: 'Rohit Sharma', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Portrait_of_an_Asiatic_lion_at_Gir_National_Park_02.jpg' },
    { file: 'rhino.jpg', subject: 'Indian rhinoceros', author: 'Charles J. Sharp', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Indian_rhinoceros_(Rhinoceros_unicornis)_4.jpg' },
    { file: 'hornbill.jpg', subject: 'Great hornbill', author: 'Malyasri Bhattacharya', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Great_Hornbill_(Buceros_bicornis).jpg' },
    { file: 'gharial.jpg', subject: 'Gharial, female and juvenile', author: 'Charles J. Sharp', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Gharial_(Gavialis_gangeticus)_female_and_juvenile.jpg' },
    { file: 'tortoise.jpg', subject: 'Indian star tortoise, Gujarat', author: 'Malaika the jackal researcher', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Indian_star_tortoise_(Geochelone_elegans)_in_Gujarat.jpg' },
    { file: 'purple-frog.jpg', subject: 'Purple frog', author: 'Karthickbala (ta.wikipedia)', licence: 'CC BY-SA 3.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Nasikabatrachus_sahyadrensis.jpg' },
    { file: 'savannah.jpg', subject: 'Savanna grassland', author: 'Javier Puig Ochoa', licence: 'CC BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/', source: 'https://commons.wikimedia.org/wiki/File:Savanna_Grasslands_(199168845).jpeg' },
    { file: 'cubs.jpg', subject: 'Leopard cubs, Satpura', author: 'Siddharth Biniwale', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Leopard_Cubs_Satpura.jpg' },
    { file: 'wild-dog-pack.jpg', subject: 'African wild dog pack', author: 'Bernard Dupont', licence: 'CC BY-SA 2.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/', source: 'https://commons.wikimedia.org/wiki/File:African_Wild_Dogs_(Lycaon_pictus)_pack_..._(52996795047).jpg' }
  ],

  /* ── Modules ────────────────────────────────────────────────────────────
     One entry per module. Each one automatically becomes an App Library row, a search
     result and a stats widget in the widget gallery (Small / Medium / Large).
       id           unique key used everywhere (layout, pins, notifications)
       name, sub    label and one-line description
       icon         Material Symbols name (https://fonts.google.com/icons)
       colour       tile colour. glyph: 'light' = white icon, 'dark' = navy icon (use 'dark' on pale colours)
       group        shown under the name in search results
       badge        optional count on the icon; badgeLabel is read by screen readers ("3 unread")
       widget       optional custom renderer name in app.js (WIDGETS); default is 'stats'
       chart        chart type for the stats widget: 'line' | 'area' | 'columns' | 'stackedBar' |
                    'donut' | 'hbar' | 'gauge' | 'heatmap'. The numbers come from data.js
                    (moduleStats) for the selected site; 'stats' below is the fallback.
       stats        data for the default stats widget:
                      k  [headline, label]                    Small
                      t  short trend pill                     Small
                      m  [[value, label], …] first 3 used     Medium + Large
                      c  { type: 'bars' | 'line' | 'donut', d: [numbers], cap: 'caption' }   (donut: d = [percent])
                      l  [[item, value], …] top 3             Large
       shortcuts    optional long-press menu entries: { label, toast?, open?: { …app options }, focus?: '#selector' }
       description  optional text for the widget gallery
     A module without its own app screen in index.html opens on its Large stats view. */
  modules: [
    { id: 'notes', name: 'Notes & Collections', sub: 'Observation notes, grouped', icon: 'sticky_note_2', colour: '#E3C24A', glyph: 'dark', group: 'Records', widget: 'notes', description: 'Recent observation notes and their collections.', shortcuts: [{ label: 'New note', toast: 'New note · opens the note editor' }, { label: 'Search notes', focus: '#noteQ' }] },
    { id: 'collections', name: 'Collections', sub: 'Species Management', icon: 'pets', colour: '#1D7E4C', glyph: 'light', group: 'Animals', widget: 'collections', description: 'Species and animal totals for the selected site.', shortcuts: [{ label: 'Add a species', toast: 'Add a species' }, { label: 'Persian Leopard', open: { level: 'species', species: 0 } }] },
    { id: 'announcements', name: 'Announcements', sub: 'News for everyone', icon: 'campaign', colour: '#00ABAB', glyph: 'light', group: 'Team', badge: 2, badgeLabel: 'unread', widget: 'announcements', description: 'The latest news for everyone, with important items first.', shortcuts: [{ label: 'Post an announcement', toast: 'Post an announcement' }] },
    { id: 'communication', name: 'Communication', sub: 'Chats with your teams', icon: 'chat', colour: '#39656E', glyph: 'light', group: 'Team', badge: 3, badgeLabel: 'unread', widget: 'communication', description: 'Unread chats from your teams.', shortcuts: [{ label: 'New message', toast: 'New message' }, { label: 'Kai Vance', open: { chat: 0 } }] },
    { id: 'focus', name: 'Focus Hub', sub: 'Likes and bookmarks', icon: 'bookmarks', colour: '#8479F9', glyph: 'light', group: 'Team', widget: 'focus', description: 'Counts of what you liked and bookmarked, plus recent saves.', shortcuts: [{ label: 'Liked', open: { tab: 'liked' } }, { label: 'Bookmarked', open: { tab: 'bm' } }] },
    { id: 'help', name: 'Help Desk', sub: 'Tickets and support', icon: 'support_agent', colour: '#00AFD6', glyph: 'light', group: 'Admin', badge: 2, badgeLabel: 'open tickets', widget: 'help', description: 'Your open tickets and a quick way to raise one.', shortcuts: [{ label: 'Raise a ticket', open: { form: 1 } }] },
    { id: 'medical', chart: 'line', name: 'Medical', sub: 'Treatments', icon: 'medical_services', colour: '#549C76', glyph: 'light', group: 'Medical & care',
      stats: { k: ['12', 'animals in treatment'], t: '↑ 2 this week', m: [['12', 'In treatment'], ['27', 'Follow-ups overdue'], ['5', 'In hospital'], ['3', 'Critical']], c: { type: 'bars', d: [4, 2, 1, 3, 0, 1, 0, 1, 0], cap: 'In treatment by site' }, l: [['Tara · PL-001', 'Wound care'], ['Gharial 07', 'Respiratory'], ['Rhino 02', 'Foot abscess']] } },
    { id: 'administer', chart: 'stackedBar', name: 'Administer', sub: 'Vaccines, deworming', icon: 'vaccines', colour: '#A4B8AC', glyph: 'dark', group: 'Medical & care',
      stats: { k: ['462', 'doses overdue'], t: '↑ 31 since Monday', m: [['143', 'Vaccines overdue'], ['319', 'Deworming overdue'], ['58', 'Due this week']], c: { type: 'bars', d: [96, 74, 61, 55, 48, 41, 37, 29, 21], cap: 'Overdue doses by site' }, l: [['Indian Star Tortoise', '96'], ['Gharial', '41'], ['Asiatic Lion', '18']] } },
    { id: 'animals', chart: 'area', name: 'Animals', sub: 'Records, sexing, microchips', icon: 'cruelty_free', colour: '#37BD69', glyph: 'light', group: 'Animals',
      stats: { k: ['643', 'newly added'], t: 'across 9 sites', m: [['110,020', 'Animals'], ['643', 'Newly added'], ['28,532', 'Sexing pending'], ['20,302', 'Microchip pending']], c: { type: 'bars', d: [120, 96, 88, 80, 71, 64, 52, 40, 32], cap: 'New animals by site' }, l: [['Crimson Frosted', '120'], ['Clearspring', '96'], ['Hollowpine', '88']] } },
    { id: 'housing', chart: 'donut', name: 'Housing', sub: 'Sites, sections, enclosures', icon: 'home_work', colour: '#5A8088', glyph: 'light', group: 'Animals',
      stats: { k: ['86%', 'enclosures occupied'], t: '9 inspections overdue', m: [['9', 'Sites'], ['115', 'Sections'], ['9,937', 'Enclosures'], ['86%', 'Occupied']], c: { type: 'donut', d: [86], cap: 'Occupancy across 9,937 enclosures' }, l: [['Big Cat House · E4', 'Inspection'], ['Aviary 2', 'Inspection'], ['Reptile House · R9', 'Repair']] } },
    { id: 'diet', chart: 'heatmap', name: 'Diet', sub: 'Diet plans and kitchen', icon: 'restaurant', colour: '#FB7456', glyph: 'light', group: 'Medical & care',
      stats: { k: ['412', 'feeds today'], t: '24 still to do', m: [['412', 'Feeds today'], ['388', 'Done'], ['24', 'Pending'], ['3', 'Diet changes']], c: { type: 'line', d: [380, 402, 395, 410, 398, 405, 412], cap: 'Feeds per day · 7 days' }, l: [['Carnivore Section', '16:00'], ['Primates', '16:30'], ['Aviary', '17:00']] } },
    { id: 'lab', chart: 'columns', name: 'Lab', sub: 'Samples, results', icon: 'science', colour: '#D4BA78', glyph: 'dark', group: 'Medical & care',
      stats: { k: ['41', 'results to review'], t: '6 flagged', m: [['41', 'To review'], ['76', 'In process'], ['6', 'Flagged']], c: { type: 'bars', d: [14, 9, 7, 6, 5], cap: 'To review by test type' }, l: [['Blood panel · PL-001', 'Flagged'], ['Faecal · Gharial 07', 'Ready'], ['Swab · Rhino 02', 'Ready']] } },
    { id: 'pharmacy', chart: 'hbar', name: 'Pharmacy', sub: 'Stock and orders', icon: 'medication', colour: '#1ABEB6', glyph: 'light', group: 'Medical & care',
      stats: { k: ['18', 'items low on stock'], t: '4 expire this month', m: [['18', 'Low stock'], ['23', 'Refills due'], ['4', 'Expiring']], c: { type: 'bars', d: [12, 25, 30, 45, 60, 72, 80], cap: 'Lowest items, % of minimum stock' }, l: [['Meloxicam 1.5 mg/ml', '12%'], ['Ivermectin 1%', '25%'], ['Amoxicillin 250 mg', '30%']] } },
    { id: 'mortality', chart: 'area', name: 'Mortality', sub: 'Deaths recorded', icon: 'monitor_heart', colour: '#FB8971', glyph: 'light', group: 'Animals',
      stats: { k: ['192', 'deaths · 7 days'], t: '30D: 611', m: [['192', '7 days'], ['611', '30 days'], ['2,140', '30+ days']], c: { type: 'line', d: [130, 150, 170, 140, 165, 150, 192], cap: 'Deaths per week' }, l: [['Fish', '88'], ['Birds', '54'], ['Reptiles', '31']] } },
    { id: 'eggs', chart: 'columns', name: 'Eggs', sub: 'Clutch to hatch', icon: 'egg', colour: '#46CADE', glyph: 'dark', group: 'Animals',
      stats: { k: ['37', 'eggs incubating'], t: '12 checks due', m: [['37', 'Incubating'], ['12', 'Checks due'], ['9', 'Hatched · 30D']], c: { type: 'bars', d: [2, 4, 3, 6, 5, 8, 9], cap: 'Hatched per week' }, l: [['Great Hornbill · clutch 3', 'Day 31/40'], ['Gharial · nest 2', 'Day 52/70'], ['Star Tortoise · nest 5', 'Day 88/120']] } },
    { id: 'necropsy', chart: 'line', name: 'Necropsy', sub: 'Reports', icon: 'biotech', colour: '#39656E', glyph: 'light', group: 'Animals',
      stats: { k: ['14,296', 'reports pending'], t: '38 drafts', m: [['14,296', 'Pending'], ['38', 'Drafts'], ['112', 'Done · 30D']], c: { type: 'bars', d: [80, 95, 110, 102, 112], cap: 'Completed per month' }, l: [['Fish · batch 1102', 'Pending'], ['Hornbill 04', 'Draft'], ['Antelope 19', 'Pending']] } },
    { id: 'fetal', chart: 'columns', name: 'Fetal death', sub: 'Records', icon: 'heart_broken', colour: '#F7778E', glyph: 'light', group: 'Animals',
      stats: { k: ['6', 'records · 30 days'], t: '↓ 2 vs last month', m: [['6', '30 days'], ['41', 'This year'], ['2', 'Await necropsy']], c: { type: 'bars', d: [3, 5, 4, 2, 6, 8, 6], cap: 'Records per month' }, l: [['Blackbuck · F-112', '12 Oct'], ['Spotted deer · F-109', '08 Oct'], ['Nilgai · F-104', '02 Oct']] } },
    { id: 'approvals', chart: 'donut', name: 'Approvals', sub: 'Transfers and requests', icon: 'task_alt', colour: '#305068', glyph: 'light', group: 'Operations', badge: 16, badgeLabel: 'pending',
      stats: { k: ['16', 'requests pending'], t: 'oldest: 3 days', m: [['16', 'Pending'], ['42', 'Approved'], ['3', 'Rejected']], c: { type: 'donut', d: [69], cap: 'Approved · last 30 days' }, l: [['Transfer · Asiatic Lion ×2', '3 days'], ['Transfer · Gharial ×4', '2 days'], ['Loan · Hornbill ×1', '1 day']] } },
    { id: 'audit', chart: 'hbar', name: 'Audit', sub: 'Animal audit by site', icon: 'fact_check', colour: '#D0526C', glyph: 'light', group: 'Operations',
      stats: { k: ['68%', 'animal audit score'], t: 'LIVE · 3 sites under 60%', m: [['68%', 'Audit score'], ['91%', 'Best site'], ['3', 'Sites < 60%']], c: { type: 'bars', d: [91, 84, 77, 72, 66, 61, 58, 52, 47], cap: 'Score by site' }, l: [['Larkspur', '47%'], ['Mistvale', '52%'], ['Redcliff', '58%']] } },
    { id: 'reports', chart: 'line', name: 'Reports', sub: 'Exports and insights', icon: 'bar_chart', colour: '#1ABEB6', glyph: 'light', group: 'Operations',
      stats: { k: ['3', 'reports ready'], t: '5 scheduled', m: [['3', 'Ready'], ['5', 'Scheduled'], ['12', 'Exports · Oct']], c: { type: 'line', d: [6, 9, 7, 11, 8, 12], cap: 'Exports per month' }, l: [['Natality report · Oct', 'Ready'], ['Inventory report', 'Ready'], ['Mortality report', 'Mon']] } },
    { id: 'users', chart: 'hbar', name: 'Users', sub: 'Staff and roles', icon: 'group', colour: '#2F5A67', glyph: 'light', group: 'Admin',
      stats: { k: ['286', 'active today'], t: 'of 1,240 staff', m: [['1,240', 'Staff'], ['286', 'Active today'], ['14', 'Invites pending'], ['6', 'Roles']], c: { type: 'bars', d: [420, 310, 220, 160, 90, 40], cap: 'Staff by role' }, l: [['Keepers', '420'], ['Veterinary', '310'], ['Maintenance', '220']] } },
    { id: 'security', chart: 'columns', name: 'Security', sub: 'Gates and access', icon: 'shield', colour: '#79847D', glyph: 'light', group: 'Operations',
      stats: { k: ['2', 'open incidents'], t: '48 gates online', m: [['2', 'Open incidents'], ['48', 'Gates online'], ['12', 'Patrols today']], c: { type: 'line', d: [1, 0, 2, 1, 3, 0, 2], cap: 'Incidents per day' }, l: [['Perimeter fence · Z4', 'Open'], ['Night house alarm', 'Open'], ['North gate panel', 'Closed']] } },
    { id: 'compliance', chart: 'gauge', name: 'Compliance', sub: 'Licences and checks', icon: 'verified_user', colour: '#1F515B', glyph: 'light', group: 'Operations',
      stats: { k: ['4', 'renewals due · 30 days'], t: '1 overdue', m: [['37', 'Licences'], ['4', 'Due · 30 days'], ['1', 'Overdue']], c: { type: 'donut', d: [89], cap: 'Licences current' }, l: [['Pharmacy licence', 'Overdue'], ['CZA recognition', '12 Nov'], ['Fire safety check', '30 Nov']] } },
    { id: 'tags', chart: 'hbar', name: 'Tags', sub: 'Labels and IDs', icon: 'sell', colour: '#E0A21B', glyph: 'dark', group: 'Animals',
      stats: { k: ['1,204', 'animals untagged'], t: '320 printed this week', m: [['1,204', 'Untagged'], ['320', 'Printed · week'], ['58', 'Reprints']], c: { type: 'bars', d: [40, 62, 58, 75, 85], cap: 'Tags printed per week' }, l: [['Fish · batch 1102', '410'], ['Indian Star Tortoise', '126'], ['Reptiles · misc', '92']] } }
  ],

  /* ── Home screen ────────────────────────────────────────────────────────
     There is one home page: the Command Centre dashboard. Every other module is reached from the
     sidebar pins, "All modules" (the App Library), search and the dashboard's quick actions.
     pins    module ids pinned to the sidebar, top to bottom (phones: the drawer and the chips
             above the dashboard). maxPins caps the total. A saved antz-pins list wins.
     layout  the dashboard's widgets, in order. zone 'main' (default) = main area, 'side' = right column.
             Each item is one of:
               { widget: 'id', size: 'S' | 'M' | 'L' }            a module's stats widget
               { stack: 'Name', size: 'M', items: ['id', 'id'] }  a swipeable widget stack
               { widget: 'item', ref: { type: 'animal', id: 'PL-014' }, size: 'M' }
                                                                   a saved item as its own widget
                 ref types: 'animal' (id = animal ID), 'species' | 'note' | 'announcement'
                 (id = name/title, or the index in the lists under data). Stacks can hold
                 items too: items: ['medical', { type: 'item', ref: { type: 'note', id: 0 } }]
               { widget: 'hero' | 'trend' | 'kpi' | 'action' | 'activity' | 'planning' |
                         'attention' | 'sites' | 'team' | 'helpcard', … }   Command Centre panels
                 kpi: metric 'animals' | 'health' | 'overdue' | 'mortality' | 'audit'
                 trend: metric (as kpi, or 'births') and period 12 | 8 | 4
                 action: preset 'vacc' | 'deworm' | 'approvals' | 'help' | 'lab' | 'necropsy'
             Sizes in the main area: S 1×2, M 2×2, L 2×4, W (wide) 4×2, XL 4×4 (of 4 columns);
             right column: S, M, L (heights 2, 3, 4 rows). Give items an id to keep them stable.
             Older configs with home.pages (a list of pages) still work: page 1 is used. */
  home: {
    maxPins: 10,
    pins: ['collections', 'medical', 'administer', 'communication', 'focus', 'help'],
    layout: [
      { widget: 'hero', size: 'W', id: 'hero' },
      { widget: 'kpi', metric: 'health', size: 'S', id: 'kpi-health' },
      { widget: 'kpi', metric: 'overdue', size: 'S', id: 'kpi-overdue' },
      { widget: 'kpi', metric: 'mortality', size: 'S', id: 'kpi-mortality' },
      { widget: 'kpi', metric: 'audit', size: 'S', id: 'kpi-audit' },
      { widget: 'trend', metric: 'health', period: 12, size: 'XL', id: 'trend' },
      { widget: 'action', preset: 'vacc', size: 'S', id: 'qa-vacc' },
      { widget: 'action', preset: 'deworm', size: 'S', id: 'qa-deworm' },
      { widget: 'action', preset: 'approvals', size: 'S', id: 'qa-approvals' },
      { widget: 'action', preset: 'help', size: 'S', id: 'qa-help' },
      { widget: 'activity', size: 'XL', id: 'activity' },
      { widget: 'planning', size: 'L', id: 'planning' },
      { widget: 'attention', size: 'L', id: 'attention' },
      { stack: 'Featured', size: 'L', id: 'featured', zone: 'side', items: [{ type: 'item', ref: { type: 'animal', id: 'PL-014' } }, 'announcements'] },
      { widget: 'sites', size: 'L', id: 'sites', zone: 'side' },
      { widget: 'team', size: 'M', id: 'team', zone: 'side' },
      { widget: 'helpcard', size: 'S', id: 'helpcard', zone: 'side' }
    ]
  },

  /* ── Notification Center: grouped per module; items are [title, body, time ago] ── */
  notifications: [
    { module: 'collections', items: [['Overdue: Vaccinations', '143 animals across 9 sites need a dose.', '2m'], ['Overdue: Deworming', '319 animals are past their due date.', '1h']] },
    { module: 'communication', items: [['Kai Vance', 'The north gate panel is replaced. Photo attached.', '15m'], ['Carnivore Section', 'Feed moved to 16:00 today.', '40m'], ['Emerson Vance', 'Can you check Zara’s weight?', '2h']] },
    { module: 'announcements', items: [['Important · Vantara admin', 'Please follow all safety protocols carefully.', '1h']] },
    { module: 'approvals', items: [['16 transfer requests pending', 'The oldest has waited 3 days.', '3h']] },
    { module: 'help', items: [['HD-1039 updated', 'Pharmacy stock sync is now in progress.', '1d']] }
  
  ],

  /* ── Search: suggested modules and quick actions shown before you type ── */
  searchSuggestions: ['collections', 'communication', 'notes', 'help', 'medical', 'focus'],
  quickActions: [
    { label: 'Record a dose', module: 'medical' },
    { label: 'Add an animal', module: 'animals' },
    { label: 'Raise a ticket', module: 'help', open: { form: 1 } },
    { label: 'New note', module: 'notes' },
    { label: 'Post an announcement', module: 'announcements' },
    { label: 'New transfer request', module: 'approvals' }
  ],

  /* ── Sample data for the six built apps ───────────────────────────────── */
  data: {
    /* Notes: t title, tags, by author, d date, n sort key (bigger = newer), coll collection, type (one of noteTypes) */
    notes: [
    { t: 'Deep Flank Wound', tags: ['Open wound', 'Bleeding'], by: 'Emerson Vance', d: '03 Sep', n: 903, coll: 'Hospital rounds', type: 'Medical' },
    { t: 'Metal Work', tags: ['Rust and corrosion'], by: 'Kai Vance', d: '02 Sep', n: 902, coll: 'Enclosure maintenance', type: 'Maintenance' },
    { t: 'Coat Condition', tags: ['Grooming', 'Routine check'], by: 'Jordan Brenner', d: '30 Aug', n: 830, coll: 'Carnivore Section', type: 'Grooming' },
    { t: 'Limping on left forelimb', tags: ['Observation'], by: 'Kunal Singh', d: '29 Aug', n: 829, coll: 'Carnivore Section', type: 'Medical' },
    { t: 'Moat water level low', tags: ['Housing'], by: 'Kai Vance', d: '28 Aug', n: 828, coll: 'Enclosure maintenance', type: 'Maintenance' },
    { t: 'Reduced appetite after transfer', tags: ['Diet', 'Follow-up'], by: 'Emerson Vance', d: '27 Aug', n: 827, coll: 'Hospital rounds', type: 'Diet' },
    { t: 'Browse rations adjusted', tags: ['Diet'], by: 'Diet Kitchen', d: '25 Aug', n: 825, coll: 'Carnivore Section', type: 'Diet' }
  
    ],
    noteCollections: ['All notes', 'Carnivore Section', 'Hospital rounds', 'Enclosure maintenance', 'Shared with me'],
    noteTypes: ['Medical', 'Maintenance', 'Grooming', 'Diet'],

    /* Species: [common name, scientific name, class, animals, sites, IUCN status] */
    species: [
    ['Persian Leopard', 'Panthera pardus saxicolor', 'Mammals', 14, 3, 'Endangered'],
    ['African Wild Dog', 'Lycaon pictus', 'Mammals', 22, 2, 'Endangered'],
    ['Asiatic Lion', 'Panthera leo persica', 'Mammals', 31, 4, 'Endangered'],
    ['Indian Rhinoceros', 'Rhinoceros unicornis', 'Mammals', 6, 1, 'Vulnerable'],
    ['Great Hornbill', 'Buceros bicornis', 'Birds', 18, 3, 'Vulnerable'],
    ['Gharial', 'Gavialis gangeticus', 'Reptiles', 40, 2, 'Critically endangered'],
    ['Indian Star Tortoise', 'Geochelone elegans', 'Reptiles', 126, 5, 'Vulnerable'],
    ['Purple Frog', 'Nasikabatrachus sahyadrensis', 'Amphibians', 9, 1, 'Endangered']
    ],
    speciesClasses: ['All', 'Mammals', 'Birds', 'Reptiles', 'Amphibians'],

    /* Animals of the first species (other species reuse these with generated names):
       n name, id, sex, age, enc enclosure, site, st status */
    animals: [
    { n: 'Zara', id: 'PL-014', sex: 'Female', age: '6 months', enc: 'Big Cat House · E3', site: 'Clearspring', st: 'On exhibit' },
    { n: 'Kian', id: 'PL-015', sex: 'Male', age: '6 months', enc: 'Big Cat House · E3', site: 'Clearspring', st: 'On exhibit' },
    { n: 'Mehr', id: 'PL-006', sex: 'Female', age: '5 years', enc: 'Big Cat House · E2', site: 'Clearspring', st: 'Off exhibit' },
    { n: 'Roshan', id: 'PL-003', sex: 'Male', age: '7 years', enc: 'Big Cat House · E1', site: 'Clearspring', st: 'On exhibit' },
    { n: 'Tara', id: 'PL-001', sex: 'Female', age: '11 years', enc: 'Hospital · Ward 2', site: 'Clearspring', st: 'Under treatment' },
    { n: 'Arash', id: 'PL-009', sex: 'Male', age: '9 years', enc: 'Carnivore Section · E7', site: 'Foxglen', st: 'On exhibit' }
  
    ],

    /* Announcements: t title, by, d date, team (from my teams), unread, important */
    announcements: [
    { t: 'Zara and Kian, our leopard cubs, go on exhibit from Monday', by: 'Emerson Vance', d: '24 Aug', team: true, unread: true },
    { t: 'World African Wild Dog Day: meet the pack this Saturday', by: 'Kunal Singh', d: '27 Aug', team: true },
    { t: 'Please follow all safety protocols carefully', by: 'Vantara admin', d: '26 Aug', important: true, unread: true },
    { t: 'Quarterly health checks begin 7 September', by: 'Hospital team', d: '22 Aug' },
    { t: 'Fresh browse deliveries move to a morning schedule', by: 'Diet Kitchen', d: '12 Aug', team: true }
  
    ],

    /* Chats: n name, sub, last message, time, unread count, group, msgs [[from or 'me', text, time, hasPhoto]] */
    chats: [
    { n: 'Kai Vance', sub: 'Maintenance · online', last: 'The north gate panel is replaced…', time: '09:12', unread: 2, group: false,
      msgs: [['Kai', 'Morning! Starting on the north gate now.', '08:40'], ['me', 'Thanks. Is the holding area clear?', '08:52'], ['Kai', 'Yes, keepers moved them at 8.', '08:55'], ['Kai', 'The north gate panel is replaced. Photo attached.', '09:12', 1]] },
    { n: 'Carnivore Section', sub: 'Group · 12 members', last: 'Feed moved to 16:00 today', time: '08:30', unread: 1, group: true },
    { n: 'Hospital team', sub: 'Group · 8 members', last: 'Quarterly round starts with Hoofstock', time: 'Yesterday', unread: 0, group: true },
    { n: 'Emerson Vance', sub: 'Veterinarian', last: 'Can you check Zara’s weight?', time: 'Yesterday', unread: 0, group: false },
    { n: 'Diet Kitchen', sub: 'Group · 6 members', last: 'Browse arrives at 06:30 from Monday', time: 'Mon', unread: 0, group: true }
  
    ],

    /* Help Desk tickets: [id, subject, module, priority, status (Open | In progress | Resolved), updated] */
    tickets: [
    ['HD-1042', 'Can’t print tag labels from the tablet', 'Tags', 'High', 'Open', '2h ago'],
    ['HD-1039', 'Pharmacy stock not syncing for Foxglen', 'Pharmacy', 'Medium', 'In progress', '1d ago'],
    ['HD-1031', 'Add a new enclosure type: aviary', 'Housing', 'Low', 'Open', '3d ago'],
    ['HD-1020', 'Login on tablet keeps timing out', 'Access', 'Medium', 'Resolved', '5d ago'],
    ['HD-1011', 'Export mortality report as CSV', 'Reports', 'Low', 'Resolved', '1w ago']
  
    ],

    /* Focus Hub: initial likes and bookmarks.
       key = sp:<species> | an:<species>:<animal> | nt:<note> | ac:<announcement> (indexes into the lists above) */
    saved: [
      { key: 'sp:0', liked: true, bm: true, folder: 'Leopard cubs' },
      { key: 'sp:1', liked: true },
      { key: 'an:0:0', liked: true, bm: true, folder: 'Leopard cubs' },
      { key: 'an:0:1', bm: true, folder: 'Leopard cubs' },
      { key: 'nt:0', bm: true, folder: 'Hospital follow-ups' },
      { key: 'nt:2', liked: true, bm: true },
      { key: 'ac:0', liked: true },
      { key: 'ac:2', bm: true, folder: 'Audit prep' },
      { key: 'ac:3', bm: true, folder: 'Hospital follow-ups' }
    ],
    folders: ['All folders', 'Leopard cubs', 'Hospital follow-ups', 'Audit prep']
  }
};
