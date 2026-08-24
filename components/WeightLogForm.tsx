'use client'

import { FormEvent, useState } from 'react'
import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { toDateKey } from '@/lib/scheduleUtils'
import { toLbs, validateWeightEntry, WeightEntryError } from '@/lib/healthValidation'

interface Props {
  cat: Cat
  /** The reading being edited. Absent when logging a new one. */
  record?: HealthRecord
  /** Dates that already have a reading for this cat, for the clash check. */
  existingDates: string[]
  onSave: (record: HealthRecord) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const inputClass =
  'w-full px-4 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'
const okBorder = 'border-brand-tan/50'
const badBorder = 'border-red-400'

const LBS_PER_KG = 2.20462

/**
 * Logs or edits one dated weight reading.
 *
 * The owner enters weight in whichever unit their cat's profile uses, and it is
 * converted to pounds on the way in — HealthRecord stores pounds canonically so
 * a chart series can never mix units. Switching a cat from kg to lbs later
 * therefore rescales nothing already recorded.
 *
 * Validation lives in lib/healthValidation so the rules are testable; this file
 * only decides where the message goes.
 */
export default function WeightLogForm({ cat, record, existingDates, onSave, onDelete, onClose }: Props) {
  const unit = cat.weightUnit
  const editing = record !== undefined

  const [date, setDate] = useState(record?.date ?? toDateKey(new Date()))
  const [weight, setWeight] = useState(() => {
    if (record?.weightLbs === undefined) return ''
    const shown = unit === 'kg' ? record.weightLbs / LBS_PER_KG : record.weightLbs
    // Trailing zeros on a value the owner typed themselves look like the form
    // changed their number, so round to a sane precision and drop them.
    return String(Number(shown.toFixed(2)))
  })
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [error, setError] = useState<WeightEntryError | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  /* Clear the message as soon as the owner starts fixing the thing it is about.
     Leaving a stale error under a field they have already corrected reads as the
     form still being wrong. */
  function edit<T>(setter: (v: T) => void, field: WeightEntryError['field']) {
    return (value: T) => {
      setter(value)
      setError(current => (current?.field === field ? null : current))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validateWeightEntry({
      weight,
      unit,
      date,
      today: toDateKey(new Date()),
      birthday: cat.birthday,
      // A record must not clash with its own date, or editing the notes on an
      // existing reading would be rejected for colliding with itself.
      existingDates: existingDates.filter(d => d !== record?.date),
    })
    if (problem) {
      setError(problem)
      return
    }
    onSave({
      id: record?.id ?? newId(),
      catId: cat.id,
      date,
      weightLbs: toLbs(Number(weight), unit),
      notes: notes.trim() || undefined,
      createdAt: record?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-7 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-brand-brown mb-1">{editing ? 'Edit weight' : 'Log a weight'}</h2>
        <p className="text-sm text-brand-brown/60 mb-6">for {cat.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="weight-date" className="block text-sm font-medium text-brand-brown mb-1.5">
              Date
            </label>
            <input
              id="weight-date"
              type="date"
              value={date}
              max={toDateKey(new Date())}
              min={cat.birthday}
              onChange={e => edit(setDate, 'date')(e.target.value)}
              aria-invalid={error?.field === 'date'}
              className={`${inputClass} ${error?.field === 'date' ? badBorder : okBorder}`}
            />
          </div>

          <div>
            <label htmlFor="weight-value" className="block text-sm font-medium text-brand-brown mb-1.5">
              Weight ({unit})
            </label>
            <input
              id="weight-value"
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              value={weight}
              onChange={e => edit(setWeight, 'weight')(e.target.value)}
              placeholder={unit === 'kg' ? '4.5' : '10.0'}
              aria-invalid={error?.field === 'weight'}
              className={`${inputClass} ${error?.field === 'weight' ? badBorder : okBorder}`}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="weight-notes" className="block text-sm font-medium text-brand-brown mb-1.5">
              Notes <span className="text-brand-brown/45 font-normal">(optional)</span>
            </label>
            <input
              id="weight-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Weighed at the vet"
              className={`${inputClass} ${okBorder}`}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error.message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan/60 text-brand-brown hover:bg-brand-tan/15 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-brand-orange text-white font-medium hover:bg-brand-orange/90 transition-colors"
            >
              {editing ? 'Save changes' : 'Save'}
            </button>
          </div>

          {editing && onDelete && (
            <div className="pt-2 border-t border-brand-tan/30 mt-2">
              {confirmingDelete ? (
                <div className="flex items-center gap-3 pt-3">
                  <span className="text-sm text-brand-brown/70 flex-1">Delete this reading?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-sm px-3 py-1.5 rounded-xl border border-brand-tan/60 text-brand-brown"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(record.id)}
                    className="text-sm px-3 py-1.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-sm text-red-700 hover:underline pt-3"
                >
                  Delete this reading
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

/**
 * `crypto.randomUUID` is only defined in a secure context, so it is missing when
 * the dev server is reached over plain http from another device on the network —
 * exactly how someone would test this on a phone. Falling back keeps saving from
 * throwing there.
 */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `hr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
