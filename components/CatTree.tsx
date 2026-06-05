import Link from 'next/link'
import CatssistantLogo from '@/components/CatssistantLogo'

// ─── Navigation items — matches the MVP flow diagram ─────────────────────────
const NAV_ITEMS = [
  {
    href:    '/cats',
    label:   'My Cats',
    emoji:   '🐱',
    desc:    'Profiles, owner & sitter view',
    type:    'shelf'   as const,
    side:    'left'    as const,
    leftPct: 4,
    topPx:   130,
    branchYPx: 188,
  },
  {
    href:    '/schedule',
    label:   'Schedule',
    emoji:   '📅',
    desc:    'Calendar, health & care log',
    type:    'hammock' as const,
    side:    'right'   as const,
    leftPct: 55,
    topPx:   285,
    branchYPx: 351,
  },
  {
    href:    '/shopping',
    label:   'Shopping',
    emoji:   '🛍️',
    desc:    'Food, toys & recommendations',
    type:    'cubie'   as const,
    side:    'left'    as const,
    leftPct: 9,
    topPx:   450,
    branchYPx: 510,
  },
  {
    href:    '/breeds',
    label:   'Breeds',
    emoji:   '📚',
    desc:    'Breed catalog & search',
    type:    'shelf'   as const,
    side:    'right'   as const,
    leftPct: 60,
    topPx:   598,
    branchYPx: 656,
  },
  {
    href:    '/resources',
    label:   'Resources',
    emoji:   '🔗',
    desc:    'Vets, boarding & external links',
    type:    'hammock' as const,
    side:    'left'    as const,
    leftPct: 2,
    topPx:   745,
    branchYPx: 811,
  },
  {
    href:    '/about',
    label:   'About',
    emoji:   '💬',
    desc:    'Suggestions & feedback',
    type:    'cubie'   as const,
    side:    'right'   as const,
    leftPct: 57,
    topPx:   878,
    branchYPx: 938,
  },
]

// Layout constants
const TRUNK_PCT  = 42   // trunk center as % of container width
const CARD_W_PCT = 22   // perch card width as % of container
const TRUNK_PX   = 14   // trunk visual width in px
const TREE_H     = 1070 // total tree height in px

// ─── Perch card variants — styled like an actual cat tree ─────────────────────

function ShelfCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="w-full group">
      <div className="bg-white rounded-xl px-4 py-4 shadow-sm border border-stone-200 text-center
                      group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        <div className="text-4xl mb-2 select-none">{emoji}</div>
        <p className="font-semibold text-brand-charcoal leading-tight">{label}</p>
        <p className="text-xs text-gray-400 mt-1 leading-snug">{desc}</p>
      </div>
      {/* Shelf plank — matches the gray cat tree in the Figma */}
      <div className="h-3 rounded-full shadow-md mx-1 mt-0.5 bg-stone-400" />
    </div>
  )
}

function CubieCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="relative bg-stone-100 border-[3px] border-stone-400 rounded-2xl
                    px-4 pb-4 pt-5 shadow text-center w-full
                    hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer group">
      {/* Circular entry hole — as shown in the Figma mockup */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2
                      w-7 h-7 rounded-full bg-stone-400 border-2 border-stone-100 shadow" />
      <div className="text-4xl mb-2 select-none">{emoji}</div>
      <p className="font-semibold text-brand-charcoal leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-1 leading-snug">{desc}</p>
    </div>
  )
}

function HammockCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="w-full group">
      {/* Hanging ropes from the platform above */}
      <div className="flex justify-between px-7">
        <div className="w-0.5 h-5 bg-stone-400" />
        <div className="w-0.5 h-5 bg-stone-400" />
      </div>
      <div className="bg-brand-tan/20 border-2 border-brand-tan/40 rounded-b-[2.5rem]
                      px-4 py-4 text-center shadow-inner
                      group-hover:bg-brand-tan/35 transition-colors duration-200 cursor-pointer">
        <div className="text-4xl mb-2 select-none">{emoji}</div>
        <p className="font-semibold text-brand-charcoal leading-tight">{label}</p>
        <p className="text-xs text-gray-400 mt-1 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

// ─── Main tree (pure server component — no data needed) ───────────────────────
export default function CatTree() {
  return (
    <div className="relative w-full select-none" style={{ height: `${TREE_H}px` }}>

      {/* ── Logo & tagline ── */}
      <div className="absolute top-6 w-full flex flex-col items-center z-10 pointer-events-none">
        <CatssistantLogo horizontal={false} height={160} />
        <p className="text-sm text-brand-tan mt-2">Your cat care headquarters</p>
      </div>

      {/* ── Trunk — gray rounded pole matching the Figma cat tree ── */}
      <div
        className="absolute bg-stone-400 rounded-full"
        style={{
          left:      `${TRUNK_PCT}%`,
          top:       0,
          height:    `${TREE_H - 20}px`,
          width:     `${TRUNK_PX}px`,
          transform: 'translateX(-50%)',
        }}
      />

      {/* ── Top cap platform ── */}
      <div
        className="absolute bg-stone-400 rounded-full"
        style={{
          left:   `calc(${TRUNK_PCT}% - 10%)`,
          top:    0,
          width:  '20%',
          height: '14px',
        }}
      />

      {/* ── Base platform ── */}
      <div
        className="absolute bg-stone-400 rounded-full shadow"
        style={{
          left:   `calc(${TRUNK_PCT}% - 12%)`,
          bottom: 0,
          width:  '24%',
          height: '14px',
        }}
      />

      {/* ── Perches ── */}
      {NAV_ITEMS.map(({ href, label, emoji, desc, type, side, leftPct, topPx, branchYPx }) => {
        const isLeft       = side === 'left'
        const cardRightPct = leftPct + CARD_W_PCT

        const branchLeft  = isLeft ? `${cardRightPct}%`    : `${TRUNK_PCT}%`
        const branchWidth = isLeft
          ? `calc(${TRUNK_PCT - cardRightPct}% - 7px)`
          : `calc(${leftPct  - TRUNK_PCT}%   - 7px)`

        return (
          <div key={href}>
            {/* Horizontal branch — gray to match the cat tree poles */}
            <div
              className="absolute bg-stone-400 rounded-full"
              style={{
                left:      branchLeft,
                top:       `${branchYPx}px`,
                width:     branchWidth,
                height:    '12px',
                transform: 'translateY(-50%)',
              }}
            />

            {/* Perch card */}
            <Link
              href={href}
              className="absolute block"
              style={{
                left:  `${leftPct}%`,
                top:   `${topPx}px`,
                width: `${CARD_W_PCT}%`,
              }}
            >
              {type === 'shelf'   && <ShelfCard   emoji={emoji} label={label} desc={desc} />}
              {type === 'cubie'   && <CubieCard   emoji={emoji} label={label} desc={desc} />}
              {type === 'hammock' && <HammockCard emoji={emoji} label={label} desc={desc} />}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
