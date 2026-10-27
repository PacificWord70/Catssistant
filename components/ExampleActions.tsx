'use client'

import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import { selectIsExample } from '@/store/selectors'

/**
 * The home page's two ways in for someone with no cats yet: start their own
 * household, or look around the example first. Its own client component so
 * the home page can stay a server component.
 *
 * Renders nothing until the store has loaded, and nothing once real cats
 * exist — an owner coming home to their own household needs neither.
 */
export default function ExampleActions() {
  const isExample = useAppSelector(selectIsExample)
  if (!isExample) return null

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
      <Link
        href="/onboarding"
        className="hover-lift px-6 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2"
      >
        Add your first cat
      </Link>
      <Link
        href="/cats"
        className="hover-lift px-6 py-3 bg-white text-brand-brown border-2 border-brand-tan rounded-2xl font-semibold hover:bg-brand-tan/10 transition-colors shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
      >
        Look around the example
      </Link>
    </div>
  )
}
