'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { BREEDS, breedSlug } from '@/lib/breeds'

const BREED_MAP = new Map(BREEDS.map(b => [b.name, b]))

interface Props {
  name: string
  variant?: 'pill' | 'inline'
  onRemove?: () => void
}

export default function BreedTag({ name, variant = 'pill', onRemove }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLElement>(null)
  const breed = BREED_MAP.get(name)

  function showTooltip() {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ top: rect.top - 8, left: rect.left })
  }

  function hideTooltip() {
    setPos(null)
  }

  const tooltip = breed && pos && createPortal(
    <div
      className="fixed z-[9999] w-56 bg-white border border-brand-tan/40 rounded-2xl shadow-lg p-3 pointer-events-none"
      style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}
    >
      <p className="font-semibold text-xs text-brand-brown mb-1">{name}</p>
      <p className="text-xs text-brand-brown/60 leading-relaxed line-clamp-4">{breed.description}</p>
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
