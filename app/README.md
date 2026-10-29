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
| `config.js` | **All content**: user, modules, stats, home layout, dock, notifications, sample data |
| `app.js` | Behaviour. Reads `window.ANTZ_CONFIG`; you rarely need to touch it |

Layout follows the screen width: phone ≤ 640px (4 columns, dock of 4), tablet 641–1239px
(6 columns), desktop ≥ 1240px (10 columns, dock of 6).

## Recipes

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
