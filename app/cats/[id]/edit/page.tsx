'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCatById } from '@/lib/storage'
import { Cat } from '@/types/cat'
import CatForm from '@/components/CatForm'

export default function EditCatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [cat, setCat] = useState<Cat | null>(null)

  useEffect(() => {
    const found = getCatById(id)
    if (!found) { router.replace('/cats'); return }
    setCat(found)
  }, [id, router])

  if (!cat) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-7 shadow-sm">
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
