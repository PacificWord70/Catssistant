'use client'

import Link from 'next/link'
import { Cat } from '@/types/cat'
import { catHumanAge } from '@/lib/utils'

// ─── Layout constants ────────────────────────────────────────────────────────
const TRUNK_PCT  = 42   // trunk center as % of container width
const CARD_W_PCT = 22   // each perch card as % of container width
const TRUNK_PX   = 12   // trunk visual width in px (half = 6px offset on each side)

// Six pre-defined slots. Deliberately uneven — some left perches hug the edge,
// others sit more center-left; same on the right.
const SLOTS = [
  { type: 'shelf',   side: 'left',  leftPct: 4,  topPx: 28,  branchYPx: 88  },
  { type: 'hammock', side: 'right', leftPct: 55, topPx: 190, branchYPx: 256 },
  { type: 'cubie',   side: 'left',  leftPct: 9,  topPx: 360, branchYPx: 420 },
  { type: 'shelf',   side: 'right', leftPct: 62, topPx: 510, branchYPx: 568 },
  { type: 'hammock', side: 'left',  leftPct: 1,  topPx: 665, branchYPx: 731 },
  { type: 'cubie',   side: 'right', leftPct: 57, topPx: 808, branchYPx: 868 },
] as const

type PerchType = typeof SLOTS[number]['type']

const PASS_HEIGHT = 970    // px between passes (for 7+ cats)
const BASE_HEIGHT = 970    // minimum container height

// ─── Shared cat card innards ──────────────────────────────────────────────────
function CatPortrait({ cat }: { cat: Cat }) {
  return (
    <div className="w-14 h-14 rounded-full bg-brand-tan/20 flex items-center justify-center overflow-hidden mx-auto mb-2 shadow-sm">
      {cat.photoUrl
        ? <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
        : <span className="text-2xl select-none">🐱</span>}
    </div>
  )
}

function CatLabel({ cat }: { cat: Cat }) {
  return (
    <>
      <p className="font-semibold text-sm text-brand-charcoal leading-tight truncate">{cat.name}</p>
      {cat.breed.length > 0 && (
        <p className="text-xs text-brand-tan mt-0.5 truncate">
          {cat.breed[0]}{cat.breed.length > 1 ? ' +' : ''}
        </p>
      )}
      {cat.birthday && (
        <p className="text-xs text-gray-400 mt-0.5">~{catHumanAge(cat.birthday)} human yrs</p>
      )}
    </>
  )
}

// ─── Perch types ─────────────────────────────────────────────────────────────

function ShelfPerch({ cat }: { cat: Cat }) {
  return (
    <div className="w-full">
      <Link href={`/cats/${cat.id}`} className="block">
        <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-brand-tan/20 text-center
                        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CatPortrait cat={cat} />
          <CatLabel cat={cat} />
        </div>
      </Link>
      {/* Shelf plank */}
      <div className="h-3 bg-brand-brown rounded-full shadow-md mx-1 mt-0.5" />
    </div>
  )
}

function CubiePerch({ cat }: { cat: Cat }) {
  return (
    <Link href={`/cats/${cat.id}`} className="block w-full">
      <div className="relative bg-brand-cream border-[3px] border-brand-brown rounded-2xl px-4 pb-3 pt-4 shadow
                      text-center hover:bg-white hover:shadow-md transition-all duration-200">
        {/* Entry hole knob on top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-brand-brown
                        border-2 border-brand-cream shadow" />
        <CatPortrait cat={cat} />
        <CatLabel cat={cat} />
      </div>
    </Link>
  )
}

function HammockPerch({ cat }: { cat: Cat }) {
  return (
    <div className="w-full">
      {/* Hanging ropes */}
      <div className="flex justify-between px-7">
        <div className="w-px h-5 bg-brand-brown" />
        <div className="w-px h-5 bg-brand-brown" />
      </div>
      {/* Hammock bed */}
      <Link href={`/cats/${cat.id}`} className="block">
        <div className="bg-brand-tan/25 border-2 border-brand-tan rounded-b-[2.5rem] px-4 py-4
                        text-center shadow-inner hover:bg-brand-tan/40 transition-colors duration-200">
          <CatPortrait cat={cat} />
          <CatLabel cat={cat} />
        </div>
      </Link>
    </div>
  )
}

