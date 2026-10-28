<!-- GSD:project-start source:PROJECT.md -->

## Project

**Catssistant**

Catssistant is a privacy-first cat care assistant. The web app (Next.js) is the active build and serves as the blueprint for future native iOS and Android apps. It helps cat owners track everything about their cat(s) — daily care events (feeding, litter, meds, vet, grooming, play) and a central profile record — in one place, without passive tracking or data selling.

**Core Value:** Reliable daily care tracking plus a trustworthy central record for each cat. Everything else (sitter handoffs, vet views, shopping, mobile apps) can wait — this cannot.

### Constraints

- **Privacy**: No passive tracking, no GPS-by-default, no behavioral analytics, no data selling — non-negotiable core product value
- **Tech stack**: Next.js 16 App Router, TypeScript, Tailwind, Redux Toolkit — established, avoid casual changes
- **Dependencies**: Do not add packages without discussing with the team first
- **Collaboration**: 3 contributors all commit to `main` — check recent commits before editing shared files
- **Backend/accounts**: Vendor choice (AWS vs. Firebase vs. open-source alternatives) intentionally undecided — do not commit to one without a team discussion

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript (`^5.4.5` declared, 5.9.3 installed) - Full codebase, all `.tsx` and `.ts` files
- JavaScript (JSX/TSX) - React components
- CSS - Tailwind utilities, globals.css. Only 42 lines of it: Tailwind lives in
  `className` strings, so ~99% of hand-written code is TypeScript.

## Runtime

- Node.js (version not pinned in package.json, uses system default)
- npm
- Lockfile: `package-lock.json` present

## Frameworks

- Next.js 16.4.3 (App Router) - Web framework, routing, server-side rendering, API routes
- React 18.3.1 - UI library for interactive components
- Tailwind CSS ^3.4.4 - Utility-first CSS framework with custom brand color tokens
- TypeScript - Type checking (`npm run typecheck`)
- ESLint ^9 - Code linting, flat config in `eslint.config.mjs`, extends
  `eslint-config-next` and `eslint-config-prettier`
- Prettier ^3.9.6 - Formatting, configured in `.prettierrc.json`
- Vitest ^4.1.11 - Test runner, config in `vitest.config.mts` (`npm test`)
- PostCSS ^8.4.38 - CSS processing pipeline
- Autoprefixer ^10.4.19 - Automatic vendor prefixes for CSS

## Key Dependencies

Six runtime dependencies, all of them load-bearing:

- next ^16.4.3 - Next.js framework with App Router
- react ^18.3.1 / react-dom ^18.3.1 - React library and DOM bindings
- @reduxjs/toolkit ^2.12.0 + react-redux ^9.3.0 - Shared client state, see
  `store/`. Cats, schedule and items each get a slice.
- framer-motion ^12.42.2 - Animation, see `components/motion/`

Fonts come from `next/font/google` in `app/layout.tsx` — **Figtree** (body) and
**Fraunces** (display). Not `@next/font`, and the display face is no longer
Tapestry.

## Configuration

- No `.env` files currently in use
- Persistence is localStorage only. No backend, no `.env`, no API keys.
- Backend vendor is deliberately undecided (see Constraints above). `.planning/STATE.md`
  records Vercel as the hosting choice and Firebase as the current *intent* for a
  backend, but neither is committed to or wired up.
- TypeScript config: `tsconfig.json`
- Next.js config: `next.config.mjs` (minimal, uses defaults)
- Tailwind config: `tailwind.config.ts`
- PostCSS config: `postcss.config.mjs`

## Platform Requirements

- Node.js runtime
- Modern browser with ES2020+ support
- File system access for development
- `npm install` to bootstrap
- Node.js runtime server (or serverless hosting compatible with Next.js)
- Browser with localStorage support
- Geolocation API support (for location detection feature)
- Internet access to Nominatim API (for reverse geocoding)

## Notable Absence

- No backend, no database, no authentication, no `.env` files, no API keys.
- CI: `.github/workflows/ci.yml` runs lint, typecheck, test and build on push/PR to main.
- Tests cover logic only: 23 Vitest files under `lib/` and `store/` (storage,
  migrations, recurrence incl. DST, slices, selectors, health, photos, URL
  guards). Components and pages have no tests — there is no DOM test tooling.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- React components: PascalCase (`CatCard.tsx`, `BreedTag.tsx`, `CatForm.tsx`)
