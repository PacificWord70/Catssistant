import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store/types'

/**
 * Selectors: the read side of the store.
 *
 * Components call these instead of reaching into `state.cats.items` themselves.
 * That way the state shape is described in one place — if a slice gets
 * restructured, only this file changes rather than every component.
 */

export const selectAllCats = (state: RootState) => state.cats.items
export const selectCatsLoaded = (state: RootState) => state.cats.loaded
export const selectSelectedCatId = (state: RootState) => state.cats.selectedCatId

/**
 * True while the store holds the example household rather than the owner's
 * own records — see lib/exampleHousehold.ts. Anything asking "does this person
 * have cats?" wants `!isExample`, not `cats.length > 0`: the example is never
 * empty.
 */
export const selectIsExample = (state: RootState) => state.example.active

/**
 * True while an owner with cats of their own is looking at the example from a
 * page's help button (`startExamplePreview`). Anything that nudges "add your
 * first cat" wants `selectIsFirstVisitExample` rather than `selectIsExample`:
 * a previewing owner already has one.
 */
export const selectIsExamplePreview = (state: RootState) => state.example.preview

export const selectIsFirstVisitExample = (state: RootState) =>
  state.example.active && !state.example.preview

/**
 * The currently selected cat, or undefined.
 *
 * Built with createSelector because it *derives* a value rather than reading one
 * straight out. A plain function would run on every state change anywhere in the
 * store; createSelector memoises, so it only recomputes when the cat list or the
 * selected id actually changes. That matters most for selectors returning a new
 * array or object each call — a fresh reference makes a component re-render even
 * when the contents are identical.
 */
export const selectSelectedCat = createSelector(
  [selectAllCats, selectSelectedCatId],
  (cats, selectedId) => cats.find(c => c.id === selectedId),
)

export const selectCatById = (id: string) =>
  createSelector([selectAllCats], cats => cats.find(c => c.id === id))

/** Cats sorted for display. Newest first, matching how the grid reads. */
export const selectCatsByNewest = createSelector([selectAllCats], cats =>
  [...cats].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const selectScheduleEvents = (state: RootState) => state.schedule.items
export const selectScheduleLoaded = (state: RootState) => state.schedule.loaded

/** Events involving one cat, for a per-cat view of its care history. */
export const selectEventsForCat = (catId: string) =>
  createSelector([selectScheduleEvents], events =>
    events.filter(e => e.catIds.includes(catId)),
  )

// ─── Items ────────────────────────────────────────────────────────────────────

export const selectHouseholdItems = (state: RootState) => state.items.items
export const selectCatalog = (state: RootState) => state.items.catalog
export const selectItemsLoaded = (state: RootState) => state.items.loaded

/**
 * Catalogue as a Map keyed by id, so a list of items can resolve product names
 * without a linear search per row.
 *
 * Memoised because it builds a new Map — an unmemoised version would return a
 * different reference every call and re-render every subscriber on any state
 * change anywhere in the store.
 */
export const selectCatalogById = createSelector([selectCatalog], catalog =>
  new Map(catalog.map(p => [p.id, p])),
)

/** Items the user is currently using, as opposed to ones they've stopped. */
export const selectCurrentItems = createSelector([selectHouseholdItems], items =>
  items.filter(i => i.status === 'current'),
)

// ─── Health ───────────────────────────────────────────────────────────────────

export const selectHealthRecords = (state: RootState) => state.health.records
export const selectHealthLoaded = (state: RootState) => state.health.loaded

/**
 * Health readings for one cat.
 *
 * Memoised because filtering builds a new array — without it the health page
 * would re-render on any state change anywhere in the store, including every
 * keystroke in an unrelated form.
 */
export const selectHealthRecordsForCat = (catId: string) =>
  createSelector([selectHealthRecords], records => records.filter(r => r.catId === catId))
