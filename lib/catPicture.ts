import { Cat } from '@/types/cat'
import { effectiveColor, effectivePattern } from '@/lib/breedDefaults'
import { safeImageSrc } from '@/lib/safeUrl'
import { catLifeStage } from '@/lib/utils'

/**
 * Which picture stands in for a cat that has no photo.
 *
 * The six cats Heidi drew for the home page tree are the only cat pictures in
 * the app, so a cat without a photo borrows the one that is closest in colour.
 * It is a stand-in, not a likeness: a grey tabby gets Pepper's drawing because
 * Pepper is grey, not because Pepper looks like that cat. Nothing here is
 * drawn or tinted in code; the files are hers, used as exported.
 *
 * Only the fields the drawings can actually tell apart are consulted. Breed,
 * coat length and energy all vanish at the size these pictures are shown, so
 * they are ignored rather than pretending to a precision the six files do not
 * have.
 */

/** Where the tree cats live. Also what `isDrawnPicture` keys on. */
export const DRAWN_CAT_DIR = '/images/cats/'

export type TreeCat = 'biscuit' | 'noodle' | 'miso' | 'pepper' | 'mochi' | 'pickle'

export function treeCatPath(name: TreeCat): string {
  return `${DRAWN_CAT_DIR}cat-${name}.png`
}

/**
 * Picks the tree cat for a cat without a photo.
 *
 * The order matters. A kitten is Pickle whatever its colour, because being
 * small is the first thing anyone notices. A tuxedo is Miso whatever its base
 * colour, because the white front is what reads before the black. After that
 * it is the base colour alone:
 *
 * - Orange, Brown → Biscuit (orange tabby)
 * - Black, Chocolate → Noodle (black)
 * - Gray, Silver, Lilac → Pepper (grey)
 * - White, Cream, and anything unknown → Mochi (cream)
 *
 * Calico, tortoiseshell and colorpoint cats land on Mochi too: all three are
 * mostly pale with darker patches, and none of the six drawings has patches
 * except Pickle, who is spoken for by the kittens.
 *
 * Colour and pattern go through the breed fallbacks, so a Russian Blue with
 * nothing filled in still gets Pepper rather than the unknown default.
 */
export function standInPictureFor(
  cat: Pick<Cat, 'birthday' | 'breed' | 'color' | 'pattern'>,
): string {
  return treeCatPath(standInTreeCat(cat))
}

export function standInTreeCat(
  cat: Pick<Cat, 'birthday' | 'breed' | 'color' | 'pattern'>,
): TreeCat {
  if (catLifeStage(cat.birthday) === 'Kitten') return 'pickle'
  if (effectivePattern(cat) === 'Tuxedo') return 'miso'
  switch (effectiveColor(cat)) {
    case 'Orange':
    case 'Brown':
      return 'biscuit'
    case 'Black':
    case 'Chocolate':
      return 'noodle'
    case 'Gray':
    case 'Silver':
    case 'Lilac':
      return 'pepper'
    default:
      return 'mochi'
  }
}

/**
 * The picture to show for a cat: its photo if it has a usable one, otherwise
 * the stand-in. A stored photo that fails the allowlist in lib/safeUrl is
 * treated as no photo at all, so the stand-in shows instead of a broken image
 * or a request to somewhere else.
 */
export function catPictureSrc(
  cat: Pick<Cat, 'photoUrl' | 'birthday' | 'breed' | 'color' | 'pattern'>,
): string {
  return safeImageSrc(cat.photoUrl) ?? standInPictureFor(cat)
}

/**
 * Whether a picture is one of the line drawings rather than a photo.
 *
 * The drawings sit on a transparent ground with ears and tails near the edge;
 * cropping them to fill a frame like a photo would lop those off, so callers
 * switch to `object-contain` with some padding for these.
 */
export function isDrawnPicture(src: string | undefined): boolean {
  return src?.startsWith(DRAWN_CAT_DIR) ?? false
}
