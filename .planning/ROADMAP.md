# Roadmap: Catssistant

## Overview

This milestone closes the two biggest gaps in the Cat Owner View: a way to scan care events as a filterable/sortable list (not just the calendar), and a way to get data out of — and back into — the app now that everything lives only in localStorage. Both features are additive to the existing, well-disciplined `lib/storage.ts` seam: no new storage mechanism, no new dependencies, no data model changes. Care-event tracking, the calendar view, breed catalog, onboarding, and recurrence-rollover correctness are already shipped and validated (existing code, confirmed 2026-07-04) — this roadmap covers only the two remaining active requirement clusters. Comprehensive test-suite work and broad hardening passes are explicitly out of scope for this milestone (see REQUIREMENTS.md Out of Scope) and are not phased here.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Care Event List View** - Owner can view, filter, and sort care events in a list, alongside the existing calendar
- [ ] **Phase 2: Data Export & Import** - Owner can back up all app data to a JSON file and restore it safely

## Phase Details

### Phase 1: Care Event List View
**Goal**: Owner can scan care events as a filterable, sortable list — the same event data as the calendar, viewed a different way — defaulting to what's current/upcoming so the most relevant events surface first.
**Mode:** mvp
**Depends on**: Nothing (first phase; builds on the existing calendar/event system, no new data model)
**Requirements**: CARE-03, CARE-04
**Success Criteria** (what must be TRUE):
  1. Owner can switch to a list view of care events from the same Schedule area as the calendar view.
  2. When first opened, the list view defaults to current/upcoming events rather than showing full history.
  3. Owner can filter the list by any event attribute (e.g., cat, category, date range) to see any subset of events.
  4. Owner can sort the list by any event attribute (e.g., date, category, cat).
  5. Calendar and list views always agree on which events exist and how recurring events expand — switching views never shows a different set of events for the same data.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Data Export & Import
**Goal**: Owner can get all their data out of the app as a portable backup, and reliably restore it — closing the current zero-export-path gap without ever silently losing or duplicating data.
**Mode:** mvp
**Depends on**: Nothing (independent of Phase 1; sequenced second by convention, not by technical dependency)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Owner can export all app data (cats + schedule events) as a single JSON file from within the app.
  2. The exported file carries an explicit schema version, so a future version of the app can tell what format it's reading.
  3. Owner can import a previously exported JSON file to restore cats and schedule events.
  4. When an imported record conflicts with existing data, the app applies one documented, predictable rule (merge/overwrite/reject) — it never silently deletes or duplicates existing cats or events.
  5. Owner can export, then later import that same file (e.g., after clearing browser data or moving devices), and end up with the same cats and events they started with.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Care Event List View | 0/TBD | Not started | - |
| 2. Data Export & Import | 0/TBD | Not started | - |
