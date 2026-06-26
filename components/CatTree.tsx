'use client'

import Link from 'next/link'
import { useState } from 'react'

// Each perch is a thin strip sitting AT the shelf line.
// top/left/width/height are percentages of the image dimensions.
// Labels float above the strip so they're visually above the shelf line.
const PERCHES = [
  { href: '/cats',      label: 'My Cats',   emoji: '🐱', top:  5,  height: 5, left:  8, width: 83 },
  { href: '/schedule',  label: 'Schedule',  emoji: '📅', top: 25,  height: 5, left: 57, width: 36 },
  { href: '/shopping',  label: 'Shopping',  emoji: '🛍️', top: 32,  height: 5, left:  5, width: 36 },
  { href: '/breeds',    label: 'Breeds',    emoji: '📚', top: 55,  height: 5, left: 13, width: 73 },
  { href: '/resources', label: 'Resources', emoji: '🔗', top: 61,  height: 5, left:  5, width: 33 },
  { href: '/about',     label: 'About',     emoji: '💬', top: 92,  height: 5, left: 16, width: 67 },
]

// SVG filter id for the squiggly border effect
const SQUIGGLE_ID = 'squiggle-border'

function SquigglyImage({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <div style={{ filter: `url(#${SQUIGGLE_ID})`, display: 'inline-block', width: '100%' }}>
      <div style={{
        background: '#fff',
        padding: 10,
        borderRadius: 18,
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            width: '100%',
            display: 'block',
            borderRadius: 10,
            userSelect: 'none',
            filter: 'none',
            ...style,
          }}
        />
      </div>
    </div>
  )
}

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 16px' }}>

      {/* Hidden SVG that defines the squiggly filter — no visible output */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id={SQUIGGLE_ID} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Logo */}
      <div style={{ marginBottom: 20, textAlign: 'center', width: '100%', maxWidth: 300 }}>
        <SquigglyImage src="/images/logo-vertical.png" alt="Catssistant" />
        <p style={{ fontSize: 12, color: '#C4956A', margin: '8px 0 0', letterSpacing: '.04em' }}>
          Your cat care headquarters
        </p>
      </div>

      {/* Cat tree image with overlaid navigation zones */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 500 }}>
        <SquigglyImage src="/images/cat-tree.png" alt="Cat tree navigation" />

        {/* Navigation pills — each is a link pill sized to its text, centered on the shelf */}
        <div style={{ position: 'absolute', inset: 10, overflow: 'visible' }}>
          {PERCHES.map(({ href, label, emoji, top, left, width }) => {
            const isHovered = hovered === href
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position:      'absolute',
                  top:           `${top}%`,
                  left:          `${left + width / 2}%`,
                  transform:     'translate(-50%, -50%)',
                  display:       'inline-block',
                  background:    isHovered ? '#8B5E3C' : 'rgba(90, 50, 20, 0.72)',
                  color:         '#fff',
                  fontSize:      11,
                  fontWeight:    700,
                  padding:       '3px 9px',
                  borderRadius:  999,
                  letterSpacing: '.03em',
                  whiteSpace:    'nowrap',
                  boxShadow:     '0 1px 4px rgba(0,0,0,0.25)',
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
  )
}
