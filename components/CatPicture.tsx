import { Cat } from '@/types/cat'
import { catPictureSrc, isDrawnPicture } from '@/lib/catPicture'

interface Props {
  cat: Pick<Cat, 'name' | 'photoUrl' | 'birthday' | 'breed' | 'color' | 'pattern'>
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
 * the tree cat that stands in for one (lib/catPicture.ts).
 *
 * Photos fill the circle. The drawings sit inside it on a cream ground with a
 * little room, because their ears and tails run close to the edge of the file
 * and a tight crop would take them off.
 */
export default function CatPicture({ cat, size, decorative = false, className = '' }: Props) {
  const src = catPictureSrc(cat)
  const drawn = isDrawnPicture(src)
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-brand-cream border border-brand-tan/40 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={decorative ? '' : cat.name}
        aria-hidden={decorative || undefined}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={drawn ? 'w-full h-full object-contain p-[12%]' : 'w-full h-full object-cover'}
      />
    </span>
  )
}