- Utilities and helpers: camelCase (`storage.ts`, `utils.ts`, `breeds.ts`)
- Type definitions: PascalCase (`cat.ts` contains `Cat`, `Vet` interfaces)
- Pages follow Next.js conventions: lowercase with brackets for dynamic routes (`[id]`, `[id]/edit`)
- camelCase throughout (`getCats`, `saveCat`, `catHumanAge`, `catAgeShort`, `breedSlug`)
- Helper functions scoped to module level or exported from `lib/` modules
- Type guards and utility functions exported individually, not as namespaced objects
- camelCase for variables and state: `cat`, `setCat`, `photoPreview`, `breedInput`, `hovered`
- Constants in ALLCAPS when they represent fixed configuration: `STORAGE_KEY`, `SCHEDULE_KEY`, `COAT_LENGTHS`, `COUNTRIES`
- Array/enum constants: ALLCAPS (`BREEDS`, `PERCHES`, `FEATURE_TABS`, `KNOWN_ILLNESSES`, `PREY_DRIVES`)
- Interfaces: PascalCase (`Cat`, `Vet`, `Breed`, `Props`, `CountryDef`, `ScheduleEvent`)
- Type aliases for unions: PascalCase (`CoatLength`, `EnergyLevel`, `PreyDrive`, `YesNoUnknown`, `Continent`)
- Props interfaces always named `Props` (singular) and defined at component file scope

## Code Style

- Tailwind CSS for styling — utility-first approach
- Inline styles used sparingly for dynamic positioning (e.g., `CatTree.tsx` absolute positioning)
- Custom Tailwind colors defined in config: `brand-orange`, `brand-tan`, `brand-brown`, `brand-slate`, `brand-cream`, `brand-charcoal`, `brand-pink`
- No external CSS-in-JS library used
- ESLint configured via `eslint-config-next` (default Next.js config)
- Run: `npm run lint` — uses Next.js linter rules
- Strict TypeScript enabled (`strict: true` in `tsconfig.json`)
- Prettier is configured (`.prettierrc.json`); run `npm run format` or
  `npm run format:check`
- ESLint uses flat config (`eslint.config.mjs`), extending `eslint-config-next`
  and `eslint-config-prettier` so the two do not fight over formatting

## Import Organization

- `@/*` maps to repository root (configured in `tsconfig.json`)
- All imports use `@/path` notation, never relative paths like `../../../`
- This applies to: components, lib utilities, types, and app pages

## Error Handling

- `try-catch` blocks around JSON operations — see `lib/storage.ts` for `JSON.parse` safety
- Reads return safe defaults: `getCats()` returns `[]` and backs up anything unreadable (`lib/storageSafety.ts`)
- Writes throw `StorageWriteError` with an owner-facing message; forms show it inline
- Early returns for null/undefined checks: `if (!cat) return null`
- Guard against SSR in browser APIs: `if (typeof window === 'undefined') return []`
- Form validation before submission — check required fields before `saveCat()`
- Async error handling in `CatForm.tsx` — `detectLocation()` catches Nominatim API failures with `finally` block

## Logging

- No explicit logging statements observed in source code
- Development relies on browser DevTools console for debugging
- Error states render as `null` or empty states rather than logging
- No production monitoring/observability integration

## Comments

- Section dividers using `─── Comment ───────────────────────────────────` pattern (see `CatForm.tsx` lines 12, 57, 80, 100)
- Comments mark logical sections: country data, phone formatter, helpers, component
- Inline comments for non-obvious logic: `// Reset phone prefix if phone is empty or only a dial code`
- Commented render conditions for component variants: `// Removable chip — form use`, `// Inline text — profile page`, `// Pill — card use`
- JSDoc `/** */` blocks are used widely — 30 of 65 source files carry them.
  They explain *why*, not what: why reducers must not touch storage in
  `store/catsSlice.ts`, why the stand-in picture in `lib/catPicture.ts` is a
  stand-in by colour and not a likeness. Match that habit; do not add comments
  that restate the code.

## Function Design

