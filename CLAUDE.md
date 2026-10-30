# Catssistant — Claude Collaboration Guide

## Project
Cat care assistant app. The **web app is the active build** (Next.js). The iOS app is planned for later.

**Repo:** https://github.com/PacificWord70/Catssistant  
**Local path (Heidi):** C:\Users\Heidi\Documents\GitHub\Catssistant

---

## Git Workflow — Read This First

**Always pull before starting any work session.** 3 contributors all commit to main — stale local copies cause merge conflicts.

### Committing
- One logical change per commit — do not batch unrelated work together
- Commit only the files that change for that one thing — no blind `git add .`
- If two unrelated changes land in the same file, stage in two passes

Message conventions live in `.claude/commit-style.md`, which is untracked. Ask a
maintainer for a copy if you do not have one.

### Pushing
- **Do NOT push unless a maintainer says to, or you ask and they approve**
- Ask about pushing when: a feature feels complete, before ending a long session, or after several commits have accumulated locally
- Never force push

---

## Tech Stack — Web App (active)
- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS with custom brand tokens (see `tailwind.config.ts`)
- Fonts: Figtree (body), Fraunces (display/headings) — both via `next/font/google`
- Animation: framer-motion (see `components/motion/`)
- State: Redux Toolkit (`store/`) — three slices, `cats` / `schedule` / `items`,
  provided by `store/StoreProvider` in the root layout
- Persistence: localStorage via `lib/storage.ts` — backend vendor still undecided
- Tests: Vitest — `npm test`, config in `vitest.config.mts`
- Formatting: Prettier (`.prettierrc.json`) — `npm run format`
- Run dev server: `npm run dev` → http://localhost:3000

### Scripts
`dev` · `build` · `start` · `lint` · `typecheck` · `test` / `test:watch` ·
`format` / `format:check`

### Why not Vite
Considered and rejected. Vite is a build tool; Next.js already includes one plus
routing and server rendering. Migrating would mean hand-rolling replacements for
things that already work, and the remaining roadmap (state, canvas, charts,
performance, tests) is framework-agnostic.

## Tech Stack — iOS App (planned)
- Language: Swift / SwiftUI, iOS 17+
- Requires macOS + Xcode (use the MacOS VM)

---

## Design System
- Background: warm apricot `#FCCF9C` — `hsl(32, 95%, 80%)`, set on `body` in
  `globals.css`. Do not push it further toward orange: its hue already sits
  within 7° of `brand-orange`, so the page would start blending into the buttons
  and nav instead of sitting behind them. Adjust lightness instead.
- Tailwind brand colors: `orange #F26A1B`, `tan #E7C9A9`, `brown #6B4A34`,
  `slate #5F8AA8`, `cream #FFFBF6`, `charcoal #2B2622`
- `font-display` = Fraunces (headings), `font-sans` = Figtree (body)
- Shadows: `shadow-soft` for resting cards, `shadow-card` for hover/raised
- Cards: `rounded-3xl`, `shadow-soft`, `border-brand-tan/30`
- Inputs: `rounded-2xl border border-brand-tan/50 focus:ring-brand-orange/40`

### No images in this repo
`*.png/jpg/jpeg/gif/webp` are gitignored. Do not create, generate, or download
artwork. Where art is needed, draw it in code or use a CSS placeholder so real
hand-drawn work can be dropped in later. Files committed before this rule
(brand logos, design mockups) stay tracked.

Three explicit exceptions carry a `.gitignore` negation, each of which must sit
**after** the blanket `*.png` rule, since the last matching rule wins:
`public/images/pets/*` (About page photos), `public/images/cat-tree.png` plus
`public/images/cats/cat-*.png` (home page navigation), and
`public/images/portraits/*.png` (the portrait layers coloured in for cats
without a photo).

### Never redraw Heidi's artwork
When Heidi supplies a drawing, use **her file**. Do not re-derive the linework
by eye into paths or canvas calls — it comes out an imitation and she will spot
it immediately. The tree cats and the portraits work precisely because the
code never draws a cat: it colours and places her exported PNGs, so the
geometry is always hers.

