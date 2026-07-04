# Feature Research

**Domain:** Pet/cat care tracking app (client-only web app, privacy-first, no accounts)
**Researched:** 2026-07-04
**Confidence:** MEDIUM (web search only, no MCP docs/dedicated pet-app APIs available this session; findings cross-checked across 2+ independent apps per claim where noted)

## Scope Note

This research covers three areas per the milestone brief:
1. Daily care event log — calendar + list view (this milestone's active scope)
2. Data export/backup for client-only storage (this milestone's active scope)
3. Sitter handoff and vet-view prior art (deferred features — informational only, to shape design later, not to build now)

Findings are presented neutrally per the quality gate — this is input for the team to decide on, not a directive.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Calendar view of all care events in one place | Every competitor surveyed (PetNote Plus, DogCat App, Petfetti, DogLog) leads with a unified calendar across feeding/meds/vaccines/vet/grooming — Catssistant already has this | LOW (existing) | Already built; no gap here |
| List/agenda view of events (not just calendar grid) | Calendar grids are bad for "what's overdue" or "what happened last month" scanning; Petfetti explicitly frames events as upcoming/overdue/completed in a list-style status view; DogCat App calendar is described as "managed like an agenda" | MEDIUM | This milestone's planned list view directly matches competitor pattern — filter by category, sort by date, status framing (overdue/done/upcoming) is a proven pattern worth adopting, not just a flat table |
| Search/filter by cat and event type | Table stakes once a household has 2+ cats or history accumulates; flagged internally in CONCERNS.md as a gap even for the cat list itself | LOW-MEDIUM | Filtering is explicitly in this milestone's scope for the event list; the same filter affordance should extend to "which cat" not just event category |
| Reminders/notifications for upcoming or overdue events | Every competitor app treats this as core, not optional (Petfetti, DogLog, Woofz, PetDesk) — a calendar you have to remember to check isn't a reminder system | MEDIUM-HIGH | CONCERNS.md already flags this as "Schedule feature is informational only, not actionable" — out of this milestone's explicit scope but is the single most consistent table-stakes gap vs. competitors; worth flagging for next milestone |
| Data export / backup | Any app with local-only or offline-first storage that competitors ship (Arfer: JSON backup + CSV export; Precise Petcare: CSV/XLS export) treats export as a baseline trust feature, not a differentiator — habit-tracker research confirms user complaints center on "lost everything, no export" when local-only storage has no export path | LOW-MEDIUM | Directly in this milestone's scope; JSON is the safer default (round-trippable/re-importable) vs. CSV (human-readable but lossy for nested/optional fields like the 50+-field ScheduleEvent model) |
| Vaccination / medication history retained and viewable per pet | 11pets, PetDesk, DogLog all treat historical med/vaccine records as core, not add-on — owners expect the app to be the system of record they'd hand to a new vet | LOW (existing) | Already covered by the unified event model; no new work needed beyond the list view surfacing history well |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Genuinely privacy-first, no-account, no-passive-tracking storage | Most competitors (PetDesk, 11pets Pro tier, Arfer) require accounts and increasingly gate features behind subscriptions; a no-account, local-only app with a real export path is a real point of difference IF the export gap is closed this milestone | LOW (already the architecture) | This only becomes a genuine differentiator once export/backup ships — right now it's a liability (see Anti-Features/Pitfalls), not yet an advantage |
| Unified event model across all care types (feeding/meds/litter/vet/grooming/play) with one form, one list, one calendar | Several competitors fragment this (separate screens per category, e.g. legacy Catssistant stub pages that were removed) or require premium tier to unlock all categories (11pets gates categories behind 50+ feature paywall) | LOW (existing) | Already built and is a genuine strength — worth explicitly protecting when adding the list view (don't let filter/sort logic silently re-fragment the model) |
| Breed catalog integrated into the cat profile | Not observed as standard in any competitor surveyed (PetDesk, 11pets, Pawprint, DogLog are all care-logging tools, not breed-education tools) | LOW (existing) | Genuine, low-effort differentiator already built |
| Live/dynamic sitter handoff (link reflects latest data) instead of a static export | CareSheet and Remewdy both moved away from static PDFs toward a single link that always shows current data — "any changes you make are reflected the next time the sitter opens it." This directly solves the stalest-PDF problem competitors themselves identify (PetDesk/etc. still don't solve staleness on printed handoffs) | HIGH | Deferred to a later milestone per PROJECT.md, but worth designing toward now: if Cat Sitter View is eventually built, a live-link model (backed by the same local data, shared via a temporary link/QR or read-only export snapshot with a "last updated" timestamp) is a stronger pattern than a one-time PDF/image export. See Pitfalls for the staleness risk of the PDF-only approach. |
| Fine-grained, time-boxed data sharing (choose what to share, with whom, for how long) | 11pets' most-cited feature: share only certain categories (e.g., meds only, not full history) for a bounded time window, without requiring the recipient to create an account | HIGH | Directly relevant prior art for a future Vet View or Cat Sitter View — the "recipient needs no account" pattern matches Catssistant's no-account philosophy well and is worth carrying forward into that later design, not reinventing full account-based sharing |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| CSV as the *only* export format | Feels simple, spreadsheet-friendly, "everyone knows CSV" | The ScheduleEvent model has 50+ optional, category-conditional fields (per CONCERNS.md) — flattening that into CSV either produces a sparse wide table or silently drops nested/recurrence data, and CSV can't be re-imported losslessly to restore a working app state | Ship JSON as the primary backup/restore format (full fidelity, round-trippable); offer CSV as a secondary "for spreadsheet review" export if there's demand, clearly labeled as not a full backup |
| One-time static PDF/image sitter handoff as the *permanent* solution (when that feature is eventually built) | Feels tangible, printable, matches paper habits owners already have (printable templates are the most common pattern in casual pet-sitting searches) | Competitors' own printable-template pattern is explicitly the fallback/legacy option; a static snapshot goes stale the moment a medication dose or schedule changes after it's handed over, with no mechanism to notice | When that feature is built, prefer (or offer alongside) a live link/read-only view sourced from the same local data, with a visible "last updated" timestamp, so staleness is at least visible instead of silent |
| Cloud sync/accounts as the fix for the export gap | Feels like the "real" solution to data loss and multi-device use, and it's tempting to reach for it while already touching storage this milestone | Explicitly deferred in PROJECT.md — vendor choice needs a team discussion and is out of scope for this milestone; conflating "add export" with "add sync" risks scope creep into a much larger, unresolved architecture decision | Ship local export/import (JSON) now as the immediate safety net; treat cloud sync as a separate, later milestone with its own vendor decision |
| Full clinical/EHR-style vet record replication (labs, structured diagnostic codes, PIMS integration) | PetDesk's PIMS-synced labs/records looks impressively "complete" and is tempting to emulate | PetDesk's depth here comes from being clinic-branded software integrated with the vet's practice management system — Catssistant has no clinic-side integration, so replicating that surface without the backend integration would produce a shallow, manually-entered imitation that doesn't actually deliver PetDesk's value (auto-synced labs) | If/when a Vet View is built later, scope it as "everything the owner already tracks, organized for a vet visit" (history, meds, vaccines) rather than attempting lab integration or PIMS-style features |
| Gating core event categories behind a premium tier | 11pets' 50+-feature paywall model is common in the space and might look like a monetization template worth copying | Contradicts Catssistant's stated core value (unified event system, all categories, no account) and would fragment the one thing multiple competitors get praised for lacking elsewhere | Keep the unified, ungated event model as the differentiator; monetization (if ever pursued) should be evaluated separately from core care-tracking completeness |

## Feature Dependencies

```
List/agenda view of events
    └──requires──> Existing unified ScheduleEvent data model (already built)
    └──requires──> Filter/sort UI (by cat, category, date range, status)

Search/filter by cat + event type
    └──enhances──> List/agenda view
    └──enhances──> Existing cat list page (CONCERNS.md gap)

Data export (JSON)
    └──requires──> Stable, versioned data shape for Cat + ScheduleEvent
    └──enables──> Data import/restore (future)
    └──enables──> (future, deferred) Cat Sitter View / Vet View live-link sharing

Reminders/notifications
    └──requires──> Reliable recurrence expansion (flagged fragile in CONCERNS.md — monthly rollover bug)
    └──conflicts with──> shipping reminders before the recurrence edge-case bug is fixed (would surface false/missed reminders)

(Deferred) Cat Sitter View / Vet View sharing
    └──requires──> Data export/backup groundwork (this milestone) as the data-shape foundation
    └──enhances──> Core Owner View trustworthiness (per PROJECT.md, deliberately sequenced after Owner View hardening)
```

### Dependency Notes

- **List view requires the existing event model, not a new one:** PROJECT.md already confirms this ("same event data — no new data model"); the risk is in filter/sort UI complexity and status framing (overdue/upcoming/done), not data modeling.
- **Search/filter by cat enhances the list view:** the same UI pattern (filter chips/dropdowns) should serve both the event list and the existing cat grid, since CONCERNS.md flags both as missing.
- **Export enables future sharing features:** JSON export undertaken this milestone becomes the data-shape foundation for a later live-link or read-only share view (11pets/CareSheet pattern) — worth choosing an export schema now with an eye toward "could this same shape power a read-only shared view later" even though sharing itself is deferred.
- **Reminders conflict with the known monthly-recurrence bug:** shipping notifications on top of the current recurrence engine (CONCERNS.md: "JS Date rolls over short months") would make a pre-existing latent bug user-visible and trust-damaging; if reminders are pursued in a future milestone, the recurrence fix should land first.

## MVP Definition

### Launch With (v1 — this milestone, per PROJECT.md Active requirements)

- [ ] Filterable, sortable list view of care events (by cat, category, date, status) — reuses existing event data
- [ ] JSON export of all data (cats + schedule events) for backup/migration — closes the highest-priority gap identified in CONCERNS.md
- [ ] Continued hardening of Owner View: fix known bugs (recurrence end-date validation — already done; monthly rollover; empty vet date) before adding new surface area
- [ ] Basic test coverage for storage.ts and scheduleUtils.ts recurrence logic — de-risks both the list view and export against silent data corruption

### Add After Validation (v1.x)

- [ ] JSON import/restore (the other half of export — currently only export is in scope, but a backup without restore is only half the safety net)
- [ ] Search/filter on the cat list itself (name/breed), not just the event list — same underlying pattern, smaller lift once list-view filtering exists
- [ ] Reminders/notifications — highest-value competitive gap, but should wait for the recurrence bug fix

### Future Consideration (v2+, explicitly deferred per PROJECT.md)

- [ ] Cat Sitter View (shareable handoff) — defer until Owner View is solid; when picked up, weigh live-link (CareSheet/11pets pattern) vs. static PDF/image export using the Pitfalls/Differentiators findings above
- [ ] Vet View (consolidated health page) — defer for the same reason; scope as "owner's data organized for a vet visit," not a PIMS-style clinical record
- [ ] CSV export as a secondary format alongside JSON, if users request spreadsheet-friendly output
- [ ] Accounts / cross-device sync — needs a separate team decision on vendor, explicitly out of scope for this milestone

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| List/filter view of care events | HIGH | MEDIUM | P1 |
| JSON export/backup | HIGH | LOW-MEDIUM | P1 |
| Bug fixes (recurrence, geolocation privacy contradiction) | HIGH | LOW | P1 |
| Test coverage (storage, recurrence) | MEDIUM (protects P1 work) | MEDIUM | P1 |
| JSON import/restore | HIGH | MEDIUM | P2 |
| Cat list search/filter | MEDIUM | LOW | P2 |
| Reminders/notifications | HIGH | HIGH (blocked on recurrence fix) | P2 |
| Cat Sitter View (live-link handoff) | MEDIUM-HIGH (deferred) | HIGH | P3 |
| Vet View (consolidated) | MEDIUM (deferred) | HIGH | P3 |
| CSV secondary export | LOW | LOW | P3 |
| Accounts / cloud sync | HIGH long-term, unscoped now | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, natural next step after this milestone
- P3: Nice to have, explicitly deferred per PROJECT.md Out of Scope

## Competitor Feature Analysis

| Feature | PetNote Plus / Petfetti / DogLog | PetDesk | 11pets | Catssistant Approach |
|---------|-----------------------------------|---------|--------|------------------------|
| Calendar view | Single calendar across all care types with reminders | Calendar synced to clinic appointments + owner to-dos | Appointment calendar + medication reminders | Already built (unified Schedule) |
| List/status view | Petfetti: upcoming/overdue/completed framing | Not primary — clinic-portal-centric | Category-based logs, not an explicit filtered list | This milestone: add filterable/sortable list alongside existing calendar |
| Data export | Not consumer-facing in these apps (consumer tier) | Not applicable (clinic owns the record) | JSON export documented via help center | This milestone: JSON export, no account required |
| Sitter/caregiver sharing | Not a focus | N/A (clinic-facing, not sitter-facing) | Fine-grained, time-boxed sharing without recipient account | Deferred — but 11pets' "no account needed for recipient" pattern is worth reusing later |
| Vet-facing consolidated view | Not a focus | Core feature, but clinic-branded and PIMS-synced | Owner can share full record with vet on demand | Deferred — scope as owner-data-for-a-visit, not clinic integration |
| Monetization gating | Some categories/features behind subscription (11pets specifically) | Free to pet owner (clinic pays) | 50+ features behind paywall | Not currently gated — flagged as a value worth protecting |

## Sources

- [Best Pet Care Apps in 2026 | Top 7 Compared | PetNoter](https://petnoter.com/best-pet-care-apps/) — MEDIUM confidence (websearch, cross-checked against multiple app listings)
- [Petfetti — All-in-one pet health tracker](https://petfetti.com/) — MEDIUM confidence
- [DogLog - Track and coordinate your pet's activities and health](https://www.doglogapp.com/) — MEDIUM confidence
- [Arfer | The app for pet care professionals](https://arfer.app/) — MEDIUM confidence
- [Exporting Data : Precise Petcare Support](https://precisepetcare.freshdesk.com/support/solutions/articles/1000181308-exporting-data) — MEDIUM confidence
- [Stop Texting Your Pet Sitter a Novel · CareSheet](https://www.caresheet.app/blog/stop-texting-your-pet-sitter-a-novel) — MEDIUM confidence
- [Share Your Pet's Medication Schedule With a Sitter - Remewdy](https://remewdy.com/pet-sitter-medication-sharing) — MEDIUM confidence
- [PetDesk - Engage Pet Parents with the #1 Veterinary Mobile App](https://petdesk.com/veterinary-mobile-app/) — MEDIUM confidence
- [11pets: Pet Care - App Store](https://apps.apple.com/us/app/11pets-pet-care/id1232470530) — MEDIUM confidence
- [11pets - How To Export Data](https://www.11pets.com/en/news/export-data) — MEDIUM confidence
- [11pets vs CatMD: Tracker or Health Intelligence?](https://catmd.pet/blog/11pets-vs-catmd-comparison) — MEDIUM confidence
- [GreatPetCare / Pawprint App - App Store](https://apps.apple.com/us/app/pawprint-pet-health-tracker/id934948619) — MEDIUM confidence
- Internal: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md` (2026-07-04 codebase audit) — HIGH confidence (first-party, verified against current codebase)

---
*Feature research for: Cat care tracking app — daily event log (calendar + list), data export/backup, sitter/vet handoff prior art*
*Researched: 2026-07-04*
