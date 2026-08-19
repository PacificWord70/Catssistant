'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'
import { selectCatById, selectCatsLoaded } from '@/store/selectors'
import CatForm from '@/components/CatForm'

export default function EditCatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const loaded = useAppSelector(selectCatsLoaded)
  // selectCatById is a factory — it builds a selector for this specific id, so it
  // has to be memoised. Calling it inline would create a new selector every
  // render and throw away the memoisation it exists to provide.
  const selectCat = useMemo(() => selectCatById(id), [id])
  const cat = useAppSelector(selectCat)

  useEffect(() => {
    if (loaded && !cat) router.replace('/cats')
  }, [loaded, cat, router])

  if (!cat) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-7 shadow-soft">
        <Link href={`/cats/${id}`} className="text-brand-slate text-sm hover:underline mb-5 inline-block">
          ← Back to profile
        </Link>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 select-none">✏️</div>
          <h1 className="font-display text-3xl text-brand-brown">Edit {cat.name}</h1>
        </div>
        <CatForm existing={cat} />
      </div>
    </div>
  )
}
