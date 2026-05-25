'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCats } from '@/lib/storage'
import { Cat } from '@/types/cat'
import CatCard from '@/components/CatCard'

export default function Home() {
  const [cats, setCats] = useState<Cat[]>([])
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = getCats()
    if (stored.length === 0) {
      router.replace('/onboarding')
    } else {
      setCats(stored)
      setLoaded(true)
    }
  }, [router])

  if (!loaded) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-brand-brown">My Cats</h1>
        <Link
          href="/cats/new"
          className="px-4 py-2 bg-brand-slate text-white rounded-lg text-sm font-medium hover:bg-brand-slate/90 transition-colors"
        >
          + Add Cat
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {cats.map(cat => (
          <CatCard key={cat.id} cat={cat} />
        ))}
      </div>
    </div>
  )
}
