# Pitfalls Research

**Domain:** Client-only (localStorage) app adding data export/backup, a dual calendar+list event view, and a local-first/optional-account sync architecture across web + iOS + Android
**Researched:** 2026-07-04
**Confidence:** MEDIUM (cross-checked web sources; no official vendor docs contradicted; findings are consistent with Catssistant's own CONCERNS.md observations)

This file is informational, not prescriptive — it exists so the roadmap can weigh tradeoffs deliberately, not to dictate a single "correct" path.

---

## Critical Pitfalls

### Pitfall 1: Export/backup that doesn't round-trip (write-only export)

**What goes wrong:**
Teams ship an "Export to JSON" button and call the feature done, but never build the matching import path, or the import path silently accepts partial/malformed files. Users can get data *out* but have no tested way to get it back *in* — which defeats the actual purpose (device migration, accidental-clear recovery). A second common variant: the exported format is a raw dump of internal state (whatever shape `lib/storage.ts` happens to use today), so a later refactor of the `Cat` / `ScheduleEvent` types silently breaks import of files exported months earlier.

**Why it happens:**
Export feels like the urgent half (it's the one flagged in CONCERNS.md as "High priority — add before launch"), so it gets built and shipped alone. Import is deprioritized as "we'll add it later," and schema versioning is skipped because "the export format IS the current data model, why version it."

**How to avoid:**
- Treat export+import as one feature, shipped together, with a round-trip test (export → clear storage → import → diff) before calling it done.
- Give the export file an explicit `schemaVersion` field from day one, even at v1. Costs nothing now; saves a rewrite later when `ScheduleEvent`'s 50+ optional fields (already flagged as fragile in CONCERNS.md) change shape.
- Validate imported JSON against the current type shape before writing to storage — never `JSON.parse` + blind `saveCat()`.

**Warning signs:**
- Export button exists, import does not (or import is a raw "restore this exact file" with no validation).
- No `schemaVersion` or `exportedAt` field in the export payload.
- No test that actually exercises export → import round-trip.

**Phase to address:**
The data export/backup phase itself — this is not a "nice to have later," it's the definition of done for that phase.

---

### Pitfall 2: Calendar and list views drift into two sources of truth

**What goes wrong:**
Once a filterable list view is added alongside the existing calendar view, it's tempting to give the list its own query/filter logic (e.g., a separate "get events in range" function, or its own recurrence-expansion pass) rather than sharing the calendar's `expandEvents()` logic. Over time the two views disagree on what a recurring event "is" — e.g., the list shows an event the calendar doesn't (or vice versa) after a recurrence edit, because one view was updated to fix a bug and the other wasn't. Filter/sort state also commonly fails to persist or sync between views — a well-documented pattern even in mature products (Microsoft Lists, SharePoint calendar views) where switching from list to calendar view silently drops active filters.

**Why it happens:**
The calendar view's recurrence-expansion code (`lib/scheduleUtils.ts`, already flagged as fragile with no lazy evaluation) is calendar-shaped — it thinks in month grids. Building a list view naturally invites writing "simpler" list-shaped query code instead of reusing/adapting the existing expansion function, because reusing it feels like extra plumbing work in the short term.

**How to avoid:**
- Both views must consume the exact same expanded-event data source (one function, two renderers), not two independent queries against raw `ScheduleEvent[]`.
- Decide once whether filter/sort state lives in URL params, a shared context, or component state — and make both views read/write the same state, not parallel copies.
- Since CONCERNS.md already flags `expandEvents()` as expanding a full month eagerly, this is a good moment to add lazy/range-scoped expansion so the list view (which may span "all events" or a custom range) doesn't force the same expensive expansion pattern the calendar uses.

**Warning signs:**
- Two different functions both computing "what recurring instances exist" independently.
- Filters that reset when switching from list to calendar (or vice versa).
- A recurrence bug fix that has to be applied in two places.

**Phase to address:**
The filterable list view phase — explicitly scope "share the calendar's event-expansion source" as an acceptance criterion, not an implementation detail left to chance.

---

### Pitfall 3: CRDTs/sync solve data merges, not business-rule conflicts

**What goes wrong:**
Teams adopt a sync approach (CRDT library, or even naive last-write-wins) expecting it to make multi-device editing "just work," then discover it doesn't understand domain rules. Concretely for Catssistant: if a cat's medication schedule is edited on two devices while offline (e.g., dose changed on phone, frequency changed on web), a CRDT will merge both edits without conflict at the data-structure level — but the *result* may be a nonsensical medication event. Last-write-wins is worse: it silently drops one device's edit entirely, with no signal to the user that anything was lost.

**Why it happens:**
"Local-first sync" is discussed as a single solved problem (pick Automerge/Yjs/CRDT-of-choice, or CloudKit's built-in merge), but merge algorithms are domain-agnostic by design — they guarantee convergence, not correctness. Teams don't design an explicit conflict-surfacing UX because it feels like solved infrastructure, not a product decision.

**How to avoid:**
- Decide, per data type, whether silent merge is acceptable (e.g., a cat's `locationCity` field — low stakes, last-write-wins is fine) versus needs surfacing (e.g., medication dosage, vet contact — should flag "this was edited on two devices, review" rather than auto-resolve).
- This decision belongs in the sync architecture design, not left to whatever the chosen sync library defaults to.
- Given the team's own note that backend vendor choice (AWS/Firebase/Supabase/PocketBase) is deliberately deferred, defer the conflict-resolution *policy* decision alongside it — don't let a vendor's default behavior become the policy by accident.

**Warning signs:**
- Sync design documents that only discuss the transport/storage layer, never mention what happens when the same cat's record is edited on two devices before either syncs.
- No UI concept for "this was changed elsewhere" at all.

**Phase to address:**
The accounts/cross-platform sync phase (deferred milestone per PROJECT.md) — flag as needing dedicated design time before implementation, not something to bolt on after the sync transport is chosen.

---

### Pitfall 4: Anonymous-to-account migration silently loses or duplicates local data

**What goes wrong:**
When a "local-first, optional account" app adds sign-in, the most common failure mode is the local→account migration step: data created before sign-in either (a) never gets attached to the new account and appears to vanish, (b) gets duplicated if the migration runs twice (e.g., user signs in on a second device that also has old local data), or (c) — the sharpest version of this bug, seen across multiple platforms' offline-first guidance — is deleted entirely if the user ever signs back out, because "anonymous mode" storage and "authenticated mode" storage are implemented as two separate stores rather than one store with an ownership field.
For Catssistant specifically, this risk applies to every existing cat profile, breed tag, and schedule event a user has already created in localStorage by the time accounts ship — real user data, not test fixtures.

**Why it happens:**
It's structurally simpler to build "local storage" and "account-synced storage" as two independent code paths (different functions, maybe even different data shapes) than to build one storage layer with an optional `ownerId`/sync-status field from the start. The migration step then becomes a one-time, one-directional script that's easy to get wrong and hard to test because it only runs once per user, in production, on real data.

**How to avoid:**
- Design local storage from the start (ideally before accounts exist) as "one record store, optionally attached to an account" rather than "local store" and "cloud store" as separate systems that later need a bridge.
- Migration must be idempotent (safe to run twice) and additive-only (never delete local data until the account-side write is confirmed).
- Never delete local data as part of sign-out. Multiple sources confirm this is the single most common data-loss pattern in anonymous→account transitions: local data preserved on sign-in, then deleted on the next sign-out because the two modes were built as mutually exclusive states rather than an account being layered on top of always-present local data.
- Test the migration against the actual shape of production-like data (cats with photos, multiple breeds, recurring schedule events with the known monthly-recurrence edge case already in CONCERNS.md) — not an empty or trivial fixture.

**Warning signs:**
- Sign-out clears or resets local app state.
- Migration code has no re-run guard (no check for "have I already migrated this local data").
- No decision recorded for "what happens to local data if the user never signs in" vs. "what happens if they sign in on a second device that also has pre-existing local data" (the two-source-of-truth merge case).

**Phase to address:**
Should be considered *before* the accounts/sync phase is scoped — ideally the storage layer refactor (if any happens for export/IndexedDB) is designed with this migration in mind, even though accounts are explicitly out of scope for this milestone. Retrofitting an ownership model onto a storage layer that assumed single-user-single-store is more expensive than designing for it now.

---

### Pitfall 5: SwiftData + CloudKit's hidden schema constraints break "just works" assumptions

**What goes wrong:**
The Apple no-account path (SwiftData + CloudKit, already a tentative decision in PROJECT.md) has requirements that don't apply to plain local SwiftData: every property and relationship must be optional or have a default value, or CloudKit sync fails outright. Teams design their model against local-only SwiftData first (where non-optional fields are fine and idiomatic), then add CloudKit later and discover large parts of the schema need reworking. A second common failure: schema changes (new fields, new relationships) don't propagate to CloudKit automatically — `initializeCloudKitSchema` must be invoked, or sync silently drops the new data on other devices while appearing to work fine on the originating device. A third: the iOS Simulator does not reliably reproduce CloudKit sync behavior, so bugs only appear on real devices, often late in testing.

**Why it happens:**
CloudKit's constraints are a downstream consequence of how it represents optional/required fields in its own schema language, not a SwiftData limitation per se — but because SwiftData's local-only mode doesn't enforce these constraints, they're invisible until CloudKit is actually wired up, which teams often do late (after the "real" data model is finalized).

**How to avoid:**
- If SwiftData+CloudKit is the chosen Apple path, design the model with CloudKit's constraints (all-optional/defaulted fields) from the very first schema draft, not as a later retrofit.
- Any schema change during development must include a `initializeCloudKitSchema` step in the test/deploy checklist, not assumed to "just sync."
- Test CloudKit-specific flows exclusively on physical devices (multiple, ideally with different iCloud accounts/family sharing states) before considering the feature done.

**Warning signs:**
- Non-optional properties or relationships in a SwiftData model that's meant to sync via CloudKit.
- No explicit schema-migration step in the release process.
- CloudKit testing done only in Simulator.

**Phase to address:**
This is a future (native iOS app) concern, not this milestone's — but worth flagging now since PROJECT.md already lists SwiftData+CloudKit as the tentative Apple path, so the eventual iOS phase plan should budget explicit time for CloudKit schema design, not treat it as "SwiftData, plus a checkbox."

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems, specific to this milestone's scope.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|------------------|------------------|
| Export format = raw dump of current internal `Cat`/`ScheduleEvent` shape, no version field | Fast to ship, zero new design | Any future type refactor breaks import of old export files silently | Never — add `schemaVersion` even if v1 has only one version |
| List view writes its own event-range query instead of reusing calendar's `expandEvents()` | Faster to build in isolation | Two sources of truth for "what events exist," recurrence bugs fixed in one place but not the other | Never for this feature; acceptable only as a very short-lived prototype, must be unified before merge |
| Build "anonymous local storage" and "signed-in cloud storage" as two separate code paths | Each path is individually simpler to reason about | Migration between them becomes a fragile, hard-to-test, one-way script; sign-out risks deleting local data | Only if accounts are truly never coming — not the case here per PROJECT.md's stated long-term direction |
| Defer schema versioning on exported JSON until "we actually change something" | No design overhead now | Field added after the fact requires guessing at unversioned files already in users' hands | Never — versioning is near-zero cost to add upfront |
| Test CloudKit sync only in Simulator during iOS development | Faster iteration, no device provisioning friction | Sync bugs invisible until real-device testing, often late in the cycle | Acceptable for early UI-only iteration; never acceptable before calling a sync feature "done" |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|------------------|---------------------|
| CloudKit (Apple sync path) | Assuming local SwiftData model works unchanged with CloudKit | Design all synced properties/relationships as optional/defaulted from the start; run `initializeCloudKitSchema` on every schema change |
| Nominatim (already integrated) | Already flagged in CONCERNS.md: no rate limiting, unvalidated response shape | Out of scope for this research but directly relevant if sync/backup work touches the same `CatForm.tsx` location code — validate and rate-limit before expanding related surface area |
| Any future auth provider (Firebase/AWS/Supabase — explicitly undecided) | Choosing a provider's default anonymous-user cleanup policy without reading it (e.g., Firebase auto-deletes stale anonymous users, which would delete their local-linked data if migration isn't complete) | Read the provider's anonymous-auth data-retention policy before it's chosen, since it directly affects the migration pitfall above |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Eager full-range recurrence expansion shared by both calendar and list views | List view (which may show "all events" or a wide custom range) becomes slow as schedule history grows | Scope `expandEvents()` to the visible/queried range for both views, not just the calendar's month grid | Noticeable with several months of recurring events across multiple cats — already flagged as a bottleneck in CONCERNS.md even for the calendar alone |
| Base64 photos in the same JSON blob as export/sync payloads | Export/sync payloads balloon in size (photos already inflate localStorage ~33% per CONCERNS.md); sync becomes slow, export files become unwieldy to email/share | Treat photos as a separate export artifact (e.g., ZIP with a manifest) or defer to file-based storage before making export/sync a first-class feature | Breaks first for users with multiple cats and multiple photos each — the same threshold already noted in CONCERNS.md for localStorage itself |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Treating export files as harmless local artifacts | Export JSON contains vet phone numbers (PII, already flagged in CONCERNS.md as unencrypted) and cat location city/region — an exported file emailed or cloud-drive-synced by the user is a new, uncontrolled copy of that PII outside the app's own privacy boundary | Document in export UI what's included; consider letting users exclude vet contact info from export, since privacy-first is a stated non-negotiable value |
| Assuming "local-first, optional account" means the local data never leaves the device | If a sync/backend path is added later, users who never opted into an account could still have data swept up if migration logic runs by default rather than by explicit consent | Migration to an account must be an explicit, reversible-until-confirmed user action — never silent/automatic on first sign-in detection |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Export button with no feedback on success/failure or file size | Users don't trust the backup exists; silent failures (e.g., export blocked by browser popup blocker or download restrictions) go unnoticed | Confirm export succeeded with a visible summary (e.g., "12 cats, 340 events exported") and a clear error state if it fails |
| List and calendar views with independent, non-obvious filter controls | Users apply a filter in one view, switch to the other, and are confused why it "reset" (a documented pain point even in mature products like Microsoft Lists) | Either share filter state visibly across both views, or make it obvious the two views have independent filters (e.g., distinct filter bar per view, not silently different defaults) |
| Silent conflict resolution during sync (whichever device "won" wins with no notice) | User discovers weeks later that a medication change they made was quietly overwritten by an edit from another device | At minimum, surface "this record was changed elsewhere since your last edit" for higher-stakes fields (medication, vet contact) rather than resolving invisibly |

## "Looks Done But Isn't" Checklist

- [ ] **Data export:** Often missing a tested import path — verify a full export→clear→import round trip actually restores identical data, including recurring schedule events and photos
- [ ] **List view:** Often missing shared recurrence-expansion logic with the calendar — verify editing a recurring event updates both views identically without separate fixes
- [ ] **Anonymous→account migration:** Often missing idempotency and a no-data-loss-on-sign-out guarantee — verify signing out after account migration does not clear local data, and verify running migration twice doesn't duplicate records
- [ ] **SwiftData+CloudKit model (future iOS phase):** Often missing all-optional/defaulted fields and an `initializeCloudKitSchema` step — verify schema changes actually propagate to a second physical device, not just the Simulator

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|--------------------|
| Export shipped without versioning, format needs to change later | MEDIUM | Add a version-sniffing import path that detects unversioned files by shape and maps them to v1 explicitly; going forward, require `schemaVersion` on all new exports |
| Calendar/list views drift out of sync on recurrence logic | MEDIUM | Refactor both views to consume one shared expansion function; add a regression test comparing calendar-rendered and list-rendered instances for the same date range |
| Local data lost during an anonymous→account migration already shipped | HIGH | If any pre-migration local backups/exports exist, offer manual re-import; otherwise this is unrecoverable — underscores why migration must be tested thoroughly before shipping, not patched after |
| CloudKit sync built against a non-optional SwiftData model | MEDIUM-HIGH | Requires a model migration (make fields optional/defaulted) plus a CloudKit schema reset; easier before the app has real user data in production CloudKit containers |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|-------------------|
| Write-only export (no tested import, no versioning) | Data export/backup phase | Automated round-trip test: export → wipe storage → import → deep-equal check against original data |
| Calendar/list view drift (two sources of truth for events) | Filterable list view phase | Both views' rendered event lists for an identical date range are generated from one shared function; a recurrence bug-fix test passes for both views simultaneously |
| CRDT/sync resolving structure but not business rules | Accounts/cross-platform sync phase (future milestone) | Explicit conflict-handling design doc exists naming which fields silently merge vs. which surface a "changed elsewhere" notice to the user |
| Anonymous-to-account data loss/duplication | Accounts/cross-platform sync phase (future milestone), but storage-layer design should anticipate it now | Migration is idempotent (re-run test), sign-out does not clear local data (regression test), and a two-device pre-existing-local-data scenario is explicitly tested |
| SwiftData+CloudKit schema constraints | Future native iOS phase | Schema designed all-optional/defaulted from first draft; `initializeCloudKitSchema` step is part of the release checklist; sync tested on 2+ physical devices before sign-off |

## Sources

- [Conflict Resolution: Using Last-Write-Wins vs. CRDTs — DZone](https://dzone.com/articles/conflict-resolution-using-last-write-wins-vs-crdts) — MEDIUM confidence (cross-checked across multiple independent search results on CRDT/LWW tradeoffs)
- [Why Local-First Software Is the Future and its Limitations — RxDB](https://rxdb.info/articles/local-first-future.html) — MEDIUM confidence
- [CRDTs and Local-First Architecture — DEV Community](https://dev.to/smallstack/crdts-and-local-first-architecture-how-smallstack-handles-offline-conflict-resolution-338c) — MEDIUM confidence
- [Fixing SwiftData & Core Data Sync: initializeCloudKitSchema — fatbobman.com](https://fatbobman.com/en/snippet/resolving-incomplete-icloud-data-sync-in-ios-development-using-initializecloudkitschema/) — MEDIUM confidence (corroborated by Hacking with Swift forum threads)
- [Syncing SwiftData with CloudKit — Hacking with Swift](https://www.hackingwithswift.com/books/ios-swiftui/syncing-swiftdata-with-cloudkit) — MEDIUM confidence
- [SOLVED: Issue syncing SwiftData to CloudKit — Hacking with Swift forums](https://www.hackingwithswift.com/forums/ios/issue-syncing-swiftdata-to-cloudkit/30222) — MEDIUM confidence
- [Storage quotas and eviction criteria — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — MEDIUM confidence (official Mozilla documentation)
- [IndexedDB Max Storage Size Limit — RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html) — MEDIUM confidence
- [Updates to Storage Policy — WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/) — MEDIUM confidence (official WebKit engineering blog, explains Safari's tighter iOS quota behavior)
- [Best Practices for Anonymous Authentication — Firebase blog](https://firebase.blog/posts/2023/07/best-practices-for-anonymous-authentication/) — MEDIUM confidence (official vendor guidance on anonymous→account migration risk)
- [Lists calendar view doesn't keep filters — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5317264/lists-calendar-view-doesnt-keep-filters) — LOW confidence (single anecdotal report, included as an illustrative real-world instance of the calendar/list filter-drift pattern)
- [Build an offline-first app — Android Developers](https://developer.android.com/topic/architecture/data-layer/offline-first) — MEDIUM confidence (official platform documentation)
- [A Design Guide for Building Offline First Apps — Hasura](https://hasura.io/blog/design-guide-to-offline-first-apps) — MEDIUM confidence
- Internal: `.planning/codebase/CONCERNS.md` (2026-07-04 codebase audit) — HIGH confidence, first-party source, used to ground pitfalls in this specific codebase's actual known issues (base64 photo storage, `expandEvents()` eager expansion, no export/backup, fragile `ScheduleEvent` optional-field model)

---
*Pitfalls research for: client-only cat care app adding export/backup, dual calendar+list views, and local-first/optional-account sync*
*Researched: 2026-07-04*
