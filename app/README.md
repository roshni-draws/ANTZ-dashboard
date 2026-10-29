# ANTZ Home

An iPad/iPhone-style home screen for ANTZ: a fixed "Hello Roshni" header with search,
springboard pages of module apps and stats widgets, a dock of pinned modules, edit mode
with drag-to-resize, widget stacks, a widget gallery, the App Library, search, the
Notification Center, and six built apps (the other modules open their stats view).

No build step. Double-click `index.html`, or serve the folder (`python3 -m http.server`).

| File | What's in it |
|---|---|
| `index.html` | Markup only: header, springboard, dock, app window, the six app screens |
| `styles.css` | 1. Style 1 tokens (colours, fonts, radii, shadows) · 2. base · 3. components · 4. responsive |
| `config.js` | **All content**: user, sites, images, modules (with chart type), home layout, dock, notifications, sample records |
| `data.js` | Seeded sample-data generator: per-site numbers and 12-week series, used by every widget |
| `assets/img/` | Photos (see `CREDITS.md`); none are bundled yet, so placeholders show |
| `app.js` | Behaviour. Reads `window.ANTZ_CONFIG`; you rarely need to touch it |

Layout follows the screen width: phone ≤ 640px (4 columns, dock of 4), tablet 641–1239px
(6 columns), desktop ≥ 1240px (10 columns, dock of 6).

Page 1 is the **Command Centre**: site and date heading, five KPI cards (with change vs last week
and a 12-week sparkline), a Needs attention list and four chart widgets. Every piece is still a
widget, so you can move, resize and remove it in edit mode. Pages 2+ are the app springboard.

## Recipes

### Switch site (and add a site)
The **Site** button in the header opens a searchable list of sites, each with its animal count.
Picking one re-scopes every number on the home screen, and the Command Centre heading shows the
active site. The choice is saved as `antz-site`. On a first visit the button pulses once with
a "Switch site here" tip. Dismissing it is remembered as `antz-site-hint`; reduced motion turns
the pulse off.

To add a site, add its name to `sites` in `config.js`. `data.js` generates its numbers, and
"All sites" is always the sum of the sites (percentages are weighted by animals).

### Sample data (data.js)
`data.js` builds all figures from a seeded random generator (`SEED`), so the numbers are stable
across reloads and identical wherever they appear. For example, the Overdue tasks KPI equals
the sum of the Needs attention list, and Mortality 7 days equals the last point of the
Mortality chart. It produces:
- per site: animals, species, enclosures and occupancy, health cases, overdue and pending work,
  audit score, approvals, licences, staff, feeds per day
- 12 weeks of series for each site: treatment, mortality, new animals, overdue, audit, animals
- the KPI cards (`ANTZ_DATA.kpi`), the Needs attention list (`ANTZ_DATA.attention`) and each
  module's stats (`ANTZ_DATA.moduleStats`)

Change `SEED` for a different dataset. To feed a new module, add a `case` to `moduleStats()`.
It returns `{ k, t, m, c, l }`, the same shape as `stats` in config. Everything is clearly
sample data: the dashboard heading and the profile menu say so.

### Chart types
Set `chart` on a module in `config.js`. The renderers live in `CHARTS` in `app.js`, as
hand-rolled SVG/HTML with no library, so they work offline. Each has a text summary
(`aria-label`), a hover tooltip on every mark, and the summary as a tooltip when the widget
has keyboard focus.

| `chart` | Use for | Data (`c` in stats) |
|---|---|---|
| `line` | trends | `{ cap, series: [..12], labels, unit }` |
| `area` | trends from zero (mortality, new animals) | same as line |
| `columns` | small categorical counts | `{ cap, bars: [[label, n], …] }` |
| `stackedBar` | parts of a whole per group (vaccinations by site) | `{ cap, cats, keys: [3 names], rows: [[a, b, c], …] }` |
| `donut` | share (occupancy, approvals) | `{ cap, slices: [[name, n], …], center }` |
| `hbar` | rankings (audit by site) | `{ cap, bars, unit, max?, warnBelow? }` |
| `gauge` | one percentage vs target (compliance) | `{ cap, value, unit }` |
| `heatmap` | per-day patterns (feeds) | `{ cap, cells: [7 × weeks], days, weeks, unit }` |

