# Project Research Summary

**Project:** Catssistant
**Domain:** Client-only (localStorage-based) cat care tracking web app, privacy-first, no accounts — this milestone adds a filterable/sortable list view alongside the existing calendar, and a data export/backup path
**Researched:** 2026-07-04
**Confidence:** MEDIUM

## Executive Summary

Catssistant is a privacy-first, no-account cat care tracker whose web app currently persists everything in localStorage through a single, well-disciplined data-access seam (`lib/storage.ts`). Research across stack, features, architecture, and pitfalls converges on one throughline: this milestone's two active deliverables — a calendar + list view (list view defaulting to current/upcoming events, filterable and sortable by any attribute) and JSON export/backup — are both achievable as additive changes on top of the existing architecture, with no new storage mechanism and no dependency additions required. The existing repository-facade pattern (`storage.ts`) and the existing event-expansion logic (`scheduleUtils.ts`) are exactly the seams that make this cheap, provided the list view reuses the calendar's event-expansion source rather than growing a second, independent query path, and provided export/import is scoped as one feature (not export-now-import-later) with an explicit `schemaVersion` field from day one.

The account/sync backend question (AWS Amplify, Firebase, Supabase, PocketBase, Appwrite, or an iOS-only SwiftData+CloudKit path) is intentionally out of scope for this milestone and remains genuinely undecided — research presents these five options neutrally, on criteria like offline-sync maturity, free-tier limits, and vendor lock-in, without asserting a winner. What research does recommend regardless of that future decision: keep `storage.ts`'s public function signatures stable and vendor-agnostic now, so that whichever backend is eventually chosen slots in behind a swappable adapter rather than requiring changes to every calling component.

Key risks to manage this milestone: (1) shipping export without a tested import path or version marker, which silently breaks later when the Cat/ScheduleEvent shape changes; (2) letting the list view fork its own recurrence-expansion logic instead of sharing the calendar's, which produces two views that quietly disagree about what a recurring event is; and (3) base64 photo storage inflating both localStorage and export-file size, a pre-existing tech-debt item (per CONCERNS.md) that will collide with export scope if not accounted for. None of these require new technology to fix — they require deliberate scoping decisions in phase planning.

## Key Findings

### Recommended Stack

For this milestone's active scope (export/backup), the research finds no new dependency is needed: native Blob/URL.createObjectURL for export and input type=file/FileReader for import cover the full round trip with zero new packages, matching the project's "don't add dependencies without discussing" constraint. An explicit schemaVersion field in the export envelope is the one convention-level addition recommended from the very first shipped version. Separately, and only if/when localStorage's ~5-10MB ceiling becomes a real constraint (likely eventually, given base64 photo storage), idb or idb-keyval are flagged as lightweight, drop-in options for a future localStorage-to-IndexedDB migration — done inside `storage.ts` so no caller code changes.

Core technologies (this milestone):
- Native Blob + URL.createObjectURL: client-side JSON file download — zero dependency, fits existing constraints
- Native input type=file + FileReader: JSON file import — same rationale
- schemaVersion field (convention, not a library): forward/backward-compatible import, cheap now, expensive to retrofit later

Deferred (not this milestone, presented neutrally): AWS Amplify Gen 2, Firebase, Supabase, PocketBase, Appwrite (cross-platform account/sync backends), and SwiftData+CloudKit (Apple-only, no-account sync path). Full neutral comparison lives in STACK.md — vendor choice remains a team decision, not a research recommendation.

### Expected Features

The list view spec for this milestone is: calendar view + list view, with the list view defaulting to current/upcoming events and filterable/sortable by any attribute to surface any subset of events. Research confirms this pairing (a grid calendar plus a status/agenda-style list for scanning overdue/upcoming/completed items) is a well-established pattern for care-tracking apps generally, and that data export/backup is treated as a baseline trust feature once storage is local-only. These are described as the shape of the problem space, not as competitive requirements to match.

Must have (this milestone, per PROJECT.md active scope):
- Filterable, sortable list view of care events (by cat, category, date, status), reusing the existing event data — no new data model
- JSON export of all data (cats + schedule events), closing the current zero-export-path gap
- Continued Owner View hardening (known bug fixes) before adding new surface area
- Basic test coverage for storage.ts and scheduleUtils.ts recurrence logic, de-risking both the list view and export

Natural next step (not this milestone, but a short lift after):
- JSON import/restore (the other half of export/backup)
- Search/filter on the cat list itself, same underlying pattern as event-list filtering
- Reminders/notifications — blocked on an existing recurrence edge-case bug fixing first