To colour line art without moving a line: label connected components of non-line
pixels, render a numbered region map, look at it, then assign a brand token per
region id. Blend anti-aliased pixels toward the fill by their own lightness so
edges stay smooth, and never write to line pixels. `sharp` is already present
via Next and is enough for decode, encode and compositing.

---

## Privacy-First Architecture (core product value)
The app uses **only data the user explicitly enters**. No passive tracking, no
behavioral analytics, no data selling. Location features pull from profile fields
(`locationCity` / `locationRegion` / `locationCountry`), **never from device GPS
unless the owner opts in** by pressing "Detect my location" in `CatForm`. This is
non-negotiable.

That opt-in is bound by three rules:

- It only ever runs from that button. Never on load, never in an effect, never
  as a side effect of anything else.
- Coordinates are rounded to two decimal places (~1km) before they leave the
  browser. A city lookup does not need a doorstep.
- Nothing GPS-derived is stored. Only the city, region and country that come
  back get saved.

Loosening any of those is a product decision, not an implementation detail.

---

## File Structure — Web App
```
Catssistant/
├── app/
│   ├── layout.tsx              # Root layout (StoreProvider, NavBar, fonts)
│   ├── page.tsx                # Home — headline beside the CatTree nav
│   ├── globals.css             # Tailwind + body background + .hover-lift
│   ├── onboarding/
│   │   ├── page.tsx            # First-time welcome screen
│   │   └── getting-a-cat/      # "I'm getting a cat" — picked-out vs researching
│   ├── cats/
│   │   ├── page.tsx            # My Cats grid
│   │   ├── new/page.tsx        # Add cat form (?prospective=1 hides microchip)
│   │   └── [id]/
│   │       ├── page.tsx        # Cat profile
│   │       └── edit/page.tsx   # Edit cat form
│   ├── schedule/page.tsx       # Calendar | List toggle (?view=list)
│   ├── backup/page.tsx         # Back up & restore — export/import JSON
│   ├── items/page.tsx          # My Items
│   ├── health/page.tsx         # Weight records, per-cat charts and stats
│   ├── breeds/, about/, resources/
│   └── guides/, shopping/      # Placeholders — icon, heading, "coming soon"
├── store/                      # Redux Toolkit
│   ├── index.ts                # configureStore — cats/schedule/items/health slices
│   ├── StoreProvider.tsx       # Wraps the app in the root layout
│   ├── catsSlice.ts, scheduleSlice.ts, itemsSlice.ts, healthSlice.ts
│   ├── selectors.ts, hooks.ts, types.ts, *.test.ts
├── components/
│   ├── NavBar.tsx              # Orange top nav, sliding indicator, scroll-shrink
│   ├── CatCard.tsx             # Grid card — avatar/photo, name, 2 breeds, coat, age
│   ├── CatPicture.tsx          # Round chip — photo or CatPortrait
│   ├── CatPortrait.tsx         # Portrait painted from the cat's details (see notes below)
│   ├── BreedTag.tsx            # Breed label + portalled tooltip (pill/inline/removable)
│   ├── CatForm.tsx             # Add/edit cat form (shared by /new and /edit)
│   ├── ScheduleEventForm.tsx   # Event modal, per-category fields, multi-cat
│   ├── ScheduleCalendar.tsx    # Month grid with per-day category dots
│   ├── ItemForm.tsx            # Household item modal
│   ├── WeightLogForm.tsx       # Weight reading modal (Health, Schedule)
│   ├── Dialog.tsx              # Shared modal — focus trap, Escape, discard confirm
│   ├── MetricChart.tsx         # Health chart
│   ├── HealthStatCard.tsx      # One cat's health stats (side by side when comparing)
│   ├── ScheduleList.tsx        # Schedule list view — range, search, sort
│   ├── ScheduleEventRow.tsx    # Event row shared by calendar day list and list view
│   ├── SegmentedControl.tsx    # Accessible toggle group (aria-pressed)
│   ├── CatTree.tsx             # Home page nav — callouts on Heidi's cat tree art
│   ├── CatssistantLogo.tsx     # Logo component
│   └── motion/                 # Reveal, Parallax, HoverLift (framer-motion)
├── lib/
│   ├── storage.ts              # Cats + schedule events in localStorage, plus migrations
│   ├── itemStorage.ts          # Household items
│   ├── healthStorage.ts        # Health records
│   ├── storageSafety.ts        # Shared read/write — unreadable data, quota errors
│   ├── breeds.ts               # BREEDS array
│   ├── catAttributes.ts        # Coat/energy/hunting/illness option lists
│   ├── itemAttributes.ts       # Household item option lists
│   ├── breedDefaults.ts        # effective* readers, plus breedFillIns for CatForm
│   ├── catPicture.ts           # catPictureSrc — the photo, if usable
│   ├── portrait.ts             # Pose + colour per part from age/energy/coat (see notes below)
│   ├── portraitRegions.ts      # Which numbered region of each pose is which part
│   ├── scheduleAttributes.ts   # Categories, litter types, durations
│   ├── scheduleUtils.ts        # Recurrence expansion, month grid, date/time labels
│   ├── scheduleValidation.ts   # Event form validation, field by field
│   ├── scheduleList.ts         # List view windows, search, sort, grouping
│   ├── backup.ts               # Backup build/validate/merge (schema version 1)
│   ├── dateKeys.ts             # Local YYYY-MM-DD keys — never toISOString
│   ├── health*.ts              # Health metrics, analysis, validation
│   ├── foodConversion.ts       # Servings as written → grams / cups / kcal via label facts
│   ├── foodFacts.ts            # Normalise label facts at every entry point; migrateProduct
│   ├── photo.ts                # Photo type check + downscale/re-encode
│   ├── safeUrl.ts              # safeImageSrc, telHref — guards for stored URLs
│   ├── catTreeArt.ts           # Pixel work on the cat tree drawing
│   ├── utils.ts                # catHumanAge, catAgeLabel, catAgeShort,
│   │                           #   coatLabel, catLifeStage, catWeightLbs
│   └── *.test.ts               # Vitest — logic tests live beside the code
└── types/
    ├── cat.ts                  # Cat, Vet, coat/energy/hunting unions, LifeStage
    ├── scheduleEvent.ts        # ScheduleEvent + per-category field types
    ├── item.ts                 # Household items
    ├── product.ts              # Product + ProductMatch (recommendation criteria)
    ├── recommendation.ts       # Recommendation (embeds Product, carries reasons)
    └── healthRecord.ts         # Dated per-cat health measurements
```

