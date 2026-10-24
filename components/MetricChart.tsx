'use client'

import { useMemo, useRef, useState } from 'react'
import { multiSeriesGeometry, NamedSeries } from '@/lib/healthAnalysis'
import { formatDateKey } from '@/lib/dateKeys'

interface Props {
  series: NamedSeries[]
  /** Unit label for the readout, e.g. "lbs" or "min/day". */
  unit: string
  /**
   * Called with the record id when a point is clicked.
   *
   * Only pass this for metrics whose points map to a real stored record.
   * Scheduled metrics are aggregated per day and their point ids are synthetic,
   * so making them clickable would open an editor for a record that does not
   * exist.
   */
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

/**
 * Past this many points a line stops drawing its markers.
 *
 * A daily metric over a couple of months is sixty-odd readings; at that density
 * the dots touch and the line reads as a fat dotted band rather than a trend.
 * The line itself still carries the shape, and the hovered date always draws its
 * markers regardless.
 */
const MAX_DOTS = 40

function shortDate(iso: string): string {
  return formatDateKey(iso, { month: 'short', day: 'numeric' })
}

export default function MetricChart({ series, unit, onSelect }: Props) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const geo = multiSeriesGeometry(series, VIEW.width, VIEW.height, PADDING)

  /**
   * Every plotted point, grouped by the date it belongs to.
   *
   * This is what makes several cats on one date visible at all. Cats are often
   * measured on the same day, and for a scheduled metric they frequently share
   * the *value* too — every cat fed the same amount puts every dot at exactly
   * the same place, where all but the last are invisible.
   */
  const byDate = useMemo(() => {
    const map = new Map<string, { id: string; label: string; value: number; x: number; y: number }[]>()
    if (!geo) return map
    for (const line of geo.lines) {
      for (const p of line.points) {
        const at = map.get(p.point.date) ?? []
        at.push({ id: line.id, label: line.label, value: p.point.value, x: p.x, y: p.y })
        map.set(p.point.date, at)
      }
    }
    return map
  }, [geo])

  if (!geo) return null

  const colorOf = (id: string) => lineColor(series.findIndex(s => s.id === id))
  const hovered = hoveredDate ? byDate.get(hoveredDate) : undefined

  /** Nearest date to the pointer, so hovering works between the markers too. */
  function trackPointer(clientX: number) {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    // The SVG scales to its container, so pointer pixels have to be mapped back
    // into viewBox units before they mean anything against the geometry.
    const x = ((clientX - box.left) / box.width) * VIEW.width
    let best: string | null = null
    let bestDistance = Infinity
    for (const [date, points] of byDate) {
      const distance = Math.abs(points[0].x - x)
      if (distance < bestDistance) {
        bestDistance = distance
        best = date
      }
    }
    setHoveredDate(best)
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label={`${geo.lines.length} ${geo.lines.length === 1 ? 'cat' : 'cats'}, ${unit}, ${formatDateKey(geo.from, { dateStyle: 'medium' })} to ${formatDateKey(geo.to, { dateStyle: 'medium' })}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        onMouseMove={e => trackPointer(e.clientX)}
        onMouseLeave={() => setHoveredDate(null)}
      >
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

        {/* Guide for the hovered date, so it is clear every marker on it belongs
            to the same day even when the lines are far apart. */}
        {hovered && (
          <line
            x1={hovered[0].x}
            y1={PADDING.top}
            x2={hovered[0].x}
            y2={VIEW.height - PADDING.bottom}
            stroke="#6B4A34"
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.45}
          />
        )}

        {geo.lines.map(line => {
          const dimmed = highlighted !== null && highlighted !== line.id
          const color = colorOf(line.id)
          const showDots = line.points.length <= MAX_DOTS
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
              {line.points.map(p => {
                const onHoveredDate = p.point.date === hoveredDate
                // A dense line still marks the hovered date, or there would be
                // nothing to read the guide against.
                if (!showDots && !onHoveredDate) return null
                return (
                  <circle
                    key={p.point.id}
                    cx={p.x}
                    cy={p.y}
                    r={onHoveredDate ? 6 : 4}
                    fill="#FFFBF6"
                    stroke={color}
                    strokeWidth={2.5}
                    style={{ cursor: onSelect ? 'pointer' : 'default' }}
                    onClick={() => onSelect?.(p.point.id)}
                  />
                )
              })}
            </g>
          )
        })}

        {/* Count badge where cats sit on top of each other. Without it a shared
            value looks like a single cat, since the dots are exactly congruent. */}
        {hovered && hovered.length > 1 && (
          <>
            {Object.entries(
              hovered.reduce<Record<string, number>>((acc, p) => {
                const key = p.y.toFixed(1)
                acc[key] = (acc[key] ?? 0) + 1
                return acc
              }, {}),
            )
              .filter(([, count]) => count > 1)
              .map(([y, count]) => (
                <g key={y}>
                  <circle cx={hovered[0].x + 13} cy={Number(y) - 11} r={8.5} fill="#6B4A34" />
                  <text
                    x={hovered[0].x + 13}
                    y={Number(y) - 7.5}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="#FFFBF6"
                  >
                    {count}
                  </text>
                </g>
              ))}
          </>
        )}

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

      {/* Readout for the hovered date: every cat with a value that day, named,
          so overlapping markers stop hiding each other. */}
      {hovered && (
        <div
          className="absolute -translate-x-1/2 pointer-events-none z-10 bg-white rounded-2xl shadow-card border border-brand-tan/40 px-3 py-2 min-w-[9rem]"
          style={{
            left: `${Math.min(Math.max((hovered[0].x / VIEW.width) * 100, 14), 86)}%`,
            top: '100%',
            marginTop: -8,
          }}
        >
          <p className="text-xs text-brand-brown/55 mb-1">{shortDate(hoveredDate!)}</p>
          <ul className="space-y-0.5">
            {[...hovered]
              .sort((a, b) => b.value - a.value)
              .map(p => (
                <li key={p.id} className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <span
                    className="w-3 h-1.5 rounded-full shrink-0"
                    style={{ background: colorOf(p.id) }}
                    aria-hidden="true"
                  />
                  <span className="text-brand-brown/70 flex-1">{p.label}</span>
                  <span className="font-medium text-brand-brown">
                    {p.value.toFixed(1)} {unit}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

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
                title={drawn ? `Highlight ${s.label}` : `${s.label} has nothing recorded for this`}
              >
                <span
                  className="w-4 h-1.5 rounded-full shrink-0"
                  style={{ background: colorOf(s.id) }}
                  aria-hidden="true"
                />
                <span className="text-sm text-brand-brown">{s.label}</span>
                {!drawn && <span className="text-xs text-brand-brown/50">no data</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
