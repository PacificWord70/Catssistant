'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Perch click zones ────────────────────────────────────────────────────────
// Positions are % of the image's width/height.
// No text or buttons appear ON the image — just a warm glow on hover.
// The section name shows in a pill label BELOW the image.
const PERCHES = [
  {
    href:  '/cats',
    label: 'My Cats',
    emoji: '🐱',
    // Top wide platform
    top: 1.5, height: 5.5, left: 8, width: 83,
  },
  {
    href:  '/schedule',
    label: 'Schedule',
    emoji: '📅',
    // Right shelf (upper, with dangling toy)
    top: 17, height: 5, left: 57, width: 36,
  },
  {
    href:  '/shopping',
    label: 'Shopping',
    emoji: '🛍️',
    // Left shelf (mid)
    top: 30, height: 5, left: 5, width: 36,
  },
  {
    href:  '/breeds',
    label: 'Breeds',
    emoji: '📚',
    // Cubie box (middle) — most prominent element
    top: 36, height: 19, left: 13, width: 73,
  },
  {
    href:  '/resources',
    label: 'Resources',
    emoji: '🔗',
    // Left lower shelf
    top: 59, height: 5, left: 5, width: 33,
  },
  {
    href:  '/about',
    label: 'About',
    emoji: '💬',
    // Hammock (lower centre)
    top: 71, height: 14, left: 16, width: 67,
  },
]

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)
  const active = PERCHES.find(p => p.href === hovered)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 0 8px',
    }}>

      {/* Logo */}
      <img
        src="/images/logo-vertical.png"
        alt="Catssistant"
        style={{ height: 110, width: 'auto', marginBottom: 10 }}
      />
      <p style={{ fontSize: 12, color: '#C4956A', margin: '0 0 16px', letterSpacing: '.04em' }}>
        Your cat care headquarters
      </p>

      {/* Tree image + transparent hover zones */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
        <img
          src="/images/cat-tree.png"
          alt="Catssistant navigation tree"
          style={{ width: '100%', display: 'block', userSelect: 'none' }}
          draggable={false}
        />

        {PERCHES.map(({ href, top, left, width, height }) => (
          <Link
            key={href}
            href={href}
            onMouseEnter={() => setHovered(href)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position:   'absolute',
              top:        `${top}%`,
              left:       `${left}%`,
              width:      `${width}%`,
              height:     `${height}%`,
              display:    'block',
              borderRadius: 10,
              // Subtle warm glow on hover — no text, no buttons
              background:  hovered === href
                ? 'rgba(232, 200, 100, 0.22)'
                : 'transparent',
              boxShadow:   hovered === href
                ? 'inset 0 0 0 2px rgba(196, 144, 64, 0.55)'
                : 'none',
              transition:  'background .15s ease, box-shadow .15s ease',
            }}
          />
        ))}
      </div>

      {/* Floating section label — appears BELOW the tree, never on the cats */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginTop: 10,
        opacity: active ? 1 : 0,
        transition: 'opacity .15s ease',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: '#8B5E3C', color: '#fff',
          padding: '7px 20px', borderRadius: 999,
          fontSize: 14, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          letterSpacing: '.02em',
        }}>
          {active?.emoji}&nbsp; {active?.label}
        </div>
      </div>

    </div>
  )
}
