import Link from 'next/link'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/cats',      label: 'My Cats',   emoji: '🐱', desc: 'Profiles, owner & sitter view',  type: 'shelf',   side: 'left',  leftPct: 3,  topPx: 178, branchYPx: 238 },
  { href: '/schedule',  label: 'Schedule',  emoji: '📅', desc: 'Calendar, health & care log',     type: 'hammock', side: 'right', leftPct: 55, topPx: 340, branchYPx: 416 },
  { href: '/shopping',  label: 'Shopping',  emoji: '🛍️', desc: 'Food, toys & recommendations',   type: 'cubie',   side: 'left',  leftPct: 8,  topPx: 520, branchYPx: 590 },
  { href: '/breeds',    label: 'Breeds',    emoji: '📚', desc: 'Breed catalog & search',          type: 'shelf',   side: 'right', leftPct: 58, topPx: 680, branchYPx: 742 },
  { href: '/resources', label: 'Resources', emoji: '🔗', desc: 'Vets, boarding & links',          type: 'hammock', side: 'left',  leftPct: 1,  topPx: 840, branchYPx: 916 },
  { href: '/about',     label: 'About',     emoji: '💬', desc: 'Suggestions & feedback',          type: 'cubie',   side: 'right', leftPct: 56, topPx: 988, branchYPx: 1058 },
] as const

const TRUNK_PCT  = 42
const CARD_W_PCT = 23
const TREE_H     = 1160

// ─── Shared hover + transition style (injected once) ─────────────────────────
const hoverStyle = `
  .perch-link { text-decoration: none; }
  .perch-shelf,
  .perch-cubie,
  .perch-hammock-bed {
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    cursor: pointer;
  }
  .perch-link:hover .perch-shelf      { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(139,94,60,.28); }
  .perch-link:hover .perch-cubie      { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,.18); }
  .perch-link:hover .perch-hammock-bed{ transform: translateY(-4px); box-shadow: 0 8px 20px rgba(139,94,60,.22); }
`

// ─── Shelf ────────────────────────────────────────────────────────────────────
// Classic flat cat-tree platform: content floats on a chunky wooden plank.
function ShelfCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div style={{ width: '100%' }}>
      {/* Surface */}
      <div className="perch-shelf" style={{
        background: '#fff',
        borderRadius: '14px 14px 4px 4px',
        padding: '16px 14px 14px',
        textAlign: 'center',
        border: '1px solid rgba(196,149,106,.35)',
        boxShadow: '0 2px 6px rgba(0,0,0,.08)',
      }}>
        <div style={{ fontSize: '2.4rem', lineHeight: 1, marginBottom: '8px' }}>{emoji}</div>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#1F1F1F', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, lineHeight: 1.45 }}>{desc}</p>
      </div>

      {/* Plank — thick, gradient, 3-D shadow */}
      <div style={{
        height: '16px',
        background: 'linear-gradient(180deg, #C4956A 0%, #8B5E3C 100%)',
        borderRadius: '0 0 3px 3px',
        boxShadow: '0 5px 10px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.18)',
        position: 'relative',
        zIndex: 1,
      }} />
      {/* Plank underside shadow */}
      <div style={{
        height: '7px',
        background: 'linear-gradient(180deg, rgba(0,0,0,.22) 0%, transparent 100%)',
        borderRadius: '0 0 6px 6px',
      }} />
    </div>
  )
}

// ─── Cubie ────────────────────────────────────────────────────────────────────
// Enclosed cat-tree box with a prominent circular entry hole (per the Figma).
function CubieCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="perch-cubie" style={{
      background: '#F0EDE8',
      border: '5px solid #9ca3af',
      borderRadius: '14px',
      padding: '16px 12px 14px',
      textAlign: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,.10)',
      position: 'relative',
    }}>
      {/* Entry hole — dark circle, fills most of the card face */}
      <div style={{
        width: '76px',
        height: '76px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 38%, #3a3a3a, #111)',
        margin: '0 auto 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 4px 16px rgba(0,0,0,.6), 0 2px 4px rgba(0,0,0,.2)',
        border: '3px solid #6b7280',
      }}>
        {/* Emoji glows softly inside the hole */}
        <span style={{ fontSize: '2rem', filter: 'brightness(1.3) drop-shadow(0 0 4px rgba(255,200,100,.5))' }}>{emoji}</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: '14px', color: '#1F1F1F', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, lineHeight: 1.45 }}>{desc}</p>
    </div>
  )
}

