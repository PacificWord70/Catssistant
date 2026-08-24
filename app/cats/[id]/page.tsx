'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { catSelected } from '@/store/catsSlice'
import { selectCatById, selectCatsLoaded } from '@/store/selectors'
import { catAgeLabel, catHumanAge, coatLabel } from '@/lib/utils'
import { effectiveCoatLength, effectiveColor, effectiveEnergy, effectivePattern } from '@/lib/breedDefaults'
import BreedTag from '@/components/BreedTag'
import CatAvatar from '@/components/CatAvatar'

const FEATURE_TABS = ['Feeding', 'Health', 'Litter', 'Meds', 'Notes']

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const loaded = useAppSelector(selectCatsLoaded)
  // Looked up from the URL id, not from selectedCatId in the store.
  //
  // Reading it from the store was a bug: this page is what *sets* selectedCatId,
  // and it does so in an effect. On the first render the selection is still null,
  // so the cat came back undefined while `loaded` was already true — and the
  // redirect below fired before the re-render carrying the selection could land.
  // Every visit to a profile bounced to the home page.
  //
  // The URL is the real source of truth for which cat this page shows, so
  // deriving from it removes the race rather than papering over it.
  const selectCat = useMemo(() => selectCatById(id), [id])
  const cat = useAppSelector(selectCat)

  // Still published to the store, for components elsewhere that want to know
  // which cat is in view without having it threaded down as a prop. Nothing on
  // this page reads it back.
  useEffect(() => {
    dispatch(catSelected(id))
    return () => { dispatch(catSelected(null)) }
  }, [id, dispatch])

  useEffect(() => {
    // Only a genuine miss should redirect — before storage is read, every id
    // looks missing.
    if (loaded && !cat) router.replace('/cats')
  }, [loaded, cat, router])

  if (!cat) return null

  // Everything known about how this cat looks and behaves, breed fallbacks
  // included. A row only appears when there is something to say — a blank means
  // neither the owner nor the breed settled it, and inventing a value would make
  // a guess indistinguishable from an answer.
  const coat = coatLabel({ color: effectiveColor(cat), pattern: effectivePattern(cat) })
  const energy = effectiveEnergy(cat)
  const list = (values?: string[]) => (values?.length ? values.join(', ') : undefined)

  const aboutRows = [
    { label: 'Coat', value: coat || undefined },
    { label: 'Coat length', value: effectiveCoatLength(cat) },
    { label: 'Energy', value: energy === 'Unknown' ? undefined : energy },
    { label: 'Hunts', value: list(cat.huntingPreyDrive?.filter(d => d !== 'Unknown')) },
    { label: 'Roams', value: list(cat.huntingLocation) },
    {
      label: 'Electronic toys',
      value: cat.likesElectronicToys && cat.likesElectronicToys !== 'Unknown'
        ? cat.likesElectronicToys
        : undefined,
    },
    { label: 'Known illnesses', value: list(cat.knownIllnesses) },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value))

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
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
              {cat.birthday ? (
                <>
                  <span className="text-brand-brown font-medium">{catAgeLabel(cat.birthday)}</span>
                  <span className="text-brand-brown/60">~{catHumanAge(cat.birthday)} in cat years</span>
                </>
              ) : (
                // Said plainly rather than left blank. A missing line reads as an
                // oversight; "Age unknown" reads as a fact, which for a rescue or
                // a stray it often is — so it sits alongside a way to fill it in
                // rather than nagging as though it were a mistake.
                <>
                  <span className="text-brand-brown/60">Age unknown</span>
                  <Link
                    href={`/cats/${cat.id}/edit`}
                    className="text-brand-slate hover:underline"
                  >
                    Add birthday
                  </Link>
                </>
              )}
            </div>
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

          {/* About — appearance and traits.

              Values fall back to the breed where the owner left a field blank,
              matching the avatar above rather than showing a portrait of a grey
              cat beside a page that never mentions grey. Anything the breed does
              not settle stays hidden instead of being guessed at, so an empty row
              here means genuinely unknown. */}
          {aboutRows.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-brand-brown uppercase tracking-wide mb-3">About</h2>
              <div className="grid grid-cols-2 gap-3">
                {aboutRows.map(({ label, value }) => (
                  <StatCard key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          )}

          {/* Vet — or a nudge to add one.

              Worth prompting for rather than hiding: a vet's number is the thing
              an owner needs at the worst possible moment, and it is no use only
              being in a phone that is upstairs. */}
          {!(cat.vet && (cat.vet.name || cat.vet.phone || cat.vet.address)) && (
            <div className="border border-dashed border-brand-tan rounded-2xl p-5 mb-6">
              <h2 className="text-xs font-semibold text-brand-brown uppercase tracking-wide mb-2">Vet</h2>
              <p className="text-sm text-brand-charcoal/70">
                No vet added yet. Worth having their number here for emergencies.
              </p>
              <Link
                href={`/cats/${cat.id}/edit`}
                className="text-sm text-brand-slate hover:underline mt-2 inline-block"
              >
                Add vet details
              </Link>
            </div>
          )}

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
