'use client'

import { FormEvent, useId, useState } from 'react'
import CatPicture from '@/components/CatPicture'
import Dialog from '@/components/Dialog'
import { Cat } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { toDateKey } from '@/lib/scheduleUtils'
import { toLbs, validateWeightEntry, WeightEntryError } from '@/lib/healthValidation'
import { DELETE_FALLBACK_MESSAGE, errorMessage } from '@/lib/formErrors'

interface Props {
  /** Cats the reading can be filed against. One entry hides the picker. */
  cats: Cat[]
  /** Which of them starts selected. */
  defaultCatId: string
  /** The reading being edited. Absent when logging a new one. */
  record?: HealthRecord
  /** Dates that already have a reading, for whichever cat is chosen. */
  existingDatesFor: (catId: string) => string[]
  onSave: (record: HealthRecord) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const inputClass =
  'w-full px-4 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'
const okBorder = 'border-brand-tan/50'
const badBorder = 'border-red-400'
const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40'

const LBS_PER_KG = 2.20462

/**
 * Logs or edits one dated weight reading.
 *
 * The owner enters weight in whichever unit the chosen cat's profile uses, and
 * it is converted to pounds on the way in — HealthRecord stores pounds
 * canonically so a chart series can never mix units. Switching a cat from kg to
 * lbs later therefore rescales nothing already recorded.
 *
 * Validation lives in lib/healthValidation so the rules are testable; this file
 * only decides where the message goes.
 */
export default function WeightLogForm({
  cats,
  defaultCatId,
  record,
  existingDatesFor,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const editing = record !== undefined

  /* A reading belongs to the cat it was taken from, so editing cannot move it
     to another one — that would silently rewrite two cats' histories at once. */
  const [catId, setCatId] = useState(record?.catId ?? defaultCatId)
  const cat = cats.find(c => c.id === catId) ?? cats[0]
  const unit = cat.weightUnit

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
  const [saveError, setSaveError] = useState<string | null>(null)

  // The first render's values are the baseline for "has anything been typed?".
  const snapshot = JSON.stringify([catId, date, weight, notes])
  const [initialSnapshot] = useState(snapshot)
  const dirty = snapshot !== initialSnapshot

  const uid = useId()
  const ids = {
    heading: `${uid}-heading`,
    cat: `${uid}-cat`,
    date: `${uid}-date`,
    weight: `${uid}-weight`,
    notes: `${uid}-notes`,
    error: `${uid}-error`,
    saveError: `${uid}-save-error`,
  }

  /* Clear the message as soon as the owner starts fixing the thing it is about.
     Leaving a stale error under a field they have already corrected reads as the
     form still being wrong. */
  function clearIfAbout(field: WeightEntryError['field']) {
    setError(current => (current?.field === field ? null : current))
  }

  function pickCat(nextId: string) {
    const next = cats.find(c => c.id === nextId)
    /* A number typed for a cat measured in pounds must not be re-read as
       kilograms just because the picker moved. Clearing forces a deliberate
       re-entry, and only happens when the units actually differ. */
    if (next && next.weightUnit !== unit) setWeight('')
    setCatId(nextId)
    setError(null)
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
      existingDates: existingDatesFor(cat.id).filter(d => d !== record?.date),
    })
    setSaveError(null)
    if (problem) {
      setError(problem)
      // Takes the owner to the field the message is about, not just the message.
      document.getElementById(problem.field === 'date' ? ids.date : ids.weight)?.focus()
      return
    }
    // The page's handler writes to storage, which can throw — when the browser
    // is out of room, say. The form stays open with the reading intact and the
    // reason shown, rather than the save vanishing.
    try {
      onSave({
        id: record?.id ?? newId(),
        catId: cat.id,
        date,
        weightLbs: toLbs(Number(weight), unit),
        notes: notes.trim() || undefined,
        createdAt: record?.createdAt ?? new Date().toISOString(),
      })
    } catch (err) {
      setSaveError(errorMessage(err))
    }
  }

  function confirmDelete(id: string) {
    if (!onDelete) return
    setSaveError(null)
    try {
      onDelete(id)
    } catch (err) {
      setConfirmingDelete(false)
      setSaveError(errorMessage(err, DELETE_FALLBACK_MESSAGE))
    }
  }

  const describedBy = (field: WeightEntryError['field']) =>
    error?.field === field ? ids.error : undefined

