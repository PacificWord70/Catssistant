'use client'

import Link from 'next/link'
import { useState } from 'react'

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

/* `lines` nudges a button off its spot — negative up, positive down. Kept
   separate from SPOTS so those stay honest about where the artwork's perches
   actually are, and so the spacing can be retuned without losing them. */
const PERCHES: {
  href: string
  label: string
  spot: keyof typeof SPOTS
  lines: number
}[] = [
  { href: '/cats', label: 'My Cats', spot: 1, lines: -1.25 },
  { href: '/health', label: 'Health Home', spot: 2, lines: -1 },
  { href: '/schedule', label: 'Schedule', spot: 3, lines: 1.5 },
  { href: '/shopping', label: 'Shopping', spot: 4, lines: -1.5 },
  { href: '/resources', label: 'Resources', spot: 6, lines: -1 },
  { href: '/about', label: 'About', spot: 7, lines: -0.5 },
]

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 16px', marginTop: 40 }}>

      {/* Single card containing logo + cat tree */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '28px 20px 20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
        width: '100%',
        maxWidth: 720,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}>

        <img
          src="/images/logo-vertical.png"
          alt="Catssistant"
          draggable={false}
          style={{ width: '34%', height: 'auto', userSelect: 'none' }}
        />

        <hr style={{ width: '100%', border: 'none', borderTop: '2px solid #F0D9C8', margin: 0 }} />

        {/* The drawing is tall and narrow, so it gets its own cap rather than
            filling the card — otherwise a wide screen makes the page a mile
            long. The image keeps its aspect ratio and the overlay is inset:0
            against it, so the pills hold their spots at every size. */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 470 }}>
          <img
            src="/images/cat-tree.png"
            alt="Cat tree navigation"
            draggable={false}
            style={{ width: '100%', display: 'block', userSelect: 'none' }}
          />

          <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {PERCHES.map(({ href, label, spot, lines }) => {
              const isHovered = hovered === href
              const { x, y } = SPOTS[spot]
              return (
                <Link
                  key={href}
                  href={href}
                  onMouseEnter={() => setHovered(href)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position:      'absolute',
                    left:          `${(x / ART.width) * 100}%`,
                    top:           `${(y / ART.height) * 100}%`,
                    transform:     `translate(-50%, calc(-50% + ${(lines * LINE).toFixed(2)}em))`,
                    display:       'inline-block',
                    /* Translucent so the drawing reads through a pill that is
                       wider than the perch it sits on — the labels vary in
                       length and the artwork's spots do not. Blurred behind, or
                       the linework crossing underneath makes the text noisy.
                       The fill sits between the nav bar's orange and the page
                       background, cut with a little brand-brown so it settles
                       into the drawing rather than glowing on top of it. Brown
                       text reads at 5:1 on it; hover flips to full brand orange
                       so the one being pointed at is unambiguous. */
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
          </div>
        </div>

      </div>
    </div>
  )
}
