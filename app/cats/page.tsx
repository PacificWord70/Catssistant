'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import { selectCatsByNewest, selectCatsLoaded } from '@/store/selectors'
import CatCard from '@/components/CatCard'
import Reveal from '@/components/motion/Reveal'

export default function CatsPage() {
  const router = useRouter()
  // Read straight from the store. No local copy, no reading storage here — the
  // provider loaded it once at startup, and this stays current if a cat changes
  // anywhere else in the app.
  const cats = useAppSelector(selectCatsByNewest)
  const loaded = useAppSelector(selectCatsLoaded)

  // Redirecting is a side effect, so it belongs in an effect rather than in the
  // render path. Waiting for `loaded` avoids bouncing to onboarding during the
  // moment before storage has been read.
  useEffect(() => {
    if (loaded && cats.length === 0) router.replace('/onboarding')
  }, [loaded, cats.length, router])

  if (!loaded || cats.length === 0) return null

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {cats.map((cat, i) => (
          <Reveal key={cat.id} delay={i * 0.05}>
            <CatCard cat={cat} />
          </Reveal>
        ))}
      </div>
    </div>
  )
}
