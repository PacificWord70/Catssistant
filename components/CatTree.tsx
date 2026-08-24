'use client'

import Link from 'next/link'
import { useState } from 'react'

/* Where the nav buttons sit on the drawing, in its own pixel coordinates
   (811x1211). Numbered to match the labelled reference, so re-assigning a
   button is a one-number change.

     1  top perch          4  crescent shelf
     2  left perch         5  low shelf
     3  box doorway        6  hammock

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
} as const

const PERCHES: { href: string; label: string; emoji: string; spot: keyof typeof SPOTS }[] = [
  { href: '/cats', label: 'My Cats', emoji: '🐱', spot: 1 },
  { href: '/shopping', label: 'Shopping', emoji: '🛍️', spot: 2 },
  { href: '/schedule', label: 'Schedule', emoji: '📅', spot: 3 },
  { href: '/resources', label: 'Resources', emoji: '🔗', spot: 4 },
  { href: '/about', label: 'About', emoji: '💬', spot: 5 },
  { href: '/breeds', label: 'Breeds', emoji: '📚', spot: 6 },
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
            {PERCHES.map(({ href, label, emoji, spot }) => {
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
                    transform:     'translate(-50%, -50%)',
                    display:       'inline-block',
                    background:    isHovered ? '#F26A1B' : '#6B4A34',
                    color:         '#FFFBF6',
                    fontSize:      13,
                    fontWeight:    700,
                    padding:       '5px 12px',
                    borderRadius:  999,
                    letterSpacing: '.03em',
                    whiteSpace:    'nowrap',
                    boxShadow:     '0 1px 4px rgba(43,38,34,0.3)',
                    transition:    'background 0.15s ease',
                    cursor:        'pointer',
                  }}
                >
                  {emoji} {label}
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