Explicitly deferred (future milestones, no action now): Cat Sitter View and Vet View are confirmed future-only for this milestone — no design or implementation action is expected now, though the export schema chosen this milestone is worth keeping in mind as a possible future foundation for either. CSV as a secondary export format, and accounts/cross-device sync, are also deferred.

### Architecture Approach

The current codebase already has a clean, one-directional flow (Pages to Components to `lib/storage.ts` to localStorage) with all mutations centralized in `storage.ts`. This milestone's two features extend that shape additively rather than restructuring it: a new pure query/filter layer (e.g., `lib/scheduleQueries.ts`) sits between the existing event-fetch/expansion logic and both the calendar and list view components, so both views compute filtering/sorting over the same expanded-event data rather than maintaining independent queries. A new `lib/backup.ts` module sits above `storage.ts` (never touching localStorage directly) and owns exportAll()/importAll(), wrapping data in a versioned envelope. A storage-adapter interface is explicitly flagged as future-only — worth knowing where the seam will go, but not worth building speculatively before a second storage implementation (IndexedDB, or eventually a sync backend) actually exists.

Major components:
1. `lib/scheduleQueries.ts` (new) — pure filterEvents()/sortEvents() functions consumed by both calendar and list view, avoiding duplicated/drifting filter logic
2. `lib/backup.ts` (new) — exportAll()/importAll() with a {schemaVersion, exportedAt, cats, scheduleEvents} envelope and an upsert-by-id import strategy (never blind-overwrite)
3. `lib/storage.ts` (unchanged public API) — remains the sole choke point for reads/writes, the seam that keeps future storage-mechanism or backend changes from touching components

### Critical Pitfalls

1. Write-only export (no tested import, no schema version) — treat export+import as one feature with a round-trip test (export, clear storage, import, diff); add schemaVersion from the very first shipped export even though v1 has nothing to migrate from yet.
2. Calendar and list views drifting into two sources of truth — both views must consume the same expanded-event data source (share expandEvents()'s output, don't build a second independent query), and filter/sort state should not silently reset when switching views.
3. Blind-overwrite import — import should upsert by id through existing saveCat()/saveScheduleEvent() functions, not replace the entire dataset, to avoid silently destroying newer local data with an older backup.
4. Base64 photos ballooning export payload size — already a flagged localStorage tech-debt item; will collide with export/backup scope if photos aren't handled as a separate concern (e.g., a manifest-based approach) before export becomes a first-class, frequently-used feature.
5. (Future-only, no action this milestone) Anonymous-to-account migration and CRDT/sync business-rule conflicts — flagged for whenever the deferred accounts/sync backend work is eventually scoped; the one actionable takeaway now is to keep storage.ts's public signatures stable and vendor-agnostic so this future work doesn't require touching every caller.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Owner View hardening (bug fixes + test coverage)
Rationale: Both the list view and export/import are described in research as needing to build on top of correct, tested existing behavior (storage.ts, scheduleUtils.ts recurrence expansion) — shipping new surface area on top of a known-fragile recurrence bug risks surfacing it more visibly.
Delivers: Fixed known bugs (e.g., monthly recurrence rollover, empty vet date), basic test coverage for storage.ts and recurrence logic.
Addresses: Foundation requirement flagged in FEATURES.md MVP definition.
Avoids: Pitfall of building the list view or export on top of untested, fragile recurrence logic.

### Phase 2: Filterable/sortable list view (calendar + list)
Rationale: Directly in scope this milestone; depends only on the existing event data model, so it's a good second phase once the underlying logic is hardened.
Delivers: A list view of care events, defaulting to current/upcoming, filterable/sortable by any attribute, alongside the existing calendar.
Uses: New lib/scheduleQueries.ts pure filter/sort functions, shared by both calendar and list view.
Implements: Pure query layer on top of shared fetch/expansion (Architecture Pattern 2).
Avoids: Two-sources-of-truth drift between calendar and list (Pitfall 2) — explicit acceptance criterion should be "shares the calendar's event-expansion source."

### Phase 3: JSON export/backup (export + import together)
Rationale: Highest-priority gap identified in the codebase (CONCERNS.md: zero way to get data out of localStorage); research is unanimous that export and import should ship as one feature, not export-first-import-later.
Delivers: lib/backup.ts with exportAll()/importAll(), a versioned envelope (schemaVersion, exportedAt), upsert-by-id import semantics, and a round-trip test.
Addresses: Data export/backup table-stakes feature from FEATURES.md.
Avoids: Write-only export (Pitfall 1) and blind-overwrite import (Pitfall 3).

### Phase Ordering Rationale

