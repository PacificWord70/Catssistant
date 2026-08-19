'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import { selectAllCats, selectCatsLoaded } from '@/store/selectors'

export default function OnboardingPage() {
  const router = useRouter()
  const loaded = useAppSelector(selectCatsLoaded)
  const cats = useAppSelector(selectAllCats)

  useEffect(() => {
    if (loaded && cats.length > 0) router.replace('/')
  }, [loaded, cats.length, router])

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-8xl mb-6 select-none">🐱</div>
      <h1 className="font-display text-4xl text-brand-brown mb-3">Welcome to Catssistant!</h1>
      <p className="text-brand-brown/60 mb-12 max-w-md text-lg leading-relaxed">
        The best assistant for cat owners — helping your baby be as healthy, happy, and cute as is humanly possible.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/cats/new"
          className="flex-1 px-8 py-5 bg-brand-orange text-white rounded-2xl font-semibold text-lg hover:bg-brand-orange/90 transition-colors shadow-soft"
        >
          I have a cat! 🐾
        </Link>
        <Link
          href="/onboarding/getting-a-cat"
          className="flex-1 px-8 py-5 bg-white text-brand-brown border-2 border-brand-tan rounded-2xl font-semibold text-lg hover:bg-brand-tan/10 transition-colors shadow-soft"
        >
          I&apos;m getting a cat 🔍
        </Link>
      </div>
    </div>
  )
}
