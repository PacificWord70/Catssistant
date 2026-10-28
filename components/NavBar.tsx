'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import CatssistantLogo from '@/components/CatssistantLogo'
import TintedLogo, { useTintedLogo } from '@/components/TintedLogo'

/* Breeds and Guides are deliberately absent: they are reference material rather
   than places you work, so they hang off Resources instead of adding two more
   entries to every screen. */
const MORE_LINKS = [
  { href: '/items',     label: 'My Items' },
  { href: '/resources', label: 'Resources' },
  { href: '/about',     label: 'About' },
  { href: '/backup',    label: 'Backup' },
]

/* No Home link: the logo beside these already goes there, and the bar is hidden
   on the home page anyway, so it would only ever be a second way to do the same
   thing from somewhere else.

   The icons are only for the phone tab bar, where a label alone at that size
   would be hard to tell apart at a glance. They are decorative there and not
   shown at all on wider screens. */
const PRIMARY_LINKS = [
  { href: '/cats',      label: 'My Cats',  icon: '🐱' },
  { href: '/schedule',  label: 'Schedule', icon: '📅' },
  { href: '/health',    label: 'Health',   icon: '🩺' },
  { href: '/shopping',  label: 'Shopping', icon: '🛒' },
]

/**
 * Whether a tab owns the current page. The tab bar counts a section's inner
 * pages as well — a cat's profile is still "My Cats" — where the desktop
 * links match exactly, because there the sliding indicator is also tracking
 * the pointer and a looser match would read as it sticking.
 */
function inSection(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The phone navigation: the four main sections along the bottom of the
 * screen, where a thumb reaches them and a new owner can see them. Before
 * this they were inside the three-line menu on phones, and nothing on the
 * screen suggested they were there.
 *
 * Fixed rather than sticky so it stays put however long the page is; the
 * layout pads <main> at the bottom so content can scroll out from under it.
 * z-40 keeps it under dialogs, which open at z-50 and need to cover it.
 * Hidden from md up, where the top bar carries the same links.
 *
 * The bottom padding is the phone's own: on a device with a home indicator
 * the safe-area inset pushes the tabs up above it.
 */
function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main sections"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-brand-cream border-t border-brand-tan/40 shadow-[0_-6px_20px_-8px_rgba(43,38,34,0.25)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {PRIMARY_LINKS.map(({ href, label, icon }) => {
          const current = inSection(pathname, href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                  current ? 'text-brand-orange' : 'text-brand-brown/80 hover:text-brand-brown'
                }`}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-[3px] w-10 rounded-b-full bg-brand-orange"
                  />
                )}
                <span aria-hidden="true" className="text-xl leading-none">
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()
  const logo = useTintedLogo()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Escape closes the menu and puts focus back on the button that opened it.
     Without the focus return, a keyboard user who dismissed the menu was left
     on whichever link they had tabbed to — now hidden — and focus fell back
     to the top of the page. Only listening while open keeps it from eating
     Escape anywhere else, such as a modal's own close. */
  useEffect(() => {
    if (!menuOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      menuButtonRef.current?.focus()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (pathname === '/') return null

  const indicatorTarget = hoveredHref ?? pathname

  const logoHeight = scrolled ? 28 : 34

  return (
    <>
    <nav
      className={`sticky top-0 z-50 text-white transition-all duration-200 ${
        scrolled ? 'bg-brand-orange/95 backdrop-blur-md shadow-card' : 'bg-brand-orange shadow-md'
      }`}
    >
      <div
        className={`w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex items-center justify-between transition-all duration-200 ${
          scrolled ? 'h-14' : 'h-16'
        }`}
      >
        {/* The logo's own colours — orange lines, brown wordmark — have
            nothing to push against on the orange bar, so it is shown in a
            single cream made from her file at runtime (see TintedLogo). Only
            if that cannot be made does the original go back on a pale chip,
            which is the one way the untouched colours get an edge here. */}
        <Link
          href="/"
          aria-label="Catssistant home"
          className={`hover:opacity-90 transition-opacity flex items-center ${
            logo.status === 'failed' ? 'rounded-2xl bg-[#FEEBD6] px-3 py-1.5' : 'py-1.5'
          }`}
        >
          <TintedLogo
            height={logoHeight}
            fallback={<CatssistantLogo horizontal height={logoHeight} />}
          />
        </Link>
        <div className="flex items-center gap-1">
          {/* Hidden on narrow screens. The full row — logo, four links, Add Cat
              and the menu button — needs about 400px of its own, so on a phone
              it ran past the edge of the viewport and took the whole page into
              a sideways scroll. Below md these links are the tab bar along the
              bottom of the screen instead. */}
          <div className="hidden md:flex items-center gap-1">
            {PRIMARY_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? 'page' : undefined}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
                className="relative px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {indicatorTarget === href && (
                  <motion.span
                    layoutId={reduceMotion ? undefined : 'navIndicator'}
                    className="absolute inset-0 rounded-lg bg-white/15"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 380, damping: 30 }
                    }
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            ))}
          </div>
          <Link href="/cats/new" className="px-3 py-2 rounded-lg text-sm font-medium bg-brand-slate hover:bg-brand-slate/90 transition-colors">
            + Add Cat
          </Link>

          {/* More menu */}
          <div ref={menuRef} className="relative ml-1">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-controls="nav-more-menu"
            >
              <span className="flex flex-col gap-1" aria-hidden="true">
                <span className="block w-4 h-0.5 bg-white rounded" />
                <span className="block w-4 h-0.5 bg-white rounded" />
                <span className="block w-4 h-0.5 bg-white rounded" />
              </span>
              {/* On a phone the icon is the only sign the rest of the site
                  exists, so it gets its word. On wider screens the four links
                  beside it already say what kind of thing this is. */}
              <span className="text-sm font-medium md:hidden" aria-hidden="true">
                Menu
              </span>
            </button>
            {menuOpen && (
              <div id="nav-more-menu" className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-lg border border-brand-tan/40 py-1 min-w-[140px] z-50">
                {MORE_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={pathname === href ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-2.5 text-sm transition-colors hover:bg-brand-tan/10 ${
                      pathname === href ? 'text-brand-orange font-medium' : 'text-brand-charcoal'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    <MobileTabBar pathname={pathname} />
    </>
  )
}
