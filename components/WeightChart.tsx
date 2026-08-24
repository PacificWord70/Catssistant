'use client'

import { useState } from 'react'
import { chartGeometry, WeightPoint } from '@/lib/healthAnalysis'

interface Props {
  series: WeightPoint[]
  /** Called with the record id when a point is clicked, to edit that reading. */
  onSelect?: (id: string) => void
}

/* Drawn by hand rather than with a charting library: dependencies need a team
   discussion first (CLAUDE.md), and one line with one axis does not justify
   one. The maths lives in lib/healthAnalysis so it can be tested; this file is
   only the drawing. */
const VIEW = { width: 640, height: 260 }
const PADDING = { top: 16, right: 16, bottom: 34, left: 46 }

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function WeightChart({ series, onSelect }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const geo = chartGeometry(series, VIEW.width, VIEW.height, PADDING)

  if (!geo) return null

  const line = geo.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  // Closing the path down to the baseline gives the line something to sit on,
  // which reads as a trend rather than as a piece of string.
  const area =
    geo.points.length > 1
      ? `${line} L${geo.points[geo.points.length - 1].x.toFixed(1)} ${VIEW.height - PADDING.bottom}` +
        ` L${geo.points[0].x.toFixed(1)} ${VIEW.height - PADDING.bottom} Z`
      : ''

  const shown = active !== null ? geo.points[active] : geo.points[geo.points.length - 1]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label={
          series.length === 1
            ? `Weight over time: one reading, ${series[0].value.toFixed(1)} pounds on ${series[0].date}`
            : `Weight over time: ${series.length} readings, from ${series[0].value.toFixed(1)} to ${series[series.length - 1].value.toFixed(1)} pounds`
        }
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        {/* Gridlines and the pound labels they carry */}
        {geo.ticks.map(t => (
          <g key={t.value}>
            <line
              x1={PADDING.left}
              y1={t.y}
              x2={VIEW.width - PADDING.right}
              y2={t.y}
              stroke="#E7C9A9"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
            <text x={PADDING.left - 8} y={t.y + 4} textAnchor="end" fontSize={11} fill="#6B4A34" opacity={0.65}>
              {t.value.toFixed(1)}
            </text>
          </g>
        ))}

        {area && <path d={area} fill="#F26A1B" opacity={0.1} />}
        <path d={line} fill="none" stroke="#F26A1B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {geo.points.map((p, i) => (
          <g key={`${p.point.date}-${i}`}>
            {/* A generous invisible target — the visible dot is far too small to
                hit on a phone. */}
            <circle
              cx={p.x}
              cy={p.y}
              r={16}
              fill="transparent"
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => onSelect?.(p.point.id)}
            >
              <title>{`${p.point.value.toFixed(1)} lbs on ${p.point.date}${onSelect ? ' — click to edit' : ''}`}</title>
            </circle>
            <circle
              cx={p.x}
              cy={p.y}
              r={active === i ? 6 : 4}
              fill="#FFFBF6"
              stroke="#F26A1B"
              strokeWidth={2.5}
              style={{ pointerEvents: 'none', transition: 'r 0.12s ease' }}
            />
          </g>
        ))}

        {/* Only the ends of the axis are labelled. Every date turns into an
            unreadable smear once there are more than a few readings. */}
        <text x={geo.points[0].x} y={VIEW.height - 12} textAnchor="middle" fontSize={11} fill="#6B4A34" opacity={0.65}>
          {shortDate(series[0].date)}
        </text>
        {series.length > 1 && (
          <text
            x={geo.points[geo.points.length - 1].x}
            y={VIEW.height - 12}
            textAnchor="middle"
            fontSize={11}
            fill="#6B4A34"
            opacity={0.65}
          >
            {shortDate(series[series.length - 1].date)}
          </text>
        )}
      </svg>

      <p className="text-center text-sm text-brand-brown/70 mt-2">
        <span className="font-semibold text-brand-brown">{shown.point.value.toFixed(1)} lbs</span>
        {' · '}
        {shortDate(shown.point.date)}
        {active === null && series.length > 1 && <span className="text-brand-brown/45"> (latest)</span>}
      </p>
    </div>
  )
}
