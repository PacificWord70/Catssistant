'use client'

import { useEffect, useState } from 'react'

export default function CatWalker() {
  const [walking, setWalking] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    function scheduleWalk() {
      const delay = (Math.random() * 90 + 30) * 1000
      timeout = setTimeout(() => setWalking(true), delay)
    }

    scheduleWalk()
    return () => clearTimeout(timeout)
  }, [])

  function handleAnimationEnd() {
    setWalking(false)
    const delay = (Math.random() * 90 + 30) * 1000
    setTimeout(() => setWalking(true), delay)
  }

  if (!walking) return null

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-10 left-0 z-0 pointer-events-none text-brand-brown/30 animate-cat-walk"
      onAnimationEnd={handleAnimationEnd}
    >
      <svg width="72" height="58" viewBox="0 0 120 96" fill="currentColor">
        <ellipse cx="60" cy="66" rx="36" ry="22" />
        <circle cx="60" cy="34" r="22" />
        <polygon points="42,18 34,2 52,16" />
        <polygon points="78,18 86,2 68,16" />
        <path
          d="M96,64 Q112,48 108,30"
          stroke="currentColor"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="30" y="82" width="10" height="14" rx="5" />
        <rect x="44" y="84" width="10" height="12" rx="5" />
        <rect x="66" y="84" width="10" height="12" rx="5" />
        <rect x="80" y="82" width="10" height="14" rx="5" />
      </svg>
    </div>
  )
}
