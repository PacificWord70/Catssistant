import { Cat } from '@/types/cat'
import { safeImageSrc } from '@/lib/safeUrl'

/**
 * The photo to show for a cat, if it has a usable one.
 *
 * A stored photo that fails the allowlist in lib/safeUrl is treated as no
 * photo at all, so the caller falls back to the drawn portrait
 * (components/CatPortrait.tsx) instead of a broken image or a request to
 * somewhere else. Returns undefined rather than a fallback path because the
 * portrait is painted from the cat's details, not fetched from a file.
 */
export function catPictureSrc(cat: Pick<Cat, 'photoUrl'>): string | undefined {
  return safeImageSrc(cat.photoUrl)
}
