import { configureStore } from '@reduxjs/toolkit'
import catsReducer from '@/store/catsSlice'

/**
 * The single store. One per app, created once per browser tab.
 *
 * Each key under `reducer` is a slice, and its name becomes the path to that
 * data in state — so `cats` here means selectors read `state.cats.items`.
 * Splitting it this way keeps state from becoming one undifferentiated blob and
 * lets components subscribe to just the part they care about.
 *
 * configureStore also wires up Redux DevTools and a middleware that warns in
 * development if a reducer accidentally mutates state or a non-serialisable
 * value is put in — both easy mistakes that are otherwise silent.
 */
export const store = configureStore({
  reducer: {
    cats: catsReducer,
  },
})
