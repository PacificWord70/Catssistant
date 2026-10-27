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
 * example?", and that should have one answer. The flag is set and cleared by
 * `loadHousehold` in store/catsSlice.ts, the only thing that decides which
 * household is shown.
 */
interface ExampleState {
  active: boolean
}

const initialState: ExampleState = { active: false }

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    exampleShown(state) {
      state.active = true
    },
    exampleEnded(state) {
      state.active = false
    },
  },
})

export const { exampleShown, exampleEnded } = exampleSlice.actions
export default exampleSlice.reducer

/**
 * Called first by every thunk that saves or deletes. Throwing before the
 * storage write is what keeps the example out of storage, and throwing rather
 * than returning quietly is what tells the visitor: the forms show a thrown
 * error's message inline, the same way they show a full-storage error.
 */
export function refuseWhileExample(getState: () => RootState): void {
  if (getState().example.active) throw new ExampleHouseholdError()
}
