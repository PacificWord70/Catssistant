// Uses the real Catssistant logo assets from public/images/

interface Props {
  horizontal?: boolean  // true = orange cat face + text side by side (navbar)
                        // false = sitting cat above text (home screen)
  height?: number       // rendered height in px (width scales automatically)
  className?: string
}

export default function CatssistantLogo({
  horizontal = false,
  height = 60,
  className = '',
}: Props) {
  if (horizontal) {
    return (
      <img
        src="/images/logo-horizontal.png"
        alt="Catssistant"
        height={height}
        style={{ height: `${height}px`, width: 'auto' }}
        className={className}
      />
    )
  }

  return (
    <img
      src="/images/logo-vertical.png"
      alt="Catssistant"
      height={height}
      style={{ height: `${height}px`, width: 'auto' }}
      className={className}
    />
  )
}
