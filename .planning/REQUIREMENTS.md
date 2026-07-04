# Requirements: Catssistant

**Defined:** 2026-07-04
**Core Value:** Reliable daily care tracking plus a trustworthy central record for each cat

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Care Event Tracking

- [x] **CARE-01**: Owner can log care events (feeding, medication, care routine incl. litter, vet, grooming, play) — existing
- [x] **CARE-02**: Owner can view care events in a calendar view — existing
- [ ] **CARE-03**: Owner can view care events in a list view, defaulting to current/upcoming events
- [ ] **CARE-04**: Owner can filter/sort the list view by any event attribute (category, cat, date range, etc.) to see any subset of events
- [x] **CARE-05**: Monthly-recurring events fall back to the last valid day of a short month instead of drifting permanently, with a UI note explaining the adjustment — fixed 2026-07-04

### Data Portability

- [ ] **DATA-01**: Owner can export all app data (cats, schedule events) as a JSON file with an explicit schema version
- [ ] **DATA-02**: Owner can import a previously exported JSON file to restore their data
- [ ] **DATA-03**: Import behavior (merge vs. overwrite vs. reject conflicts) is an explicit, approved design decision before implementation — never silently destroys or duplicates existing data

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Sitter & Vet Handoff

- **HANDOFF-01**: Owner can generate a shareable output (PDF/link) summarizing a cat's profile, schedule, and feeding inventory for a sitter
- **HANDOFF-02**: Owner can generate a consolidated vet-info output (contact, visit history, upcoming appointments)

### Shopping

- **SHOP-01**: Build out the Shopping feature beyond its current nav placeholder

### Accounts & Sync

- **SYNC-01**: Optional account creation with cross-platform (web/iOS/Android) data sync — vendor undecided (leaning Firebase Spark, not locked in)
- **SYNC-02**: Apple-native local/no-account path via SwiftData + CloudKit

## Out of Scope

Explicitly excluded from this milestone. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Cat Sitter View / Vet View as dedicated app pages | Reframed as future PDF/shareable outputs generated from Owner View data, not separate UI — see HANDOFF-01/02 |
| Native iOS / Android apps | Web app is the blueprint first; mobile comes later |
| Comprehensive test-suite / broad hardening pass | Premature while the active feature set (list view, export/import) is still being built; revisit once it stabilizes |
| Reminders / notifications | No longer blocked (recurrence logic is now correct) but not scoped for this milestone |

## Traceability

Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CARE-01 | — | Complete (existing) |
| CARE-02 | — | Complete (existing) |
| CARE-03 | TBD | Pending |
| CARE-04 | TBD | Pending |
| CARE-05 | — | Complete (fixed 2026-07-04) |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 8 total
- Already complete: 3
- Remaining to map to phases: 5

---
*Requirements defined: 2026-07-04*
*Last updated: 2026-07-04 after initial definition*