- Use object destructuring for component props: `{ cat }: Props`
- Single parameter for utilities unless multiple related values
- Generic type constraints for reusable functions: `updateField<K extends keyof Cat>`
- Functions return typed values: `Cat | undefined`, `string`, `void`
- No implicit `undefined` — explicitly return `[]` or `null` for empty states
- React components return JSX or `null` (not undefined)

## Module Design

- Named exports for utilities: `export function getCats()`, `export const BREEDS`
- Default export for React components: `export default function CatCard()`
- Type-only exports: `export interface Cat`, `export type CoatLength`
- Not used — imports reference specific files directly
- Example: `import { Cat } from '@/types/cat'` not from a barrel
- Constants at module level: `const COUNTRIES`, `const PERCHES`, `const STORAGE_KEY`
- Enums represented as `type` unions with constant arrays: `COAT_LENGTHS: CoatLength[]`
- Static data (breeds, cat attributes) in dedicated `lib/` files, imported into components as needed

## Styling Patterns

- Responsive design using Tailwind breakpoints: `sm:`, `md:`, `lg:`
- Consistent spacing: `gap-4`, `p-7`, `px-4 py-2.5`
- Rounded corners use fixed values: `rounded-2xl`, `rounded-3xl`, `rounded-xl` (design system tokens)
- Hover states: `hover:shadow-md`, `hover:bg-brand-orange/90`, `hover:underline`
- Transitions for interactive elements: `transition-colors`, `transition-all duration-200`
- Standard input pattern defined as const string (see `CatForm.tsx` line 234):

## Client/Server Boundaries

- Pages using hooks, router, or browser APIs must have `'use client'` at the top
- Example: `app/cats/page.tsx`, `app/cats/[id]/page.tsx`, `app/cats/new/page.tsx`
- Pages without interactivity can be Server Components (not observed yet)
- `lib/storage.ts` is the single source of truth for localStorage mutations
- Components must import from storage, never write `localStorage` directly
- Storage functions guard against SSR with `typeof window === 'undefined'`

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Pages | Entry points, route handling, server/client boundary | `app/**/*.tsx` |
| CatForm | Add/edit cat profile, breed combobox with tooltips, location detection | `components/CatForm.tsx` |
| ScheduleEventForm | Add/edit schedule events, multi-cat selection, category-specific fields | `components/ScheduleEventForm.tsx` |
| CatCard | Display cat in grid, shows photo, breeds, color | `components/CatCard.tsx` |
| ScheduleCalendar | Month calendar view, event cells per day | `components/ScheduleCalendar.tsx` |
| NavBar | Top navigation, links to main sections | `components/NavBar.tsx` |
| BreedTag | Reusable breed label with optional hover tooltip | `components/BreedTag.tsx` |
| Store | Shared client state — cats, schedule, items slices | `store/` |
| Storage Layer | Read/write cats and schedule events to localStorage | `lib/storage.ts` |
| Utilities | Age calculations, date formatting, schedule expansion | `lib/utils.ts`, `lib/scheduleUtils.ts` |

## Pattern Overview

- **Privacy-first:** No passive tracking. All data explicitly entered by user.
- **Client-side persistence:** localStorage stores all cat profiles and schedule
  events; the Redux store in `store/` is the live in-memory copy the UI renders
  from, kept in step through thunks that write to storage
- **Stateful components:** Pages read shared data from the Redux store; `useState` is only for local UI state (selected day, open modal)
- **No backend:** This is a PWA-like client-side app — works fully offline
- **Router-based routing:** Next.js App Router handles page navigation

## Layers

- Purpose: Route entry points, redirect logic (e.g., redirect to onboarding if no cats), layout composition
- Location: `app/**/*.tsx`
- Contains: Client components that wrap feature pages, use hooks for data fetching from storage
- Depends on: Components, storage utilities, types
- Used by: Next.js App Router
- Purpose: Reusable UI building blocks — forms, cards, calendars, navigation
- Location: `components/*.tsx`
- Contains: Forms (`CatForm`, `ScheduleEventForm`), display components (`CatCard`, `NavBar`), specialized (`BreedTag`, `ScheduleCalendar`)
- Depends on: Types, storage, utilities
- Used by: Pages
- Purpose: Business logic, data access, formatting, calculations
- Location: `lib/*.ts`
- Contains: 
- Depends on: Types
- Used by: Pages and Components
- Purpose: Type definitions, interfaces
- Location: `types/*.ts`
- Contains:

