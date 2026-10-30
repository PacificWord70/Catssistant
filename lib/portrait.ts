import { Cat, CoatColor, CoatPattern, EnergyLevel } from '@/types/cat'
import { effectiveColor, effectiveEnergy, effectivePattern } from '@/lib/breedDefaults'
import { catLifeStage } from '@/lib/utils'
import type { Part } from '@/lib/portraitRegions'

/**
 * What a cat without a photo looks like, worked out from its own details.
 *
 * Heidi drew six poses. Each ships as three layers in public/images/portraits/
 * (her outline, the thin inner lines that divide the cat into parts, and a map
 * numbering the enclosed regions), and lib/portraitRegions.ts says which
 * number is which part. Nothing here draws a cat: this file only decides which
 * pose to show and what colour each part gets. The geometry stays hers.
 *
 * The result is a stand-in by colour, not a likeness. A tabby gets paler
 * underparts and darker tips because that is what reads as "tabby" at card
 * size, not because any real tabby is coloured by region. Where the owner has
 * entered nothing and the breed settles nothing, the cat is cream and solid,
 * which is the quietest guess.
 */

export type Pose =
  'sit-tail-out' | 'sit-tail-curl' | 'stretch-up' | 'lying' | 'stretch-curl' | 'kitten'

export const POSES: Pose[] = [
  'sit-tail-out',
  'sit-tail-curl',
  'stretch-up',
  'lying',
  'stretch-curl',
  'kitten',
]

/**
 * Which adult pose each energy level gets. Kept as a table so that swapping a
 * pose is a one-line edit: 'stretch-up' is the spare at the moment, held back
 * rather than forced onto a level it does not suit. 'Unknown' gets the curled
 * tail, a resting pose that commits to nothing.
 */
export const POSE_BY_ENERGY: Record<EnergyLevel, Pose> = {
  Low: 'lying',
  Medium: 'sit-tail-out',
  High: 'stretch-curl',
  Unknown: 'sit-tail-curl',
}

/**
 * The pose for a cat. Being a kitten comes first, whatever its energy, because
 * being small is the first thing anyone notices. Energy goes through the breed
 * fallback, so a Bengal with nothing filled in still stretches.
 */
export function poseFor(cat: Pick<Cat, 'birthday' | 'breed' | 'energyLevel'>): Pose {
  if (catLifeStage(cat.birthday) === 'Kitten') return 'kitten'
  return POSE_BY_ENERGY[effectiveEnergy(cat)]
}

export interface CoatTones {
  /** The body colour. */
  base: string
  /** Darker: tips of ears and tail, the points on a colorpoint. */
  shade: string
  /** Paler: bib, belly and paws on a tabby, the body of a colorpoint. */
  light: string
}

/** `hex` mixed toward black (`amount` < 0) or white (`amount` > 0) by that fraction. */
function mix(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const channel = (c: number) => {
    const target = amount < 0 ? 0 : 255
    const v = Math.round(c + (target - c) * Math.abs(amount))
    return v.toString(16).padStart(2, '0')
  }
  return `#${channel((n >> 16) & 255)}${channel((n >> 8) & 255)}${channel(n & 255)}`
}

/** A base colour with its shade (25% darker) and light (35% lighter) worked out from it. */
function tones(base: string): CoatTones {
  return { base, shade: mix(base, -0.25), light: mix(base, 0.35) }
}

/**
 * Three tones per coat colour. The bases are the plain colours an owner would
 * name — black is black, orange is orange — rather than tuned to the page,
 * because Heidi asked for basic colours and a "warm near-black" reads as a
 * dark brown cat. Shade and light are derived from the base by a fixed
 * amount so every colour's markings sit at the same contrast.
 */
export const COAT_TONES: Record<CoatColor, CoatTones> = {
  // Softened off true black: pure black flattened to a silhouette on the
  // cards and hid the inner lines. Still darker than cocoa, so lines go black.
  Black: tones('#3a3330'),
  White: tones('#ffffff'),
  Gray: tones('#9a9a9a'),
  Orange: tones('#f28c28'),
  Brown: tones('#8b5a2b'),
  Cream: tones('#f5e6c8'),
  Silver: tones('#c8c8c8'),
  Chocolate: tones('#5c3a21'),
  Lilac: tones('#c4b2c8'),
}

/** The white of a tuxedo front and a calico ground. Matches White's base. */
const WHITE = COAT_TONES.White.base

export const DEFAULT_COLOR: CoatColor = 'Cream'
export const DEFAULT_PATTERN: CoatPattern = 'Solid'

export const PARTS: Part[] = [
  'head',
  'body',
  'leg',
  'haunch',
  'bib',
  'belly',
  'paw',
  'tail',
  'tailTip',
  'earTipLeft',
  'earTipRight',
  'earInner',
]

