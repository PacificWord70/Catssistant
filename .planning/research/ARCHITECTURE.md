
# Architecture Research

**Domain:** Client-only event-tracking app (localStorage today) evolving toward list/filter views, export/backup, and an eventual offline-first sync backend
**Researched:** 2026-07-04
**Confidence:** MEDIUM (general patterns cross-checked across multiple independent sources; not project-specific, presented for the team to decide, not a mandate)

## Standard Architecture

### System Overview — Where Catssistant Is Today vs. Where the Seams Go

```text
┌───────────────────────────────────────────────────────────────────┐
│                     Pages / Components (UI)                       │
│   app/schedule/page.tsx, ScheduleCalendar, (new) ScheduleListView  │
└──────────────────────────────┬────────────────────────────────────┘
                                │  calls
┌──────────────────────────────▼────────────────────────────────────┐
│              Query/View Layer  — NEW, pure functions               │
│   filterEvents(events, criteria), sortEvents(events, key, dir)     │
│   (reuses lib/scheduleUtils.ts expandEvents() output — no new      │
│    storage, no new fields; both Calendar and List call this)       │
└──────────────────────────────┬────────────────────────────────────┘
                                │  reads
┌──────────────────────────────▼────────────────────────────────────┐
│         Repository / Data-Access Facade  — lib/storage.ts          │
│   getCats / saveCat / deleteCat / getScheduleEvents / save / del   │
│   (today: calls localStorage directly and IS the adapter;          │
│    tomorrow: becomes a thin facade over a swappable adapter)       │
└──────────┬───────────────────────────────────────────┬────────────┘
           │                                            │
┌──────────▼──────────┐                     ┌───────────▼───────────┐
│  Export/Import       │                     │   Storage Adapter      │
│  Boundary — NEW       │                     │   (interface, NEW)     │
│  lib/backup.ts        │                     │   implemented today by │
│  exportAll()/          │                     │   localStorage; later  │
│  importAll(json)       │                     │   by IndexedDB and/or  │
│  {schemaVersion, ...}  │                     │   a sync-queue adapter │
└──────────┬────────────┘                     └───────────┬────────────┘
           │                                              │
           ▼                                              ▼
   Browser file download /                    ┌───────────────────────┐
   file picker (JSON blob)                    │  FUTURE: Sync Engine   │
                                               │  + local cache (IDB)   │
                                               │  + remote backend API  │
                                               └───────────────────────┘
```

The current codebase (per `.planning/codebase/ARCHITECTURE.md`) already has a clean one-directional flow: Pages → Components → `lib/storage.ts` → localStorage, with all mutations centralized in `storage.ts`. That discipline is exactly what makes the evolution below cheap — the risk is components reaching past `storage.ts` for anything, which the existing anti-pattern list already flags.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Query/View layer | Pure filter + sort over already-fetched events; no I/O | Small functions in a new `lib/scheduleQueries.ts` (or extend `scheduleUtils.ts`), consumed by both the calendar and the new list view |
| Repository facade | Single choke point for reads/writes; hides *how* data is persisted from every caller | `lib/storage.ts`, unchanged public function signatures (`getCats`, `saveScheduleEvent`, etc.) |
| Storage adapter | Actual persistence mechanism behind the facade | Today: direct `localStorage.getItem/setItem`. Later: `idb`/`idb-keyval` wrapper, or a remote-backed adapter |
| Export/Import boundary | Serialize/deserialize the *whole* local dataset as a portable, versioned document | `lib/backup.ts`: `exportAll()` returns `{ schemaVersion, exportedAt, cats, scheduleEvents }`; `importAll(json)` validates + migrates + upserts via the repository facade |
| Sync engine (future) | Reconcile local writes with a remote backend; resilient to offline/crash | A queue of pending mutations (with timestamps) + a background push/pull process against a chosen backend |

## Recommended Project Structure (incremental additions only)

