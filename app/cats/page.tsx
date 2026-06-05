'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCats } from '@/lib/storage'
import { Cat } from '@/types/cat'
import CatCard from '@/components/CatCard'
import EmptyState from '@/components/EmptyState'

export default function CatsPage() {
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

  if (cats.length === 0) return <EmptyState />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-brand-brown">My Cats</h1>
        <Link
          href="/cats/new"
          className="px-4 py-2 bg-brand-slate text-white rounded-lg text-sm font-medium
                     hover:bg-brand-slate/90 transition-colors"
        >
          + Add Cat
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {cats.map(cat => <CatCard key={cat.id} cat={cat} />)}
      </div>
    </div>
  )
}
