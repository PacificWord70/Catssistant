<!-- refreshed: 2026-07-04 -->
# Architecture

**Analysis Date:** 2026-07-04

## System Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Pages (Next.js App Router)                 │
│  /cats, /schedule, /breeds, /about, /onboarding, /guides, etc   │
│              `app/[feature]/page.tsx`                            │
└────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                    Shared Components Layer                        │
│    CatForm, CatCard, NavBar, ScheduleCalendar, etc              │
│                    `components/*.tsx`                            │
└────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                      Data & Utils Layer                           │
│   storage.ts, breeds.ts, utils.ts, scheduleUtils.ts             │
│                        `lib/*.ts`                                │
└────────────────────────────────┬────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                    Type Definitions                               │
│           Cat, ScheduleEvent, and related types                  │
│                        `types/*.ts`                              │
└────────────────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
            ┌──────────────────┐      ┌──────────────────┐
            │   localStorage   │      │  Nominatim API   │
            │   (persistence)  │      │  (location only) │
            └──────────────────┘      └──────────────────┘
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
| Storage Layer | Read/write cats and schedule events to localStorage | `lib/storage.ts` |
| Utilities | Age calculations, date formatting, schedule expansion | `lib/utils.ts`, `lib/scheduleUtils.ts` |

## Pattern Overview

**Overall:** MVC-adjacent with client-side state management

**Key Characteristics:**
- **Privacy-first:** No passive tracking. All data explicitly entered by user.
- **Client-side persistence:** localStorage stores all cat profiles and schedule events
- **Stateful components:** Pages use `useState` to manage cat lists and schedule data, re-fetch from storage on mount
- **No backend:** This is a PWA-like client-side app — works fully offline
- **Router-based routing:** Next.js App Router handles page navigation

## Layers

**Page Layer:**
- Purpose: Route entry points, redirect logic (e.g., redirect to onboarding if no cats), layout composition
- Location: `app/**/*.tsx`
- Contains: Client components that wrap feature pages, use hooks for data fetching from storage
- Depends on: Components, storage utilities, types
- Used by: Next.js App Router

**Component Layer:**
- Purpose: Reusable UI building blocks — forms, cards, calendars, navigation
- Location: `components/*.tsx`
- Contains: Forms (`CatForm`, `ScheduleEventForm`), display components (`CatCard`, `NavBar`), specialized (`BreedTag`, `ScheduleCalendar`)
- Depends on: Types, storage, utilities
- Used by: Pages

**Utility/Service Layer:**
- Purpose: Business logic, data access, formatting, calculations
- Location: `lib/*.ts`
- Contains: 
  - `storage.ts` — localStorage get/save/delete for cats and schedule events
  - `breeds.ts` — breed data and descriptions
  - `scheduleUtils.ts` — calendar building, event expansion, date/time formatting
  - `utils.ts` — cat age calculations
  - `catAttributes.ts` — dropdown options (coat lengths, energy levels, prey drives, illnesses)
  - `scheduleAttributes.ts` — category options for schedule events
- Depends on: Types
- Used by: Pages and Components

**Type Layer:**
- Purpose: Type definitions, interfaces
- Location: `types/*.ts`
- Contains:
  - `cat.ts` — Cat interface with all profile fields, Vet interface
  - `scheduleEvent.ts` — ScheduleEvent interface with category-specific fields

## Data Flow

### Primary Request Path — Adding a Cat

1. User navigates to `/cats/new` → `app/cats/new/page.tsx` renders
2. Page imports `CatForm` component
3. `CatForm` (`components/CatForm.tsx:104`) initializes local state with empty cat via `newCat()`
4. User fills form — all changes update local component state via `setState`
5. User clicks "Save Cat" → `handleSubmit` calls `saveCat(cat)` from `lib/storage.ts`
6. `saveCat()` reads current cats array from localStorage, appends/updates, writes back
7. Router navigates to `/cats/{cat.id}` (cat profile page)

### Viewing Cats List

1. User navigates to `/cats` → `app/cats/page.tsx` renders
2. Page calls `getCats()` on mount via `useEffect`
3. `getCats()` (`lib/storage.ts:7`) reads from localStorage, returns array
4. Page renders grid of `CatCard` components
5. Each card links to `/cats/{cat.id}` or `/cats/{cat.id}/edit`

### Schedule Event Creation & Expansion

1. User navigates to `/schedule` → `app/schedule/page.tsx` renders
2. Page loads events via `getScheduleEvents()` on mount
3. User selects date and clicks "New event" → `ScheduleEventForm` opens
4. User fills form, selects cats, chooses category (Feeding, Medication, etc.) → category-specific fields appear
5. User sets recurrence (daily, weekly, monthly, none) and optional end date
6. Submit calls `saveScheduleEvent(event)` → stored in localStorage
7. Calendar re-renders by calling `buildMonthGrid(monthStart, events)` in `lib/scheduleUtils.ts`
8. `buildMonthGrid()` calls `expandEvents()` which:
   - Iterates all events
   - For recurring events, generates instances for each date in range
   - Returns sorted `AgendaItem[]` (one per date)
