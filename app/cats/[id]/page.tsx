'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCatById } from '@/lib/storage'
import { Cat } from '@/types/cat'
import { catAgeLabel, catHumanAge } from '@/lib/utils'

const FEATURE_TABS = ['Feeding', 'Health', 'Litter', 'Meds', 'Notes']

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cat, setCat] = useState<Cat | null>(null)

  useEffect(() => {
    const found = getCatById(id)
    if (!found) {
      router.replace('/')
      return
    }
    setCat(found)
  }, [id, router])

  if (!cat) return null

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-brand-slate text-sm hover:underline mb-6 inline-block">
        ← My Cats
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-3xl shadow-sm border border-brand-tan/30 overflow-hidden mb-6">
        <div className="h-56 bg-brand-tan/20 flex items-center justify-center overflow-hidden">
          {cat.photoUrl ? (
            <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-9xl select-none">🐱</span>
          )}
        </div>
        <div className="p-6">
          <h1 className="font-display text-3xl text-brand-brown">{cat.name}</h1>
          {cat.breed.length > 0 && (
            <p className="text-brand-tan font-medium mt-1">{cat.breed.join(' · ')}</p>
          )}
          {cat.birthday && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="text-gray-500">{catAgeLabel(cat.birthday)}</span>
              <span className="text-brand-brown font-medium">
                ~{catHumanAge(cat.birthday)} in human years
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      {(cat.weight || cat.chipId || cat.homeLocation) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {cat.weight && (
            <StatCard label="Weight" value={`${cat.weight} ${cat.weightUnit}`} />
          )}
          {cat.chipId && (
            <StatCard label="Microchip ID" value={cat.chipId} mono />
          )}
          {cat.homeLocation && (
            <StatCard label="Home" value={cat.homeLocation} />
          )}
        </div>
      )}

      {/* Vet info */}
      {cat.vet && (cat.vet.name || cat.vet.phone || cat.vet.address) && (
        <div className="bg-white rounded-2xl border border-brand-tan/30 p-5 mb-6">
          <h2 className="font-semibold text-brand-brown mb-3">Vet</h2>
          {cat.vet.name && <p className="text-sm font-medium">{cat.vet.name}</p>}
          {cat.vet.phone && (
            <a href={`tel:${cat.vet.phone}`} className="text-sm text-brand-slate hover:underline block mt-0.5">
              {cat.vet.phone}
            </a>
          )}
          {cat.vet.address && <p className="text-sm text-gray-400 mt-0.5">{cat.vet.address}</p>}
        </div>
      )}

      {/* Personality / notes */}
      {(cat.personality || cat.notes) && (
        <div className="bg-white rounded-2xl border border-brand-tan/30 p-5 mb-6 space-y-4">
          {cat.personality && (
            <div>
              <h2 className="font-semibold text-brand-brown mb-1">Personality</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{cat.personality}</p>
            </div>
          )}
          {cat.notes && (
            <div>
              <h2 className="font-semibold text-brand-brown mb-1">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{cat.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Feature tabs — placeholders */}
      <div className="bg-white rounded-2xl border border-brand-tan/30 overflow-hidden">
        <div className="flex border-b border-brand-tan/20 overflow-x-auto">
          {FEATURE_TABS.map(tab => (
            <button
              key={tab}
              className="flex-1 min-w-[4rem] py-3 text-xs sm:text-sm font-medium text-gray-300 cursor-default"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-8 text-center text-gray-400 text-sm">
          More features coming soon!
        </div>
      </div>

      {/* Edit link */}
      <div className="mt-6 text-center">
        <Link
          href={`/cats/${cat.id}/edit`}
          className="text-sm text-brand-slate hover:underline"
        >
          Edit {cat.name}&apos;s profile
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-tan/30 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-medium text-brand-charcoal ${mono ? 'font-mono text-sm break-all' : ''}`}>
        {value}
      </p>
    </div>
  )
}