```
lib/
├── storage.ts              # UNCHANGED public API — becomes thin facade later
├── scheduleUtils.ts         # UNCHANGED — buildMonthGrid, expandEvents (calendar)
├── scheduleQueries.ts       # NEW — filterEvents(), sortEvents(), shared by list + calendar
├── backup.ts                # NEW — exportAll(), importAll(), schemaVersion + migration chain
└── storageAdapter.ts         # FUTURE — interface + LocalStorageAdapter, IndexedDBAdapter, RemoteAdapter

components/
├── ScheduleCalendar.tsx      # UNCHANGED
├── ScheduleListView.tsx       # NEW — table/list UI, calls scheduleQueries + storage.ts
└── BackupPanel.tsx            # NEW — export button (download), import button (file picker)

app/
├── schedule/page.tsx          # UNCHANGED route; add a view-mode toggle (Calendar | List)
└── settings/page.tsx (or similar)  # NEW route housing BackupPanel
```

### Structure Rationale

- **`scheduleQueries.ts` is separate from `scheduleUtils.ts`:** `scheduleUtils.ts` already owns recurrence expansion (a distinct, fragile concern per `CONCERNS.md`). Filtering/sorting is a different, much simpler concern operating on the *output* of expansion — keeping them separate avoids growing an already-important file and keeps the list view's logic independently testable.
- **`backup.ts` sits above `storage.ts`, never touches `localStorage` directly:** this means the export/import boundary automatically keeps working unchanged when the adapter underneath `storage.ts` changes later (IndexedDB, then remote).
- **`storageAdapter.ts` is listed as FUTURE, not to be built now:** introducing the interface without a second implementation is speculative complexity. It becomes justified once IndexedDB or a sync backend is actually being built — but sketching the interface now signals where the seam belongs so `storage.ts`'s public API is not accidentally reshaped later in a breaking way.

## Architectural Patterns

### Pattern 1: Repository Facade (data-access seam)

**What:** All reads/writes to persisted data go through a small set of named functions (`getCats`, `saveScheduleEvent`, ...) rather than components touching the storage mechanism directly. Catssistant already does this today for localStorage.
**When to use:** As soon as more than one caller needs the same data, and especially before a storage mechanism might change underneath.
**Trade-offs:** Slight indirection for a one-person, one-storage-mechanism app; pays off the moment there's a second consumer (list view) or a second storage mechanism (IndexedDB, remote).

**Example:**
```typescript
// lib/storage.ts today (adapter == implementation, no interface yet)
export function getScheduleEvents(): ScheduleEvent[] { /* localStorage read */ }

// Same public signature, later backed by a swappable adapter — callers never change
export function getScheduleEvents(): ScheduleEvent[] {
  return activeAdapter.list('scheduleEvents')
}
```

### Pattern 2: Pure Query Layer on Top of a Shared Fetch

**What:** List/filter/sort views and calendar views both call the *same* fetch (`getScheduleEvents()` + `expandEvents()`), then apply different pure transforms (`filterEvents`, `sortEvents`) purely in memory. No new data model, no duplicated fetch logic.
**When to use:** Whenever multiple views need different projections of the same underlying records — exactly the stated requirement here.
**Trade-offs:** Requires discipline to not let filter/sort logic leak into the calendar-specific `scheduleUtils.ts` or into components directly; if skipped, filter logic tends to get duplicated between the two views and drift out of sync.

**Example:**
```typescript
// lib/scheduleQueries.ts
export function filterEvents(events: AgendaItem[], criteria: FilterCriteria) { /* ... */ }
export function sortEvents(events: AgendaItem[], key: SortKey, dir: 'asc'|'desc') { /* ... */ }

// Both consumers:
const events = getScheduleEvents()
const agenda = buildMonthGrid(month, events)       // calendar
const list = sortEvents(filterEvents(agenda, criteria), 'date', 'asc')  // list view
```

### Pattern 3: Versioned Export/Import Envelope

