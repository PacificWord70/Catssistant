'use client'

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface Props {
  children: ReactNode
  className?: string
  /** Magnitude of the vertical translate range, in pixels. */
  offset?: number
}

export default function Parallax({ children, className, offset = 30 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset])

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  )
}
