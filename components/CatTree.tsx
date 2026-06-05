import Link from 'next/link'

// ─── Layout ───────────────────────────────────────────────────────────────────
const LP   = 20    // left pole centre %
const RP   = 70    // right pole centre %
const PW   = 18    // pole width px
const TH   = 1130  // tree height px

// Colors
const TAN  = '#E8C87A'
const TAN2 = '#C49040'
const BRWN = '#A07840'

// ─── Structural pieces ────────────────────────────────────────────────────────
function Pole({ pct, h }: { pct: number; h: number }) {
  return (
    <div style={{
      position:'absolute', left:`${pct}%`, top:0, height:`${h}px`,
      width:`${PW}px`, transform:'translateX(-50%)', zIndex:1,
      borderRadius:'9px',
      background:`repeating-linear-gradient(180deg,${TAN} 0px,${TAN} 7px,${TAN2} 7px,${TAN2} 10px)`,
      boxShadow:'2px 0 5px rgba(0,0,0,.18)',
    }}/>
  )
}

function Plank({ l, r, y, h=16 }: { l:number; r:number; y:number; h?:number }) {
  return (
    <div style={{
      position:'absolute', left:`${l}%`, width:`${r-l}%`, top:`${y}px`,
      height:`${h}px`, zIndex:2,
      background:`linear-gradient(180deg,${TAN} 0%,${TAN2} 100%)`,
      borderRadius:'5px',
      boxShadow:'0 4px 8px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.18)',
    }}/>
  )
}

