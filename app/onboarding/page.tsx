'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import { selectCatsLoaded, selectIsFirstVisitExample } from '@/store/selectors'
import CatPortrait from '@/components/CatPortrait'

export default function OnboardingPage() {
  const router = useRouter()
  const loaded = useAppSelector(selectCatsLoaded)
  const isExample = useAppSelector(selectIsFirstVisitExample)

  // Only real cats count. The example household always has cats in the store,
  // and this page is where "Add your first cat" leads from it. A preview of
  // the example does not count either: that owner has cats.
  useEffect(() => {
    if (loaded && !isExample) router.replace('/')
  }, [loaded, isExample, router])

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* One of Heidi's drawn cats rather than the system emoji, so the first
          thing a new owner sees is the kind of portrait their own cat will get
          until it has a photo: a cream, solid, middling-energy adult, which is
          what a cat nothing describes looks like. */}
      <div className="mb-6 select-none" aria-hidden="true">
        <CatPortrait
          cat={{ name: '', breed: [], color: 'Cream', pattern: 'Solid', energyLevel: 'Medium' }}
          size={140}
          decorative
        />
      </div>
      <h1 className="font-display text-4xl text-brand-brown mb-3">Welcome to Catssistant!</h1>
      <p className="text-brand-brown/60 mb-12 max-w-md text-lg leading-relaxed">
        The best assistant for cat owners — helping your baby be as healthy, happy, and cute as is humanly possible.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/cats/new"
          className="flex-1 px-8 py-5 bg-brand-orange text-white rounded-2xl font-semibold text-lg hover:bg-brand-orange/90 transition-colors shadow-soft"
        >
          I have a cat! <span aria-hidden="true">🐾</span>
        </Link>
        <Link
          href="/onboarding/getting-a-cat"
          className="flex-1 px-8 py-5 bg-white text-brand-brown border-2 border-brand-tan rounded-2xl font-semibold text-lg hover:bg-brand-tan/10 transition-colors shadow-soft"
        >
          I&apos;m getting a cat <span aria-hidden="true">🔍</span>
        </Link>
      </div>
    </div>
  )
}
