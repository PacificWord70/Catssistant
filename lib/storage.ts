import { Cat } from '@/types/cat'

const STORAGE_KEY = 'catssistant_cats'

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
