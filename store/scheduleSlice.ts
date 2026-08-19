import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ScheduleEvent } from '@/types/scheduleEvent'
import {
  deleteScheduleEvent as removeFromStorage,
  getScheduleEvents,
  saveScheduleEvent as writeToStorage,
} from '@/lib/storage'
import type { AppDispatch } from '@/store/types'

/**
 * Care events for the user's cats.
 *
 * Only the events themselves live here. Which month the calendar is showing and
 * which day is selected stay as local state on the page: they are view state,
 * meaningful to one screen and reset when you leave it. Putting them in the
 * store would make the calendar remember its scroll position across the whole
 * app for no benefit — a useful line to be able to draw, since "put everything
 * in Redux" is the usual overcorrection.
 */
interface ScheduleState {
  items: ScheduleEvent[]
  loaded: boolean
}

const initialState: ScheduleState = {
  items: [],
  loaded: false,
}

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    scheduleEventsLoaded(state, action: PayloadAction<ScheduleEvent[]>) {
      state.items = action.payload
      state.loaded = true
    },

    scheduleEventSaved(state, action: PayloadAction<ScheduleEvent>) {
      const event = action.payload
      const index = state.items.findIndex(e => e.id === event.id)
      if (index >= 0) state.items[index] = event
      else state.items.push(event)
    },

    scheduleEventDeleted(state, action: PayloadAction<string>) {
      state.items = state.items.filter(e => e.id !== action.payload)
    },
  },
})

export const { scheduleEventsLoaded, scheduleEventSaved, scheduleEventDeleted } =
  scheduleSlice.actions
export default scheduleSlice.reducer

// ─── Thunks ───────────────────────────────────────────────────────────────────

export function loadScheduleEvents() {
  return (dispatch: AppDispatch) => {
    dispatch(scheduleEventsLoaded(getScheduleEvents()))
  }
}

export function persistScheduleEvent(event: ScheduleEvent) {
  return (dispatch: AppDispatch) => {
    writeToStorage(event)
    dispatch(scheduleEventSaved(event))
  }
}

export function removeScheduleEvent(id: string) {
  return (dispatch: AppDispatch) => {
    removeFromStorage(id)
    dispatch(scheduleEventDeleted(id))
  }
}
