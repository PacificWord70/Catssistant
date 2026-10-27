---
status: complete
---

# Self-serve batch: CI, backup, list view, health cards, small fixes

The items from the review that needed no product guidance, plus three that
needed one answer each from Heidi.

## Decisions from Heidi
- Import merges. When the same record exists on both sides and they differ,
  the newer one wins (by `updatedAt`); with no usable time, the imported one wins
- No UI for restoring unreadable-data backups for now
- List view is a Calendar | List toggle on the Schedule page (Phase 1)
- Health shows one stat card per cat, side by side; may switch to a combined
  table after seeing it, so stats are computed apart from layout
- The async storage refactor waits for accounts

## Work
- CI on push and pull request: lint, typecheck, test, build
- `updatedAt` on every stored record, migrated from `createdAt`
- Back up & restore page: export every collection with a schema version,
  import with a merge summary and confirm (DATA-01/02/03)
- Product names editable in My Items
- Schedule list view with filters, date ranges and sort (CARE-03/04)
- Health stat cards per cat, no empty-state flash while loading
- Delete-cat button with a confirm that counts what goes with it
- Search on My Cats
- Remove the unused EmptyState; lazy-load photos in the grid
- `scheduleUtils` and `healthAnalysis` use `lib/dateKeys.ts`
