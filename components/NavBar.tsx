'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import CatssistantLogo from '@/components/CatssistantLogo'

const MORE_LINKS = [
  { href: '/items',     label: 'My Items' },
  { href: '/breeds',    label: 'Breeds' },
  { href: '/guides',    label: 'Guides' },
  { href: '/resources', label: 'Resources' },
  { href: '/about',     label: 'About' },
]

const PRIMARY_LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/cats',      label: 'My Cats' },
  { href: '/schedule',  label: 'Schedule' },
  { href: '/shopping',  label: 'Shopping' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
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
        className={`max-w-5xl mx-auto px-4 flex items-center justify-between transition-all duration-200 ${
          scrolled ? 'h-14' : 'h-16'
        }`}
      >
        <Link href="/" className="hover:opacity-90 transition-opacity">
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
              onClick={() => setMenuOpen(o => !o)}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex flex-col gap-1 items-center justify-center"
              aria-label="More"
            >
              <span className="block w-4 h-0.5 bg-white rounded" />
              <span className="block w-4 h-0.5 bg-white rounded" />
              <span className="block w-4 h-0.5 bg-white rounded" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-lg border border-brand-tan/40 py-1 min-w-[140px] z-50">
                {/* Only below md, where the bar itself is not showing these. */}
                <div className="md:hidden">
                  {PRIMARY_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
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