// ─── Decorative cats ──────────────────────────────────────────────────────────
function CatSleep({ c='#bbb' }: { c?: string }) {
  return (
    <svg viewBox="0 0 82 36" width="76" height="33" style={{display:'block'}}>
      <ellipse cx="46" cy="24" rx="28" ry="10" fill={c}/>
      <circle cx="15" cy="18" r="12" fill={c}/>
      <polygon points="7,10 12,1 18,10" fill={c}/>
      <polygon points="8,10 12,4 17,10" fill="rgba(255,180,180,.5)"/>
      <path d="M72,24 Q82,16 78,10" stroke={c} strokeWidth="8" fill="none" strokeLinecap="round"/>
      <path d="M9,19 Q15,17 21,19" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <line x1="3" y1="16" x2="9" y2="18" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
      <line x1="3" y1="19" x2="9" y2="19" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function CatSit({ c='#bbb' }: { c?: string }) {
  return (
    <svg viewBox="0 0 46 54" width="40" height="48" style={{display:'block'}}>
      <ellipse cx="23" cy="43" rx="15" ry="9" fill={c}/>
      <circle cx="23" cy="22" r="13" fill={c}/>
      <polygon points="13,12 17,2 23,12" fill={c}/>
      <polygon points="8,12 12,5 18,12" fill="rgba(255,180,180,.5)"/>
      <polygon points="23,12 29,2 33,12" fill={c}/>
      <polygon points="28,12 32,5 36,12" fill="rgba(255,180,180,.5)"/>
      <circle cx="17" cy="22" r="3.5" fill="#111"/>
      <circle cx="29" cy="22" r="3.5" fill="#111"/>
      <circle cx="18.5" cy="20.5" r="1.2" fill="#fff"/>
      <circle cx="30.5" cy="20.5" r="1.2" fill="#fff"/>
      <polygon points="23,29 20,26 26,26" fill="#FFB3C6"/>
      <path d="M36,43 Q46,37 42,28" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

function CatFace({ c='#fff' }: { c?: string }) {
  return (
    <svg viewBox="0 0 52 48" width="46" height="42" style={{display:'block'}}>
      <circle cx="26" cy="30" r="17" fill={c}/>
      <polygon points="12,16 17,5 23,16" fill={c}/>
      <polygon points="13,16 17,8 22,16" fill="rgba(255,180,180,.5)"/>
      <polygon points="29,16 35,5 40,16" fill={c}/>
      <polygon points="30,16 35,8 39,16" fill="rgba(255,180,180,.5)"/>
      <circle cx="19" cy="29" r="4" fill="#111"/>
      <circle cx="33" cy="29" r="4" fill="#111"/>
      <circle cx="20.5" cy="27.5" r="1.4" fill="#fff"/>
      <circle cx="34.5" cy="27.5" r="1.4" fill="#fff"/>
      <polygon points="26,36 23,33 29,33" fill="#FFB3C6"/>
      <line x1="7" y1="30" x2="19" y2="33" stroke="#ccc" strokeWidth="1"/>
      <line x1="33" y1="33" x2="45" y2="30" stroke="#ccc" strokeWidth="1"/>
    </svg>
  )
}

// ─── Rope-end (hammock attachment) ────────────────────────────────────────────
function RopeEnd() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{
        width:12,height:12,borderRadius:'50%',
        background:TAN2, border:`2px solid ${BRWN}`,
        boxShadow:'0 1px 3px rgba(0,0,0,.3)',
      }}/>
      <div style={{
        width:3,height:22,
        background:`repeating-linear-gradient(180deg,${BRWN} 0px,${BRWN} 4px,${TAN} 4px,${TAN} 7px)`,
      }}/>
    </div>
  )
}

// ─── Perch: Shelf ─────────────────────────────────────────────────────────────
// Shelf IS the branch. Cat and label card sit ON TOP of the plank.
function ShelfPerch({ href, label, emoji, desc, l, r, plankY, catC='#bbb' }: {
  href:string; label:string; emoji:string; desc:string;
  l:number; r:number; plankY:number; catC?:string;
}) {
  return (
    <Link href={href} className="perch-link" style={{
      position:'absolute', left:`${l}%`, width:`${r-l}%`,
      top:`${plankY - 116}px`, display:'block', textDecoration:'none',
    }}>
      {/* Cat sleeping on shelf */}
      <div style={{display:'flex',justifyContent:'center',marginBottom:2}}>
        <CatSleep c={catC}/>
      </div>
      {/* Nav card (sits on plank surface) */}
      <div className="perch-card" style={{
        background:'#fff', borderRadius:'8px 8px 0 0',
        padding:'8px 10px 6px', textAlign:'center',
        border:'1px solid rgba(196,149,106,.35)',
        boxShadow:'0 2px 4px rgba(0,0,0,.08)',
      }}>
        <span style={{fontSize:'1.5rem'}}>{emoji}</span>
        <p style={{fontWeight:700,fontSize:'13px',color:'#1F1F1F',margin:'2px 0 1px'}}>{label}</p>
        <p style={{fontSize:'10px',color:'#9ca3af',margin:0,lineHeight:1.35}}>{desc}</p>
      </div>
      {/* Plank — sits below card, IS the shelf */}
      <div style={{
        height:16, borderRadius:'0 0 4px 4px',
        background:`linear-gradient(180deg,${TAN} 0%,${TAN2} 100%)`,
        boxShadow:'0 5px 10px rgba(0,0,0,.25)',
      }}/>
      <div style={{height:6,background:'linear-gradient(180deg,rgba(0,0,0,.18) 0%,transparent 100%)',borderRadius:'0 0 4px 4px'}}/>
    </Link>
  )
}

// ─── Perch: Cubie ─────────────────────────────────────────────────────────────
// Box sits ON TOP of a wide platform. Branch level = platform top.
function CubiePerch({ href, label, desc, cx, platL, platR, platY, catC='#fff' }: {
  href:string; label:string; desc:string;
  cx:number; platL:number; platR:number; platY:number; catC?:string;
}) {
  const CW = 22   // cubie width %
  const CH = 118  // cubie height px
  return (
    <>
      <Plank l={platL} r={platR} y={platY}/>
      <Link href={href} className="perch-link" style={{
        position:'absolute', left:`${cx - CW/2}%`, width:`${CW}%`,
        top:`${platY - CH}px`, display:'block', textDecoration:'none',
      }}>
        <div className="perch-card" style={{
          height:CH, background:'#F0EDE5',
          border:'4px solid #A09080', borderRadius:'10px',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'0 8px', boxShadow:'0 2px 6px rgba(0,0,0,.12)',
          position:'relative', overflow:'hidden',
        }}>
          {/* Roof stripe */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:13,
            background:`linear-gradient(180deg,${TAN} 0%,${TAN2} 100%)`,
            borderRadius:'6px 6px 0 0',
          }}/>
          {/* Entry hole */}
          <div style={{
            width:70,height:70,borderRadius:'50%',marginTop:10,
            background:'radial-gradient(circle at 38% 36%,#2a2a2a,#0d0d0d)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'inset 0 4px 14px rgba(0,0,0,.7)',
            border:'3px solid #808080',
          }}>
            <CatFace c={catC}/>
          </div>
          <p style={{fontWeight:700,fontSize:'12px',color:'#1F1F1F',margin:'5px 0 2px',textAlign:'center'}}>{label}</p>
          <p style={{fontSize:'10px',color:'#9ca3af',margin:0,textAlign:'center',lineHeight:1.3}}>{desc}</p>
        </div>
      </Link>
    </>
  )
}

