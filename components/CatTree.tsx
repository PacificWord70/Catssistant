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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 16px' }}>

      {/* Logo — white card so it looks clean on pink background */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '16px 24px 12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: 20, textAlign: 'center',
      }}>
        <img src="/images/logo-vertical.png" alt="Catssistant" style={{ height: 110, width: 'auto' }} />
        <p style={{ fontSize: 12, color: '#C4956A', margin: '4px 0 0', letterSpacing: '.04em' }}>
          Your cat care headquarters
        </p>
      </div>

      {/* Cat tree image — white card border so pink → white transitions smoothly */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: 14,
        boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
        width: '100%', maxWidth: 500,
      }}>
        <div style={{ position: 'relative' }}>
          <img
            src="/images/cat-tree.png"
            alt="Cat tree navigation"
            style={{ width: '100%', display: 'block', borderRadius: 12, userSelect: 'none' }}
            draggable={false}
          />

          {/* Transparent hover zones with always-visible labels */}
          {PERCHES.map(({ href, label, emoji, top, left, width, height }) => {
            const isHovered = hovered === href
            return (
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
                  background:   isHovered ? 'rgba(255, 210, 80, 0.28)' : 'transparent',
                  outline:      isHovered ? '2px solid rgba(196, 144, 40, 0.65)' : 'none',
                  transition:   'background 0.15s ease, outline 0.15s ease',
                  // Keep label visible without covering cats
                  display:      'flex',
                  alignItems:   'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 3,
                }}
              >
                <Link
                  href={href}
                  style={{ position: 'absolute', inset: 0, zIndex: 1 }}
                  aria-label={`${emoji} ${label}`}
                />
                {/* Always-visible label at the bottom of each perch zone */}
                <span style={{
                  position:     'relative',
                  zIndex:       2,
                  pointerEvents: 'none',
                  background:   isHovered ? '#8B5E3C' : 'rgba(90, 50, 20, 0.72)',
                  color:        '#fff',
                  fontSize:     11,
                  fontWeight:   700,
                  padding:      '3px 9px',
                  borderRadius: 999,
                  letterSpacing: '.03em',
                  whiteSpace:   'nowrap',
                  boxShadow:    '0 1px 4px rgba(0,0,0,0.25)',
                  transition:   'background 0.15s ease',
                }}>
                  {emoji} {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