  return (
    <Dialog labelledBy={ids.heading} onClose={onClose} dirty={dirty}>
        <h2 id={ids.heading} className="font-display text-2xl text-brand-brown mb-1">{editing ? 'Edit weight' : 'Log a weight'}</h2>
        <p className="text-sm text-brand-brown/60 mb-6">
          {editing ? `for ${cat.name}` : cats.length === 1 ? `for ${cat.name}` : 'Pick which cat this is for.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Only offered when creating. Moving an existing reading to another
              cat would rewrite two histories at once. */}
          {!editing && cats.length > 1 && (
            <div role="group" aria-labelledby={ids.cat}>
              <span id={ids.cat} className="block text-sm font-medium text-brand-brown mb-1.5">Cat</span>
              <div className="flex flex-wrap gap-2">
                {cats.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickCat(c.id)}
                    aria-pressed={c.id === cat.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-colors ${focusRing} ${
                      c.id === cat.id
                        ? 'border-brand-orange bg-brand-orange/10 text-brand-brown'
                        : 'border-brand-tan/50 text-brand-brown/60 hover:bg-brand-tan/15'
                    }`}
                  >
                    <CatPicture cat={c} size={22} decorative />
                    <span className="text-sm font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor={ids.date} className="block text-sm font-medium text-brand-brown mb-1.5">
              Date
            </label>
            <input
              id={ids.date}
              type="date"
              value={date}
              max={toDateKey(new Date())}
              min={cat.birthday}
              onChange={e => {
                setDate(e.target.value)
                clearIfAbout('date')
              }}
              aria-invalid={error?.field === 'date'}
              aria-describedby={describedBy('date')}
              className={`${inputClass} ${error?.field === 'date' ? badBorder : okBorder}`}
            />
          </div>

          <div>
            <label htmlFor={ids.weight} className="block text-sm font-medium text-brand-brown mb-1.5">
              Weight ({unit})
            </label>
            <input
              id={ids.weight}
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              value={weight}
              onChange={e => {
                setWeight(e.target.value)
                clearIfAbout('weight')
              }}
              placeholder={unit === 'kg' ? '4.5' : '10.0'}
              aria-invalid={error?.field === 'weight'}
              aria-describedby={describedBy('weight')}
              className={`${inputClass} ${error?.field === 'weight' ? badBorder : okBorder}`}
              // Read by Dialog, which owns where focus starts.
              data-autofocus
            />
          </div>

          <div>
            <label htmlFor={ids.notes} className="block text-sm font-medium text-brand-brown mb-1.5">
              Notes <span className="text-brand-brown/45 font-normal">(optional)</span>
            </label>
            <input
              id={ids.notes}
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Weighed at the vet"
              className={`${inputClass} ${okBorder}`}
            />
          </div>

          {error && (
            <p id={ids.error} role="alert" className="text-sm text-red-700">
              {error.message}
            </p>
          )}

          {saveError && (
            <p id={ids.saveError} role="alert" className="text-sm text-red-700">
              {saveError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan/60 text-brand-brown hover:bg-brand-tan/15 transition-colors ${focusRing}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              aria-describedby={saveError ? ids.saveError : undefined}
              className={`flex-1 px-4 py-2.5 rounded-2xl bg-brand-orange text-white font-medium hover:bg-brand-orange/90 transition-colors ${focusRing} focus-visible:ring-offset-2`}
            >
              {editing ? 'Save changes' : 'Save'}
            </button>
          </div>

          {editing && onDelete && record && (
            <div className="pt-2 border-t border-brand-tan/30 mt-2">
              {confirmingDelete ? (
                <div className="flex items-center gap-3 pt-3">
                  <span role="alert" className="text-sm text-brand-brown/70 flex-1">
                    Delete {cat.name}’s reading from {record.date}? This can’t be undone.
                  </span>
                  <button
                    type="button"
                    // The button that asked has just disappeared, so focus moves
                    // to the safe answer instead of falling back to the page.
                    autoFocus
                    onClick={() => setConfirmingDelete(false)}
                    className={`text-sm px-3 py-1.5 rounded-xl border border-brand-tan/60 text-brand-brown ${focusRing}`}
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDelete(record.id)}
                    className={`text-sm px-3 py-1.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors ${focusRing}`}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className={`text-sm text-red-700 hover:underline mt-3 rounded-lg ${focusRing}`}
                >
                  Delete this reading
                </button>
              )}
            </div>
          )}
        </form>
    </Dialog>
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
