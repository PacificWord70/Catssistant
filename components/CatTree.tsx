'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import CatTreeCanvas from '@/components/CatTreeCanvas'
import { TREE_ANCHORS, TREE_VIEWBOX, TreeAnchor } from '@/lib/catTree'

/* Which button sits on which spot of the drawing. The spots themselves live in
   lib/catTree.ts next to the artwork that defines them, so moving a button is a
   one-word change here and nudging a spot is one pair of numbers there. */
const PERCHES: {
  href: string
  label: string
  emoji: string
  anchor: TreeAnchor
}[] = [
  { href: '/cats', label: 'My Cats', emoji: '🐱', anchor: 'topPerch' },
  { href: '/shopping', label: 'Shopping', emoji: '🛍️', anchor: 'leftPerch' },
  { href: '/schedule', label: 'Schedule', emoji: '📅', anchor: 'boxDoor' },
  { href: '/resources', label: 'Resources', emoji: '🔗', anchor: 'crescent' },
  { href: '/about', label: 'About', emoji: '💬', anchor: 'lowShelf' },
  { href: '/breeds', label: 'Breeds', emoji: '📚', anchor: 'hammock' },
]

/* The drawing is tall and narrow, so it gets its own cap rather than filling
   the card — otherwise a wide screen makes the page a mile long. */
const MAX_TREE_WIDTH = 470

export default function CatTree() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [treeWidth, setTreeWidth] = useState(MAX_TREE_WIDTH)
  const frameRef = useRef<HTMLDivElement>(null)

  /* A canvas needs a pixel width, but the card is fluid, so the frame is
     measured and the canvas redrawn whenever it changes size. */
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const measure = () => setTreeWidth(Math.min(frame.clientWidth, MAX_TREE_WIDTH))
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  const treeHeight = (treeWidth * TREE_VIEWBOX.height) / TREE_VIEWBOX.width

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

        {/* Full-width measuring frame; the canvas inside is centred at its own
            capped width, and the pill overlay matches that box exactly so the
            percentage positions land on the drawing at any size. */}
        <div ref={frameRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: treeWidth, height: treeHeight }}>
            <CatTreeCanvas width={treeWidth} />

            <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              {PERCHES.map(({ href, label, emoji, anchor }) => {
                const isHovered = hovered === href
                const { x, y } = TREE_ANCHORS[anchor]
                return (
                  <Link
                    key={href}
                    href={href}
                    onMouseEnter={() => setHovered(href)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position:      'absolute',
                      left:          `${(x / TREE_VIEWBOX.width) * 100}%`,
                      top:           `${(y / TREE_VIEWBOX.height) * 100}%`,
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
    </div>
  )
}
