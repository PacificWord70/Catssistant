# Stack Research

**Domain:** Data export/backup for a localStorage-based web app + optional-account cross-device sync backend for a privacy-first cat care tracker (web/iOS/Android)
**Researched:** 2026-07-04
**Confidence:** MEDIUM (web-search-derived, cross-checked across multiple independent sources; no vendor API/SDK was hands-on verified in this pass)

> This document presents options neutrally for the team to decide on — it is not a final recommendation to execute. Vendor choice was explicitly flagged in PROJECT.md as "intentionally undecided... do not commit to one without a team discussion."

---

## Part 1: Data Export / Backup (immediate need, no new backend required)

This addresses the CONCERNS.md "High priority" gap: users currently have zero way to get data out of localStorage, and localStorage caps out around 5-10MB (roughly 10-20 cats with photos).

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Native `Blob` + `URL.createObjectURL` | Browser built-in | Client-side "download as file" for export | No dependency needed — a JSON export button is just `new Blob([JSON.stringify(data)], {type: 'application/json'})` + a synthetic `<a download>` click. Zero new packages, fits "don't add dependencies without discussing" constraint. |
| `<input type="file">` + `FileReader` | Browser built-in | Import a previously exported JSON file back in | Same rationale — no library needed for the read side either. |
| Explicit `schemaVersion` field in export payload | N/A (convention) | Forward/backward-compatible import | Cross-checked pattern (MEDIUM confidence): embed `schemaVersion` in every exported document; on import, compare against current version and run a chain of migration functions before accepting data. Avoids "big-bang" breakage when the Cat/ScheduleEvent shape changes later. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `idb` (jakearchibald/idb) | 8.x | Thin promise-based wrapper around IndexedDB | Only if/when you migrate off localStorage entirely for capacity reasons (see below) — mirrors the native IndexedDB API with minor ergonomics improvements, ~1.2KB. |
| `idb-keyval` | 6.x | Simple key-value store on top of IndexedDB | Lighter alternative to `idb` if you only need get/set/del semantics rather than structured queries — a near drop-in replacement for the current `lib/storage.ts` key-value pattern. |

### Migration pattern (localStorage → IndexedDB, if pursued)

Cross-checked (MEDIUM confidence) finding: **migrate inside the storage abstraction layer, not by having callers know about it.** Catssistant already has this seam — `lib/storage.ts` is the single point that touches persistence. The repository/abstraction pattern says: keep the same function signatures (`getCats`, `saveCat`, `deleteCat`, `getScheduleEvents`, etc.), swap the implementation inside `lib/storage.ts` from `localStorage.getItem/setItem` to `idb`/`idb-keyval` calls, and nothing in `app/` or `components/` needs to change. This is a strong fit for the existing codebase structure.

**When to make this move:** IndexedDB removes the ~5-10MB ceiling (goes to 500MB+ browser-dependent) and gets you real schema versioning via `indexedDB.open(dbName, version)` + `onupgradeneeded`. Given the base64-photo-in-localStorage issue already flagged in CONCERNS.md, this is likely to become necessary regardless of whether a sync backend is added, simply to stop the app from silently losing data at the 5-10MB wall.

**This is a distinct decision from the export/import feature above** — you can (and should) ship JSON export/import first, cheaply, regardless of whether/when the storage backend changes underneath it, because the export format is a snapshot of app data, not a description of where it lives.

### What NOT to Use (for export/backup)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| CSV export as the primary/only format | Cat + schedule event data is nested (breeds array, recurrence rules, category-specific optional fields) — CSV flattening is lossy and fragile for re-import | JSON as primary export format; offer CSV only as a secondary "view in spreadsheet" convenience export if requested later |
| Rolling your own IndexedDB schema-migration code from scratch | `onupgradeneeded` version-migration logic is easy to get subtly wrong (this is exactly the kind of "date math without a library" mistake CONCERNS.md already flags for `lib/scheduleUtils.ts`) | `idb` or `idb-keyval`, both tiny and already battle-tested for this exact problem |

---

## Part 2: Optional-Account Cross-Device Sync Backend (deferred decision, researched for team discussion)

PROJECT.md explicitly defers this decision. The five options under consideration (AWS Amplify, Firebase, Supabase, PocketBase, Appwrite) plus the iOS-native no-account path (SwiftData + CloudKit) are compared below **neutrally** — no single recommendation is asserted, per the quality gate for this research.

### iOS-native, no-account path: SwiftData + CloudKit

**Confidence: MEDIUM** (cross-checked across Apple docs description + multiple independent tutorials, no hands-on verification)

