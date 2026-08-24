'use client'

import { useState } from 'react'
import { multiSeriesGeometry, NamedSeries } from '@/lib/healthAnalysis'

interface Props {
  series: NamedSeries[]
  /** Called with the record id when a point is clicked, to edit that reading. */
  onSelect?: (id: string) => void
}

const VIEW = { width: 640, height: 280 }
const PADDING = { top: 16, right: 16, bottom: 34, left: 46 }

/**
 * Line colours, in assignment order.
 *
 * Brand orange and slate lead because they already carry meaning in this app;
 * the rest are chosen to stay apart in hue rather than to match the palette, so
 * two cats never read as the same line. Ordered by how distinguishable the
 * first few are, since most households have two or three cats.
 */
const LINE_COLORS = ['#F26A1B', '#5F8AA8', '#2F8F83', '#8E5B8E', '#C99A2E', '#6B4A34']

export function lineColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length]
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Several cats' weights on one pair of axes.
 *
 * The axes are shared, not per-cat — see multiSeriesGeometry. Hovering a cat in
 * the key fades the others rather than hiding them, so the highlighted line
 * keeps its context instead of jumping to a different-looking chart.
 */
export default function WeightComparisonChart({ series, onSelect }: Props) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const geo = multiSeriesGeometry(series, VIEW.width, VIEW.height, PADDING)

  if (!geo) return null

  // Colour is keyed off the caller's order, not the drawn order, so a cat keeps
  // its colour even when it has no readings and drops out of the chart.
  const colorOf = (id: string) => lineColor(series.findIndex(s => s.id === id))

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label={`Weight over time for ${geo.lines.length} cats, ${geo.from} to ${geo.to}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        {geo.ticks.map(t => (
          <g key={t.lbs}>
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
              {t.lbs.toFixed(1)}
            </text>
          </g>
        ))}

        {geo.lines.map(line => {
          const dimmed = highlighted !== null && highlighted !== line.id
          const color = colorOf(line.id)
          return (
            <g key={line.id} opacity={dimmed ? 0.18 : 1} style={{ transition: 'opacity 0.15s ease' }}>
              <path
                d={line.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={highlighted === line.id ? 3.5 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {line.points.map(p => (
                <circle
                  key={p.point.id}
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="#FFFBF6"
                  stroke={color}
                  strokeWidth={2.5}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  onClick={() => onSelect?.(p.point.id)}
                >
                  <title>{`${line.label} — ${p.point.lbs.toFixed(1)} lbs on ${p.point.date}`}</title>
                </circle>
              ))}
            </g>
          )
        })}

        <text x={PADDING.left} y={VIEW.height - 12} textAnchor="start" fontSize={11} fill="#6B4A34" opacity={0.65}>
          {shortDate(geo.from)}
        </text>
        {geo.from !== geo.to && (
          <text
            x={VIEW.width - PADDING.right}
            y={VIEW.height - 12}
            textAnchor="end"
            fontSize={11}
            fill="#6B4A34"
            opacity={0.65}
          >
            {shortDate(geo.to)}
          </text>
        )}
      </svg>

      {/* The key. Hovering one fades the others. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4">
        {series.map(s => {
          const drawn = s.points.length > 0
          return (
            <li key={s.id}>
              <button
                type="button"
                onMouseEnter={() => drawn && setHighlighted(s.id)}
                onMouseLeave={() => setHighlighted(null)}
                onFocus={() => drawn && setHighlighted(s.id)}
                onBlur={() => setHighlighted(null)}
                disabled={!drawn}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                  drawn ? 'hover:bg-brand-tan/20 cursor-default' : 'opacity-40 cursor-not-allowed'
                }`}
                title={drawn ? `Highlight ${s.label}` : `${s.label} has no readings yet`}
              >
                <span
                  className="w-4 h-1.5 rounded-full shrink-0"
                  style={{ background: colorOf(s.id) }}
                  aria-hidden="true"
                />
                <span className="text-sm text-brand-brown">{s.label}</span>
                {!drawn && <span className="text-xs text-brand-brown/50">no readings</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