**What:** Wrap the full exported dataset in an envelope carrying a `schemaVersion` integer. On import, run an ordered chain of small `up()` migration functions to bring older exports to the current shape before writing anything, rather than a single ad-hoc parser. Verified pattern for client-only apps and JSON configuration/schema versioning generally (MEDIUM confidence, cross-checked across independent sources).
**When to use:** From the very first export/import implementation — retrofitting `schemaVersion` after real user exports already exist without one is the expensive path to avoid.
**Trade-offs:** A small amount of upfront ceremony (an envelope type, a migrations array) for a feature that has zero cost today (v1 has no migrations to run) but avoids a rewrite the first time `Cat` or `ScheduleEvent` gains/removes a field.

**Example:**
```typescript
// lib/backup.ts
interface BackupEnvelope {
  schemaVersion: number
  exportedAt: string
  cats: Cat[]
  scheduleEvents: ScheduleEvent[]
}

const CURRENT_SCHEMA_VERSION = 1
const migrations: Record<number, (e: BackupEnvelope) => BackupEnvelope> = {
  // 2: (e) => ({ ...e, schemaVersion: 2, cats: e.cats.map(addNewField) }),
}

export function exportAll(): BackupEnvelope {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt: new Date().toISOString(),
            cats: getCats(), scheduleEvents: getScheduleEvents() }
}

export function importAll(raw: BackupEnvelope): void {
  let e = raw
  while (e.schemaVersion < CURRENT_SCHEMA_VERSION) e = migrations[e.schemaVersion](e)
  // upsert by id via storage.ts, not a blind overwrite — decision point, see Anti-Patterns
  e.cats.forEach(saveCat)
  e.scheduleEvents.forEach(saveScheduleEvent)
}
```

## Data Flow

### Filter/Sort List View (new, no new storage)

```
User opens /schedule, toggles "List" view
    ↓
Page calls existing getScheduleEvents() + buildMonthGrid()/expandEvents()  [unchanged]
    ↓
Page calls NEW filterEvents() / sortEvents() over the resulting AgendaItem[]
    ↓
ScheduleListView renders rows — same data, different projection
```

### Export / Import (new boundary)

```
User clicks "Export" on BackupPanel
    ↓
backup.ts exportAll() reads via storage.ts (getCats, getScheduleEvents)
    ↓
Wraps in {schemaVersion, exportedAt, cats, scheduleEvents}
    ↓
Browser triggers JSON file download

User clicks "Import", picks a file
    ↓
backup.ts importAll() parses JSON, checks schemaVersion, runs migration chain if needed
    ↓
Upserts records via storage.ts (saveCat/saveScheduleEvent, matched by id)
    ↓
Page re-fetches from storage.ts to reflect new state
```

### Future Sync (not built now — shown for context)

```
Local write (Component → storage.ts facade)
    ↓
Facade writes to local adapter (IndexedDB) immediately — optimistic, offline-safe
    ↓
Write is also appended to a Sync Queue (pending mutation + timestamp)
    ↓ (when online)
Sync Engine pushes queued mutations to remote backend API
Sync Engine pulls remote changes, merges into local adapter (last-write-wins on
  an `updatedAt` timestamp, or field-level merge if needed)
    ↓
Facade's read functions are unchanged — UI still just calls getCats()/getScheduleEvents()
```

**Key point:** in this future state, `app/` and `components/` code does not change at all — they still call `getCats()`, `saveScheduleEvent()`, etc. Only what's behind `storage.ts` changes. This is the entire payoff of keeping the repository facade boundary clean today.

## Scaling Considerations

Framed around *devices per user*, not traffic, since this is a single-user local app rather than a multi-tenant SaaS:

