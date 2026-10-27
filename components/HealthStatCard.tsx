import CatAvatar from '@/components/CatAvatar'
import { CatHealthSummary } from '@/lib/healthAnalysis'
import { daysBetween, formatDateKey, todayKey } from '@/lib/dateKeys'
import { Cat } from '@/types/cat'

interface Props {
  cat: Cat
  summary: CatHealthSummary
  /** This cat's line colour on the charts, so the card and the line read as one cat. */
  color: string
  /**
   * Lays the four stats out in a row when the card has the page to itself.
   * Beside other cards there is no room, so they sit two by two.
   */
  wide?: boolean
}

function daysAgoLabel(iso: string): string {
  const days = daysBetween(iso, todayKey())
  if (days === null) return iso
  // A future date has no "ago". Callers should not pass one, but a reading
  // typed a day ahead should still say something true rather than "-1 days ago".
  if (days < 0) return daysUntilLabel(iso)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.round(days / 30)} months ago`
  return `${Math.floor(days / 365)}y ago`
}

function daysUntilLabel(iso: string): string {
  const days = daysBetween(todayKey(), iso)
  if (days === null) return iso
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 30) return `in ${days} days`
  if (days < 365) return `in ${Math.round(days / 30)} months`
  return `in ${Math.floor(days / 365)}y`
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-brand-cream border border-brand-tan/30 p-4 min-w-0">
      <dt className="text-xs uppercase tracking-wide text-brand-brown/50 mb-1">{label}</dt>
      <dd className="font-display text-2xl text-brand-brown leading-tight">{value}</dd>
      {hint && <dd className="text-sm text-brand-brown/55 mt-1 break-words">{hint}</dd>}
    </div>
  )
}

/**
 * One cat's health at a glance.
 *
 * Only presentation lives here — every number comes from `catHealthSummary`, so
 * swapping these cards for a combined table later touches the markup alone.
 */
export default function HealthStatCard({ cat, summary, color, wide = false }: Props) {
  const { weight, trend, lastVet, nextVet } = summary
  const headingId = `health-stats-${cat.id}`

  return (
    <section
      aria-labelledby={headingId}
      className="bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6 min-w-0"
    >
      <div className="flex items-center gap-3 mb-4">
        <CatAvatar cat={cat} size={36} />
        <h2 id={headingId} className="font-display text-xl text-brand-brown truncate flex-1">
          {cat.name}
        </h2>
        <span
          className="w-5 h-1.5 rounded-full shrink-0"
          style={{ background: color }}
          aria-hidden="true"
        />
      </div>

      <dl className={`grid gap-3 grid-cols-2 ${wide ? 'lg:grid-cols-4' : ''}`}>
        <Stat
          label="Current weight"
          value={weight ? `${weight.lbs.toFixed(1)} lbs` : '—'}
          hint={
            weight?.date
              ? `logged ${daysAgoLabel(weight.date)}`
              : weight
                ? 'from the profile, undated'
                : 'not recorded'
          }
        />
        <Stat
          label="Trend"
          value={
            trend
              ? trend.direction === 'steady'
                ? 'Steady'
                : `${trend.changeLbs > 0 ? '+' : ''}${trend.changeLbs.toFixed(1)} lbs`
              : '—'
          }
          hint={
            trend
              ? `${trend.percent > 0 ? '+' : ''}${trend.percent.toFixed(1)}% over ${trend.days} days`
              : summary.readingCount === 1
                ? 'one reading so far'
                : 'needs two readings'
          }
        />
        <Stat
          label="Last vet visit"
          value={lastVet ? daysAgoLabel(lastVet) : '—'}
          /* Falls back to the practice on the profile. A cat can have a vet on
             file and no visit scheduled yet, and showing only "none" hides
             information the owner already gave us. */
          hint={[
            lastVet
              ? formatDateKey(lastVet)
              : summary.vetName
                ? `${summary.vetName} on file`
                : 'no vet on file',
            nextVet && `next visit ${daysUntilLabel(nextVet)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
        <Stat
          label="Known illnesses"
          value={summary.illnesses.length ? String(summary.illnesses.length) : 'None'}
          hint={
            summary.illnesses.length
              ? summary.illnesses.join(', ')
              : `${summary.activeMeds} active medication${summary.activeMeds === 1 ? '' : 's'}`
          }
        />
      </dl>
    </section>
  )
}
