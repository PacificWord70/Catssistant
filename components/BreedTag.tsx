'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { BREEDS, breedSlug } from '@/lib/breeds'

const BREED_MAP = new Map(BREEDS.map(b => [b.name, b]))

/** How long to keep hovering before the full description opens up. */
const EXPAND_DELAY_MS = 3000

/**
 * Roughly how tall the tooltip gets once expanded. Used only to decide which
 * side of the tag it opens on, so it does not need to be exact.
 */
const EXPANDED_MAX_H = 220

interface Props {
  name: string
  variant?: 'pill' | 'inline'
  onRemove?: () => void
}

export default function BreedTag({ name, variant = 'pill', onRemove }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const breed = BREED_MAP.get(name)

  // Also cleared on unmount, not just on mouse leave. Navigating away with the
  // pointer still resting on a tag would otherwise leave a pending callback
  // that fires against a component which no longer exists.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function showTooltip() {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()

    // Which side it opens on is decided once, up front, and measured against the
    // *expanded* height rather than the current one. Deciding again at expand
    // time would make the tooltip jump from above the tag to below it midway
    // through a hover.
    const below = rect.top < EXPANDED_MAX_H
    setPos({ top: below ? rect.bottom + 8 : rect.top - 8, left: rect.left, below })

    // The clamped version reads first and the full paragraph waits for anyone
    // who lingers, rather than dropping a wall of text on every passing hover.
    timerRef.current = setTimeout(() => setExpanded(true), EXPAND_DELAY_MS)
  }

  function hideTooltip() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setPos(null)
    setExpanded(false)
  }

  const tooltip = breed && pos && createPortal(
    <div
      className={`fixed z-[9999] bg-white border border-brand-tan/40 rounded-2xl shadow-lg p-3 pointer-events-none transition-[width] duration-200 ${expanded ? 'w-72' : 'w-56'}`}
      style={{
        top: pos.top,
        left: pos.left,
        transform: pos.below ? undefined : 'translateY(-100%)',
      }}
    >
      <p className="font-semibold text-xs text-brand-brown mb-1">{name}</p>
      <p className={`text-xs text-brand-brown/60 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>{breed.description}</p>
    </div>,
    document.body
  )

  // Removable chip — form use
  if (onRemove) {
    return (
      <>
        <span
          ref={ref as React.RefObject<HTMLSpanElement>}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          className="flex items-center gap-1 px-3 py-1 bg-brand-tan/20 text-brand-brown rounded-full text-sm cursor-default"
        >
          {name}
          <button type="button" onClick={onRemove} className="text-brand-tan hover:text-brand-brown font-bold ml-0.5">×</button>
        </span>
        {tooltip}
      </>
    )
  }

  // Inline text — profile page
  if (variant === 'inline') {
    return (
      <>
        {breed
          ? <Link
              ref={ref as React.RefObject<HTMLAnchorElement>}
              href={`/breeds#${breedSlug(name)}`}
              onMouseEnter={showTooltip}
              onMouseLeave={hideTooltip}
              className="hover:underline"
            >{name}</Link>
          : <span ref={ref as React.RefObject<HTMLSpanElement>}>{name}</span>
        }
        {tooltip}
      </>
    )
  }

  // Pill — card use
  return (
    <>
      {breed
        ? <Link
            ref={ref as React.RefObject<HTMLAnchorElement>}
            href={`/breeds#${breedSlug(name)}`}
            onClick={e => e.stopPropagation()}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            className="text-xs px-2 py-0.5 rounded-full bg-brand-tan/20 text-brand-brown hover:bg-brand-tan/40 transition-colors whitespace-nowrap"
          >{name}</Link>
        : <span className="text-xs px-2 py-0.5 rounded-full bg-brand-tan/20 text-brand-brown whitespace-nowrap">{name}</span>
      }
      {tooltip}
    </>
  )
}
