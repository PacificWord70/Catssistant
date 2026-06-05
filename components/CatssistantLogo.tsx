// SVG recreation of the Catssistant sitting-cat logo

interface Props {
  size?: number
  catColor?: string
  textColor?: string
  showText?: boolean
  horizontal?: boolean   // horizontal layout: cat face + text side by side
}

export default function CatssistantLogo({
  size = 120,
  catColor = '#1F1F1F',
  textColor = '#8B5E3C',
  showText = true,
  horizontal = false,
}: Props) {
  if (horizontal) {
    // Cat face outline (image 3 style) + text beside it
    return (
      <div className="flex items-center gap-3">
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 80 80"
          fill="none"
          stroke="#E8841A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Cat head with ear bumps */}
          <path d="M18,68 Q8,58 8,40 Q8,18 20,12 Q28,8 40,8 Q52,8 62,14 Q70,20 70,38 Q70,56 58,65 Q50,72 38,72 Q28,72 18,68 Z" />
          {/* Left ear inner point */}
          <path d="M22,16 L18,6 L30,12" />
          {/* Right ear inner point */}
          <path d="M52,12 L56,4 L62,14" />
          {/* Whiskers (going left) */}
          <line x1="8"  y1="38" x2="26" y2="40" />
          <line x1="4"  y1="44" x2="25" y2="45" />
          <line x1="8"  y1="50" x2="25" y2="50" />
        </svg>
        {showText && (
          <span
            className="font-display leading-none"
            style={{ fontSize: size * 0.38, color: textColor }}
          >
            Catssistant
          </span>
        )}
      </div>
    )
  }

  // Vertical: sitting cat above text (image 1 style)
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 120 130"
        fill="none"
        stroke={catColor}
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Left ear */}
        <path d="M36,34 L26,14 L46,26" />
        {/* Right ear outer */}
        <path d="M68,28 L74,12 L82,24" />
        {/* Head */}
        <path d="M36,34 Q20,32 18,48 Q16,62 24,72 Q34,82 54,82 Q72,82 82,70 Q90,58 86,44 Q82,32 68,28 Q54,24 36,34 Z" />
        {/* Whiskers */}
        <line x1="18" y1="52" x2="2"  y2="46" />
        <line x1="18" y1="58" x2="0"  y2="58" />
        <line x1="18" y1="64" x2="2"  y2="70" />
        {/* Body */}
        <path d="M22,78 Q14,96 18,112 Q22,126 40,128 Q58,130 72,124 Q86,118 88,106 Q92,88 80,76" />
        {/* Tail curling right and up */}
        <path d="M80,76 Q100,80 106,66 Q114,50 100,42 Q92,36 84,44" />
        {/* Front paws */}
        <path d="M30,122 Q24,128 20,126" />
        <path d="M30,122 Q34,128 40,126" />
        <path d="M64,122 Q58,128 54,126" />
        <path d="M64,122 Q70,128 76,126" />
      </svg>
      {showText && (
        <span
          className="font-display"
          style={{ fontSize: size * 0.28, color: textColor }}
        >
          Catssistant
        </span>
      )}
    </div>
  )
}
