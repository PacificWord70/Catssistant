# Catssistant

## What This Is

Catssistant is a privacy-first cat care assistant. The web app (Next.js) is the active build and serves as the blueprint for future native iOS and Android apps. It helps cat owners track everything about their cat(s) — daily care events (feeding, litter, meds, vet, grooming, play) and a central profile record — in one place, without passive tracking or data selling.

## Core Value

Reliable daily care tracking plus a trustworthy central record for each cat. Everything else (sitter handoffs, vet views, shopping, mobile apps) can wait — this cannot.

## Requirements

### Validated

- ✓ Cat profile management (add/edit/view, breed tagging, photo, location, vet contact) — existing
- ✓ Unified Schedule/event system covering Feeding, Medication, Care Routine (incl. litter), Vet, Grooming, Play, Other with calendar view — existing
- ✓ Breed catalog — existing
- ✓ First-time onboarding flow — existing
- ✓ Owner guides / resources content — existing

### Active

- [ ] Filterable, sortable list view of care events, alongside the existing calendar view (same event data — no new data model)
- [ ] Data export/backup — no way currently to get data out of localStorage-only storage (flagged in CONCERNS.md as high priority)
- [ ] Continued hardening of the Cat Owner View as the core experience before building specialized secondary views
- [x] Test coverage for critical paths (storage, schedule recurrence) — 20 test files as of 2026-10-26, logic only

### Out of Scope

- Cat Sitter View (profile + schedule + feeding-inventory PDF/image export for sitters) — deferred until the core Owner View is solid
- Vet View (dedicated consolidated vet info/history page) — deferred, same reason
- Shopping feature buildout — deferred, not a current priority
- Accounts / cross-platform sync backend — deferred to a later milestone; needs team discussion before committing to a vendor
- Native iOS / Android apps — web app is the blueprint first; mobile comes later

## Context

- Existing Next.js 14 (App Router) / TypeScript / Tailwind codebase, already substantial — see `.planning/codebase/` for full architecture, stack, conventions, testing, integrations, and concerns docs (mapped 2026-07-04)
- Removed 5 orphaned stub pages this session (`feeding`, `health`, `litter`, `meds`, `tips`) — 11-line placeholders, unlinked from navigation, superseded by the unified Schedule/event system. Confirmed via the user's own hand-drawn MVP flow diagram, which never depicts these as standalone pages.
- The user's MVP flow diagram (hand-drawn) maps: Home → Cat Profile List (Owner View → Add Cat, → Cat Sitter View) and → Calendar/Schedule (→ Shopping, → Vet View, → Health Event Log/Add Health Event), plus Breed Catalog, External Resources, and About/Feedback. Health Event Log is the same event data as Schedule, just needs a list+filter/sort view in addition to the calendar view.
- Two small fixes already applied and committed this session:
  1. GPS coordinates truncated to ~1km precision before reverse-geocoding via Nominatim, plus graceful handling of failed/malformed responses (`components/CatForm.tsx`)
  2. Recurrence end-date validation so an event can't be saved with an end date before its start date (`components/ScheduleEventForm.tsx`)
- Long-term sync strategy under consideration (not yet built, revisit with the team):
  - Apple/no-account path: SwiftData + CloudKit (Apple-native, free, no third party, uses the user's own iCloud)
  - Cross-platform account path: AWS or Firebase, free tier to start — no vendor loyalty either way; open-source alternatives (Supabase, PocketBase) were discussed as lower-lock-in options worth reconsidering later

## Constraints

- **Privacy**: No passive tracking, no GPS-by-default, no behavioral analytics, no data selling — non-negotiable core product value
- **Tech stack**: Next.js 14 App Router, TypeScript, Tailwind — established, avoid casual changes
- **Dependencies**: Do not add packages without discussing with the team first
- **Collaboration**: 3 contributors all commit to `main` — check recent commits before editing shared files
- **Backend/accounts**: Vendor choice (AWS vs. Firebase vs. open-source alternatives) intentionally undecided — do not commit to one without a team discussion

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Delete orphaned `feeding`/`health`/`litter`/`meds`/`tips` stub pages | Unified Schedule/event system already covers these; user's own MVP diagram confirms they were never meant to be standalone pages | ✓ Good |
| Health Event Log = same event data as Schedule, just a list+filter/sort view | All care events share common + category-specific attributes in one model; no need for a separate data structure | ✓ Good |
| Defer Cat Sitter View and Vet View | Build out the core Cat Owner View first before specialized secondary views | — Pending |
| Apple no-account path = SwiftData + CloudKit | Apple-native, free, zero third-party dependency, uses the user's own iCloud account/storage | — Pending |
| Cross-platform account backend = AWS or Firebase, free tier | No strong vendor loyalty; accepted as reasonable starting options; open-source alternatives considered but decision deferred | — Pending |
| Keep Nominatim geolocation as opt-in; truncate coordinates to ~1km precision | Not a meaningful security risk (HTTPS, no persistent storage, browser permission-gated); truncation reduces third-party exposure at near-zero cost | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-04 after initialization*
