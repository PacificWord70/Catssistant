'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCatById } from '@/lib/storage'
import { Cat } from '@/types/cat'
import { catAgeLabel, catHumanAge } from '@/lib/utils'
import BreedTag from '@/components/BreedTag'
import CatAvatar from '@/components/CatAvatar'

const FEATURE_TABS = ['Feeding', 'Health', 'Litter', 'Meds', 'Notes']

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cat, setCat] = useState<Cat | null>(null)

  useEffect(() => {
    const found = getCatById(id)
    if (!found) { router.replace('/'); return }
    setCat(found)
  }, [id, router])

  if (!cat) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden">

        {/* Photo hero */}
        <div className="h-64 bg-brand-tan/20 flex items-center justify-center overflow-hidden relative">
          {cat.photoUrl ? (
            <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
          ) : (
            <CatAvatar cat={cat} size={210} />
          )}
          <Link
            href="/cats"
            className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-brand-brown text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white transition-colors shadow-soft"
          >
            ← My Cats
          </Link>
        </div>

        <div className="p-7">

          {/* Name + breed + age */}
          <div className="mb-6">
            <h1 className="font-display text-4xl text-brand-brown leading-tight">{cat.name}</h1>
            {cat.breed.length > 0 && (
              <p className="text-brand-tan font-medium mt-1 flex flex-wrap items-center gap-x-1">
                {cat.breed.map((b, i) => (
                  <span key={b} className="flex items-center gap-x-1">
                    {i > 0 && <span>·</span>}
                    <BreedTag name={b} variant="inline" />
                  </span>
                ))}
              </p>
            )}
            {cat.birthday && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
                <span className="text-brand-brown font-medium">{catAgeLabel(cat.birthday)}</span>
                <span className="text-brand-brown/60">~{catHumanAge(cat.birthday)} in cat years</span>
              </div>
            )}
          </div>

          {/* Quick stats */}
          {(cat.weight || cat.chipId || cat.locationCity || cat.locationCountry) && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {cat.weight && (
                <StatCard label="Weight" value={`${cat.weight} ${cat.weightUnit}`} />
              )}
              {cat.chipId && (
                <StatCard label="Microchip ID" value={cat.chipId} mono />
              )}
              {(cat.locationCity || cat.locationRegion || cat.locationCountry) && (
                <StatCard label="Home" value={[cat.locationCity, cat.locationRegion, cat.locationCountry].filter(Boolean).join(', ')} />
              )}
            </div>
          )}

          {/* Vet */}
          {cat.vet && (cat.vet.name || cat.vet.phone || cat.vet.address) && (
            <div className="bg-brand-tan/10 rounded-2xl p-5 mb-6">
              <h2 className="text-xs font-semibold text-brand-brown uppercase tracking-wide mb-3">Vet</h2>
              {cat.vet.name && <p className="font-medium text-brand-charcoal">{cat.vet.name}</p>}
              {cat.vet.phone && (
                <a href={`tel:${cat.vet.phone}`} className="text-sm text-brand-slate hover:underline block mt-0.5">
                  {cat.vet.phone}
                </a>
              )}
              {cat.vet.address && <p className="text-sm text-brand-brown/60 mt-0.5">{cat.vet.address}</p>}
            </div>
          )}

          {/* Personality / notes */}
          {(cat.personality || cat.notes) && (
            <div className="space-y-3 mb-6">
              {cat.personality && (
                <div className="bg-brand-tan/10 rounded-2xl p-5">
                  <h2 className="text-xs font-semibold text-brand-brown uppercase tracking-wide mb-2">Personality</h2>
                  <p className="text-sm text-brand-charcoal/80 whitespace-pre-wrap leading-relaxed">{cat.personality}</p>
                </div>
              )}
              {cat.notes && (
                <div className="bg-brand-tan/10 rounded-2xl p-5">
                  <h2 className="text-xs font-semibold text-brand-brown uppercase tracking-wide mb-2">Notes</h2>
                  <p className="text-sm text-brand-charcoal/80 whitespace-pre-wrap leading-relaxed">{cat.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Feature tabs — placeholders */}
          <div className="border border-brand-tan/30 rounded-2xl overflow-hidden mb-6">
            <div className="flex border-b border-brand-tan/20 overflow-x-auto bg-brand-tan/5">
              {FEATURE_TABS.map(tab => (
                <button
                  key={tab}
                  className="flex-1 min-w-[4rem] py-3 text-xs sm:text-sm font-medium text-brand-brown/40 cursor-default"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-8 text-center text-brand-brown/60 text-sm">
              More features coming soon 🐾
            </div>
          </div>

          <div className="text-center">
            <Link href={`/cats/${cat.id}/edit`} className="text-sm text-brand-slate hover:underline">
              Edit {cat.name}&apos;s profile
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-brand-tan/10 rounded-2xl p-4">
      <p className="text-xs text-brand-brown/60 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-medium text-brand-charcoal ${mono ? 'font-mono text-sm break-all' : ''}`}>{value}</p>
    </div>
  )
}
