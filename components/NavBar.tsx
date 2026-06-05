'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()

  // Home page has no navbar — the cat tree IS the navigation
  if (pathname === '/') return null

  return (
    <nav className="bg-brand-orange text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl text-white hover:opacity-90 transition-opacity">
          🐱 Catssistant
        </Link>
        <div className="flex gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Home
          </Link>
          <Link
            href="/cats/new"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-slate hover:bg-brand-slate/90 transition-colors"
          >
            + Add Cat
          </Link>
        </div>
      </div>
    </nav>
  )
}
