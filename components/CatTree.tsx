import Link from 'next/link'

// ─── Nav items — matches the MVP flow diagram ─────────────────────────────────
const NAV_ITEMS = [
  { href: '/cats',      label: 'My Cats',   emoji: '🐱', desc: 'Profiles, owner & sitter view',   type: 'shelf',   side: 'left',  leftPct: 4,  topPx: 170, branchYPx: 228 },
  { href: '/schedule',  label: 'Schedule',  emoji: '📅', desc: 'Calendar, health & care log',      type: 'hammock', side: 'right', leftPct: 55, topPx: 320, branchYPx: 388 },
  { href: '/shopping',  label: 'Shopping',  emoji: '🛍️', desc: 'Food, toys & recommendations',    type: 'cubie',   side: 'left',  leftPct: 9,  topPx: 490, branchYPx: 550 },
  { href: '/breeds',    label: 'Breeds',    emoji: '📚', desc: 'Breed catalog & search',           type: 'shelf',   side: 'right', leftPct: 60, topPx: 638, branchYPx: 696 },
  { href: '/resources', label: 'Resources', emoji: '🔗', desc: 'Vets, boarding & external links',  type: 'hammock', side: 'left',  leftPct: 2,  topPx: 785, branchYPx: 853 },
  { href: '/about',     label: 'About',     emoji: '💬', desc: 'Suggestions & feedback',           type: 'cubie',   side: 'right', leftPct: 57, topPx: 918, branchYPx: 978 },
] as const

const TRUNK_PCT  = 42   // trunk centre, % of container width
const CARD_W_PCT = 22   // perch card width, % of container
const TREE_H     = 1110 // total container height in px

// ─── Perch card styles ────────────────────────────────────────────────────────

function ShelfCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="w-full">
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.12)', border: '1px solid #e5d5c4', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{emoji}</div>
        <p style={{ fontWeight: 600, color: '#1F1F1F', margin: 0, lineHeight: 1.3 }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', lineHeight: 1.4 }}>{desc}</p>
      </div>
      {/* Shelf plank */}
      <div style={{ height: '10px', background: '#8B5E3C', borderRadius: '999px', margin: '2px 4px 0', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }} />
    </div>
  )
}

function CubieCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div style={{ position: 'relative', background: '#FAFAF5', border: '3px solid #8B5E3C', borderRadius: '16px', padding: '16px 16px 14px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.1)' }}>
      {/* Entry hole */}
      <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '28px', borderRadius: '50%', background: '#8B5E3C', border: '3px solid #FAFAF5', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      <div style={{ marginTop: '6px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{emoji}</div>
        <p style={{ fontWeight: 600, color: '#1F1F1F', margin: 0, lineHeight: 1.3 }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', lineHeight: 1.4 }}>{desc}</p>
      </div>
    </div>
  )
}

function HammockCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="w-full">
      {/* Hanging ropes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 28px' }}>
        <div style={{ width: '2px', height: '20px', background: '#8B5E3C' }} />
        <div style={{ width: '2px', height: '20px', background: '#8B5E3C' }} />
      </div>
      {/* Hammock bed */}
      <div style={{ background: 'rgba(196,149,106,0.2)', border: '2px solid rgba(196,149,106,0.5)', borderRadius: '0 0 60px 60px', padding: '14px 16px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{emoji}</div>
        <p style={{ fontWeight: 600, color: '#1F1F1F', margin: 0, lineHeight: 1.3 }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0', lineHeight: 1.4 }}>{desc}</p>
      </div>
    </div>
  )
}

// ─── Main tree ────────────────────────────────────────────────────────────────
export default function CatTree() {
  return (
    <div style={{ position: 'relative', width: '100%', height: `${TREE_H}px`, background: '#FAFAF5', overflow: 'hidden' }}>

      {/* ── Logo ── */}
      <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <img src="/images/logo-vertical.png" alt="Catssistant" style={{ height: '140px', width: 'auto' }} />
        <p style={{ fontSize: '13px', color: '#C4956A', marginTop: '4px' }}>Your cat care headquarters</p>
      </div>

      {/* ── Trunk ── */}
      <div style={{
        position: 'absolute',
        left: `${TRUNK_PCT}%`,
        top: 0,
        height: `${TREE_H - 16}px`,
        width: '14px',
        background: '#8B5E3C',
        borderRadius: '999px',
        transform: 'translateX(-50%)',
      }} />

      {/* ── Top cap ── */}
      <div style={{ position: 'absolute', left: `calc(${TRUNK_PCT}% - 10%)`, top: 0, width: '20%', height: '14px', background: '#8B5E3C', borderRadius: '999px' }} />

      {/* ── Base ── */}
      <div style={{ position: 'absolute', left: `calc(${TRUNK_PCT}% - 12%)`, bottom: 0, width: '24%', height: '14px', background: '#8B5E3C', borderRadius: '999px' }} />

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
            {/* Branch */}
            <div style={{
              position: 'absolute',
              left: branchLeft,
              top: `${branchYPx}px`,
              width: branchWidth,
              height: '12px',
              background: '#8B5E3C',
              borderRadius: '999px',
              transform: 'translateY(-50%)',
            }} />

            {/* Perch */}
            <Link
              href={href}
              style={{
                position: 'absolute',
                left:  `${leftPct}%`,
                top:   `${topPx}px`,
                width: `${CARD_W_PCT}%`,
                display: 'block',
                textDecoration: 'none',
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
