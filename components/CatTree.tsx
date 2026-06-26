'use client'

import Link from 'next/link'
import { useState } from 'react'

const PERCHES = [
  { href: '/cats',      label: 'My Cats',   emoji: '🐱', top:  5,  left:  8, width: 83 },
  { href: '/schedule',  label: 'Schedule',  emoji: '📅', top: 25,  left: 57, width: 36 },
  { href: '/shopping',  label: 'Shopping',  emoji: '🛍️', top: 32,  left:  5, width: 36 },
  { href: '/breeds',    label: 'Breeds',    emoji: '📚', top: 55,  left: 13, width: 73 },
  { href: '/resources', label: 'Resources', emoji: '🔗', top: 61,  left:  5, width: 33 },
  { href: '/about',     label: 'About',     emoji: '💬', top: 92,  left: 16, width: 67 },
]

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 16px' }}>

      {/* Single card containing logo + cat tree */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
        width: '100%',
        maxWidth: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>

        <img
          src="/images/logo-vertical.png"
          alt="Catssistant"
          draggable={false}
          style={{ height: 110, width: 'auto', userSelect: 'none' }}
        />

        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src="/images/cat-tree.png"
            alt="Cat tree navigation"
            draggable={false}
            style={{ width: '100%', display: 'block', borderRadius: 12, userSelect: 'none' }}
          />

          <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
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
    </div>
  )
}