- Bug fixes and test coverage come first because both later phases (list view, export) inherit risk from the existing fragile recurrence logic — fixing it once, at the base, avoids fixing the same bug twice across two views or shipping export files with known-bad data.
- List view before export is a judgment call, not a hard dependency: research shows list view depends only on existing data (no new model), while export can, in principle, ship independently. Either order is architecturally valid; sequencing them this way keeps the "shared query layer" habit (Pattern 2) established before the export boundary is built on top of it, but the team may reasonably choose to reverse this order.
- Export and import are grouped into a single phase deliberately, per the strongest and most-repeated pitfall finding in this research (Pitfall 1): shipping them separately is the single most common way this kind of feature goes wrong.
- The account/sync backend question is deliberately excluded from this roadmap's phase structure — research treats it as a separate, later milestone requiring its own vendor-comparison spike, not something to sequence into this milestone's phases.

### Research Flags

Phases likely needing deeper research during planning:
- None flagged as needing dedicated --research-phase treatment for this milestone's three phases — export/backup and list-view patterns are both well-covered by this research pass, with concrete implementation examples already available (see ARCHITECTURE.md Pattern 1-3 code snippets).

Phases with standard patterns (skip research-phase):
- Owner View hardening: standard bug-fixing and test-writing against an already-understood codebase.
- List view: standard pure-function filter/sort pattern over existing data, well-documented in ARCHITECTURE.md.
- Export/backup: standard versioned-envelope export/import pattern, well-documented in ARCHITECTURE.md and STACK.md with working code examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Web-search-derived, cross-checked across independent sources; no hands-on SDK/API verification performed this pass. Export/backup portion (no new dependencies) is low-risk regardless of confidence level; sync-backend portion is explicitly presented neutrally, not resolved. |
| Features | MEDIUM | Web search plus first-party codebase audit (CONCERNS.md, PROJECT.md) grounding; competitor findings cross-checked across 2+ independent sources per claim, but no dedicated pet-care-app API/docs access this session. |
| Architecture | MEDIUM | General offline-first/repository-pattern findings cross-checked across multiple independent sources, combined with HIGH-confidence first-party grounding (this codebase's actual current structure) — the resulting recommendations are well-fitted to Catssistant specifically even though the underlying patterns are general-purpose. |
| Pitfalls | MEDIUM | Cross-checked web sources, consistent with and reinforced by the project's own first-party CONCERNS.md findings, which are HIGH confidence. |

Overall confidence: MEDIUM

### Gaps to Address

- Account/sync backend vendor choice: genuinely unresolved by design — research presents AWS/Firebase/Supabase/PocketBase/Appwrite and SwiftData+CloudKit neutrally, with no recommendation implied. This should remain a dedicated team discussion and its own future milestone, not something roadmap phase planning should attempt to pre-resolve.
- Current BaaS pricing/feature figures: stack research flags that free-tier limits and pricing for the five backend options change frequently and should be reconfirmed directly against each vendor's pricing page at the time the team actually revisits this decision, not taken as fixed from this research pass.
- Export payload size with base64 photos: not fully resolved — research flags this as a likely near-term collision (export files ballooning) but does not prescribe a specific mitigation; this should be a concrete decision point during Phase 3 planning (e.g., whether to exclude/separate photos from the JSON envelope).
- Whether list view or export ships first: research does not establish a hard dependency order between these two phases; the suggested order above is a judgment call the team can revisit during roadmap creation.

## Sources

### Primary (HIGH confidence)
- .planning/PROJECT.md, .planning/codebase/ARCHITECTURE.md, .planning/codebase/STRUCTURE.md, .planning/codebase/CONCERNS.md — first-party, verified against current codebase
- lib/storage.ts, types/scheduleEvent.ts, package.json — read directly to confirm current storage functions, data shapes, and installed dependencies

### Secondary (MEDIUM confidence)
- MDN Web Docs (IndexedDB, Storage quotas) — official browser documentation
- Apple Developer Documentation (SwiftData + CloudKit syncing) — official platform documentation
- Firebase, AWS Amplify, Supabase, Appwrite, PocketBase official pricing/docs pages — official vendor sources, but pricing/feature details noted as time-sensitive
- Android Developers (offline-first data layer) — official platform documentation
- PowerSync, RxDB, jsonic.io, ElectricSQL — cross-checked independent technical writeups on sync/migration/versioning patterns
- Competitor app research (PetNoter roundup, Petfetti, DogLog, Arfer, PetDesk, 11pets, Pawprint, CareSheet, Remewdy) — cross-checked across multiple independent listings

### Tertiary (LOW confidence)
- Microsoft Q&A single anecdotal report on Lists calendar/list filter-reset behavior — included as one illustrative real-world instance, not independently corroborated

---
*Research completed: 2026-07-04*
*Ready for roadmap: yes*