## Data Flow

### Primary Request Path — Adding a Cat

### Viewing Cats List

### Schedule Event Creation & Expansion

- Shared domain state lives in a Redux Toolkit store (`store/`), wrapped around
  the app by `store/StoreProvider` in `app/layout.tsx`. Three slices: `cats`,
  `schedule`, `items`.
- **localStorage remains the persistence layer; Redux is the live copy the UI
  reads.** Before the store, `/cats`, `/cats/[id]` and `/schedule` each read
  storage on mount and held a private array, so renaming a cat on one page left
  the others stale until they remounted.
- Reducers stay pure — storage reads and writes happen in thunks, never inside a
  reducer, or the same action would produce different results depending on when
  it ran and break DevTools replay.
- Purely local UI state (which day is selected, which modal is open) is still
  plain `useState`. Not everything belongs in the store.

## Key Abstractions

- Purpose: Represent a single cat with comprehensive metadata
- Examples: `app/cats/[id]/page.tsx` displays a Cat, `CatForm.tsx` edits one
- Pattern: Immutable data structure (Cat interface), mutations via `saveCat()` function
- Purpose: Represent recurring or one-time reminders/tasks for one or more cats
- Examples: "Feed Whiskers at 8 AM daily", "Annual vet checkup on 2026-09-15"
- Pattern: Recurrence rules are stored (not all instances), expanded at render time
- Purpose: Provide origin, traits, description for breed selection
- Examples: Display as tooltip in CatForm, shown in CatCard
- Pattern: Static BREEDS array in `lib/breeds.ts`

## Entry Points

- Location: `app/layout.tsx`
- Triggers: Every page load
- Responsibilities: Set up fonts (Figtree, Fraunces), wrap children in StoreProvider, render NavBar and the main container
- Location: `app/page.tsx`
- Triggers: `/` route
- Responsibilities: Render CatTree component (home card UI)
- Location: `app/onboarding/page.tsx`
- Triggers: `/onboarding` route; auto-redirect here if no cats exist
- Responsibilities: Welcome screen, redirect user to add first cat or read getting-a-cat guide
- Location: `app/cats/page.tsx`
- Triggers: `/cats` route
- Responsibilities: List all cats in grid, redirect to onboarding if empty
- Location: `app/cats/[id]/page.tsx`
- Triggers: `/cats/{id}` route
- Responsibilities: Display cat details (photo, age, vet info, personality notes), link to edit form
- Location: `app/cats/new/page.tsx`, `app/cats/[id]/edit/page.tsx`
- Triggers: `/cats/new` and `/cats/{id}/edit` routes
- Responsibilities: Render CatForm with or without existing cat data
- Location: `app/schedule/page.tsx`
- Triggers: `/schedule` route
- Responsibilities: Month calendar view, list events per day, open form to add/edit/delete

## Architectural Constraints

- **Threading:** Single-threaded event loop (browser JavaScript)
- **Global state:** Redux Toolkit store in `store/` (cats, schedule, items, health slices); localStorage remains the persistence layer
- **Circular imports:** Not observed. Imports flow one direction: Pages → Components → Lib → Types
- **localStorage limits:** Browser limit is typically 5–10 MB. With JSON serialization, supports hundreds of cats and thousands of events
- **No server calls:** App is fully client-side; location detection uses Nominatim API (read-only, no user-identifying data sent)
- **Breed combobox:** Custom implementation (not native datalist) to enable hover tooltips with createPortal (avoids overflow clipping)
- **Date handling:** All dates stored as ISO strings (YYYY-MM-DD); parsed ad-hoc, no date library dependency

## Anti-Patterns

### Direct localStorage Access in Components

### Storing GPS Coordinates

### Uncontrolled Form State

## Error Handling

- localStorage read errors → return empty array (getCats, getScheduleEvents)
- Location detection failures → silently continue (user can manually enter location)
- Breed tooltip positioning → usePortal to avoid rendering outside viewport
- Invalid phone number → show inline error message, prevent submit

## Cross-Cutting Concerns

- Form validation happens on submit (phone number length, cat name required)
- Invalid states prevent navigation (saveCat only on valid form)

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