The KPI cards use sparklines (`CHARTS.spark`). Colours are the `--viz-*` tokens in
`styles.css`. They were checked with the dataviz palette validator for light and dark:
adjacent pairs pass the colour-blind separation and contrast checks. Stacked bars use the
order Done, Overdue, Pending; keep that order, because teal next to blue fails.

### Add an image
1. Put a JPG or WebP (about 800px wide, compressed) in `assets/img/`.
2. Map it in `config.js` → `images`. Keys are a species name (`'Persian Leopard'`), an animal
   ID (`'PL-014'`), `'collectionsHero'`, `'announcement:0'` or `'avatar:RS'`.
3. Add its source, author and licence to `assets/img/CREDITS.md` and to `config.js` → `credits`.
   The `credits` list is shown in the app under Profile menu → Photo credits, which covers the
   attribution CC BY and CC BY-SA require.

Images load lazily, are cropped to fit, carry alt text, and fall back to the grey placeholder
if the file is missing. Keys without an entry never request a file.

### Add a module
Add one entry to `modules` in `config.js`:

```js
{ id: 'vet', name: 'Vet Rounds', sub: 'Daily checks', icon: 'stethoscope', colour: '#549C76',
  glyph: 'light', group: 'Medical & care', badge: 4, badgeLabel: 'due',
  stats: { k: ['4', 'rounds due'], t: '2 overdue',
           m: [['4', 'Due'], ['2', 'Overdue'], ['31', 'Done · week']],
           c: { type: 'bars', d: [3, 5, 4, 6, 4], cap: 'Rounds per day' },
           l: [['Big Cat House', '09:00'], ['Aviary', '11:00'], ['Hoofstock', '14:00']] } }
```

That's all it needs. It then shows up in the App Library, search and the widget gallery,
and it opens on its Large stats view. Icons come from https://fonts.google.com/icons.
Use `glyph: 'dark'` for pale colours, so the icon is navy instead of white.
To put it on the home screen too, see "Add a widget or app to the home layout".

### Add or change a widget's stats
Edit that module's `stats` in `config.js`:
- `k` and `t` feed the **Small** widget: headline, label and trend pill.
- `m` feeds **Medium** and **Large**: up to 3 KPIs.
- `c` is the chart. Use `bars` or `line` with a list of numbers, or `donut` with `[percent]`.
- `l` is the **Large** list of top 3 items.

The six built modules (notes, collections, announcements, communication, focus, help) use
custom renderers named by `widget:`. They live in `WIDGETS` in `app.js`. To give any module
a custom widget, add a function to `WIDGETS` and set `widget: 'yourName'` on the module.

### Add a widget or app to the home layout
In `config.js` → `home.pages`, add one of these to a page (page 1 is first):

```js
{ app: 'vet' }                                          // an app icon
{ widget: 'vet', size: 'M' }                            // S 2×2 · M 4×2 · L 4×4 · XL 8×4 (desktop)
{ stack: 'Health', size: 'M', items: ['medical', 'lab', 'vet'] }   // swipeable stack
```

Anything that doesn't fit on a page flows onto the next one.

Once someone rearranges their home screen, their layout is saved in the browser and wins
over `config.js`. That covers moves, resizes, added and removed widgets, and stacks. Modules
you add to config later still appear, at the end of the last page. To see config changes
again, clear `antz-layout` and `antz-pins` in localStorage (or use a private window).

### Add a Focus Hub item as a widget
Any saved species, animal, note or announcement can be its own widget:

```js
{ widget: 'item', ref: { type: 'animal', id: 'PL-014' }, size: 'M' }
{ widget: 'item', ref: { type: 'species', id: 'Persian Leopard' }, size: 'S' }
{ widget: 'item', ref: { type: 'note', id: 0 }, size: 'L' }   // id = title, or index in data.notes
{ stack: 'Favourites', size: 'M', items: [{ type: 'item', ref: { type: 'animal', id: 'PL-014' } },
                                          { type: 'item', ref: { type: 'announcement', id: 2 } }] }
```

