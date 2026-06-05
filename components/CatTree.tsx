import Link from 'next/link'

// ─── Nav items — one perch per app section ────────────────────────────────────
const NAV_ITEMS = [
  {
    href:    '/cats',
    label:   'My Cats',
    emoji:   '🐱',
    desc:    'Profiles & care records',
    type:    'shelf'   as const,
    side:    'left'    as const,
    leftPct: 4,
    topPx:   115,
    branchYPx: 172,
  },
  {
    href:    '/feeding',
    label:   'Feeding',
    emoji:   '🍽️',
    desc:    'Meals & schedules',
    type:    'hammock' as const,
    side:    'right'   as const,
    leftPct: 55,
    topPx:   270,
    branchYPx: 336,
  },
  {
    href:    '/health',
    label:   'Health',
    emoji:   '🏥',
    desc:    'Vets, vaccines & weight',
    type:    'cubie'   as const,
    side:    'left'    as const,
    leftPct: 9,
    topPx:   432,
    branchYPx: 492,
  },
  {
    href:    '/litter',
    label:   'Litter',
    emoji:   '🪣',
    desc:    'Cleaning reminders',
    type:    'shelf'   as const,
    side:    'right'   as const,
    leftPct: 62,
    topPx:   578,
    branchYPx: 636,
  },
  {
    href:    '/meds',
    label:   'Meds',
    emoji:   '💊',
    desc:    'Medicine schedule',
    type:    'hammock' as const,
    side:    'left'    as const,
    leftPct: 1,
    topPx:   725,
    branchYPx: 791,
  },
  {
    href:    '/tips',
    label:   'Tips',
    emoji:   '💡',
    desc:    'Cat care advice',
    type:    'cubie'   as const,
    side:    'right'   as const,
    leftPct: 57,
    topPx:   862,
    branchYPx: 922,
  },
]

const TRUNK_PCT  = 42   // trunk center, % of container
const CARD_W_PCT = 22   // perch card width, % of container
const TRUNK_PX   = 12   // trunk visual width in px
const TREE_H     = 1050 // total tree height in px

// ─── Perch card variants ──────────────────────────────────────────────────────

function ShelfCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="w-full">
      <div className="bg-white rounded-xl px-4 py-4 shadow-sm border border-brand-tan/20 text-center
                      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        <div className="text-4xl mb-2 select-none">{emoji}</div>
        <p className="font-semibold text-brand-charcoal leading-tight">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{desc}</p>
      </div>
      {/* Shelf plank */}
      <div className="h-3 bg-brand-brown rounded-full shadow-md mx-1 mt-0.5" />
    </div>
  )
}

function CubieCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="relative bg-brand-cream border-[3px] border-brand-brown rounded-2xl
                    px-4 pb-4 pt-5 shadow text-center
                    hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer w-full">
      {/* Entry hole knob */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2
                      w-7 h-7 rounded-full bg-brand-brown border-2 border-brand-cream shadow" />
      <div className="text-4xl mb-2 select-none">{emoji}</div>
      <p className="font-semibold text-brand-charcoal leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  )
}

function HammockCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="w-full">
      {/* Hanging ropes */}
      <div className="flex justify-between px-7">
        <div className="w-px h-5 bg-brand-brown" />
        <div className="w-px h-5 bg-brand-brown" />
      </div>
      {/* Hammock bed */}
      <div className="bg-brand-tan/25 border-2 border-brand-tan rounded-b-[2.5rem] px-4 py-4
                      text-center shadow-inner
                      hover:bg-brand-tan/45 transition-colors duration-200 cursor-pointer">
        <div className="text-4xl mb-2 select-none">{emoji}</div>
        <p className="font-semibold text-brand-charcoal leading-tight">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{desc}</p>
      </div>
    </div>
  )
}

// ─── Main tree (server component — pure nav, no data needed) ──────────────────
export default function CatTree() {
  return (
    <div className="relative w-full select-none" style={{ height: `${TREE_H}px` }}>

      {/* App title, centred above trunk */}
      <div className="absolute top-6 w-full text-center z-10 pointer-events-none">
        <h1 className="font-display text-4xl text-brand-brown drop-shadow-sm">
          🐱 Catssistant
        </h1>
        <p className="text-sm text-brand-tan mt-1">Your cat care headquarters</p>
      </div>

      {/* Trunk */}
      <div
        className="absolute bg-brand-brown rounded-full"
        style={{
          left:      `${TRUNK_PCT}%`,
          top:       0,
          height:    `${TREE_H - 18}px`,
          width:     `${TRUNK_PX}px`,
          transform: 'translateX(-50%)',
        }}
      />

      {/* Base platform */}
      <div
        className="absolute bottom-0 bg-brand-brown rounded-xl shadow"
        style={{
          left:   `calc(${TRUNK_PCT}% - 12%)`,
          width:  '24%',
          height: '18px',
        }}
      />

      {/* Perches */}
      {NAV_ITEMS.map(({ href, label, emoji, desc, type, side, leftPct, topPx, branchYPx }) => {
        const isLeft      = side === 'left'
        const cardRightPct = leftPct + CARD_W_PCT

        const branchLeft  = isLeft ? `${cardRightPct}%` : `${TRUNK_PCT}%`
        const branchWidth = isLeft
          ? `calc(${TRUNK_PCT - cardRightPct}% - 6px)`
          : `calc(${leftPct - TRUNK_PCT}% - 6px)`

        return (
          <div key={href}>
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

            {/* Perch card — wrapped in Link */}
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