- SwiftData (iOS 17+, mature by 2026) is a Swift-native API over the same Core Data engine. Configure a `ModelContainer` with a `ModelConfiguration` that includes a CloudKit container identifier and you get the same sync behavior as `NSPersistentCloudKitContainer`, with far less boilerplate.
- Zero third-party dependency, zero server to run or pay for — sync rides on the user's own iCloud account and storage quota.
- Requirements/gotchas: iCloud + CloudKit capability, Remote Notifications background mode (CloudKit uses these to trigger background sync when another device writes), and **every SwiftData model property/relationship must be optional or have a default value** for CloudKit compatibility (a real constraint on how the iOS data model can be shaped versus the web app's `types/cat.ts`).
- Common mistake flagged in sources: don't build a manual upload queue or reachability check before saving — the persistence container already handles queuing/retry; adding your own breaks offline behavior.
- **This path only covers Apple devices with an iCloud account.** It is not a cross-platform (Android/web) sync solution by itself — it's the "local/no-account, Apple-only" branch of the strategy already sketched in PROJECT.md's Key Decisions table.

### Cross-platform account/sync backend comparison

| Criterion | AWS Amplify (Gen 2) | Firebase | Supabase | PocketBase | Appwrite |
|-----------|---------------------|----------|----------|------------|----------|
| Model | AWS-managed, GraphQL (AppSync) + DynamoDB | Google-managed, Firestore (NoSQL) | Postgres-based, managed or self-host | Single-binary, self-hosted (SQLite) | Managed cloud or self-hosted (Docker) |
| Offline-first / client sync | **No built-in DataStore in Gen 2** — Amplify Gen 2 dropped the offline-sync engine that Gen 1's DataStore provided; you'd hand-roll offline sync on top of AppSync + client-side IndexedDB/SQLite | Firestore SDKs have solid built-in offline persistence/sync out of the box | No built-in offline-sync engine natively; commonly paired with RxDB/Dexie.js or PowerSync/ElectricSQL for true offline-first | No offline-sync engine; realtime is via Server-Sent Events (online-only push) | No built-in offline-sync engine; realtime via WebSocket subscriptions |
| Free tier (as of search) | Pay-as-you-go; new AWS accounts get up to $200 in credits (from July 2025); AppSync + DynamoDB each have their own free tiers, no DataStore-specific charge | Spark plan (free): 20K Firestore writes/day, 50K reads/day, one free DB per project, quota resets daily Pacific time; **hard service shutoff for the rest of the month if you exceed free quota** | Free tier: 500MB DB storage, 1GB file storage, 50K MAUs, unlimited API requests, 200 concurrent realtime connections / 2M messages/month; capped at 2 active projects; **free projects pause after 1 week inactivity**; no backups/SLA/SSO on free tier | Free (open source, self-hosted) — cost is only your own server; reported to handle 10,000+ persistent realtime connections on a $4/mo Hetzner VPS | Cloud free tier: 75K MAUs, 2GB storage, 750K function executions, 5GB bandwidth, 2 projects, paused after 1 week inactivity; self-hosted is free with no feature restrictions |
| Paid tier entry point | Usage-based, no flat "Pro" tier — scales with AppSync/DynamoDB usage | Blaze plan: pay-as-you-go, still-free quotas apply first, only overages billed (and Firestore has the harsh "shut off for the month on overage" behavior on Spark) | Pro: $25/mo + usage (8GB DB, 100K MAUs, 100GB storage, 500 realtime connections) | N/A — no paid tier, self-host cost only | Pro: ~$15-25/mo depending on source (verify current price at appwrite.io/pricing), 200K MAUs, 2TB bandwidth, 150GB storage |
| Vendor lock-in / portability | High — AppSync GraphQL schema + DynamoDB data model are AWS-specific | High — Firestore's data model and SDKs are Google-proprietary | Low — plain Postgres underneath; can self-host or migrate to any Postgres host | Lowest — single binary, SQLite file, easy to inspect/back up/move | Low-Medium — open source, Docker Compose self-host is a real escape hatch |
| Best fit if... | Already deep in AWS (S3 for photos, existing IAM, etc.) | Want the most mature/hands-off client SDKs and don't mind Google lock-in | Want Postgres + relatively low lock-in + generous realtime free tier | Want the cheapest, simplest, most inspectable self-hosted option and are comfortable running your own VPS | Want a Firebase-like DX with an open-source, self-hostable escape hatch |

**Notes on offline-first fit specifically:** None of these five give you offline-first sync "for free" the way SwiftData+CloudKit does on Apple platforms. Firebase's client SDKs come closest (mature built-in offline persistence). For the other four, cross-checked findings from Part 1's research suggest layering a sync engine (e.g., PowerSync or ElectricSQL on top of a Postgres-based backend like Supabase) rather than building offline queuing by hand — but this adds a second piece of infrastructure and should be weighed against the added complexity versus this project's actual needs (a personal care-tracking app, not a real-time collaborative document editor).

### What NOT to Use (for sync backend, at this stage)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| AWS Amplify Gen 1 / DataStore | Gen 1 is being phased out in favor of Gen 2, and Gen 2 does not carry DataStore's offline-sync engine forward — building on the deprecated generation invites a forced migration later | If AWS is chosen, build on Gen 2 directly and plan for a custom offline-sync layer from day one |
| A full CRDT library (Yjs/Automerge) for this app's sync problem | Cross-checked field reports say CRDTs solve concurrent-editing conflicts; Catssistant's data (one owner's cat records) has effectively no concurrent-write conflict problem — CRDT adoption here would be complexity without a matching need | A simpler "last-write-wins" or queued-write sync (which is what most of the BaaS options above provide natively) |
| Committing to a vendor before the account/multi-device feature is actually scoped | PROJECT.md explicitly defers this and flags it needs team discussion; premature lock-in risks a rebuild | Ship JSON export/import + (optionally) IndexedDB migration now; revisit backend choice as its own milestone with a dedicated spike/comparison |

## Stack Patterns by Variant

**If the team wants the fastest path to "data isn't trapped in one browser":**
- Ship JSON export/import now (Part 1) — no vendor decision required, ships this milestone.

**If the team decides to pursue iOS first with no account system:**
- Use SwiftData + CloudKit exclusively for iOS; the web app keeps localStorage/IndexedDB independently, with JSON export/import as the manual bridge between the two until/unless a real cross-platform backend is built.

**If the team decides cross-platform accounts are worth the complexity:**
- Prioritize evaluating Supabase or PocketBase first for lock-in reasons (plain Postgres / plain SQLite are both easy to exit), reserving AWS/Firebase for the case where the team has a specific reason to prefer a hyperscaler (existing AWS usage, need for other AWS services, etc.)
- Budget for building a sync/offline layer separately from the backend choice — none of the five give this "for free" the way CloudKit does for Apple-only.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `idb` 8.x | Modern evergreen browsers (Chromium, Firefox, Safari 15+) | No IE/legacy support needed given this is a personal-use app |
| SwiftData + CloudKit | iOS 17+ only | Matches PROJECT.md's "iOS app is planned for later" — not a constraint today, but locks any iOS build to a fairly recent minimum OS |

## Sources

- WebSearch: "local-first offline-first software architecture sync engine patterns" — appscale.blog, wal.sh, github.com/alexanderop/awesome-local-first (MEDIUM, cross-checked)
- WebSearch: "localStorage to IndexedDB migration strategy repository pattern typescript" — MDN, github.com/jakearchibald/idb, rxdb.info (MEDIUM, cross-checked)
- WebSearch: "JSON export import backup pattern client-only web app schema versioning" — jsonic.io, offlinetools.org (MEDIUM, cross-checked)
- WebSearch: "CRDT sync backend offline-first apps Automerge Yjs Replicache ElectricSQL PowerSync comparison" — powersync.com, electric-sql.com, cssauthor.com (MEDIUM, cross-checked)
- WebSearch: "SwiftData CloudKit sync architecture offline-first iOS app" — developer.apple.com, hackingwithswift.com (MEDIUM, cross-checked)
- WebSearch: "AWS Amplify Gen 2 pricing free tier DataStore sync" — aws.amazon.com/amplify/pricing, aws.amazon.com/appsync/pricing (MEDIUM — official AWS pricing pages, but DataStore-in-Gen-2 status should be re-verified directly against current Amplify docs before committing)
- WebSearch: "Firebase Firestore pricing free tier Spark plan limits" — firebase.google.com/docs/projects/billing/firebase-pricing-plans, firebase.google.com/docs/firestore/quotas (MEDIUM — official docs cited)
- WebSearch: "Supabase pricing free tier limits realtime" — supabase.com/pricing (MEDIUM — official pricing page cited, but numbers should be reconfirmed at decision time since BaaS free tiers change often)
- WebSearch: "PocketBase self-hosted backend features realtime sync limitations" — github.com/pocketbase/pocketbase, betterstack.com (MEDIUM, cross-checked)
- WebSearch: "Appwrite pricing free tier cloud vs self-hosted" — appwrite.io/pricing (MEDIUM — official pricing page cited, exact current dollar figures vary slightly between sources and should be reconfirmed at appwrite.io/pricing before committing)

**Gap flagged:** No source in this pass was hands-on verified (e.g., no direct Context7/SDK doc pull) — all findings are WebSearch-derived and should be treated as MEDIUM confidence, directional rather than exact. Before actually committing budget/dev time to any BaaS vendor, re-verify current pricing directly on each vendor's pricing page (these change frequently) and, if AWS is a real contender, verify current Amplify Gen 2 documentation directly for whatever offline-sync story exists at that time.

---
*Stack research for: privacy-first personal data-tracking app — export/backup + optional cross-device sync*
*Researched: 2026-07-04*
