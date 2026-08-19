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
