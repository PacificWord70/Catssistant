'use client'

import Link from 'next/link'
import { useEffect, useState, type CSSProperties } from 'react'
import {
  clearRect,
  cropRect,
  dilate,
  extractMasked,
  floodMask,
  lineMask,
  recolourLines,
  type Rect,
  type Rgba,
} from '@/lib/catTreeArt'

/* Where the nav buttons sit on the drawing, in its own pixel coordinates
   (811x1211). Numbered to match the labelled reference, so re-assigning a
   button is a one-number change.

     1  top perch          5  low shelf, left
     2  left perch         6  hammock
     3  box doorway        7  ledge, right
     4  crescent shelf

   Spot 5 is currently unused — there are seven places to sit and six buttons.
   The small left ledge is the one that looks least empty without a button on
   it; an empty hammock reads as a missing link.

   Positions are turned into percentages below rather than being hard-coded as
   percentages, so they stay readable against the artwork they came from. */
const ART = { width: 811, height: 1211 }
const SRC = '/images/cat-tree.png'

const SPOTS = {
  1: { x: 531, y: 40 },
  2: { x: 266, y: 226 },
  3: { x: 531, y: 470 },
  4: { x: 135, y: 609 },
  5: { x: 175, y: 800 },
  6: { x: 449, y: 1018 },
  7: { x: 712, y: 758 },
} as const

/* Height of one button, in ems of its own text. Nudges below are counted in
   these rather than in artwork pixels: the buttons keep their size when the
   drawing scales down, so their spacing should be measured against themselves,
   not against the picture behind them. */
const LINE = 2.27

/* The drawing's outline, lifted from pure black to a warm cocoa. Black was the
   darkest thing on the page and made the drawing read as marker on paper; the
   cocoa sits with the brand browns. It must stay darker than every fill on all
   three channels — see recolourLines — and the door (#6B4A34) is the closest. */
const OUTLINE: [number, number, number] = [0x4a, 0x35, 0x27]

/* Gap between the drawing's edge and a callout label, in artwork pixels. */
const CALLOUT_GAP = 40

/* Each perch's part of the drawing, picked out so hovering its label can light
   it up. `seeds` flood the fill under them; `rect` takes the linework inside it,
   for the ledge, which is only a line. */
type Region = { seeds: [number, number][] } | { rect: Rect }

interface Perch {
  href: string
  label: string
  blurb: string
  /** On-perch pill, used on narrow screens. */
  spot: keyof typeof SPOTS
  /** `lines` nudges the pill off its spot — negative up, positive down. Kept
      separate from SPOTS so those stay honest about where the artwork's perches
      actually are, and so the spacing can be retuned without losing them. */
  lines: number
  /** Callout, used from md up: which side its label sits on, and the point on
      the perch its leader line ends at. The label lines up with that point. */
  side: 'left' | 'right'
  dot: { x: number; y: number }
  region: Region
}

const PERCHES: Perch[] = [
  {
    href: '/cats', label: 'My Cats', blurb: 'A profile for every cat',
    spot: 1, lines: -1.25, side: 'right', dot: { x: 636, y: 38 },
    region: { seeds: [[530, 38]] },
  },
  {
    href: '/health', label: 'Health Home', blurb: 'Weight and checkups',
    spot: 2, lines: -1, side: 'left', dot: { x: 162, y: 226 },
    region: { seeds: [[266, 226]] },
  },
  {
    href: '/schedule', label: 'Schedule', blurb: 'Feeding, meds and vet visits',
    spot: 3, lines: 1.5, side: 'right', dot: { x: 668, y: 452 },
    region: { seeds: [[400, 500], [531, 470], [430, 390]] },
  },
  {
    href: '/shopping', label: 'Shopping', blurb: 'Coming soon',
    spot: 4, lines: -1.5, side: 'left', dot: { x: 72, y: 600 },
    region: { seeds: [[135, 609]] },
  },
  {
    href: '/resources', label: 'Resources', blurb: 'Guides and breed notes',
    spot: 6, lines: -1, side: 'left', dot: { x: 420, y: 1040 },
    region: { seeds: [[449, 1040]] },
  },
  {
    href: '/about', label: 'About', blurb: 'Who makes Catssistant',
    spot: 7, lines: -0.5, side: 'right', dot: { x: 744, y: 767 },
    region: { rect: { x: 664, y: 758, w: 112, h: 20 } },
  },
]

/* The two toys hang free, so they are lifted out of the drawing and swung on
   their strings. `rect` holds the string and ball and nothing else; `pivot` is
   where the string meets its shelf. */
const PENDULUMS: { rect: Rect; pivot: { x: number; y: number }; className: string }[] = [
  { rect: { x: 622, y: 67, w: 82, h: 180 }, pivot: { x: 655, y: 64 }, className: 'cat-tree-sway' },
  { rect: { x: 95, y: 806, w: 89, h: 192 }, pivot: { x: 133, y: 803 }, className: 'cat-tree-sway cat-tree-sway-late' },
]

