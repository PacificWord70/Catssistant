'use client'

import { useState, useRef, useEffect } from 'react'
import { BREEDS, breedSlug } from '@/lib/breeds'

const TRAIT_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  Quiet: 'bg-blue-100 text-blue-700',
  Moderate: 'bg-yellow-100 text-yellow-700',
  Vocal: 'bg-pink-100 text-pink-700',
  Reserved: 'bg-gray-100 text-gray-600',
  Friendly: 'bg-green-100 text-green-700',
  'Very Friendly': 'bg-emerald-100 text-emerald-700',
}

const FILTER_DEFS = [
  { key: 'energy',       label: 'Energy',       options: ['Low', 'Medium', 'High'] },
  { key: 'friendliness', label: 'Friendliness', options: ['Reserved', 'Moderate', 'Friendly', 'Very Friendly'] },
  { key: 'grooming',     label: 'Grooming',     options: ['Low', 'Medium', 'High'] },
  { key: 'vocality',     label: 'Vocality',     options: ['Quiet', 'Moderate', 'Vocal'] },
  { key: 'continent',    label: 'Origin',       options: ['North America', 'Europe', 'Asia', 'Africa', 'Various'] },
] as const

type FilterKey = typeof FILTER_DEFS[number]['key']
type Filters = Record<FilterKey, string[]>

function MultiDropdown({ label, options, active, onToggle }: {
  label: string
  options: readonly string[]
  active: string[]
  onToggle: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const count = active.length
  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-1.5 text-sm px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${
          count > 0
            ? 'border-brand-orange/40 bg-brand-orange/5 text-brand-brown font-medium'
            : 'border-gray-200 text-gray-500 hover:border-gray-300'
        }`}
      >
        {label}
        {count > 0 && (
          <span className="bg-brand-orange text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {count}
          </span>
        )}
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
          {options.map(opt => {
            const on = active.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px] ${on ? 'bg-brand-orange border-brand-orange text-white' : 'border-gray-300'}`}>
                  {on && '✓'}
                </span>
                <span className={`${TRAIT_COLORS[opt] ?? ''} px-1.5 py-0.5 rounded-full text-xs`}>{opt}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TraitPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${TRAIT_COLORS[value] ?? 'bg-gray-100 text-gray-600'}`}>
        {value}
      </span>
    </div>
  )
}

const SORT_OPTIONS = ['Alphabetical', 'Energy', 'Friendliness', 'Grooming', 'Vocality'] as const
type SortOption = typeof SORT_OPTIONS[number]

const TRAIT_ORDER: Record<string, number> = {
  Low: 0, Quiet: 0, Reserved: 0,
  Medium: 1, Moderate: 1,
  High: 2, Vocal: 2, Friendly: 2, 'Very Friendly': 3,
}

export default function BreedsPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('Alphabetical')
  const [sortAsc, setSortAsc] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    energy: [], friendliness: [], grooming: [], vocality: [], continent: [],
  })

  function toggle(key: FilterKey, value: string) {
    setFilters(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value],
    }))
  }

  const hasFilters = Object.values(filters).some(f => f.length > 0)

  const filtered = BREEDS.filter(b => {
    if (query && !b.name.toLowerCase().includes(query.toLowerCase()) && !b.origin.toLowerCase().includes(query.toLowerCase())) return false
    if (filters.energy.length       && !filters.energy.includes(b.traits.energy))             return false
    if (filters.friendliness.length && !filters.friendliness.includes(b.traits.friendliness)) return false
    if (filters.grooming.length     && !filters.grooming.includes(b.traits.grooming))         return false
    if (filters.vocality.length     && !filters.vocality.includes(b.traits.vocality))         return false
    if (filters.continent.length    && !filters.continent.includes(b.continent))              return false
    return true
  }).sort((a, b) => {
    let cmp = 0
    if (sort === 'Alphabetical') cmp = a.name.localeCompare(b.name)
    else {
      const key = sort.toLowerCase() as keyof typeof a.traits
      cmp = (TRAIT_ORDER[a.traits[key]] ?? 0) - (TRAIT_ORDER[b.traits[key]] ?? 0)
    }
    return sortAsc ? cmp : -cmp
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm p-7">

        <div className="text-center mb-7">
          <div className="text-5xl mb-3 select-none">📚</div>
          <h1 className="font-display text-4xl text-brand-brown">Breed Catalog</h1>
          <p className="text-brand-tan mt-2 font-medium">Cat breed information</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Sort</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 bg-white"
          >
            {SORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <button
            onClick={() => setSortAsc(a => !a)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:border-gray-300 transition-colors"
            title={sortAsc ? 'Ascending' : 'Descending'}
          >
            {sortAsc ? '↓' : '↑'}
          </button>
        </div>

        <input
          type="search"
          placeholder="Search breeds or origin..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
        />
        <div className="flex gap-2 mb-6 items-center">
          {FILTER_DEFS.map(({ key, label, options }) => (
            <MultiDropdown
              key={key}
              label={label}
              options={options}
              active={filters[key]}
              onToggle={v => toggle(key, v)}
            />
          ))}
          {hasFilters && (
            <button
              onClick={() => setFilters({ energy: [], friendliness: [], grooming: [], vocality: [], continent: [] })}
              className="text-xs text-brand-slate hover:underline whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No breeds match your filters</p>
        ) : (
          <div className="space-y-4">
            {filtered.map(breed => (
              <div key={breed.name} id={breedSlug(breed.name)} className="border border-brand-tan/30 rounded-2xl p-5 scroll-mt-6">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h2 className="font-display text-xl text-brand-brown">{breed.name}</h2>
                  <span className="text-xs text-gray-400 shrink-0">{breed.origin}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{breed.description}</p>
                <div className="grid grid-cols-4 gap-3">
                  <TraitPill label="Energy"       value={breed.traits.energy} />
                  <TraitPill label="Friendliness" value={breed.traits.friendliness} />
                  <TraitPill label="Grooming"     value={breed.traits.grooming} />
                  <TraitPill label="Vocality"     value={breed.traits.vocality} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