export interface PortraitPlan {
  pose: Pose
  /**
   * Whether to draw the inner part-dividing lines. A solid cat is one colour
   * all over, so the lines would only cut it up for no reason; they are drawn
   * once there are colour changes for them to edge.
   */
  showInner: boolean
  colours: Record<Part, string>
  /**
   * The colour her lines are drawn in. Cocoa, like the home tree, unless the
   * coat is darker than cocoa — a black cat with a lighter outline looks as
   * if its edges were worn off — in which case the lines go black too.
   */
  line: string
}

export const LINE_COCOA = '#4a3527'
export const LINE_BLACK = '#0f0d0c'

/** Perceived lightness 0..255 of a hex colour. */
function lightness(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
}

/** Lines darker than the coat, always: cocoa, or black on a dark coat. */
export function lineColourFor(colours: Record<Part, string>): string {
  const darkest = Math.min(...PARTS.map(p => lightness(colours[p])))
  return darkest < lightness(LINE_COCOA) + 12 ? LINE_BLACK : LINE_COCOA
}

/**
 * Colour per part for a coat colour and pattern. The patterns are rules of
 * thumb for what reads at a glance:
 *
 * - Solid: one colour, no inner lines.
 * - Tabby: pale bib, belly and paws; darker ear and tail tips.
 * - Tuxedo: white bib, belly and paws over the coat colour.
 * - Colorpoint: the pale tone all over, with the coat's shade on the ears,
 *   legs, paws and tail tip. A white colorpoint still gets beige points via
 *   White's shade, which is what keeps it from being a plain white cat.
 * - Calico: fixed white, orange and black whatever the coat colour says, since
 *   calico is those three colours by definition. Orange on the left ear,
 *   haunch and tail tip; black on the right ear and tail.
 * - Tortoiseshell: the coat colour (usually black) with orange on the left
 *   ear, tail tip, belly and haunch.
 */
export function portraitColours(color: CoatColor, pattern: CoatPattern): Record<Part, string> {
  const tones = COAT_TONES[color]
  const all = (c: string) => Object.fromEntries(PARTS.map(p => [p, c])) as Record<Part, string>
  const orange = COAT_TONES.Orange.base
  const black = COAT_TONES.Black.base

  /* One layout for every two-tone coat, as Heidi asked: the second colour
     goes on the ears, bib, belly (the high-energy pose has one), paws and tail
     tip, and the base colour everywhere else. Only the two colours differ. */
  const twoTone = (base: string, accent: string): Record<Part, string> => ({
    ...all(base),
    earTipLeft: accent,
    earTipRight: accent,
    earInner: accent,
    bib: accent,
    belly: accent,
    paw: accent,
    tailTip: accent,
  })

  let colours: Record<Part, string>
  switch (pattern) {
    case 'Tabby':
      colours = twoTone(tones.base, tones.light)
      break
    case 'Tuxedo':
      colours = twoTone(tones.base, WHITE)
      break
    case 'Colorpoint':
      // The inverse of the layout: a pale body with the dark colour on the
      // extremities, which is what makes a points cat a points cat.
      colours = { ...twoTone(tones.light, tones.shade), bib: tones.light, belly: tones.light, leg: tones.shade }
      break
    case 'Calico':
      // White with orange in the two-tone places, and black on the tail and
      // one haunch so all three colours show.
      colours = { ...twoTone(WHITE, orange), tail: black, haunch: black }
      break
    case 'Tortoiseshell':
      colours = twoTone(tones.base, orange)
      break
    case 'Solid':
    default:
      colours = all(tones.base)
  }
  // The ear insides take whatever the ear tips got: the inner line marks the
  // ear's shape, not a different colour. Heidi tried pink and didn't want it.
  colours.earInner = colours.earTipLeft
  return colours
}

/** Everything the renderer needs for one cat: pose, lines, colour per part. */
export function portraitPlan(
  cat: Pick<Cat, 'birthday' | 'breed' | 'energyLevel' | 'color' | 'pattern'>,
): PortraitPlan {
  const color = effectiveColor(cat) ?? DEFAULT_COLOR
  const pattern = effectivePattern(cat) ?? DEFAULT_PATTERN
  const colours = portraitColours(color, pattern)
  return {
    pose: poseFor(cat),
    showInner: pattern !== 'Solid',
    colours,
    line: lineColourFor(colours),
  }
}

/**
 * One string per distinct appearance, so two cats that would render the same
 * picture share one render. The pose and colours are the whole input to the
 * painter, so this is exact rather than a heuristic.
 */
export function portraitKey(plan: PortraitPlan): string {
  return `${plan.pose}|${plan.showInner ? 'lines' : 'clean'}|${plan.line}|${PARTS.map(p => plan.colours[p]).join(',')}`
}