function AddCatPerch() {
  return (
    <div className="w-full">
      <Link href="/cats/new" className="block">
        <div className="bg-white border-2 border-dashed border-brand-tan rounded-xl px-4 py-4
                        text-center hover:border-brand-orange hover:bg-brand-orange/5 transition-colors duration-200">
          <div className="w-14 h-14 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl select-none">➕</span>
          </div>
          <p className="text-sm font-medium text-brand-tan group-hover:text-brand-orange">Add a cat</p>
        </div>
      </Link>
      {/* Dashed shelf */}
      <div className="h-3 bg-brand-tan/40 rounded-full mx-1 mt-0.5" />
    </div>
  )
}

// ─── Main tree ────────────────────────────────────────────────────────────────

interface Props {
  cats: Cat[]
}

export default function CatTree({ cats }: Props) {
  const totalItems  = cats.length + 1 // last slot = Add Cat
  const passes      = Math.ceil(totalItems / SLOTS.length)
  const containerH  = Math.max(BASE_HEIGHT, passes * PASS_HEIGHT)

  // Build items list: every cat + the Add Cat button
  const items = ([...cats, null] as (Cat | null)[]).map((cat, i) => {
    const slotIdx = i % SLOTS.length
    const pass    = Math.floor(i / SLOTS.length)
    const slot    = SLOTS[slotIdx]
    return {
      key:       cat ? cat.id : 'add-cat',
      cat,
      type:      slot.type as PerchType,
      side:      slot.side as 'left' | 'right',
      leftPct:   slot.leftPct,
      topPx:     slot.topPx  + pass * PASS_HEIGHT,
      branchYPx: slot.branchYPx + pass * PASS_HEIGHT,
    }
  })

  return (
    <div className="relative w-full select-none" style={{ height: `${containerH}px` }}>

      {/* ── Trunk ── */}
      <div
        className="absolute bg-brand-brown rounded-full"
        style={{
          left:      `${TRUNK_PCT}%`,
          top:       0,
          height:    `${containerH - 18}px`,
          width:     `${TRUNK_PX}px`,
          transform: 'translateX(-50%)',
        }}
      />

      {/* ── Base platform ── */}
      <div
        className="absolute bottom-0 bg-brand-brown rounded-xl shadow"
        style={{
          left:   `calc(${TRUNK_PCT}% - 12%)`,
          width:  '24%',
          height: '18px',
        }}
      />

      {/* ── Perches ── */}
      {items.map(({ key, cat, type, side, leftPct, topPx, branchYPx }) => {
        const cardRightPct = leftPct + CARD_W_PCT
        const isLeft       = side === 'left'

        // Branch spans from card edge to trunk (minus half trunk width = 6px)
        const branchLeft  = isLeft ? `${cardRightPct}%`     : `${TRUNK_PCT}%`
        const branchWidth = isLeft
          ? `calc(${TRUNK_PCT - cardRightPct}% - 6px)`
          : `calc(${leftPct - TRUNK_PCT}% - 6px)`

        return (
          <div key={key}>
            {/* Horizontal branch */}
            <div
              className="absolute bg-brand-brown rounded-full"
              style={{
                left:      branchLeft,
                top:       `${branchYPx}px`,
                width:     branchWidth,
                height:    '10px',
                transform: 'translateY(-50%)',
              }}
            />

            {/* Perch card */}
            <div
              className="absolute"
              style={{
                left:  `${leftPct}%`,
                top:   `${topPx}px`,
                width: `${CARD_W_PCT}%`,
              }}
            >
              {!cat                ? <AddCatPerch /> :
               type === 'shelf'   ? <ShelfPerch   cat={cat} /> :
               type === 'cubie'   ? <CubiePerch   cat={cat} /> :
                                    <HammockPerch  cat={cat} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