| Scale | Architecture Adjustments |
|-------|---------------------------|
| Single device, local-only (today) | localStorage is fine; existing `~5-10MB` limit supports hundreds of cats / thousands of events per current codebase analysis. Photos as base64 are the actual near-term ceiling (flagged in `CONCERNS.md`), not the event data this milestone touches. |
| Same user, multiple Apple devices, no account | SwiftData + CloudKit (private database) can sync automatically for the iOS app with near-zero code — but this is an **iOS-only** mechanism; the web app has no equivalent today, so a user on web-only or web+iOS-without-iCloud gets no cross-device sync until the backend exists. |
| Same user across web + iOS + Android (or Apple users wanting a real account) | Requires the deferred sync backend. Because this app's data is structured records (cat profiles, schedule events) rather than freeform collaborative documents, a database-replication-style sync engine (e.g., PowerSync, ElectricSQL, or a hand-rolled REST/queue sync) is a better shape match than a CRDT library — CRDTs (Yjs/Automerge) earn their complexity for real-time collaborative *editing*, which isn't this app's use case (MEDIUM confidence; teams building structured-record offline-first apps have specifically moved away from CRDTs toward server-authoritative replication for this reason). |

### Scaling Priorities

1. **First bottleneck:** Photo storage in localStorage (base64), already flagged as high-priority tech debt — unrelated to this milestone's event model but will collide with export/import size limits if not addressed (a full-dataset JSON export including base64 photos could be large).
2. **Second bottleneck:** Cross-device sync gap on web (no localStorage equivalent to CloudKit) — the reason "optional-account sync backend" is on the roadmap at all.

## Anti-Patterns

### Anti-Pattern 1: Duplicating Filter/Sort Logic Per View

**What people do:** Write filter/sort logic inline inside `ScheduleCalendar` and again inside a new list-view component because "it's just a few lines."
**Why it's wrong:** The two views silently drift (e.g., a category filter added to the list view but forgotten in the calendar's day-cell rendering), and every future filter criterion has to be added twice.
**Do this instead:** One shared, pure query module (`scheduleQueries.ts`) that both views call over the same already-fetched data.

### Anti-Pattern 2: Skipping `schemaVersion` in the First Export Format

**What people do:** Ship export/import as a raw dump of the current TypeScript interfaces with no version marker, reasoning "we'll add versioning when we actually change the schema."
**Why it's wrong:** By the time the schema changes, real users have export files in the wild with no version marker to detect — every future migration now needs fragile shape-sniffing instead of a clean version check.
**Do this instead:** Add the `schemaVersion` field from the very first shipped export, even though `CURRENT_SCHEMA_VERSION = 1` has nothing to migrate from yet.

### Anti-Pattern 3: Blind-Overwrite Import

**What people do:** Import replaces the entire local dataset with the imported file's contents.
**Why it's wrong:** Silently destroys any local data created since the export was taken (e.g., importing an old backup on a second device wipes newer entries); also forecloses "merge two devices' data" as a future use case.
**Do this instead:** Import should upsert by `id` through the existing `saveCat()`/`saveScheduleEvent()` functions (matching current create-or-update semantics already implemented there), with the decision of "overwrite on conflict" vs. "keep newer by timestamp" made explicit and visible to the user — this is a decision point for the team, not an assumed default.

### Anti-Pattern 4: Committing to a Sync Vendor Before the Adapter Seam Exists

