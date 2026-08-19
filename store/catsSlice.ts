import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cat } from '@/types/cat'
import { deleteCat as removeFromStorage, getCats, saveCat as writeToStorage } from '@/lib/storage'
// Type-only import, so it is erased at compile time and creates no runtime cycle
// even though store/index.ts imports this file's reducer.
import type { AppDispatch } from '@/store/types'

/**
 * The user's cats, plus which one is currently being looked at.
 *
 * localStorage stays the persistence layer; this slice is the live copy the UI
 * reads. Before it, /cats, /cats/[id], and /schedule each read storage on mount
 * and held their own private array, so renaming a cat on one page left the
 * others showing the old name until they remounted.
 */
interface CatsState {
  items: Cat[]
  /** Which cat is being viewed. Null on list pages. */
  selectedCatId: string | null
  /** False until the first load from storage, so the UI can avoid flashing empty. */
  loaded: boolean
}

const initialState: CatsState = {
  items: [],
  selectedCatId: null,
  loaded: false,
}

const catsSlice = createSlice({
  name: 'cats',
  initialState,
  reducers: {
    /**
     * Puts the stored cats into state. Reading storage happens in the thunk
     * below, not here — reducers must be pure, and touching localStorage inside
     * one would make the same action produce different results depending on when
     * it ran, which breaks DevTools replay.
     */
    catsLoaded(state, action: PayloadAction<Cat[]>) {
      state.items = action.payload
      state.loaded = true
    },

    catSaved(state, action: PayloadAction<Cat>) {
      const cat = action.payload
      const index = state.items.findIndex(c => c.id === cat.id)
      // Assigning to state looks like mutation but isn't. Redux Toolkit runs
      // reducers inside Immer, which records writes against a draft and produces
      // a new immutable object — so the no-mutation rule still holds without
      // hand-writing spread operators.
      if (index >= 0) state.items[index] = cat
      else state.items.push(cat)
    },

    catDeleted(state, action: PayloadAction<string>) {
      state.items = state.items.filter(c => c.id !== action.payload)
      if (state.selectedCatId === action.payload) state.selectedCatId = null
    },

    catSelected(state, action: PayloadAction<string | null>) {
      state.selectedCatId = action.payload
    },
  },
})

export const { catsLoaded, catSaved, catDeleted, catSelected } = catsSlice.actions
export default catsSlice.reducer

// ─── Thunks ───────────────────────────────────────────────────────────────────
// Storage writes live here because reducers have to stay pure. A thunk is just a
// function that receives `dispatch`: it can do the side effect first, then
// dispatch the plain action that updates state.

export function loadCats() {
  return (dispatch: AppDispatch) => {
    dispatch(catsLoaded(getCats()))
  }
}

export function persistCat(cat: Cat) {
  return (dispatch: AppDispatch) => {
    writeToStorage(cat)
    dispatch(catSaved(cat))
  }
}

export function removeCat(id: string) {
  return (dispatch: AppDispatch) => {
    removeFromStorage(id)
    dispatch(catDeleted(id))
  }
}