// ─── Hammock ──────────────────────────────────────────────────────────────────
// Fabric sling hanging from two ring-and-rope attachment points.
function HammockCard({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div style={{ width: '100%' }}>
      {/* Attachment rings + ropes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22px' }}>
        <RopeEnd />
        <RopeEnd />
      </div>

      {/* Fabric sling — curves dramatically at the bottom like a real hammock */}
      <div className="perch-hammock-bed" style={{
        background: 'linear-gradient(170deg, #E8D5B7 0%, #D4B896 60%, #C4A07A 100%)',
        border: '2px solid #C4956A',
        // Wide elliptical curve on the bottom
        borderRadius: '10px 10px 60% 60% / 10px 10px 38px 38px',
        padding: '14px 14px 28px',
        textAlign: 'center',
        boxShadow: '0 3px 10px rgba(139,94,60,.18), inset 0 -4px 8px rgba(0,0,0,.08)',
        // Subtle woven-fabric stripe
        backgroundImage: `
          linear-gradient(170deg, #E8D5B7 0%, #D4B896 60%, #C4A07A 100%),
          repeating-linear-gradient(90deg, transparent 0px, transparent 10px, rgba(0,0,0,.04) 10px, rgba(0,0,0,.04) 11px)
        `,
        backgroundBlendMode: 'multiply',
      }}>
        <div style={{ fontSize: '2.4rem', lineHeight: 1, marginBottom: '8px' }}>{emoji}</div>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#4a3520', margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#7a6040', margin: 0, lineHeight: 1.45 }}>{desc}</p>
      </div>
    </div>
  )
}

function RopeEnd() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Ring */}
      <div style={{
        width: '12px', height: '12px', borderRadius: '50%',
        border: '2.5px solid #8B5E3C', background: '#C4956A',
        boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }} />
      {/* Rope */}
      <div style={{
        width: '2.5px', height: '20px',
        background: 'repeating-linear-gradient(180deg, #8B5E3C 0px, #8B5E3C 4px, #C4956A 4px, #C4956A 6px)',
        borderRadius: '1px',
      }} />
    </div>
  )
}

// ─── Main tree ────────────────────────────────────────────────────────────────
export default function CatTree() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hoverStyle }} />

      <div style={{ position: 'relative', width: '100%', height: `${TREE_H}px`, background: '#FAFAF5' }}>

        {/* ── Logo ── */}
        <div style={{ position: 'absolute', top: '18px', left: 0, right: 0, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <img src="/images/logo-vertical.png" alt="Catssistant" style={{ height: '138px', width: 'auto' }} />
          <p style={{ fontSize: '12px', color: '#C4956A', marginTop: '2px', letterSpacing: '.04em' }}>
            Your cat care headquarters
          </p>
        </div>

        {/* ── Top cap platform ── */}
        <div style={{
          position: 'absolute',
          left: `calc(${TRUNK_PCT}% - 11%)`,
          top: 0,
          width: '22%',
          height: '16px',
          background: 'linear-gradient(180deg, #C4956A 0%, #8B5E3C 100%)',
          borderRadius: '999px',
          boxShadow: '0 3px 8px rgba(0,0,0,.25)',
        }} />

        {/* ── Trunk — sisal-rope texture ── */}
        <div style={{
          position: 'absolute',
          left: `${TRUNK_PCT}%`,
          top: 0,
          height: `${TREE_H - 22}px`,
          width: '16px',
          transform: 'translateX(-50%)',
          borderRadius: '8px',
          background: `repeating-linear-gradient(
            180deg,
            #9B6E48 0px, #9B6E48 9px,
            #7A5230 9px, #7A5230 13px
          )`,
          boxShadow: '2px 0 6px rgba(0,0,0,.18), -1px 0 3px rgba(0,0,0,.10)',
        }} />

        {/* ── Base platform ── */}
        <div style={{
          position: 'absolute',
          left: `calc(${TRUNK_PCT}% - 13%)`,
          bottom: 0,
          width: '26%',
          height: '22px',
          background: 'linear-gradient(180deg, #C4956A 0%, #7A5230 100%)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,.30)',
        }} />

        {/* ── Perches ── */}
        {NAV_ITEMS.map(({ href, label, emoji, desc, type, side, leftPct, topPx, branchYPx }) => {
          const isLeft       = side === 'left'
          const cardRightPct = leftPct + CARD_W_PCT

          const branchLeft  = isLeft ? `${cardRightPct}%`  : `${TRUNK_PCT}%`
          const branchWidth = isLeft
            ? `calc(${TRUNK_PCT - cardRightPct}% - 8px)`
            : `calc(${leftPct  - TRUNK_PCT}%   - 8px)`

          return (
            <div key={href}>
              {/* Branch — tapered wood plank with end cap */}
              <div style={{
                position: 'absolute',
                left: branchLeft,
                top: `${branchYPx}px`,
                width: branchWidth,
                height: '14px',
                background: 'linear-gradient(180deg, #C4956A 0%, #8B5E3C 100%)',
                borderRadius: '999px',
                transform: 'translateY(-50%)',
                boxShadow: '0 3px 6px rgba(0,0,0,.22)',
              }} />

              {/* Perch card */}
              <Link
                href={href}
                className="perch-link"
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPx}px`,
                  width: `${CARD_W_PCT}%`,
                  display: 'block',
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
    </>
  )
}