---

## Coding Conventions
- Pages using hooks or router must have `'use client'` at the top
- localStorage access only in client components or `lib/storage.ts` (guarded by `typeof window === 'undefined'`)
- Data mutations go through `lib/storage.ts` — never write localStorage directly in components
- Tooltips that could be clipped by `overflow-hidden` parents must use `createPortal` to render into `document.body`
- Do not add packages/dependencies without discussing with the team first
- Storage writes throw `StorageWriteError` (`lib/storageSafety.ts`) with a
  message written for the owner. Forms catch it and show `error.message`
  inline; never swallow it. A read that can't be parsed is backed up and never
  treated as empty — "couldn't read" must not become "overwrite with nothing"
- Dates are local `YYYY-MM-DD` keys from `lib/dateKeys.ts`. Never
  `toISOString().slice(0, 10)` (tomorrow in a US evening) or
  `new Date('YYYY-MM-DD')` (UTC midnight, yesterday west of UTC)
- Anything stored that lands in `src` or `href` goes through `lib/safeUrl.ts`
- Modals use `components/Dialog.tsx`; every input has a label tied by `htmlFor`
- User-facing copy makes no claims about where data lives ("stays on your
  device") — accounts with server storage are coming
- Every stored record carries `updatedAt`, stamped by the storage save
  functions, which return the stamped record for the thunk to dispatch. Old
  records may lack it; compare with `updatedAt ?? createdAt`. Backup merges
  depend on this, so never bypass the save functions
- New collections must be added to `lib/backup.ts`, or backups silently drop them
- A feeding is stored exactly as the owner wrote it (cans, cups, g, oz, tbsp)
  and points at a product. Conversion to grams, cups or calories happens only
  at chart time from the product's label facts (`lib/foodConversion.ts`), and
  never guesses: a serving that cannot be converted leaves the cat off that
  chart, named. A can never becomes cups. Label facts pass through
  `normaliseFoodFacts` wherever they enter (form, read, import)

---

## Key Components — Notes

### BreedTag
`components/BreedTag.tsx` — reusable breed label with hover tooltip (portaled to body to avoid overflow clipping).
- `variant="pill"` (default) — rounded pill with background, used in CatCard
- `variant="inline"` — plain text/link, used in cat profile page
- `onRemove` prop — shows × button, used in CatForm selected breed chips

### CatForm
- Uses a custom breed combobox (not a native `<datalist>`) so breed options can show hover tooltips
- Breed dropdown filters as you type and shows every match; tooltip appears above the hovered row
- Coat colour and pattern are separate fields — see the migration note below
- Location detection uses Nominatim (OpenStreetMap) — no GPS stored, only city/region/country saved to profile

### CatTree
`components/CatTree.tsx` — the home page navigation. Six buttons positioned over
`public/images/cat-tree.png`, which is Heidi's line drawing with its regions
colour-filled (see the artwork rules above).

Three things are kept deliberately separate, because they change for different
reasons:
- `SPOTS` — the seven places on the drawing a button can sit, in the artwork's
  own pixel coordinates (811x1211). These describe where the perches *are*, so
  they only change if the artwork does.
- `PERCHES` — which button sits on which spot. Re-assigning is a one-number edit.
- `lines` — per-button nudge off its spot, counted in button-heights, not
  artwork pixels. The buttons keep their size while the drawing scales down, so
  their spacing belongs measured against themselves. Fractions are fine.

There are seven spots and six buttons; spot 5 (the small left ledge) is the
empty one, because an empty hammock reads as a missing link.

### CatCard
- Shows up to 2 breeds (silently truncates, no +N badge)
- Shows a `CatPortrait` when a cat has no uploaded photo

### Cat pictures
`catPictureSrc(cat)` in `lib/catPicture.ts` is the photo if it passes
`safeImageSrc`, else `undefined`, and every caller (CatCard, the profile hero,
`components/CatPicture.tsx` for chips) then renders `components/CatPortrait.tsx`
instead: a portrait painted from the cat's own details, so the example cats
and an owner's cats get the same treatment. The home page tree still uses
`public/images/cats/`.

`lib/portrait.ts` decides what to paint. Pose: kitten if the life stage is
Kitten, otherwise `POSE_BY_ENERGY[effectiveEnergy(cat)]` — Low → lying,
Medium → sit-tail-out, High → stretch-curl, Unknown → sit-tail-curl
(stretch-up is a spare). Colours: `COAT_TONES` gives each `CoatColor` a
base/shade/light triple, and `portraitColours(color, pattern)` assigns one to
each part — Solid is base all over with no inner lines; Tabby pales the
bib/belly/paws and darkens the tips; Tuxedo whites the front; Colorpoint is
the light tone with the shade on ears, legs, paws and tail tip; Calico and
Tortoiseshell patch in fixed orange (and black) regardless of coat colour.
Ear insides match the ear tips — no pink. Unknown colour → Cream, unknown pattern →
Solid. It is a stand-in by colour, not a likeness.

The layers live in `public/images/portraits/{pose}-{outline,inner,regions}.png`:
Heidi's outline, her thin part-dividing lines, and a map whose R channel is a
region id (alpha 255 inside the cat). `lib/portraitRegions.ts` names each id
by looking at a numbered render — if a pose is re-exported, check it again.
`CatPortrait` fills each region's pixels with its part's colour, draws the
inner lines when the pattern has colour changes to edge, then the outline on
top, exports a blob URL cached per appearance for the session, and shows it in
an `<img>` at native layer resolution so the browser's downscale stays crisp.

### Storage migrations
`lib/storage.ts` migrates old shapes on read rather than rewriting localStorage,
so reads stay side-effect free and the new shape persists on next save. Migrations
must be **idempotent** — running twice equals running once. Existing example:
cats saved before the colour/pattern split may hold a pattern name in `color`.

---

## Collaborators
3 contributors all working on `main`. Check recent commits before editing a file someone else may be actively working on.
