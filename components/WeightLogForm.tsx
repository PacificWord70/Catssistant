'use client'

import { FormEvent, useState } from 'react'
import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { toDateKey } from '@/lib/scheduleUtils'

interface Props {
  cat: Cat
  onSave: (record: HealthRecord) => void
  onClose: () => void
}

const inputClass =
  'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'

const LBS_PER_KG = 2.20462

/**
 * Logs one dated weight reading.
 *
 * The owner enters weight in whichever unit their cat's profile uses, and it is
 * converted to pounds on the way in — HealthRecord stores pounds canonically so
 * a chart series can never mix units. Switching a cat from kg to lbs later
 * therefore rescales nothing that was already recorded.
 */
export default function WeightLogForm({ cat, onSave, onClose }: Props) {
  const [date, setDate] = useState(toDateKey(new Date()))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const unit = cat.weightUnit

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(weight)
    if (!weight.trim() || Number.isNaN(value) || value <= 0) {
      setError('Enter a weight greater than zero.')
      return
    }
    if (!date) {
      setError('Pick the date this weight was taken.')
      return
    }
    onSave({
      id: crypto.randomUUID(),
      catId: cat.id,
      date,
      weightLbs: unit === 'kg' ? value * LBS_PER_KG : value,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-7 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-brand-brown mb-1">Log a weight</h2>
        <p className="text-sm text-brand-brown/60 mb-6">for {cat.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="weight-date" className="block text-sm font-medium text-brand-brown mb-1.5">
              Date
            </label>
            <input
              id="weight-date"
              type="date"
              value={date}
              max={toDateKey(new Date())}
              onChange={e => setDate(e.target.value)}
              className={inputClass}
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
              onChange={e => setWeight(e.target.value)}
              placeholder={unit === 'kg' ? '4.5' : '10.0'}
              className={inputClass}
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
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
