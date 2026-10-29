# PRD: Antz Home, Style 4 ("Widget Board")

| | |
|---|---|
| **Date** | 2026-10-29 |
| **Status** | Draft |
| **Source of truth** | Live prototype at https://antz-home-style-2.vercel.app/style-4 (also served as `style-4.html`) |
| **Prototype author (per source comment)** | Sourav, 26 Oct 2026 |

> **How to read this document.** Everything in this PRD was taken from the deployed page's HTML, CSS, inline JavaScript and its developer comments, fetched on 2026-10-29. Statements marked **[Observed]** are taken directly from the page. Statements marked **[Inferred]** are the author's reading of that evidence. Guesses are kept in §14 (Open questions and assumptions). The prototype uses sample data, so the numbers below are illustrative, not production figures.

---

## 1. Overview and problem statement

**What Antz is [Observed + Inferred].** ANTZ is a zoo and animal-collection management product. The login screen says: *"Every animal, every site, one place. Medical, housing, collections and more: the whole zoo on one board."* Its modules cover medical care, vaccination and deworming, pharmacy, lab, diet, housing (sites, sections and enclosures), collections (species and animals), mortality, necropsy, eggs, tags, approvals for transfers, audit, compliance, security, reports, users, a help desk, communication and announcements. The sample data covers 9 sites, 2,411 species and 110,020 animals. It refers to an "ANTZ app" and an "Antz account", and staff email addresses use `@antz.app`.

**What this page is [Observed].** `/style-4` is the fourth of four design explorations for the Antz **Home / Command Centre** screen, titled "Antz Home · Style 4". The source comment calls it a **Widget Board**: *"Every module is a widget (S 1×1, M 2×1, L 2×2, XL 4×2) on one board, the way a phone home screen works."*

**Problem [Inferred from the agreed-UX comment].** Zoo staff work across many modules and sites. Their first question each day is *what needs doing*, and the next is *where do I go to do it*. The home screen should:
1. Show all pending and overdue work in one place, overdue first, with each item leading to its module.
2. Give a quick view of each module's own key figures, without repeating figures across widgets.
3. Let each person arrange the board to suit their work, while a common baseline stays in place for everyone.
4. Scope every figure to one site or to all sites.

## 2. Goals and non-goals

### Goals
- **G1.** A single home board on which every module the user can open appears as a widget.
- **G2.** A "Today" widget in the top-left that lists all pending work, with overdue work first. Each row opens its module.
- **G3.** Personalisation: users can drag, resize, remove and add widgets, undo changes and restore the default. The layout persists.
- **G4.** A site filter that rescopes every figure on the board to one site or to all sites, and scales to any number of sites.
- **G5.** Fast navigation to any module or screen through Quick Actions, a searchable command palette opened with the `/` key.
- **G6.** A responsive layout that works from desktop down to phone width, and meets accessibility requirements, including reduced motion.

### Non-goals (for this style / prototype)
- Building the module screens themselves. Apart from the two Pending pages, these show a toast: *"… · opens in the ANTZ app"*.
- Real authentication. Per the on-page note, *"Prototype · any email and password will log you in"*.
- A live data backend. All figures are hard-coded sample data.
- Permission and role management UI. Widgets are meant to follow access rights, but the prototype does not enforce this.
- Choosing between Styles 1–4. That decision belongs to the design review, not to this PRD.

## 3. Target users and personas

**[Observed]** The signed-in sample user is **Sourav Tambe**, *Curator*, `sourav.t@antz.app`, with access to *All sites · 9 sites*. The announcements and notes name other roles and teams: Vantara admin, the Hospital team, Diet Kitchen, Carnivore Section keepers and section heads.