/* Fine paper grain, laid over the drawing only: a tile of cocoa speckles,
   mostly near-clear with the odd darker fleck. Cubing the random value is what
   keeps it sparse — the mean lands around 1% — so it reads as tooth in the
   paper rather than as a wash over the colours. */
function makeGrain(): string {
  const size = 160
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    img.data.set([OUTLINE[0], OUTLINE[1], OUTLINE[2], Math.random() ** 3 * 12], i)
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

const pct = (n: number, of: number) => `${(n / of) * 100}%`

function boxStyle(rect: Rect): CSSProperties {
  return {
    position: 'absolute',
    left: pct(rect.x, ART.width),
    top: pct(rect.y, ART.height),
    width: pct(rect.w, ART.width),
    height: pct(rect.h, ART.height),
  }
}

function toUrl(img: Rgba): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(URL.createObjectURL(blob!)), 'image/png'))
}

interface Layers {
  base: string
  pendulums: string[]
  regions: Record<string, string>
  grain: string
}

/**
 * Builds every layer from Heidi's one file. Until it finishes — or if it never
 * does — the drawing shows as-is, so nothing here is load-bearing for the nav.
 */
function useTreeLayers(): Layers | null {
  const [layers, setLayers] = useState<Layers | null>(null)

  useEffect(() => {
    let cancelled = false
    let urls: string[] = []

    ;(async () => {
      const image = new Image()
      image.src = SRC
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = ART.width
      canvas.height = ART.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(image, 0, 0)
      const { data } = ctx.getImageData(0, 0, ART.width, ART.height)
      const art: Rgba = { data, width: ART.width, height: ART.height }

      recolourLines(art, OUTLINE)

      const regions: Record<string, string> = {}
      for (const perch of PERCHES) {
        const isLine = 'rect' in perch.region
        const mask =
          'rect' in perch.region
            ? lineMask(art, perch.region.rect)
            : dilate(floodMask(art, perch.region.seeds), ART.width, 1)
        const sprite = extractMasked(art, mask)
        // A line has no fill to brighten, so it turns brand orange instead.
        if (isLine) {
          for (let i = 0; i < sprite.data.length; i += 4) {
            if (sprite.data[i + 3]) sprite.data.set([0xf2, 0x6a, 0x1b], i)
          }
        }
        regions[perch.href] = await toUrl(sprite)
      }

      const pendulums: string[] = []
      for (const { rect } of PENDULUMS) {
        pendulums.push(await toUrl(cropRect(art, rect)))
        clearRect(art, rect)
      }

      const base = await toUrl(art)
      urls = [base, ...pendulums, ...Object.values(regions)]
      if (cancelled) urls.forEach(URL.revokeObjectURL)
      else setLayers({ base, pendulums, regions, grain: makeGrain() })
    })().catch(() => {
      /* Leave the original drawing up. */
    })

    return () => {
      cancelled = true
      urls.forEach(URL.revokeObjectURL)
    }
  }, [])

  return layers
}

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)
  const layers = useTreeLayers()

  const hoverProps = (href: string) => ({
    onMouseEnter: () => setHovered(href),
    onMouseLeave: () => setHovered(null),
    onFocus: () => setHovered(href),
    onBlur: () => setHovered(null),
  })

  return (
    <div className="flex justify-center md:px-[170px]">
      {/* The drawing keeps its aspect ratio and every layer is inset:0 against
          it, so labels, glows and swinging toys hold their spots at every size. */}
      <div className="relative w-full max-w-[340px] md:w-[360px] md:max-w-none xl:w-[420px]" style={{ aspectRatio: `${ART.width} / ${ART.height}` }}>

        {/* A soft contact shadow, so the tree stands on something. */}
        <div
          aria-hidden
          style={{
            ...boxStyle({ x: 122, y: 1150, w: 620, h: 60 }),
            background: 'radial-gradient(closest-side, rgba(74,53,39,0.30), rgba(74,53,39,0))',
          }}
        />

        {/* Halos behind each perch, shown while its label is hovered. The blur
            sits on a wrapper because filters run before masks: on the same
            element the mask would cut the blur straight back off. */}
        {layers &&
          PERCHES.map(({ href }) => (
            <div
              key={href}
              aria-hidden
              className="absolute inset-0 transition-opacity duration-300"
              style={{ filter: 'blur(9px)', opacity: hovered === href ? 0.7 : 0 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: '#F26A1B',
                  maskImage: `url(${layers.regions[href]})`,
                  WebkitMaskImage: `url(${layers.regions[href]})`,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%',
                }}
              />
            </div>
          ))}

        <img
          src={layers?.base ?? SRC}
          alt="A hand-drawn cat tree"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
        />

        {layers &&
          PENDULUMS.map(({ rect, pivot, className }, i) => (
            <img
              key={i}
              src={layers.pendulums[i]}
              alt=""
              aria-hidden
              draggable={false}
              className={`select-none ${className}`}
              style={{
                ...boxStyle(rect),
                transformOrigin: `${pct(pivot.x - rect.x, rect.w)} ${pct(pivot.y - rect.y, rect.h)}`,
              }}
            />
          ))}

        {/* The hovered perch's own pixels, brightened. */}
        {layers &&
          PERCHES.map(({ href }) => (
            <img
              key={href}
              src={layers.regions[href]}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full select-none transition-opacity duration-300"
              style={{ opacity: hovered === href ? 1 : 0, filter: 'brightness(1.1) saturate(1.15)' }}
            />
          ))}

        {layers && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url(${layers.grain})`,
              backgroundSize: '160px 160px',
              mixBlendMode: 'multiply',
              maskImage: `url(${SRC})`,
              WebkitMaskImage: `url(${SRC})`,
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
            }}
          />
        )}

        {/* ─── Callouts, md and up ─────────────────────────────────────── */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible md:block"
          viewBox={`0 0 ${ART.width} ${ART.height}`}
          preserveAspectRatio="none"
        >
          {PERCHES.map(({ href, side, dot }) => {
            const on = hovered === href
            const end = side === 'left' ? -CALLOUT_GAP + 8 : ART.width + CALLOUT_GAP - 8
            return (
              <g key={href} className="transition-colors duration-200" style={{ color: on ? '#F26A1B' : '#4A3527' }}>
                <line
                  x1={dot.x} y1={dot.y} x2={end} y2={dot.y}
                  stroke="currentColor"
                  strokeWidth={on ? 1.75 : 1.1}
                  strokeOpacity={on ? 1 : 0.55}
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={dot.x} cy={dot.y} r={on ? 9 : 7} fill="currentColor" stroke="#FFFBF6" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              </g>
            )
          })}
        </svg>

        <nav aria-label="Main sections" className="hidden md:block">
          {PERCHES.map(({ href, label, blurb, side, dot }) => {
            const on = hovered === href
            const offset = `${100 + (CALLOUT_GAP / ART.width) * 100}%`
            return (
              <Link
                key={href}
                href={href}
                {...hoverProps(href)}
                className={`group absolute block -translate-y-1/2 whitespace-nowrap rounded-xl px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 ${side === 'left' ? 'text-right' : 'text-left'}`}
                style={{ top: pct(dot.y, ART.height), [side === 'left' ? 'right' : 'left']: offset }}
              >
                <span className={`block font-display text-[17px] font-semibold leading-tight transition-colors ${on ? 'text-brand-orange' : 'text-brand-charcoal'}`}>
                  {label}
                </span>
                <span className="block text-[12.5px] leading-snug text-brand-brown/80">{blurb}</span>
              </Link>
            )
          })}
        </nav>

        {/* ─── On-perch pills, below md ─────────────────────────────────── */}
        <nav aria-label="Main sections" className="absolute inset-0 md:hidden">
          {PERCHES.map(({ href, label, spot, lines }) => {
            const isHovered = hovered === href
            const { x, y } = SPOTS[spot]
            return (
              <Link
                key={href}
                href={href}
                {...hoverProps(href)}
                /* The pill is about 30px tall, a touch small for a thumb. An
                   invisible ::before stretches the tap target to ~42px without
                   making the pill itself any bigger on the drawing. Focus uses
                   an outline, not a ring: the inline boxShadow below would
                   override a ring's box-shadow. Focus also flips the pill to
                   its hover colours via hoverProps. */
                className="before:absolute before:-inset-x-1 before:-inset-y-1.5 before:content-[''] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown"
                style={{
                  position:      'absolute',
                  left:          pct(x, ART.width),
                  top:           pct(y, ART.height),
                  transform:     `translate(-50%, calc(-50% + ${(lines * LINE).toFixed(2)}em))`,
                  display:       'inline-block',
                  /* Translucent so the drawing reads through a pill that is
                     wider than the perch it sits on — the labels vary in
                     length and the artwork's spots do not. Blurred behind, or
                     the linework crossing underneath makes the text noisy.
                     Brown text reads at 5:1 on it; hover flips to full brand
                     orange so the one being pointed at is unambiguous. */
                  background:    isHovered ? '#F26A1B' : 'rgba(228,154,96,0.94)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  color:         isHovered ? '#FFFBF6' : '#4A3527',
                  fontSize:      12,
                  fontWeight:    600,
                  padding:       '5px 11px',
                  borderRadius:  999,
                  letterSpacing: '.02em',
                  whiteSpace:    'nowrap',
                  border:        isHovered ? '1px solid rgba(255,251,246,0.55)' : '1px solid rgba(107,74,52,0.28)',
                  boxShadow:     isHovered
                    ? '0 4px 12px -2px rgba(43,38,34,0.35)'
                    : '0 1px 4px -1px rgba(43,38,34,0.22)',
                  transition:    'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
                  cursor:        'pointer',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
