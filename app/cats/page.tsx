'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import { selectCatsByNewest, selectCatsLoaded } from '@/store/selectors'
import CatCard from '@/components/CatCard'
import Reveal from '@/components/motion/Reveal'

/**
 * Below this many cats the whole grid fits on one screen, and a search box
 * would be clutter for the one- and two-cat households most owners are.
 */
const SEARCH_THRESHOLD = 4

export default function CatsPage() {
  // Read straight from the store. No local copy, no reading storage here — the
  // provider loaded it once at startup, and this stays current if a cat changes
  // anywhere else in the app.
  const cats = useAppSelector(selectCatsByNewest)
  const loaded = useAppSelector(selectCatsLoaded)
  const [query, setQuery] = useState('')
  const searchId = useId()

  // No redirect to onboarding for an empty household any more: with no cats
  // saved, the store holds the example household instead, so there is always
  // a grid to show. Rendering nothing until storage has been read avoids
  // flashing one household and then the other.
  if (!loaded) return null

  const searchable = cats.length >= SEARCH_THRESHOLD
  // Ignored once the box is hidden, so deleting down to a few cats cannot leave
  // the grid filtered by a search the owner can no longer see or clear.
  const needle = searchable ? query.trim().toLowerCase() : ''
  const shown = needle
    ? cats.filter(
        cat =>
          cat.name.toLowerCase().includes(needle) ||
          cat.breed.some(b => b.toLowerCase().includes(needle)),
      )
    : cats

  return (
    <div className="bg-white rounded-3xl shadow-soft p-7 min-h-[calc(100vh-8rem)]">
      <Reveal>
        <div className="flex items-center justify-between mb-7">
          <h1 className="font-display text-3xl text-brand-brown">My Cats</h1>
          <Link
            href="/cats/new"
            className="hover-lift px-4 py-2 bg-brand-orange text-white rounded-2xl text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft"
          >
            + Add Cat
          </Link>
        </div>
      </Reveal>
      {searchable && (
        <div className="mb-6 max-w-sm">
          <label htmlFor={searchId} className="block text-sm font-medium text-brand-brown mb-1.5">
            Search your cats
          </label>
          <div className="relative">
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name or breed"
              className="w-full rounded-2xl border border-brand-tan/50 px-4 py-2.5 pr-20 text-sm text-brand-charcoal bg-white [&::-webkit-search-cancel-button]:appearance-none focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  document.getElementById(searchId)?.focus()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl text-sm text-brand-slate hover:bg-brand-tan/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      {shown.length === 0 ? (
        <p role="status" className="text-brand-brown/70 py-10 text-center">
          No cats match “{query.trim()}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {shown.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 0.05}>
              <CatCard cat={cat} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
