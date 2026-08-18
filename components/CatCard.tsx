'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Cat } from '@/types/cat'
import { catAgeShort } from '@/lib/utils'
import BreedTag from '@/components/BreedTag'

interface Props {
  cat: Cat
}

export default function CatCard({ cat }: Props) {
  const reduceMotion = useReducedMotion()

  return (
    <Link href={`/cats/${cat.id}`} className="block h-full">
      <motion.div
        className="h-full bg-brand-cream rounded-3xl shadow-soft border border-brand-tan/30 overflow-hidden flex flex-col"
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02, boxShadow: '0 6px 24px -6px rgba(43, 38, 34, 0.12)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="h-44 bg-brand-tan/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {cat.photoUrl ? (
            <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl select-none">🐱</span>
          )}
        </div>
        <div className="p-4 flex flex-col justify-between flex-1 min-h-[5.5rem]">
          <div>
            <h3 className="font-semibold text-lg text-brand-charcoal leading-tight">{cat.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1 min-h-[1.5rem]">
              {cat.breed.slice(0, 2).map(b => (
                <BreedTag key={b} name={b} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            {cat.color && (
              <span className="text-xs text-brand-brown/60 truncate">{cat.color}</span>
            )}
            {cat.birthday && (
              <span className="text-xs text-brand-brown/60 ml-auto">{catAgeShort(cat.birthday)}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
