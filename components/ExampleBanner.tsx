'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpDialog } from '@/components/HelpButton'
import { helpPageForPath } from '@/lib/pageHelp'
import { endExamplePreview } from '@/store/catsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectIsExample, selectIsExamplePreview } from '@/store/selectors'

/**
 * Pages where the first-visit banner would be in the way. The home page has
 * its own buttons for the same two choices, and onboarding and Add Cat are
 * where "Add your first cat" leads — offering it again there is a link to
 * here. A preview is different: it shows everywhere, home included, because
 * the owner's own cats are out of sight until they exit, and the way out
 * has to be wherever they are.
 */
function hiddenOn(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/onboarding') || pathname === '/cats/new'
}

const BUTTON =
  'self-start whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold shadow-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream sm:self-auto'
const PRIMARY = `${BUTTON} bg-brand-orange text-white hover:bg-brand-orange/90`
const SECONDARY = `${BUTTON} border border-brand-tan bg-white text-brand-brown hover:bg-brand-tan/15`

/**
 * The label on every page while the example household is showing, so nobody
 * mistakes Biscuit and friends for cats they entered.
 *
 * It sticks to the top of the viewport, under the nav bar where there is one,
 * because the pages it labels are long — a month of events, two years of
 * weights — and the reminder is for the person halfway down them. Sticky
 * rather than fixed so it still takes its place in the flow and never covers
 * a heading. z-40 keeps it under the nav (z-50) and under dialogs, which are
 * portalled after it at z-50. The nav is 56px tall once the page has
 * scrolled, which is the only time stickiness matters, so `top-14` meets it
 * with no gap; on the home page there is no nav and it sits at the top.
 *
 * A region, not an alert, and in the card colours with an orange rim rather
 * than a warning colour. Looking around the example is the intended thing to
 * do, not a problem to fix — but it should not be forgettable either, which
 * is why it is not dismissable: it goes when the example does.
 */
export default function ExampleBanner() {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const isExample = useAppSelector(selectIsExample)
  const isPreview = useAppSelector(selectIsExamplePreview)
  const [notesOpen, setNotesOpen] = useState(false)
  const helpPage = helpPageForPath(pathname)

  if (!isExample) return null
  if (!isPreview && hiddenOn(pathname)) return null

  const atTop = pathname === '/'

  return (
    <section
      aria-label={isPreview ? 'Example household preview' : 'Example household'}
      className={`sticky z-40 mb-6 flex flex-col gap-2 rounded-2xl border-2 border-brand-orange/70 bg-brand-cream px-4 py-2.5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
        atTop ? 'top-2' : 'top-14'
      }`}
    >
      <p className="text-sm font-medium text-brand-charcoal">
        <span aria-hidden="true">🐾 </span>
        {isPreview
          ? 'You’re previewing the example household. Your own cats come back when you exit.'
          : 'You’re looking at an example household.'}
      </p>
      {isPreview ? (
        <div className="flex flex-wrap gap-2">
          {helpPage && (
            <button type="button" onClick={() => setNotesOpen(true)} className={SECONDARY}>
              Show notes
            </button>
          )}
          <button type="button" onClick={() => dispatch(endExamplePreview())} className={PRIMARY}>
            Exit preview
          </button>
        </div>
      ) : (
        <Link href="/onboarding" className={PRIMARY}>
          Add your first cat
        </Link>
      )}
      {notesOpen && helpPage && <HelpDialog page={helpPage} onClose={() => setNotesOpen(false)} />}
    </section>
  )
}
