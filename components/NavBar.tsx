'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import CatssistantLogo from '@/components/CatssistantLogo'

const MORE_LINKS = [
  { href: '/breeds',    label: 'Breeds' },
  { href: '/resources', label: 'Resources' },
  { href: '/about',     label: 'About' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (pathname === '/') return null

  return (
    <nav className="bg-brand-orange text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <CatssistantLogo horizontal height={34} />
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Home
          </Link>
          <Link href="/cats" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            My Cats
          </Link>
          <Link href="/schedule" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Schedule
          </Link>
          <Link href="/shopping" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Shopping
          </Link>
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
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px] z-50">
                {MORE_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-brand-charcoal hover:bg-brand-tan/10 transition-colors"
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