**[Inferred] personas:**
| Persona | Needs from Home |
|---|---|
| **Curator / collection manager** (multi-site) | Cross-site totals for species, animals and new arrivals, approvals for transfers, audit scores, mortality. |
| **Veterinarian / hospital team** | Overdue vaccinations, deworming and treatment follow-ups, lab results to review, pharmacy refills. |
| **Keeper / section head** | Their own section's tasks, observation notes, announcements, team chat. |
| **Operations / admin** | Compliance, security, users, help desk, reports. |

From the source comment: *"everyone uses the same board; widgets appear only for modules a person can open; Collections, Housing, Mortality and Animals are for everyone."*

## 4. Scope

### In scope (Style 4)
- The Home board: header, greeting, site picker, search, notifications and profile.
- 30 widgets in the default layout, in four sizes.
- Edit mode: drag to reorder, resize, remove, Add widget, Undo changes, Restore default, Done.
- The Quick Actions command palette, listing modules and their screens.
- Two drill-down pages, **Pending Vaccination** and **Pending Deworming**, with a module rail and breadcrumb.
- A profile menu, a logout confirmation and a login screen (prototype only).
- A footer switcher between design styles.

### Relationship to other style variants [Observed]
The footer nav, labelled "Home style", links to all four styles:
| Variant | URL | Notes from source |
|---|---|---|
| Style 1 | `./?ms=1` (root) | The root page is titled "Home Page Redesign · ANTZ" / "ANTZ Command Centre · Home". It is a customisable module dashboard built from the Figma artboard *Antz Modules → Home (iPad Pro 12.9")*, with 17 modules and 71 widget cards. |
| Style 2 | `./?ms=2` (root) | A variant served from the same root file. Style 3's comment describes it as the "widget home" with MD3_Antz colours. |
| Style 3 | `/style-3` | "The same widget home, rebuilt as a **bento dashboard**" (23 Oct 2026). |
| **Style 4** | `/style-4` | **Widget Board** (26 Oct 2026). Uses Style 3's colours (MD3_Antz) and only the Inter typeface. |

`/style-1`, `/style-2` and `/style-5` return 404. Styles 1 and 2 are reached only through the `?ms=` query parameter on the root.

## 5. Information architecture and page structure [Observed]

### 5.1 Global layout
1. **Header**: avatar button (profile menu), greeting ("Good morning/afternoon/evening," + name + 👋), **Command Centre** button, **site picker** ("All sites · 9 sites"), **search** (placeholder *Search "Ira"*), **Notifications**.
2. **Board toolbar**: hint text *"Drag widgets to arrange your board"*, plus **Add widget**, **Edit**, **Restore default**, **Undo changes** and **Done**. The last three are visible in edit mode only.
3. **Board**: a CSS grid of widgets. Decorative large soft circles sit on a green background.
4. **Footer**: the style switcher (Style 1–4).
5. **Dock**, fixed at the bottom: a **Quick Actions** button and a **Communication** chat button with an unread badge (3).
6. **Overlays**: Quick Actions dialog, Add widgets sheet, profile menu, logout confirmation, login screen, Pending pages, toast.

### 5.2 Default board (order and size)
| # | Widget | Size | Content observed | Removable |
|---|---|---|---|---|
| 1 | **Today**: "What needs doing" | L | Date badge (e.g. OCT 26). **Overdue** and **Pending** tabs with counts. A scrolling list of rows, each with icon, task, module and count. Overdue rows: Deworming 319, Vaccinations 143, Treatment follow-ups 27, Enclosure inspections 9, Weight checks 34. Pending rows: Necropsy reports 14,296, Microchipping 20,302, Sexing 28,532, Lab results to review 41, Medication refills 23, Egg checks 12. Empty state: "Nothing overdue/pending — all clear". When a list is short, a link points to the other tab ("See N pending"). | No (locked) |
| 2 | **Collections**: "Species Management" | XL | Full-width savannah photo. "Every species and animal across the sites". **2,411 Species**, **110,020 Animals**. | No |
| 3 | **Animals**: "Newly added, by site" | L | Deep-green widget. Total 643. Ranked vertical bars per site, scrolling sideways. "9 sites · Scroll". | No |
| 4 | **Focus hub** | M | Dark widget with a glow. "Favourites, bookmarks, folders". Four favourite species faces. "4 favourites · Bookmarks · Folders". | Yes |
| 5 | **Housing** | M | **9 Sites**, **115 Sections**, **9,937 Enclosures**. | No |
| 6 | **Announcements** | XL | Photo + text carousel of 5 items. Auto-advances every 6 s, pauses on hover, has dot controls. The kind label reads "Announcement" or "Important". Each item shows author initials, name and date. | Yes |
| 7–8 | **Medical** (Treatments), **Administer** (Vaccines, deworming) | S | Launch tiles: coloured icon and a two-line label. | Yes |
| 9 | **Audit** | L | "LIVE" badge, **68%** animal audit score, bars per site on a 0–100 track. Scores under 60 show in coral. The best site is highlighted. Scrolls sideways. | Yes |
| 10–11 | **Pharmacy** (Stock and orders), **Lab** (Samples, results) | S | Launch tiles | Yes |
| 12 | **Observation Notes** | L | Pinned pastel note cards: Deep Flank Wound, Metal Work, Coat Condition. Each shows tags, author and date. "View all" link. | Yes |
| 13 | **Communication** | M | "Chats with your teams". Latest message preview ("Kai: The north gate panel is replaced…"). | Yes |
| 14–17 | **Diet**, **Eggs**, **Necropsy**, **Fetal death** | S | Launch tiles | Yes |
| 18 | **Approvals** | M | "Transfers and requests · last 30 days": **16 Pending**, **42 Approved**, **3 Rejected**. | Yes |
| 19–24 | **Reports**, **Users**, **Security**, **Compliance**, **Tags**, **Help Desk** | S | Launch tiles | Yes |
| 25 | **Mortality** | M | Light coral widget. Segmented range control **7D / 30D / 30+**. **192** "Deaths recorded" (7D, all sites). | No |

Locked widgets carry a lock icon with the tooltip *"Everyone keeps this widget"*: Today, Collections, Animals, Housing and Mortality.

### 5.3 Widget catalogue (Add widgets sheet)
The sheet is titled "Add widgets", with the subtitle "Modules you have access to". Its categories are **Overview**, **Animals**, **Medical & care** and **Operations**. Each widget lists the sizes it allows:
- Today, Collections, Animals, Observation Notes and Audit: **L or XL**
- Announcements: **XL only**
- Focus hub, Communication, Housing, Mortality and Approvals: **M or L**
- Launch tiles: **S or M**

### 5.4 Quick Actions (command palette)
- Categories: **All** (A–Z), **Medical & Care**, **Animal Management**, **Operations**, **Administration**.
- It lists 23 modules. Each module has its own screens, and some screens carry a badge count. Examples:
  - Medical: Dashboard, Vaccination pending (143), Deworming pending (319), Medical records.
  - Animals: All animals, Newly added, Sexing pending (28,532), Microchipping pending (20,302), Add an animal.
  - Approvals: Pending (16), Approved, Rejected, New transfer request.
  - Users: Staff, Roles and access, Shifts, Invite a user.
- Create actions (e.g. "Record a dose", "Add eggs", "Raise a ticket") are styled with a "+".
- Search covers both module names and screen names, highlights matches and shows a result count.

### 5.5 Pending pages (`#pending/vaccination`, `#pending/deworming`)
- A breadcrumb (Home › Administer › Pending Vaccination), a vertical module rail with a flyout listing each module's screens, and a Quick Actions entry.
- Summary stats: animals waiting, number of species, and the species with the most pending.
- Controls: species search, a time range (**All time / 30 days / 7 days**) and a sort (**Most pending / A–Z**).
- A list of species rows: photo, common name, scientific name, a relative bar and an animal count.

## 6. Functional requirements

> Acceptance criteria (AC) describe the behaviour shown in the prototype. A production build must meet the same behaviour.

**FR-1 Personalised greeting**
- AC1: The greeting reads "Good morning" before 12:00, "Good afternoon" from 12:00 to 16:59, and "Good evening" from 17:00, in the user's local time. The user's full name follows.
- AC2: The Today widget's date badge shows the current month (3-letter, uppercase) and the day of the month.

**FR-2 Site picker**
- AC1: The button shows "All sites · N sites" or the name of the selected site.
- AC2: Opening it shows a searchable list. "All sites" comes first, then each site with its animal count. The selected site has a tick.
- AC3: Typing filters sites by name. With no match, the list shows *No site matches "<query>"*.
- AC4: Keyboard: Enter picks the first result, ArrowUp and ArrowDown move through the list, and Escape closes the picker and returns focus to the button. Clicking outside closes it.
- AC5: Picking a site rescopes every figure on the board: species, animals, new animals, housing, mortality (for the current range), audit %, and approvals. Numbers animate to their new value.
- AC6: In the Animals and Audit charts, the selected site's bar is highlighted and scrolled into view. The other bars are de-emphasised.

**FR-3 Today widget (pending work)**
- AC1: Items are split into **Overdue** and **Pending** tabs, and each tab shows its count.
- AC2: The Overdue tab is shown by default when it has items.
- AC3: Each row shows an icon, the task name, the module name and a count. Overdue rows use the "hot" (coral) treatment.
- AC4: The list scrolls inside the widget, and a fade shows when more rows are below.
- AC5: When a tab has fewer than 4 rows and the other tab has items, a "See N pending/overdue" link switches tabs.
- AC6: An empty tab shows "Nothing overdue/pending — all clear".
- AC7: The Vaccinations and Deworming rows open the matching Pending page (FR-11). Other rows open their module, which the prototype stands in for with a toast.

**FR-4 Module data widgets**
- AC1: Collections, Housing, Approvals and the Audit headline show the figures for the selected site.
- AC2: Mortality offers a 7D / 30D / 30+ segmented control. The pressed state is shown with `aria-pressed`, and the figure updates for the selected site.
- AC3: The Animals and Audit bar charts rank sites in descending order, scroll sideways for any number of sites, and convert vertical mouse-wheel movement into sideways scrolling while the pointer is over them. On first paint the bars grow in.
- AC4: Audit bars below 60% are coloured coral, and the top site is marked "best".
- AC5: No figure appears in more than one widget (the "no repeats" rule).

**FR-5 Announcements carousel**
- AC1: The carousel cycles through announcements every 6 s and pauses while the pointer is over it. Auto-advance is turned off when reduced motion is on.
- AC2: Dot buttons, labelled "Announcement N", jump to an item. The current dot has `aria-current`.
- AC3: An "important" item shows a warning graphic instead of a photo, and the label "Important".

**FR-6 Launch tiles and widget navigation**
- AC1: Tapping a widget or tile opens its module. In the prototype, a toast reads "<Module> · opens in the ANTZ app" and stays for about 1.8 s.
- AC2: On hover, a widget rises slightly and the round arrow button rotates.

**FR-7 Edit mode: arrange the board**
- AC1: **Edit** enters edit mode. While editing, tapping a widget does not open it.
- AC2: Widgets can be dragged with mouse or touch (pointer events). A dashed placeholder marks where the widget will land, and the other widgets slide to their new places (FLIP animation).
- AC3: Dragging near the top or bottom of the viewport scrolls the page.
- AC4: Removable widgets show a remove (−/×) control. Locked widgets show a lock with "Everyone keeps this widget".
- AC5: Widgets that support more than one size show a size switch (S/M/L/XL) limited to the sizes they allow.
- AC6: **Undo changes** reverts to the board as it was when Edit was tapped. It is disabled when nothing has changed.
- AC7: **Restore default** asks for confirmation ("Tap again to restore default", with a timeout), then restores the default order, sizes and removed widgets. A toast reads "Default board · tap Done to keep it".
- AC8: **Done** saves the layout and shows a toast, "Board saved" or "No changes".

**FR-8 Add widgets**
- AC1: **Add widget** opens a sheet titled "Add widgets", subtitled "Modules you have access to", grouped by category.
- AC2: Only widgets not already on the board can be added, at one of their allowed sizes.

**FR-9 Layout persistence**
- AC1: Order, sizes and removed widgets are saved per device. The prototype uses the `localStorage` key `antz-s4-board`.
- AC2: The saved layout is tied to a default-layout version (`BASE = '2026-10-27c'`). When the default changes, an older saved layout is discarded so the new default appears.
- AC3: Widgets added to the product after a layout was saved are added to the end of the board.
- AC4: Locked widgets cannot be removed, even through a saved layout.

**FR-10 Quick Actions palette**
- AC1: It opens from the dock button or the `/` key (when no text field has focus), and closes with Escape or the Close button. Focus returns to where it was before.
- AC2: A left nav lists the categories. The list shows the modules, and the side panel shows the selected module's screens with badges and "+" actions. On hover-capable devices, hovering previews a module's screens.
- AC3: Search matches module names, module descriptions and screen names. It highlights matches, shows "N results", and shows *Nothing matches "<q>".* when there are none. Enter activates the first result.
- AC4: ArrowUp and ArrowDown move through modules. On narrow screens, selecting a module slides to its screens, with a Back button.
- AC5: A screen that has a dedicated page opens that page (Vaccination/Deworming pending). Other screens show the "opens in the ANTZ app" toast.

**FR-11 Pending Vaccination / Deworming pages**
- AC1: The page opens as a full-screen view, updates the URL hash (`#pending/<kind>`) and supports browser Back. Loading the hash directly opens the page.
- AC2: The summary shows total animals waiting, the species count and the species with the most pending, for the current filters.
- AC3: Search filters by common or scientific name. The time range (All time / 30 days / 7 days) and the sort (Most pending / A–Z) update the list.
- AC4: A breadcrumb (Home › Module › Page), a module rail with a screen flyout, and a Quick Actions entry are present. Escape or Back returns to the board with focus restored.

**FR-12 Profile, logout and login**
- AC1: The avatar opens a menu showing name, role, email, the current site scope, and My Profile, Settings, Help & Support and Log out.
- AC2: Log out asks for confirmation: *"Log out of Antz? You'll need to log in again to see your board. Your layout stays saved on this device."* (Cancel / Log out).
- AC3: The login screen has an Email or phone field, a Password field with a show/hide toggle, "Keep me logged in", "Forgot password?" and **Log in**.
- AC4: Validation messages: "Enter your email or phone"; "That doesn't look like an email or phone number" (not an email, and not 7 or more digits); "Enter your password". Errors clear while the user types.
- AC5: The button shows a busy state ("Logging in…"), then a "Welcome back" toast. The logged-out state persists across reloads (prototype key `antz-s4-auth`).

**FR-13 Style switcher**
- AC1: The footer links to Styles 1–4, and the current style is marked with `aria-current="page"`.

**FR-14 Notifications and Communication dock**
- AC1: The Notifications button and the Communication button (with an unread count badge, e.g. 3) exist and open their modules. In the prototype these show a toast.

## 7. Non-functional requirements

**Performance**
- NFR-P1: The page is a single self-contained HTML file (about 154 KB) with inline CSS and JS. The only external dependency is Google Fonts (Inter). Production should keep the initial payload comparably light.
- NFR-P2: Target Core Web Vitals at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Images below the fold use `loading="lazy"` (this is observed on the Pending list).
- NFR-P3: Number count-up animations last about 900 ms and must not block interaction.

**Responsive / mobile [Observed breakpoints]**
| Viewport | Board grid |
|---|---|
| > 1240 px | 8 columns, 158 px rows, 14 px gap |
| ≤ 1240 px | 6 columns |
| ≤ 980 px | 4 columns, 150 px rows. The search moves to its own full-width row. |
| ≤ 640 px | 2 columns, 162 px rows, 12 px gap. XL widgets become 2 columns wide, Announcements stacks image over text, the Command Centre label is hidden, and the page gutter is 16 px. |
- NFR-R1: The page must have no horizontal page scroll at any width (`overflow-x: hidden`). Charts scroll inside their widgets.
- NFR-R2: Drag-and-drop must work with touch.

**Accessibility (WCAG 2.2 AA)**
- NFR-A1: Observed foundations to keep: `lang="en"`; a visible `:focus-visible` ring (2 px, #00AFD6); `aria-expanded`, `aria-selected`, `aria-pressed` and `aria-current` on interactive controls; labelled icon buttons; full keyboard support in the pickers and palette; focus returned after overlays close; `prefers-reduced-motion` turns off animations and auto-advance.
- NFR-A2: The following are required and need verification:
  - Drag-to-reorder needs a keyboard and single-pointer alternative (WCAG 2.5.7 Dragging Movements).
  - Targets must be at least 24×24 CSS px (2.5.8). The `.seg` buttons look small.
  - Contrast must reach at least 4.5:1, notably the `--mute` (#7A8684) text on white and on the green board, and white text on photos.
  - Dialogs (Quick Actions, Add widgets, logout, Pending page) must trap focus and use `role="dialog"` with `aria-modal`.
  - Content that updates live (toasts, site changes, carousel) needs an appropriate `aria-live` region.
  - The carousel must offer a pause control, not only pause-on-hover (2.2.2).
  - The Today tabs must follow the tab pattern (`role="tablist"`/`tab`/`tabpanel`).

**SEO**
- NFR-S1: This is an authenticated internal app, so the Home board should be `noindex`. Only the login or marketing surface, if any, needs a meta description, an OG image and a canonical URL. None of these are present today.
- NFR-S2: Every view needs a meaningful `<title>`. The current title is "Antz Home · Style 4".

**Browser support**
- NFR-B1: The latest two versions of Chrome, Edge, Safari (macOS and iOS) and Firefox. The prototype uses `color-mix()`, CSS masks, `grid-auto-flow: dense`, pointer events and `inert`-style patterns, so these targets are needed for faithful rendering.
- NFR-B2: The root page declares it can be saved to the home screen (`apple-mobile-web-app-capable`), so a tablet/iPad home-screen experience is expected.

**Reliability and privacy**
- NFR-RL1: All `localStorage` access is wrapped in try/catch. The board must render with defaults when storage is unavailable.

## 8. Design and visual requirements [Observed]

**Design intent (source comment).** The look draws on nine references: a soft green board with a large circle; white widgets; deep-green and light tinted widgets; a photo widget with a round arrow; small white tiles with a coloured icon and a two-line label; bar charts; a list with icon, name and amount; a dark widget with a glow; pastel pinned notes; and a photo + text split widget.

**Colour tokens** (the MD3_Antz palette, shared with Style 3):
| Token | Hex | Use |
|---|---|---|
| `--board` / `--board-2` | #DDEFE4 / #C9E7D4 | Page background and decorative circles |
| `--paper` | #FFFFFF | Widget surface |
| `--ink` / `--ink-2` / `--mute` | #000000 / #44544A / #7A8684 | Text levels |
| `--line` / `--line-2` | #DAE7DF / #E9F0EC | Dividers |
| `--lime` / `--lime-soft` / `--lime-ink` | #52F990 / #D3FBE0 / #006D35 | Primary accent and positive |
| `--deep` | #00512A | Deep-green widget (Animals) |
| `--dark` | #262732 | Dark widget (Focus hub) |
| `--coral` / `--coral-2` / `--coral-3` | #FA6140 / #FFBDA8 / #FFEBE5 | Overdue, alerts, Mortality, low audit |
| `--teal` / `--navy` / `--hl` / `--mint` | #00ABAB / #1F415B / #AFEFEB / #E8F4F2 | Secondary accents |
| Focus ring | #00AFD6 | `:focus-visible` |

**Typography.** Inter only (weights 300–700) from Google Fonts. Base size 14 px. Widget titles are 15 px/600. Subtitles and meta text are 12 px. Large stat numbers use tabular numerals (`font-variant-numeric: tabular-nums`).

**Shape and elevation.** Corner radius is 8 px everywhere (`--r`). Circles are used only for avatars and round icon buttons. Shadow `--sh`: `0 1px 2px rgba(0,60,30,.05), 0 14px 30px -22px rgba(0,60,30,.45)`. A hover lift of -3 px gives a stronger shadow.

**Motion.** Easing `cubic-bezier(.2,.7,.2,1)`. Widgets enter with a staggered "rise" (0.7 s, 40 ms stagger). Numbers count up, bars grow, widgets FLIP when reordered, and the carousel crossfades. All of this is turned off under `prefers-reduced-motion`.

**Components.** Widget card (S/M/L/XL), launch tile, stat group, segmented control, tab pair with counts, ranked bar chart (vertical, scrolls sideways), photo hero, carousel with dots, pinned note card, avatar stack, date badge, searchable popover list, command palette (nav, list and detail), bottom sheet, confirmation dialog, toast, dock with badge.

**Icons.** SVG icons are rendered with CSS masks from `assets/icon/*.svg`, plus inline stroked SVGs (20 px, 1.8 stroke). Photography comes from `assets/img/` (species, hero, hospital and brand images).

## 9. Content requirements
- **Voice [Observed]:** short, plain and friendly. Examples: "What needs doing", "Nothing overdue — all clear", "Tap again to restore default".
- **Numbers** use the en-US thousands separator (2,411). Dates use the en-GB short format (e.g. "24 Aug", "OCT 26").
- **Module descriptor lines** are two to four words each, e.g. "Stock and orders" and "Clutch to hatch".
- **Announcements** need a title, body, author, date, an optional image, and a tone (normal or important).
- **Observation notes** need a title, tags, author, date and a colour category.
- **Species** need a common name, a scientific name and a photo.
- **Sample data in the prototype:** 9 sites (Crimson Frosted, Clearspring, Hollowpine, Foxglen, plus five marked "sample site": Ambergrove, Silverbrook, Redcliff, Mistvale, Larkspur). Several Today items and the mortality and new-animal figures per site are marked "sample". Production content must come from the module APIs.
- Text must stay readable when it truncates or wraps. For example, announcement text clamps to 2 lines on mobile.

## 10. Technical notes
- **Hosting [Observed]:** Vercel (`server: Vercel`, `x-vercel-cache: HIT`, served from the bom1/Mumbai edge). Cache headers: `public, max-age=0, must-revalidate`.
- **Framework [Observed]:** none for Style 4. It is a **static, self-contained HTML file** with vanilla JS in one IIFE and no build step, served at both `/style-4` and `style-4.html`. The root page (Styles 1 and 2) is a larger standalone HTML file (about 3.6 MB), also described in its source as "one self-contained file… no build step". It is **not** Next.js.
- **External:** Google Fonts (Inter). Local assets live in `/assets/icon` and `/assets/img`.
- **State:** `localStorage` keys `antz-s4-board` (layout, versioned) and `antz-s4-auth` (prototype logout flag). Pending pages use URL hash routing (`#pending/vaccination|deworming`) with `history.pushState`/`popstate`.
- **Data model implied by the prototype:** per site: `species, animals, new, mortality[7D,30D,30+], audit, sections, enclosures, appr[pending,approved,rejected]`. Today items: `[task, count, module, icon, colour, overdue?]`. Module catalogue entries: `[key, name, line, category, colour, icon, screens[label, badge?, isAction?, href?]]`.
- **For production [Inferred]:** replace the hard-coded data with module APIs; store layouts on the server per user, not only per device; filter widgets by permissions; replace the toast placeholders with real routes; and add real authentication.

## 11. Success metrics (proposed)
| Metric | Target (proposed) |
|---|---|
| Time from opening Home to the first module action | ↓ 30% vs current home |
| Share of sessions where the user opens an item from the Today widget | ≥ 40% |
| Overdue items cleared within 24 h of appearing | ↑ vs baseline |
| Users who customise their board (≥ 1 change saved) within 30 days | ≥ 25% |
| Quick Actions usage (opens per active user per week) | Tracked; ≥ 2 |
| Task success in usability testing, Style 4 vs Styles 1–3 (find overdue vaccinations; switch site; reorder a widget) | ≥ 90% success, highest SUS of the four |
| Accessibility | 0 axe Critical/Serious issues; keyboard-only completion of all FRs |
| Performance | LCP ≤ 2.5 s, CLS ≤ 0.1 on a mid-range tablet |

## 12. Milestones (proposed)
1. **M1 – Style decision:** design review and usability tests compare Styles 1–4, and one direction is chosen.
2. **M2 – Design hardening:** close the accessibility gaps in NFR-A2, finalise tokens and components, and write the specs for empty, loading and error states.
3. **M3 – Data integration:** connect the site-scoped stats, the Today feed and the permission-filtered widget catalogue.
4. **M4 – Personalisation backend:** layout storage per user on the server, with default-layout versioning.
5. **M5 – Beta:** pilot with one site (e.g. a curator and the hospital team), instrument the metrics, then roll out.

## 13. Out of scope
- Module screens other than Pending Vaccination and Pending Deworming.
- Real authentication, password reset ("Password reset link" is a toast only) and SSO.
- Notification centre content, chat functionality, and the creation flows behind the "+" actions.
- Admin configuration of default boards per role.
- Offline support and native mobile apps.

## 14. Open questions and assumptions
**Assumptions**
- A1: ANTZ is a B2B zoo and wildlife-collection management platform used by multi-site organisations. "Vantara admin" in the sample data suggests a client or pilot organisation.
- A2: "Command Centre" is the product name for the Home screen. The header button only shows a toast.
- A3: Styles 1–4 are competing explorations for one Home screen, not separate features.
- A4: Figures on production widgets come from the respective module services and respect the user's site access.

**Open questions**
1. Which style will ship, or will elements of several be merged? What are the decision criteria?
2. How do permissions work exactly? Which roles see which widgets? Are the "for everyone" locked widgets (Today, Collections, Animals, Housing, Mortality) right for every role, for example security staff?
3. Should layouts sync across devices and be stored on the server? The logout copy says the layout "stays saved on this device".
4. Can admins set a default board per role or per site?
5. What exactly do "Overdue" and "Pending" mean for each module, and who owns the rules? Is the Today feed scoped to the user, their team or the site?
6. Some Today counts are very large (Sexing 28,532, Necropsy reports 14,296). Are these real backlogs, and does the widget need grouping or thresholds?
7. Does the site picker scope the Today widget too? Today it does not change with the site.
8. What does the header search ("Search 'Ira'") search: animals, people or everything? How does it relate to Quick Actions?
9. Mortality "30+": does it mean more than 30 days, or all time?
10. Is the Audit "LIVE" badge real-time data? How often does it refresh?
11. Is a keyboard or button-based alternative to drag-to-reorder required? (Recommended, to meet WCAG 2.5.7.)
12. Should the product be localised? Number formats are en-US and date formats are en-GB, which mixes locales.
13. Is the Communication dock badge (3) the same data as the Communication widget?
14. Is there a light/dark theme requirement? Only a light theme is observed.
15. Which device is the primary target? Style 1's source is an iPad Pro 12.9" artboard, and Style 4 is responsive down to phone width.
