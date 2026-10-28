import { createSlice } from '@reduxjs/toolkit'
import { ExampleHouseholdError } from '@/lib/exampleHousehold'
// Type-only import, so it is erased at compile time and creates no runtime cycle
// even though store/index.ts imports this file's reducer.
import type { RootState } from '@/store/types'

/**
 * Whether the other slices are holding the example household rather than the
 * owner's own records (see lib/exampleHousehold.ts).
 *
 * One flag in its own slice, rather than a marker on each record or a check
 * for `example-` ids, because the question every save asks is "is this the
 * example?", and that should have one answer. The flags are set and cleared by
 * `loadHousehold`, `startExamplePreview` and `endExamplePreview` in
 * store/catsSlice.ts, the only things that decide which household is shown.
 *
 * `preview` is the second reason the example can be showing: an owner with
 * cats of their own opened it from a page's help button to see the page
 * filled in. The refusals are the same either way — that is `active` — but
 * what the owner is told, and the way back, differ: a first-time visitor is
 * pointed at Add Cat, a previewing owner at Exit preview. Nothing here is
 * persisted, so a reload lands on the owner's own records again.
 */
interface ExampleState {
  active: boolean
  preview: boolean
}

const initialState: ExampleState = { active: false, preview: false }

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    exampleShown(state) {
      state.active = true
      state.preview = false
    },
    examplePreviewStarted(state) {
      state.active = true
      state.preview = true
    },
    exampleEnded(state) {
      state.active = false
      state.preview = false
    },
  },
})

export const { exampleShown, examplePreviewStarted, exampleEnded } = exampleSlice.actions
export default exampleSlice.reducer

/**
 * Called first by every thunk that saves or deletes. Throwing before the
 * storage write is what keeps the example out of storage, and throwing rather
 * than returning quietly is what tells the visitor: the forms show a thrown
 * error's message inline, the same way they show a full-storage error.
 */
export function refuseWhileExample(getState: () => RootState): void {
  const { active, preview } = getState().example
  if (active) throw new ExampleHouseholdError(preview)
}
