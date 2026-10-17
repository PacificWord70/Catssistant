'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Cat } from '@/types/cat'
import { catAgeShort, coatLabel } from '@/lib/utils'
import BreedTag from '@/components/BreedTag'
import CatAvatar from '@/components/CatAvatar'
import { effectiveColor, effectivePattern } from '@/lib/breedDefaults'
import { safeImageSrc } from '@/lib/safeUrl'

interface Props {
  cat: Cat
}

export default function CatCard({ cat }: Props) {
  // Colour and markings the card should name, breed fallbacks included. Both
  // stay undefined where nothing settles them, so the caption can say nothing
  // rather than guess.
  const effective = { color: effectiveColor(cat), pattern: effectivePattern(cat) }

  const reduceMotion = useReducedMotion()
  // A stored photo that fails the allowlist is treated as no photo at all, so
  // the avatar shows instead of a broken image or a request to somewhere else.
  const photoSrc = safeImageSrc(cat.photoUrl)

  return (
    <Link href={`/cats/${cat.id}`} className="block h-full">
      <motion.div
        className="h-full bg-brand-cream rounded-3xl shadow-soft border border-brand-tan/30 overflow-hidden flex flex-col"
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02, boxShadow: '0 6px 24px -6px rgba(43, 38, 34, 0.12)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="h-44 bg-brand-tan/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {photoSrc ? (
            <img src={photoSrc} alt={cat.name} className="w-full h-full object-cover" />
          ) : (
            // No photo, so fall back to the drawn avatar rather than a generic
            // emoji — it at least reflects this cat's colour and markings.
            <CatAvatar cat={cat} size={128} />
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
            {/* Falls back to the breed's own colour and markings, matching the
                avatar above rather than leaving the caption blank beside a
                clearly grey cat. Where the breed settles nothing — a Persian can
                be any colour — both stay quiet instead of inventing one. */}
            {coatLabel(effective) && (
              <span className="text-xs text-brand-brown/60 truncate">{coatLabel(effective)}</span>
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
