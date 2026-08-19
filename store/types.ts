import type { store } from '@/store'

/**
 * Types derived from the store rather than written by hand.
 *
 * `RootState` is inferred from the actual reducers, so adding a slice updates it
 * automatically and every selector stays type-safe with no second declaration to
 * keep in sync. Hand-writing this shape is the usual way Redux types drift out of
 * step with the store.
 *
 * These live in their own file so slices can import AppDispatch without importing
 * the store itself, which would be a circular dependency.
 */
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