**What people do:** Pick AWS/Firebase/Supabase and start writing backend-specific code directly into `storage.ts` or components.
**Why it's wrong:** `PROJECT.md` explicitly defers the vendor decision; wiring a specific vendor's SDK directly into call sites means the eventual decision (or a later vendor switch) requires touching every caller instead of one adapter file.
**Do this instead:** Keep `storage.ts`'s public function signatures stable and vendor-agnostic; the swappable-adapter shape sketched above is exactly what defers the vendor decision safely.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|----------------------|-------|
| Nominatim (existing, location only) | Direct `fetch()` from `CatForm.tsx`, no persistence of raw response | Unrelated to this milestone; already flagged for hardening in `CONCERNS.md` |
| Future sync backend (undecided: AWS / Firebase / Supabase / PocketBase) | Would sit entirely behind the storage-adapter seam described above | Vendor intentionally undecided per `PROJECT.md` — do not couple the adapter interface's shape to any one vendor's SDK |
| CloudKit (iOS-only, future) | Native SwiftData `ModelConfiguration` with a CloudKit container — near-zero glue code on Apple platforms | Only covers a single user's own Apple devices (private database); cannot provide cross-user sharing or a real multi-platform backend, so it is a *parallel* no-account path, not a substitute for the web/Android sync backend |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|----------------|-------|
| Pages/Components ↔ `lib/storage.ts` | Direct function calls, already the established pattern | Must remain the *only* path components use to reach persisted data — this is what makes every later change (list view, backup, sync) additive rather than a rewrite |
| Calendar view ↔ List view | Shared `scheduleQueries.ts` functions, no direct coupling between the two components | Prevents duplicated filter/sort logic (Anti-Pattern 1) |
| `backup.ts` ↔ `storage.ts` | `backup.ts` calls `storage.ts`'s public functions only, never touches `localStorage` directly | Keeps export/import working unchanged across future adapter swaps |
| `storage.ts` ↔ storage adapter (future) | Adapter interface (e.g. `list/get/save/delete`) | Only worth introducing when a second adapter implementation is actually being built (IndexedDB or remote), not speculatively now |

## Sources

- [Local-First Architecture: CRDTs & Sync Engines — AppScale Blog](https://appscale.blog/en/blog/local-first-architecture-crdts-sync-engines-offline-first-2026) — repository/sync-engine pattern description (MEDIUM confidence, cross-checked against multiple independent offline-first architecture writeups)
- [The Complete Guide to Offline-First Architecture in Android](https://androidengineers.substack.com/p/the-complete-guide-to-offline-first) — repository-as-single-source-of-truth pattern, sync queue design
- [Migration Storage | RxDB](https://rxdb.info/migration-storage.html) — localStorage → IndexedDB migration approach
- [Using IndexedDB — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) — native versioned schema migration via `onupgradeneeded`
- [JSON Schema Migration Strategy: Versioning & Transforms — Jsonic](https://jsonic.io/guides/json-migrations) — `schemaVersion` + ordered `up()`/`down()` migration chain pattern
- [ElectricSQL vs PowerSync vs Zero: Best Local-First Sync Engine (2026) — BuildPilot](https://trybuildpilot.com/648-electric-sql-vs-powersync-vs-zero-2026) — comparison of database-replication sync engines vs. CRDT approach
- [Why Cinapse Moved Away From CRDTs For Sync — PowerSync](https://powersync.com/blog/why-cinapse-moved-away-from-crdts-for-sync) — real-world rationale for server-authoritative sync over CRDTs for structured (non-collaborative-text) data
- [Yjs vs Automerge vs Loro: CRDT Libraries 2026 — PkgPulse](https://www.pkgpulse.com/guides/yjs-vs-automerge-vs-loro-crdt-libraries-2026) — CRDT libraries' fit for collaborative editing specifically
- [Syncing model data across a person's devices — Apple Developer Documentation](https://developer.apple.com/documentation/swiftdata/syncing-model-data-across-a-persons-devices) — SwiftData + CloudKit configuration and constraints (unique attributes, optionality requirements)
- [SwiftData Meets CloudKit: Build Seamless Offline Apps in SwiftUI — Medium](https://medium.com/@ashitranpura27/swiftdata-meets-cloudkit-build-seamless-offline-apps-in-swiftui-5b5844f23ac3) — private-database-only limitation (no cross-user sharing)
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/codebase/CONCERNS.md` — current-state grounding (this codebase's actual layers, file locations, and already-flagged tech debt)
- `lib/storage.ts`, `types/scheduleEvent.ts`, `package.json` — read directly to confirm current storage functions, ScheduleEvent shape, and that no date/validation/sync libraries are yet installed

---
*Architecture research for: Catssistant — localStorage-to-sync-backend evolution*
*Researched: 2026-07-04*
