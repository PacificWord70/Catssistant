import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Cat } from '@/types/cat'
import {
  deleteCat as removeFromStorage,
  getCats,
  getScheduleEvents,
  saveCat as writeToStorage,
} from '@/lib/storage'
import { getHealthRecords } from '@/lib/healthStorage'
import { getCatalogProducts, getHouseholdItems } from '@/lib/itemStorage'
import { todayKey } from '@/lib/dateKeys'
import { buildExampleHousehold, ExampleHouseholdError, isExampleId } from '@/lib/exampleHousehold'
import { exampleEnded, exampleShown, refuseWhileExample } from '@/store/exampleSlice'
import { healthRecordDeleted, healthRecordsLoaded } from '@/store/healthSlice'
import { itemsLoaded } from '@/store/itemsSlice'
import {
  scheduleEventDeleted,
  scheduleEventSaved,
  scheduleEventsLoaded,
} from '@/store/scheduleSlice'
// Type-only import, so it is erased at compile time and creates no runtime cycle
// even though store/index.ts imports this file's reducer.
import type { AppDispatch, RootState } from '@/store/types'

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
//
// The order is load-bearing: storage functions throw StorageWriteError when a
// write did not happen, and because the dispatch comes after, a failed save
// never reaches state. The UI catches the error and shows its message.

/** Reads cats alone. The app itself loads through `loadHousehold` below. */
export function loadCats() {
  return (dispatch: AppDispatch) => {
    dispatch(catsLoaded(getCats()))
  }
}

/**
 * Loads every slice at once, and decides which household they hold: the
 * owner's own records, or — when no real cats are saved — the example
 * (lib/exampleHousehold.ts).
 *
 * It lives here rather than in its own module because cats are what decide it,
 * and because persistCat and removeCat both need to call it; a separate file
 * importing this slice's actions would make the two import each other.
 *
 * The example replaces every slice, not just cats. Leftover events or items
 * from a household whose cats were all deleted stay untouched in storage and
 * come back with the next real cat; showing them beside example cats would
 * mix the two, which is the one thing the example must never do.
 *
 * The flag goes first, so no subscriber ever sees example cats while saves
 * are still allowed.
 */
export function loadHousehold() {
  return (dispatch: AppDispatch) => {
    const cats = getCats()
    if (cats.length === 0) {
      const example = buildExampleHousehold(todayKey())
      dispatch(exampleShown())
      dispatch(catsLoaded(example.cats))
      dispatch(scheduleEventsLoaded(example.events))
      dispatch(itemsLoaded({ items: example.items, catalog: example.products }))
      dispatch(healthRecordsLoaded(example.healthRecords))
      return
    }
    dispatch(exampleEnded())
    dispatch(catsLoaded(cats))
    dispatch(scheduleEventsLoaded(getScheduleEvents()))
    dispatch(itemsLoaded({ items: getHouseholdItems(), catalog: getCatalogProducts() }))
    dispatch(healthRecordsLoaded(getHealthRecords()))
  }
}

/**
 * Saves a cat. While the example is showing, a brand-new cat — anything
 * without an example id, which only the Add Cat form produces — is the
 * owner's first real one: it is saved, and reloading the household from
 * storage then finds a cat there and ends the example. Editing an example
 * cat is refused like any other change to the example.
 */
export function persistCat(cat: Cat) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().example.active) {
      if (isExampleId(cat.id)) throw new ExampleHouseholdError()
      writeToStorage(cat)
      dispatch(loadHousehold())
      return
    }
    // Storage stamps updatedAt, so state gets the copy storage kept, not the
    // one the form handed in.
    dispatch(catSaved(writeToStorage(cat)))
  }
}

/**
 * Deletes a cat and mirrors the cascade storage performed, so the schedule and
 * health slices drop the same events and readings without reloading. Applying
 * storage's own list of changes, rather than recomputing them here, keeps the
 * rule about shared events in one place.
 *
 * Deleting the last real cat brings the example back, since the owner is once
 * again someone with no cats saved.
 */
export function removeCat(id: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    refuseWhileExample(getState)
    const { updatedEvents, deletedEventIds, deletedHealthRecordIds } = removeFromStorage(id)
    dispatch(catDeleted(id))
    for (const event of updatedEvents) dispatch(scheduleEventSaved(event))
    for (const eventId of deletedEventIds) dispatch(scheduleEventDeleted(eventId))
    for (const recordId of deletedHealthRecordIds) dispatch(healthRecordDeleted(recordId))
    if (getState().cats.items.length === 0) dispatch(loadHousehold())
  }
}
