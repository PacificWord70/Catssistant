'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import { selectIsExample } from '@/store/selectors'

/**
 * Pages where the banner would be in the way. The home page has its own
 * buttons for the same two choices, and onboarding and Add Cat are where
 * "Add your first cat" leads — offering it again there is a link to here.
 */
function hiddenOn(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/onboarding') || pathname === '/cats/new'
}

/**
 * The label on every page while the example household is showing, so nobody
 * mistakes Biscuit and friends for cats they entered.
 *
 * Deliberately calm: a region, not an alert, and in the card colours rather
 * than a warning colour. Looking around the example is the intended thing to
 * do, not a problem to fix.
 */
export default function ExampleBanner() {
  const pathname = usePathname()
  const isExample = useAppSelector(selectIsExample)

  if (!isExample || hiddenOn(pathname)) return null

  return (
    <section
      aria-label="Example household"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-tan/50 bg-brand-cream px-5 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-brand-brown">
        <span aria-hidden="true">🐾 </span>
        You’re looking at an example household.
      </p>
      <Link
        href="/onboarding"
        className="self-start whitespace-nowrap rounded-2xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-orange/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2 sm:self-auto"
      >
        Add your first cat
      </Link>
    </section>
  )
}
