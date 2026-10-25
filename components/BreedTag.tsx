'use client'

import { useState, useRef, useEffect, useId } from 'react'
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

/** The expanded tooltip's width (w-72), used to keep it inside the viewport. */
const EXPANDED_W = 288
/** Breathing room kept between the tooltip and the edge of the screen. */
const EDGE_GAP = 8

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
  const tooltipId = useId()

  // Also cleared on unmount, not just on mouse leave. Navigating away with the
  // pointer still resting on a tag would otherwise leave a pending callback
  // that fires against a component which no longer exists.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  // Escape dismisses an open tooltip, whether it was opened by hover or focus,
  // so it can always be cleared without moving the pointer or focus away.
  useEffect(() => {
    if (!pos) return
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // hideTooltip, inlined: it only touches refs and setters, and naming it
      // here would make it an effect dependency that changes every render.
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      setPos(null)
      setExpanded(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [pos])

  function showTooltip() {
    if (!ref.current) return
    // Hover and focus can both arrive for the same tag; a second call must not
    // strand the first one's timer.
    if (timerRef.current) clearTimeout(timerRef.current)
    const rect = ref.current.getBoundingClientRect()

    // Which side it opens on is decided once, up front, and measured against the
    // *expanded* height rather than the current one. Deciding again at expand
    // time would make the tooltip jump from above the tag to below it midway
    // through a hover.
    const below = rect.top < EXPANDED_MAX_H
    // Clamped against the expanded width, for the same reason: a tag near the
    // right edge would otherwise open its tooltip partly off-screen, and
    // growing into the full description would push it further off.
    const maxLeft = window.innerWidth - EXPANDED_W - EDGE_GAP
    const left = Math.max(EDGE_GAP, Math.min(rect.left, maxLeft))
    setPos({ top: below ? rect.bottom + 8 : rect.top - 8, left, below })

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
      id={tooltipId}
      role="tooltip"
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
          onMouseEnter={breed ? showTooltip : undefined}
          onMouseLeave={breed ? hideTooltip : undefined}
          className="flex items-center gap-1 px-3 py-1 bg-brand-tan/20 text-brand-brown rounded-full text-sm cursor-default"
        >
          {name}
          {/* The × is the chip's only focusable part, so keyboard users get the
              description while they are on it, the way a hover would. */}
          <button
            type="button"
            onClick={onRemove}
            onFocus={breed ? showTooltip : undefined}
            onBlur={breed ? hideTooltip : undefined}
            aria-label={`Remove ${name}`}
            aria-describedby={tooltip ? tooltipId : undefined}
            className="text-brand-tan hover:text-brand-brown font-bold ml-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
          >
            <span aria-hidden="true">×</span>
          </button>
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
              onFocus={showTooltip}
              onBlur={hideTooltip}
              aria-describedby={tooltip ? tooltipId : undefined}
              className="hover:underline"
            >{name}</Link>
          : <span ref={ref as React.RefObject<HTMLSpanElement>}>{name}</span>
        }
        {tooltip}
      </>
    )
  }

  /* Pill — card use.
   *
   * Never a link, even for a known breed. CatCard wraps the whole card in one,
   * and an anchor inside an anchor is invalid HTML: React warns about it in
   * development, and in production the browser silently closes the outer one
   * early, which breaks the card's own click target. The breed is still
   * reachable as a link from the cat's profile, where the inline variant is not
   * nested inside anything.
   */
  return (
    <>
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        onMouseEnter={breed ? showTooltip : undefined}
        onMouseLeave={breed ? hideTooltip : undefined}
        className="text-xs px-2 py-0.5 rounded-full bg-brand-tan/20 text-brand-brown whitespace-nowrap"
      >
        {name}
      </span>
      {tooltip}
    </>
  )
}
