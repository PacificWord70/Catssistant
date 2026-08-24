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
`*.png/jpg/jpeg/gif/webp` are gitignored, as is `public/art-assets/`. Do not
create, generate, or download artwork. Where art is needed, draw it in code or
use a CSS placeholder so real hand-drawn work can be dropped in later. Files
committed before this rule (brand logos, design mockups) stay tracked.

Three explicit exceptions carry a `.gitignore` negation, each of which must sit
**after** the blanket `*.png` rule, since the last matching rule wins:
`public/images/pets/*` (About page photos), `public/art-assets/{base,features,pattern}-*.png`
(avatar layers), and `public/images/cat-tree.png` (home page navigation).

### Never redraw Heidi's artwork
When Heidi supplies a drawing, use **her file**. Do not re-derive the linework
by eye into paths or canvas calls — it comes out an imitation and she will spot
it immediately. The avatars work precisely because the code never draws a cat:
it tints and layers her exported PNGs, so the geometry is always hers.

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
│   ├── page.tsx                # Home — CatTree nav
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
│   ├── schedule/page.tsx       # Month calendar + per-day event list
│   ├── items/page.tsx          # My Items
│   ├── guides/page.tsx         # New-owner guide series
│   ├── breeds/, about/, resources/
│   └── health/, shopping/      # Placeholders — icon, heading, "coming soon"
├── store/                      # Redux Toolkit
│   ├── index.ts                # configureStore — cats/schedule/items slices
│   ├── StoreProvider.tsx       # Wraps the app in the root layout
│   ├── catsSlice.ts, scheduleSlice.ts, itemsSlice.ts
│   ├── selectors.ts, hooks.ts, types.ts
├── components/
│   ├── NavBar.tsx              # Orange top nav, sliding indicator, scroll-shrink
│   ├── CatCard.tsx             # Grid card — avatar/photo, name, 2 breeds, coat, age
│   ├── CatAvatar.tsx           # Canvas avatar (see notes below)
│   ├── BreedTag.tsx            # Breed label + portalled tooltip (pill/inline/removable)
│   ├── CatForm.tsx             # Add/edit cat form (shared by /new and /edit)
│   ├── ScheduleEventForm.tsx   # Event modal, per-category fields, multi-cat
│   ├── ScheduleCalendar.tsx    # Month grid with per-day category dots
│   ├── ItemForm.tsx            # Household item modal
│   ├── CatTree.tsx             # Home page nav — buttons on Heidi's cat tree art
│   ├── CatssistantLogo.tsx     # Logo component
│   ├── EmptyState.tsx          # No-cats fallback
│   └── motion/                 # Reveal, Parallax, HoverLift (framer-motion)
├── lib/
│   ├── storage.ts              # Cats + schedule events in localStorage, plus migrations
│   ├── itemStorage.ts          # Household items
│   ├── breeds.ts               # BREEDS array
│   ├── catAttributes.ts        # Coat/energy/hunting/illness option lists
│   ├── itemAttributes.ts       # Household item option lists
│   ├── breedDefaults.ts        # effective* readers — derive at read time, store nothing
│   ├── breedFillIns.ts         # Values written into CatForm when a breed is picked
│   ├── scheduleAttributes.ts   # Categories, litter types, durations
│   ├── scheduleUtils.ts        # Recurrence expansion, month grid, date/time labels
│   ├── utils.ts                # catHumanAge, catAgeLabel, catAgeShort,
│   │                           #   coatLabel, catLifeStage, catWeightLbs
│   ├── *.test.ts               # Vitest — 6 files, all of the suite lives here
│   └── avatar/
│       ├── palette.ts          # Coat colour → base/shade/light tones
│       ├── placeholder.ts      # Code-drawn cat, Canvas 2D primitives only
│       ├── breedTraits.ts      # Breed → face/hair/eye traits
│       └── artLayers.ts        # Optional PNG layers + runtime tinting
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
- Falls back to `CatAvatar` when a cat has no uploaded photo

### CatAvatar
Canvas-rendered avatar, `components/CatAvatar.tsx`.
- Drawing code works in a fixed 100×100 space; the context is scaled to the
  requested `size`, so one code path serves every size
- The canvas buffer is separately sized by `devicePixelRatio` — without this it
  looks blurry on retina screens
- Draws `lib/avatar/placeholder.ts` first, then swaps in PNG layers from
  `public/art-assets/` if any exist. That folder is gitignored, so the
  placeholder is the normal path
- Layers are greyscale and tinted at runtime (`multiply`, then `destination-in`
  to restore the alpha mask), so one body serves all six coat colours

### Storage migrations
`lib/storage.ts` migrates old shapes on read rather than rewriting localStorage,
so reads stay side-effect free and the new shape persists on next save. Migrations
must be **idempotent** — running twice equals running once. Existing example:
cats saved before the colour/pattern split may hold a pattern name in `color`.

---

## Collaborators
3 contributors all working on `main`. Check recent commits before editing a file someone else may be actively working on.
