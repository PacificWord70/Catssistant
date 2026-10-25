'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import CatssistantLogo from '@/components/CatssistantLogo'

/* Breeds and Guides are deliberately absent: they are reference material rather
   than places you work, so they hang off Resources instead of adding two more
   entries to every screen. */
const MORE_LINKS = [
  { href: '/items',     label: 'My Items' },
  { href: '/resources', label: 'Resources' },
  { href: '/about',     label: 'About' },
]

/* No Home link: the logo beside these already goes there, and the bar is hidden
   on the home page anyway, so it would only ever be a second way to do the same
   thing from somewhere else. */
const PRIMARY_LINKS = [
  { href: '/cats',      label: 'My Cats' },
  { href: '/schedule',  label: 'Schedule' },
  { href: '/health',    label: 'Health' },
  { href: '/shopping',  label: 'Shopping' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const reduceMotion = useReducedMotion()

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

  return (
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
        {/* The logo sits on the orange bar, where its own colours have little
            to push against. A pale apricot chip behind it gives it an edge —
            lighter than the page background, so the logo reads as sitting on
            its own ground rather than on a patch of the page. */}
        <Link
          href="/"
          aria-label="Catssistant home"
          className="hover:opacity-90 transition-opacity rounded-2xl bg-[#FEEBD6] px-3 py-1.5 flex items-center"
        >
          <CatssistantLogo horizontal height={scrolled ? 28 : 34} />
        </Link>
        <div className="flex items-center gap-1">
          {/* Hidden on narrow screens. The full row — logo, four links, Add Cat
              and the menu button — needs about 400px of its own, so on a phone
              it ran past the edge of the viewport and took the whole page into
              a sideways scroll. Below md these links live in the menu instead. */}
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
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col gap-1 items-center justify-center"
              aria-label="More"
              aria-expanded={menuOpen}
              aria-controls="nav-more-menu"
            >
              <span className="block w-4 h-0.5 bg-white rounded" aria-hidden="true" />
              <span className="block w-4 h-0.5 bg-white rounded" aria-hidden="true" />
              <span className="block w-4 h-0.5 bg-white rounded" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div id="nav-more-menu" className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-lg border border-brand-tan/40 py-1 min-w-[140px] z-50">
                {/* Only below md, where the bar itself is not showing these. */}
                <div className="md:hidden">
                  {PRIMARY_LINKS.map(({ href, label }) => (
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
                  <div className="my-1 border-t border-brand-tan/30" />
                </div>
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
  )
}
