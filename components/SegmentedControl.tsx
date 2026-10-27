'use client'

interface Props<T extends string> {
  /** Names the group for screen readers, e.g. "Schedule view". */
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/**
 * A row of mutually exclusive buttons. Built as toggle buttons in a labelled
 * group (aria-pressed) rather than as tabs: tabs promise arrow-key movement and
 * a tab panel each, and the options here re-filter one region rather than
 * swapping between panels. Plain buttons keep Tab and Enter working as anyone
 * would expect.
 */
export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-2xl border border-brand-tan/50 bg-white p-0.5"
    >
      {options.map(o => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              on
                ? 'bg-brand-orange text-white shadow-soft'
                : 'text-brand-brown/70 hover:bg-brand-tan/15'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
