import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { HealthRecord } from '@/types/healthRecord'
import {
  deleteHealthRecord as removeFromStorage,
  getHealthRecords,
  saveHealthRecord as writeToStorage,
} from '@/lib/healthStorage'
// Type-only import, so it is erased at compile time and creates no runtime cycle
// even though store/index.ts imports this file's reducer.
import { refuseWhileExample } from '@/store/exampleSlice'
import type { AppDispatch, RootState } from '@/store/types'

/**
 * Dated health measurements for every cat.
 *
 * One flat list rather than a map keyed by cat: the health page filters to one
 * cat at a time, but keeping them together means a reading can be added without
 * first checking whether that cat has a bucket, and export later gets one array
 * to serialise.
 *
 * localStorage stays the persistence layer; this slice is the live copy the UI
 * reads, same arrangement as the cats and schedule slices.
 */
interface HealthState {
  records: HealthRecord[]
  /** False until the first load from storage, so the UI can avoid flashing empty. */
  loaded: boolean
}

const initialState: HealthState = { records: [], loaded: false }

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    /**
     * Puts the stored records into state. Reading storage happens in the thunk
     * below, not here — reducers must stay pure.
     */
    healthRecordsLoaded(state, action: PayloadAction<HealthRecord[]>) {
      state.records = action.payload
      state.loaded = true
    },

    healthRecordSaved(state, action: PayloadAction<HealthRecord>) {
      const record = action.payload
      const index = state.records.findIndex(r => r.id === record.id)
      if (index >= 0) state.records[index] = record
      else state.records.push(record)
    },

    healthRecordDeleted(state, action: PayloadAction<string>) {
      state.records = state.records.filter(r => r.id !== action.payload)
    },
  },
})

export const { healthRecordsLoaded, healthRecordSaved, healthRecordDeleted } = healthSlice.actions
export default healthSlice.reducer

// ─── Thunks ───────────────────────────────────────────────────────────────────

export function loadHealthRecords() {
  return (dispatch: AppDispatch) => {
    dispatch(healthRecordsLoaded(getHealthRecords()))
  }
}

export function persistHealthRecord(record: HealthRecord) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    refuseWhileExample(getState)
    dispatch(healthRecordSaved(writeToStorage(record)))
  }
}

export function removeHealthRecord(id: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    refuseWhileExample(getState)
    removeFromStorage(id)
    dispatch(healthRecordDeleted(id))
  }
}