9. Calendar displays agenda items in each day cell

**State Management:**
- Each page manages its own state for cats, events, UI (which date is selected, which event is being edited)
- No global state provider — just local `useState`
- Data source of truth: localStorage
- On any mutation, page re-fetches from storage to stay in sync

## Key Abstractions

**Cat Profile:**
- Purpose: Represent a single cat with comprehensive metadata
- Examples: `app/cats/[id]/page.tsx` displays a Cat, `CatForm.tsx` edits one
- Pattern: Immutable data structure (Cat interface), mutations via `saveCat()` function

**Schedule Event:**
- Purpose: Represent recurring or one-time reminders/tasks for one or more cats
- Examples: "Feed Whiskers at 8 AM daily", "Annual vet checkup on 2026-09-15"
- Pattern: Recurrence rules are stored (not all instances), expanded at render time

**Breed Info:**
- Purpose: Provide origin, traits, description for breed selection
- Examples: Display as tooltip in CatForm, shown in CatCard
- Pattern: Static BREEDS array in `lib/breeds.ts`

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page load
- Responsibilities: Set up fonts (Figtree, Tapestry), render NavBar, CatWalker easter egg, wrap content

**Home Page:**
- Location: `app/page.tsx`
- Triggers: `/` route
- Responsibilities: Render CatTree component (home card UI)

**Onboarding:**
- Location: `app/onboarding/page.tsx`
- Triggers: `/onboarding` route; auto-redirect here if no cats exist
- Responsibilities: Welcome screen, redirect user to add first cat or read getting-a-cat guide

**My Cats:**
- Location: `app/cats/page.tsx`
- Triggers: `/cats` route
- Responsibilities: List all cats in grid, redirect to onboarding if empty

**Cat Profile:**
- Location: `app/cats/[id]/page.tsx`
- Triggers: `/cats/{id}` route
- Responsibilities: Display cat details (photo, age, vet info, personality notes), link to edit form

**Add/Edit Cat:**
- Location: `app/cats/new/page.tsx`, `app/cats/[id]/edit/page.tsx`
- Triggers: `/cats/new` and `/cats/{id}/edit` routes
- Responsibilities: Render CatForm with or without existing cat data

**Schedule:**
- Location: `app/schedule/page.tsx`
- Triggers: `/schedule` route
- Responsibilities: Month calendar view, list events per day, open form to add/edit/delete

## Architectural Constraints

- **Threading:** Single-threaded event loop (browser JavaScript)
- **Global state:** None — each page holds its own state. Shared state would require Context API or external store (not currently used)
- **Circular imports:** Not observed. Imports flow one direction: Pages → Components → Lib → Types
- **localStorage limits:** Browser limit is typically 5–10 MB. With JSON serialization, supports hundreds of cats and thousands of events
- **No server calls:** App is fully client-side; location detection uses Nominatim API (read-only, no user-identifying data sent)
- **Breed combobox:** Custom implementation (not native datalist) to enable hover tooltips with createPortal (avoids overflow clipping)
- **Date handling:** All dates stored as ISO strings (YYYY-MM-DD); parsed ad-hoc, no date library dependency

## Anti-Patterns

### Direct localStorage Access in Components

**What happens:** Some components could directly call `localStorage.getItem()` instead of going through `lib/storage.ts`

**Why it's wrong:** Bypasses a single data access point, makes mutations harder to track, violates separation of concerns

**Do this instead:** Always use helper functions from `lib/storage.ts` (`getCats()`, `saveCat()`, etc.). This centralizes validation and ensures consistent serialization.

### Storing GPS Coordinates

**What happens:** A component could call `navigator.geolocation.getCurrentPosition()` and store lat/lon in the cat profile

**Why it's wrong:** Violates privacy-first architecture — the app explicitly uses only manually-entered location fields (city/region/country)

**Do this instead:** Keep location detection as opt-in, store only city/region/country via `locationCity`, `locationRegion`, `locationCountry` fields. (Currently done correctly in `CatForm.tsx:129–150`.)

### Uncontrolled Form State

**What happens:** A form could use uncontrolled inputs (no onChange handler) and read values on submit via direct DOM access

**Why it's wrong:** Harder to validate in real-time, violates React best practices

**Do this instead:** Use controlled inputs with `setState` handlers, validate before submit. (Currently done correctly in `CatForm.tsx`.)

## Error Handling

**Strategy:** Graceful degradation with silent fallbacks

**Patterns:**
- localStorage read errors → return empty array (getCats, getScheduleEvents)
- Location detection failures → silently continue (user can manually enter location)
- Breed tooltip positioning → usePortal to avoid rendering outside viewport
- Invalid phone number → show inline error message, prevent submit

## Cross-Cutting Concerns

**Logging:** None — no logging library. Error states are silent or shown as UI messages.

**Validation:** 
- Form validation happens on submit (phone number length, cat name required)
- Invalid states prevent navigation (saveCat only on valid form)

**Authentication:** None — this is a single-user, local-only app.

---

*Architecture analysis: 2026-07-04*
