'use client'

import { Cat } from '@/types/cat'
import { catPictureSrc } from '@/lib/catPicture'
import CatPortrait from '@/components/CatPortrait'

interface Props {
  cat: Pick<Cat, 'name' | 'photoUrl' | 'birthday' | 'breed' | 'energyLevel' | 'color' | 'pattern'>
  /** Rendered width and height in CSS pixels. */
  size: number
  /**
   * The name is usually printed right beside the chip, in which case reading
   * it twice helps nobody; pass `true` to hide the picture from screen readers.
   */
  decorative?: boolean
  className?: string
}

/**
 * A small round picture of a cat for chips and headings: the cat's photo, or
 * a portrait painted from its details when it has none.
 *
 * Photos fill the circle. The portrait sits inside it on a cream ground with
 * a little room, because ears and tails run close to the edge of the drawing
 * and a tight crop would take them off.
 */
export default function CatPicture({ cat, size, decorative = false, className = '' }: Props) {
  const src = catPictureSrc(cat)
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-brand-cream border border-brand-tan/40 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={decorative ? '' : cat.name}
          aria-hidden={decorative || undefined}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        /* Enough inset that the whole square drawing sits inside the circle:
           the round clip must never take a corner off a pose. */
        <CatPortrait cat={cat} size={size} decorative={decorative} className="p-[10%]" />
      )}
    </span>
  )
}
