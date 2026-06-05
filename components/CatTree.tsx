'use client'

import Link from 'next/link'
import { useState } from 'react'

const PERCHES = [
  { href: '/cats',      label: 'My Cats',   emoji: '🐱', top:  1.5, height:  5.5, left:  8, width: 83 },
  { href: '/schedule',  label: 'Schedule',  emoji: '📅', top: 17,   height:  5,   left: 57, width: 36 },
  { href: '/shopping',  label: 'Shopping',  emoji: '🛍️', top: 30,   height:  5,   left:  5, width: 36 },
  { href: '/breeds',    label: 'Breeds',    emoji: '📚', top: 36,   height: 19,   left: 13, width: 73 },
  { href: '/resources', label: 'Resources', emoji: '🔗', top: 59,   height:  5,   left:  5, width: 33 },
  { href: '/about',     label: 'About',     emoji: '💬', top: 71,   height: 14,   left: 16, width: 67 },
]

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)
  const active = PERCHES.find(p => p.href === hovered)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 8px' }}>

      {/* Logo */}
      <img src="/images/logo-vertical.png" alt="Catssistant" style={{ height: 110, width: 'auto', marginBottom: 8 }} />
      <p style={{ fontSize: 12, color: '#C4956A', margin: '0 0 14px', letterSpacing: '.04em' }}>
        Your cat care headquarters
      </p>

      {/* Tree + hover zones */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
        <img
          src="/images/cat-tree.png"
          alt="Cat tree navigation"
          style={{ width: '100%', display: 'block', userSelect: 'none' }}
          draggable={false}
        />

        {PERCHES.map(({ href, label, emoji, top, left, width, height }) => (
          // Wrapper div handles mouse — more reliable than putting events on Link
          <div
            key={href}
            onMouseEnter={() => setHovered(href)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position:     'absolute',
              top:          `${top}%`,
              left:         `${left}%`,
              width:        `${width}%`,
              height:       `${height}%`,
              borderRadius: 10,
              cursor:       'pointer',
              // Visible warm glow when hovered — no text, no buttons on the cats
              background:   hovered === href ? 'rgba(255, 210, 80, 0.30)' : 'transparent',
              outline:      hovered === href ? '2px solid rgba(196, 144, 40, 0.70)' : 'none',
              transition:   'background 0.15s ease, outline 0.15s ease',
            }}
          >
            {/* Link fills the whole zone so clicking navigates */}
            <Link
              href={href}
              aria-label={`${emoji} ${label}`}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>
        ))}
      </div>

      {/* Section label — fades in BELOW the image, never over the cats */}
      <div style={{
        height: 42, marginTop: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity:    active ? 1 : 0,
        transition: 'opacity 0.15s ease',
        pointerEvents: 'none',
      }}>
        <div style={{
          background:   '#8B5E3C',
          color:        '#fff',
          padding:      '8px 22px',
          borderRadius: 999,
          fontSize:     15,
          fontWeight:   700,
          boxShadow:    '0 3px 10px rgba(0,0,0,0.25)',
          letterSpacing: '.02em',
          whiteSpace:   'nowrap',
        }}>
          {active?.emoji}&nbsp;&nbsp;{active?.label}
        </div>
      </div>

    </div>
  )
}