The widget reads the live sample data, so edits under `data` show up in it, and tapping
it opens that item in its app. People can add one from Focus Hub (the widgets button
or ⋯ → "Add to Home Screen as widget"), from the like/bookmark buttons anywhere, or from
"From Focus Hub" in the widget gallery.

To support a **new item type**:
1. Register its records in the Focus Hub store (`reg('xx:' + i, { type: 'Thing', t, sub, go: { app, …open options } })` near the top of `app.js`).
2. Add an icon and owning app in `ITEM_KIND`, and a renderer `ITEM_RENDERERS.xx(parts, size, meta)` that returns the inner HTML for S / M / L.
3. Optionally teach `refKey()` a config ref such as `{ type: 'thing', id: … }`.

### Rearrange the home screen (reordering)
In edit mode (Edit, or long-press then move), press and drag any icon or widget:
- The grid shifts live to show where it will land.
- Hold at the left or right edge for about half a second to change page.
- Drop an app on the dock to pin it, or drag it out to unpin.
- Drop a widget on the middle of a stack to add it to the stack.

Escape cancels a drag, and the toast offers Undo. Drag the round corner handle to resize
(S → M → L, and XL on desktop). Keyboard: Alt + arrow keys on a focused item, or "Move
earlier / later" in its ⋯ menu; arrow keys on a focused resize handle. Order and sizes are
saved under `antz-layout`.

### Change the dock pins
Change `home.dock` in `config.js` (module ids, left to right). Phones show 4 and
tablet/desktop show 6. Extra pins sit at the start of page 1, and `maxPins` caps the total.
Users can also pin and unpin from the ⋯ / long-press menu, in edit mode, or with "Keep in
Dock" inside an app. Their choice is saved under `antz-pins`.

### Add a new app screen
1. In `index.html`, inside `#appBody`, add
   `<section class="screen" data-screen="vet" aria-label="Vet Rounds" hidden> … </section>`
   with an `.app-toolbar` at the top, like the other screens.
2. In `app.js`, add an entry to `SCREENS`:
   `vet: { open: function (options) { /* render the screen */ } }`.
   `open()` runs every time the app launches. `options` comes from shortcuts,
   notifications or search, for example `{ level: 'species', species: 0 }`.
3. Put its data under `data` in `config.js` and read it from `CFG.data`.

Back navigation inside an app is set in `updateAppHeader()` in `app.js`.

### Change colours
All colours are custom properties at the top of `styles.css`:
- `:root` is light mode (Style 1).
- `:root[data-theme="dark"]` and the `prefers-color-scheme` block are dark mode.
- Components use the role names (`--md-sys-color-primary`, `-surface`, `-on-surface`,
  `-secondary-container` for selected chips, and so on). Change a role once and
  everything using it follows.
- Module tile colours are the `colour` field of each module in `config.js`.

Keep text at WCAG AA contrast: 4.5:1 for text, 3:1 for icons and borders. Status fills
(`--antz-warning`, `--antz-alert`, `--antz-success`) always take black text.

To force a theme, put `data-theme="dark"` or `data-theme="light"` on `<html>`.
Without it, the OS setting decides.

### Light / dark mode
People switch with the sun/moon button in the header. The avatar menu has
**Appearance: Light / Dark / System**. Their choice is saved under `antz-theme` and wins
on the next visit. A small script in `<head>` applies it before the page paints, so there
is no flash of the wrong theme.

- **Default theme:** set `theme` in `config.js` to `'system'` (follow the device),
  `'light'` or `'dark'`. The default only applies to people who haven't chosen one yet.
  To test it, clear `antz-theme` in localStorage.
- **Dark colours:** edit the `:root[data-theme="dark"]` block in `styles.css`, and copy
  the same values into the `@media (prefers-color-scheme: dark)` block below it. One is
  used when dark mode is chosen, the other when it comes from the device. The browser bar
  colour (`theme-color`) is `#F2FBF8` for light and `#0D1A20` for dark. It is set in the
  `<head>` script in `index.html` and in `syncThemeUI()` in `app.js`.