// ─── Perch: Hammock ───────────────────────────────────────────────────────────
// Hangs at branch level. Ropes attach to pole at `y`, fabric sags below.
function HammockPerch({ href, label, desc, l, r, y, catC='#aaa' }: {
  href:string; label:string; desc:string;
  l:number; r:number; y:number; catC?:string;
}) {
  return (
    <Link href={href} className="perch-link" style={{
      position:'absolute', left:`${l}%`, width:`${r-l}%`,
      top:`${y}px`, display:'block', textDecoration:'none',
    }}>
      {/* Rope attachment points */}
      <div style={{display:'flex',justifyContent:'space-between',padding:'0 10px'}}>
        <RopeEnd/><RopeEnd/>
      </div>
      {/* Fabric sling */}
      <div className="perch-card" style={{
        background:'linear-gradient(170deg,#F5F0E0 0%,#E8DEC8 55%,#D8C8A8 100%)',
        border:'2px solid #C4A860',
        borderRadius:'10px 10px 55% 55% / 10px 10px 38px 38px',
        padding:'10px 12px 22px', textAlign:'center',
        boxShadow:'0 3px 10px rgba(0,0,0,.15)',
      }}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:4}}>
          <CatSit c={catC}/>
        </div>
        <p style={{fontWeight:700,fontSize:'13px',color:'#3a2a10',margin:'0 0 2px'}}>{label}</p>
        <p style={{fontSize:'10px',color:'#7a6040',margin:0,lineHeight:1.35}}>{desc}</p>
      </div>
    </Link>
  )
}

// ─── Main tree ────────────────────────────────────────────────────────────────
export default function CatTree() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .perch-link { cursor:pointer; }
        .perch-card { transition: transform .18s ease, box-shadow .18s ease; }
        .perch-link:hover .perch-card { transform:translateY(-5px); box-shadow:0 8px 20px rgba(0,0,0,.22) !important; }
      ` }}/>

      {/* Logo */}
      <div style={{textAlign:'center',padding:'16px 0 0'}}>
        <img src="/images/logo-vertical.png" alt="Catssistant" style={{height:128,width:'auto'}}/>
        <p style={{fontSize:'12px',color:'#C4956A',margin:'3px 0 0',letterSpacing:'.04em'}}>
          Your cat care headquarters
        </p>
      </div>

      {/* Tree canvas */}
      <div style={{position:'relative',width:'100%',height:`${TH}px`,background:'#FAFAF5',marginTop:6}}>

        {/* Top cap */}
        <Plank l={11} r={80} y={0} h={14}/>

        {/* Both poles, full height */}
        <Pole pct={LP} h={TH-20}/>
        <Pole pct={RP} h={TH-20}/>

        {/* Base */}
        <div style={{
          position:'absolute',left:'8%',right:'8%',bottom:0,
          height:22,zIndex:2,borderRadius:11,
          background:`linear-gradient(180deg,${TAN} 0%,${BRWN} 100%)`,
          boxShadow:'0 4px 12px rgba(0,0,0,.28)',
        }}/>

        {/* ── 1. My Cats — shelf, left ── */}
        <ShelfPerch
          href="/cats" label="My Cats" emoji="🐱"
          desc="Profiles, owner & sitter view"
          l={11} r={54} plankY={222} catC="#C8C8C8"
        />

        {/* ── 2. Schedule — cubie, centre ── */}
        <CubiePerch
          href="/schedule" label="Schedule" desc="Calendar, health & care log"
          cx={45} platL={18} platR={72} platY={400} catC="#F5C880"
        />

        {/* ── 3. Shopping — hammock, left→centre ── */}
        <HammockPerch
          href="/shopping" label="Shopping" desc="Food, toys & recommendations"
          l={18} r={57} y={480} catC="#A8B8C8"
        />

        {/* ── 4. Breeds — shelf, right ── */}
        <ShelfPerch
          href="/breeds" label="Breeds" emoji="📚"
          desc="Breed catalog & search"
          l={53} r={81} plankY={724} catC="#E8761E"
        />

        {/* ── 5. Resources — hammock, left ── */}
        <HammockPerch
          href="/resources" label="Resources" desc="Vets, boarding & links"
          l={12} r={52} y={826} catC="#C0C0C0"
        />

        {/* ── 6. About — cubie, centre-right ── */}
        <CubiePerch
          href="/about" label="About" desc="Suggestions & feedback"
          cx={48} platL={18} platR={72} platY={1100} catC="#fff"
        />

      </div>
    </>
  )
}
