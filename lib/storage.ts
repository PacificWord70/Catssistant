import { Cat } from '@/types/cat'
import { ScheduleEvent } from '@/types/scheduleEvent'

const STORAGE_KEY = 'catssistant_cats'
const SCHEDULE_KEY = 'catssistant_schedule_events'

export function getCats(): Cat[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getCatById(id: string): Cat | undefined {
  return getCats().find(c => c.id === id)
}

export function saveCat(cat: Cat): void {
  const cats = getCats()
  const idx = cats.findIndex(c => c.id === cat.id)
  if (idx >= 0) {
    cats[idx] = cat
  } else {
    cats.push(cat)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

export function deleteCat(id: string): void {
  const cats = getCats().filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
}

export function getScheduleEvents(): ScheduleEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveScheduleEvent(event: ScheduleEvent): void {
  const events = getScheduleEvents()
  const idx = events.findIndex(e => e.id === event.id)
  if (idx >= 0) {
    events[idx] = event
  } else {
    events.push(event)
  }
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events))
}

export function deleteScheduleEvent(id: string): void {
  const events = getScheduleEvents().filter(e => e.id !== id)
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(events))
}
