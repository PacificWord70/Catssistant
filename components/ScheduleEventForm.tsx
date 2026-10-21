'use client'

import { useId, useState, FormEvent } from 'react'
import { Cat } from '@/types/cat'
import { ScheduleEvent, ScheduleCategory, Recurrence, MedicationStatus, MedicationDuration, CareRoutineType, LitterType, PlayActivityType, PerCatValue, FeedingAmount, FeedingUnit } from '@/types/scheduleEvent'
import { SCHEDULE_CATEGORIES, MEDICATION_STATUSES, MEDICATION_DURATIONS, CARE_ROUTINE_TYPES, LITTER_TYPES, PLAY_ACTIVITY_TYPES, FEEDING_UNITS, DURATION_OPTIONS_MINUTES } from '@/lib/scheduleAttributes'
import { toDateKey, formatDurationLabel, formatDateLabel } from '@/lib/scheduleUtils'
import { ScheduleField, firstInvalidField, validateScheduleDraft } from '@/lib/scheduleValidation'
import { DELETE_FALLBACK_MESSAGE, errorMessage } from '@/lib/formErrors'
import Dialog, { ConfirmRequest } from '@/components/Dialog'

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

interface Props {
  cats: Cat[]
  existing?: ScheduleEvent
  defaultDate?: string
  /** Category a new event starts on. Ignored when editing an existing one. */
  defaultCategory?: ScheduleCategory
  /** Cats a new event starts against. Ignored when editing an existing one. */
  defaultCatIds?: string[]
  onSave: (event: ScheduleEvent) => void
  onCancel: () => void
  onDelete?: () => void
}

function getValue(list: PerCatValue[], catId: string): string {
  return list.find(v => v.catId === catId)?.value ?? ''
}

function setValue(list: PerCatValue[], catId: string, value: string): PerCatValue[] {
  const next = list.filter(v => v.catId !== catId)
  if (value) next.push({ catId, value })
  return next
}

interface VetOption { key: string; name: string; phone: string; address: string }

const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'
const labelClass = 'block text-sm font-medium text-brand-charcoal mb-1'
const checkboxClass = 'rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40'
// Text-only buttons had no focus indicator at all, so a keyboard user could not
// tell when one was selected.
const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded-lg'

/** The input class with its border swapped for red when the field is invalid. */
function fieldClass(invalid: boolean, base = inputClass): string {
  return invalid ? base.replace('border-brand-tan/50', 'border-red-400') : base
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="text-xs text-red-700 mt-1 px-1">{message}</p>
}

/**
 * The times list plus its handlers, bundled so TimesSection takes one prop
 * instead of four.
 */
interface TimesControl {
  times: string[]
  update: (index: number, value: string) => void
  remove: (index: number) => void
  add: () => void
}

/**
 * Repeating time rows with an "add another" control.
 *
 * Declared at module scope, not inside ScheduleEventForm. A component defined
 * inside another component is a *new type* on every parent render, so React
 * unmounts and remounts it rather than updating it — which meant the time input
 * lost focus after every keystroke, since typing updates parent state and
 * re-renders the form.
 *
 * One visible label names a list of inputs, so it names the group and each
 * input gets a numbered accessible name of its own.
 */
function TimesSection({
  idBase,
  label = 'Times',
  requireFirst = false,
  control,
  error,
}: {
  idBase: string
  label?: string
  requireFirst?: boolean
  control: TimesControl
  error?: string
}) {
  const labelId = `${idBase}-label`
  const errorId = `${idBase}-error`
  return (
    <div role="group" aria-labelledby={labelId}>
      <span id={labelId} className={labelClass}>
        {label} {requireFirst && <span className="text-brand-orange" aria-hidden="true">*</span>}
      </span>
      <div className="space-y-2">
        {control.times.map((t, i) => (
          <div key={i} className="flex gap-2">
            <input
              id={`${idBase}-${i}`}
              type="time" required={requireFirst && i === 0}
              aria-label={`Time ${i + 1}`}
              aria-invalid={error && i === 0 ? true : undefined}
              aria-describedby={error && i === 0 ? errorId : undefined}
              value={t} onChange={e => control.update(i, e.target.value)}
              className={fieldClass(Boolean(error) && i === 0)}
            />
            <button type="button" onClick={() => control.remove(i)} aria-label={`Remove time ${i + 1}`} className={`px-3 text-brand-slate hover:text-brand-brown ${focusRing}`}>×</button>
          </div>
        ))}
        <button type="button" onClick={control.add} className={`text-sm text-brand-slate hover:underline ${focusRing}`}>
          + Add {control.times.length > 0 ? 'another' : 'a'} time
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}

/** Expected-duration picker. Hoisted for the same reason as TimesSection. */
function DurationSection({
  id,
  label = 'Expected duration',
  value,
  onChange,
}: {
  id: string
  label?: string
  value?: number
  onChange: (minutes: number | undefined) => void
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <select
        id={id}
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className={inputClass}
      >
        <option value="">Not sure</option>
        {DURATION_OPTIONS_MINUTES.map(m => <option key={m} value={m}>{formatDurationLabel(m)}</option>)}
      </select>
    </div>
  )
}

export default function ScheduleEventForm({ cats, existing, defaultDate, defaultCategory, defaultCatIds, onSave, onCancel, onDelete }: Props) {
  const [catIds, setCatIds] = useState<string[]>(
    existing?.catIds ?? defaultCatIds ?? (cats.length === 1 ? [cats[0].id] : []),
  )
  const initialCategory = existing?.category ?? defaultCategory ?? 'Feeding'
  const [category, setCategory] = useState<ScheduleCategory>(initialCategory)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate] = useState(existing?.date ?? (initialCategory === 'Vet' ? '' : (defaultDate ?? toDateKey(new Date()))))
  const [times, setTimes] = useState<string[]>(existing?.times ?? (initialCategory === 'Feeding' || initialCategory === 'Vet' ? [''] : []))
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(existing?.durationMinutes)
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'none')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(existing?.recurrenceEndDate ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const [medicationStatus, setMedicationStatus] = useState<MedicationStatus>(existing?.medicationStatus ?? 'Started')
  const [medicationDuration, setMedicationDuration] = useState<MedicationDuration>(existing?.medicationDuration ?? 'Forever')

  const [routineType, setRoutineType] = useState<CareRoutineType>(existing?.routineType ?? 'Changed food')
  const [routineBrand, setRoutineBrand] = useState(existing?.routineBrand ?? '')
  const [routineItemName, setRoutineItemName] = useState(existing?.routineItemName ?? '')
  const [litterType, setLitterType] = useState<LitterType | ''>(existing?.litterType ?? '')
  const [routineOther, setRoutineOther] = useState(existing?.routineOther ?? '')

  const [foodBrand, setFoodBrand] = useState(existing?.foodBrand ?? '')
  const [foodName, setFoodName] = useState(existing?.foodName ?? '')
  const [feedingAmounts, setFeedingAmounts] = useState<FeedingAmount[]>(existing?.feedingAmounts ?? [])

  const [groomingTools, setGroomingTools] = useState<PerCatValue[]>(existing?.groomingTools ?? [])

  const [playActivityType, setPlayActivityType] = useState<PlayActivityType>(existing?.playActivityType ?? 'Toy')
  const [playDetail, setPlayDetail] = useState(existing?.playDetail ?? '')

  const [vetChoice, setVetChoice] = useState('new')
  const [vetName, setVetName] = useState(existing?.vetName ?? '')
  const [vetPhone, setVetPhone] = useState(existing?.vetPhone ?? '')
  const [vetAddress, setVetAddress] = useState(existing?.vetAddress ?? '')
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>(existing?.estimatedCost)

  // Messages only appear once Save has been pressed, then track the fields
  // live, so each one disappears as soon as the owner fixes it.
  const [showErrors, setShowErrors] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Every field in one string, so "has anything changed?" is one comparison.
  // The first render's copy is the baseline; useState keeps only that one.
  const snapshot = JSON.stringify([catIds, category, title, date, times, durationMinutes, recurrence, recurrenceEndDate, notes, medicationStatus, medicationDuration, routineType, routineBrand, routineItemName, litterType, routineOther, foodBrand, foodName, feedingAmounts, groomingTools, playActivityType, playDetail, vetName, vetPhone, vetAddress, estimatedCost])
  const [initialSnapshot] = useState(snapshot)
  const dirty = snapshot !== initialSnapshot

  const uid = useId()
  const ids = {
    title: `${uid}-title`,
    heading: `${uid}-heading`,
    cats: `${uid}-cats`,
    category: `${uid}-category`,
    foodBrand: `${uid}-food-brand`,
    foodName: `${uid}-food-name`,
    amounts: `${uid}-amounts`,
    medStatus: `${uid}-med-status`,
    medDuration: `${uid}-med-duration`,
    until: `${uid}-until`,
    routineType: `${uid}-routine-type`,
    routineOther: `${uid}-routine-other`,
    routineBrand: `${uid}-routine-brand`,
    routineItem: `${uid}-routine-item`,
    litter: `${uid}-litter`,
    grooming: `${uid}-grooming`,
    playType: `${uid}-play-type`,
    playDetail: `${uid}-play-detail`,
    times: `${uid}-times`,
    duration: `${uid}-duration`,
    vetChoice: `${uid}-vet-choice`,
    vetName: `${uid}-vet-name`,
    vetPhone: `${uid}-vet-phone`,
    vetAddress: `${uid}-vet-address`,
    cost: `${uid}-cost`,
    date: `${uid}-date`,
    recurrence: `${uid}-recurrence`,
    notes: `${uid}-notes`,
    saveError: `${uid}-save-error`,
  }
  const errId = (field: ScheduleField) => `${uid}-${field}-error`
  const amountId = (catId: string) => `${uid}-amount-${catId}`

  // inputClass is defined at module scope — see the top of this file.

  const vetOptions: VetOption[] = []
  const seenVets = new Set<string>()
  for (const c of cats) {
    if (c.vet?.name && !seenVets.has(c.vet.name)) {
      seenVets.add(c.vet.name)
      vetOptions.push({ key: c.id, name: c.vet.name, phone: c.vet.phone ?? '', address: c.vet.address ?? '' })
    }
  }

  function handleVetChoice(key: string) {
    setVetChoice(key)
    if (key === 'new') {
      setVetName(''); setVetPhone(''); setVetAddress('')
      return
    }
    const opt = vetOptions.find(v => v.key === key)
    if (opt) { setVetName(opt.name); setVetPhone(opt.phone); setVetAddress(opt.address) }
  }

  function toggleCat(id: string) {
    setCatIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  function handleCategoryChange(next: ScheduleCategory) {
    setCategory(next)
    if (next === 'Vet' && !existing) setDate('')
    const needsFirstTime = next === 'Feeding' || next === 'Vet' || (next === 'Medication' && medicationStatus === 'Started')
    if (needsFirstTime && times.length === 0) setTimes([''])
  }

  function handleMedicationStatusChange(status: MedicationStatus) {
    setMedicationStatus(status)
    if (status === 'Started' && times.length === 0) setTimes([''])
  }

  function addTime() {
    setTimes(prev => [...prev, ''])
  }
  function updateTime(i: number, value: string) {
    setTimes(prev => prev.map((t, idx) => idx === i ? value : t))
  }
  function removeTime(i: number) {
    setTimes(prev => prev.filter((_, idx) => idx !== i))
  }

  function getFeedingAmount(catId: string): FeedingAmount {
    return feedingAmounts.find(f => f.catId === catId) ?? { catId, amount: 0, unit: 'cup' }
  }
  function setFeedingField(catId: string, patch: Partial<Pick<FeedingAmount, 'amount' | 'unit'>>) {
    setFeedingAmounts(prev => {
      const current = prev.find(f => f.catId === catId) ?? { catId, amount: 0, unit: 'cup' as FeedingUnit }
      return [...prev.filter(f => f.catId !== catId), { ...current, ...patch }]
    })
  }

  function fallbackTitle(): string {
    if (category === 'Feeding') return foodName || 'Feeding'
    if (category === 'Medication') return title || 'Medication'
    if (category === 'Care Routine') return routineType === 'Other' ? (routineOther || 'Care routine') : routineType
    if (category === 'Vet') return title || 'Vet visit'
    if (category === 'Grooming') return title || 'Grooming'
    if (category === 'Play') return title || (playActivityType === 'Walk' ? 'Walk' : 'Play')
    return title
  }

  const endDateShown = category === 'Medication' && medicationStatus === 'Started' && medicationDuration === 'Set duration'
  const currentErrors = validateScheduleDraft({
    category, catIds, title, date, times, recurrenceEndDate, endDateShown, medicationStatus,
    feedingAmounts, vetName, vetAddress, routineType, litterType,
  })
  const errors = showErrors ? currentErrors : {}

  /** aria wiring for a field that may carry an error. */
  function invalidProps(field: ScheduleField) {
    return errors[field]
      ? { 'aria-invalid': true as const, 'aria-describedby': errId(field) }
      : {}
  }

  /** Where focus goes for each field — its first control. */
  function focusTarget(field: ScheduleField): string {
    switch (field) {
      case 'cats': return `${uid}-cat-${cats[0]?.id}`
      case 'feedingAmounts': {
        const missing = catIds.find(id => !(getFeedingAmount(id).amount > 0)) ?? catIds[0]
        return amountId(missing)
      }
      case 'title': return ids.title
      case 'recurrenceEndDate': return ids.until
      case 'litterType': return ids.litter
      case 'times': return `${ids.times}-0`
      case 'vetName': return ids.vetName
      case 'vetAddress': return ids.vetAddress
      case 'date': return ids.date
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    const firstBad = firstInvalidField(currentErrors)
    if (firstBad) {
      setShowErrors(true)
      document.getElementById(focusTarget(firstBad))?.focus()
      return
    }
    const finalTitle = fallbackTitle().trim()

    // The page's handler writes to storage, which can throw — when the browser
    // is out of room, say. The modal stays open with everything still typed in,
    // and the reason is shown, rather than the save vanishing.
    try {
      onSave({
        id: existing?.id ?? crypto.randomUUID(),
        catIds,
        category,
        title: finalTitle,
        date,
        times: times.filter(Boolean),
        durationMinutes: (category === 'Vet' || category === 'Play' || category === 'Other') ? durationMinutes : undefined,
        recurrence,
        recurrenceEndDate: recurrenceEndDate || undefined,
        notes: notes.trim() || undefined,

        medicationStatus: category === 'Medication' ? medicationStatus : undefined,
        medicationDuration: category === 'Medication' && medicationStatus === 'Started' ? medicationDuration : undefined,

        routineType: category === 'Care Routine' ? routineType : undefined,
        routineBrand: category === 'Care Routine' && routineType !== 'Other' ? routineBrand.trim() || undefined : undefined,
        routineItemName: category === 'Care Routine' && routineType !== 'Other' ? routineItemName.trim() || undefined : undefined,
        litterType: category === 'Care Routine' && routineType === 'Changed litter' ? (litterType || undefined) : undefined,
        routineOther: category === 'Care Routine' && routineType === 'Other' ? routineOther.trim() || undefined : undefined,

        foodBrand: category === 'Feeding' ? foodBrand.trim() || undefined : undefined,
        foodName: category === 'Feeding' ? foodName.trim() || undefined : undefined,
        feedingAmounts: category === 'Feeding' ? feedingAmounts.filter(a => catIds.includes(a.catId) && a.amount > 0) : undefined,

        groomingTools: category === 'Grooming' ? groomingTools.filter(g => catIds.includes(g.catId)) : undefined,

        playActivityType: category === 'Play' ? playActivityType : undefined,
        playDetail: category === 'Play' ? playDetail.trim() || undefined : undefined,

        vetName: category === 'Vet' ? vetName.trim() || undefined : undefined,
        vetPhone: category === 'Vet' ? vetPhone.trim() || undefined : undefined,
        vetAddress: category === 'Vet' ? vetAddress.trim() || undefined : undefined,
        estimatedCost: category === 'Vet' ? estimatedCost : undefined,

        createdAt: existing?.createdAt ?? new Date().toISOString(),
      })
    } catch (err) {
      setSaveError(errorMessage(err))
    }
  }

  // Deleting an event deletes its whole stored record. For a repeating event
  // that is every occurrence, not just the day that was clicked — the confirm
  // says so in as many words, because the calendar makes it look like one entry.
  const deleteConfirm: ConfirmRequest | null =
    confirmingDelete && existing && onDelete
      ? {
          title: existing.recurrence === 'none' ? 'Delete this event?' : 'Delete the whole series?',
          message:
            existing.recurrence === 'none' ? (
              <p>
                “{existing.title}” on {formatDateLabel(existing.date)} will be deleted. This can’t be undone.
              </p>
            ) : (
              <p>
                “{existing.title}” repeats {RECURRENCES.find(r => r.value === existing.recurrence)?.label.toLowerCase()}.
                Deleting it removes <strong>every occurrence in the series</strong>, past and future — not
                just this one. This can’t be undone.
              </p>
            ),
          confirmLabel: existing.recurrence === 'none' ? 'Delete event' : 'Delete every occurrence',
          cancelLabel: 'Keep it',
          danger: true,
          onCancel: () => setConfirmingDelete(false),
          onConfirm: () => {
            setConfirmingDelete(false)
            try {
              onDelete()
            } catch (err) {
              setSaveError(errorMessage(err, DELETE_FALLBACK_MESSAGE))
            }
          },
        }
      : null

  // Handed to TimesSection, which lives at module scope so it isn't recreated
  // on every render.
  const timesControl: TimesControl = {
    times,
    update: updateTime,
    remove: removeTime,
    add: addTime,
  }

  const routineBrandLabel = routineType === 'Changed litter' ? 'Litter brand' : 'Food brand'
  const routineItemLabel = routineType === 'Changed litter' ? 'Litter name' : 'Food name'
  const required = <span className="text-brand-orange" aria-hidden="true">*</span>

  return (
    <Dialog labelledBy={ids.heading} onClose={onCancel} dirty={dirty} confirm={deleteConfirm}>
        <h2 id={ids.heading} className="font-display text-2xl text-brand-brown mb-5">{existing ? 'Edit Event' : 'Add Event'}</h2>
        {/* noValidate: the browser's own bubbles covered only some fields and
            vanished on their own. Every rule is checked in validateScheduleDraft
            and shown under its field instead. */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Cats */}
          <fieldset className="min-w-0" aria-describedby={errors.cats ? errId('cats') : undefined}>
            <legend className={labelClass}>
              Cats {required}
            </legend>
            <div className={`grid grid-cols-2 gap-2 bg-brand-tan/10 rounded-2xl p-4 ${errors.cats ? 'ring-1 ring-red-400' : ''}`}>
              {cats.map(c => (
                <label key={c.id} htmlFor={`${uid}-cat-${c.id}`} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    id={`${uid}-cat-${c.id}`}
                    type="checkbox"
                    checked={catIds.includes(c.id)}
                    onChange={() => toggleCat(c.id)}
                    aria-invalid={errors.cats ? true : undefined}
                    className={checkboxClass}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <FieldError id={errId('cats')} message={errors.cats} />
          </fieldset>

          {/* Category */}
          <div>
            <label htmlFor={ids.category} className={labelClass}>Category</label>
            <select id={ids.category} value={category} onChange={e => handleCategoryChange(e.target.value as ScheduleCategory)} className={inputClass}>
              {SCHEDULE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Feeding ───────────────────────────────────────── */}
          {category === 'Feeding' && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor={ids.foodBrand} className={labelClass}>Food brand</label>
                  <input id={ids.foodBrand} type="text" value={foodBrand} onChange={e => setFoodBrand(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label htmlFor={ids.foodName} className={labelClass}>Food name</label>
                  <input id={ids.foodName} type="text" value={foodName} onChange={e => setFoodName(e.target.value)} className={inputClass} />
                </div>
              </div>
              {catIds.length > 0 && (
                <div role="group" aria-labelledby={ids.amounts}>
                  <span id={ids.amounts} className={labelClass}>
                    Amount per cat {required}
                  </span>
                  <div className="space-y-2">
                    {catIds.map(id => {
                      const row = getFeedingAmount(id)
                      const catName = cats.find(c => c.id === id)?.name ?? 'Cat'
                      const bad = Boolean(errors.feedingAmounts) && !(row.amount > 0)
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <label htmlFor={amountId(id)} className="text-sm text-brand-brown/60 w-20 truncate">{catName}</label>
                          <input
                            id={amountId(id)}
                            type="number" min="0.01" step="0.25" required
                            value={row.amount || ''}
                            onChange={e => setFeedingField(id, { amount: e.target.value ? parseFloat(e.target.value) : 0 })}
                            aria-invalid={bad ? true : undefined}
                            aria-describedby={bad ? errId('feedingAmounts') : undefined}
                            className={fieldClass(bad, 'flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white')}
                          />
                          <select
                            aria-label={`${catName} — unit`}
                            value={row.unit}
                            onChange={e => setFeedingField(id, { unit: e.target.value as FeedingUnit })}
                            className="px-2 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
                          >
                            {FEEDING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                  <FieldError id={errId('feedingAmounts')} message={errors.feedingAmounts} />
                </div>
              )}
              <TimesSection idBase={ids.times} label="Feeding times" requireFirst control={timesControl} error={errors.times} />
            </>
          )}

          {/* ── Medication ────────────────────────────────────── */}
          {category === 'Medication' && (
            <>
              <div>
                <label htmlFor={ids.title} className={labelClass}>
                  Medicine name {required}
                </label>
                <input id={ids.title} type="text" required value={title} onChange={e => setTitle(e.target.value)} {...invalidProps('title')} className={fieldClass(Boolean(errors.title))} />
                <FieldError id={errId('title')} message={errors.title} />
              </div>
              <div>
                <label htmlFor={ids.medStatus} className={labelClass}>Status</label>
                <select id={ids.medStatus} value={medicationStatus} onChange={e => handleMedicationStatusChange(e.target.value as MedicationStatus)} className={inputClass}>
                  {MEDICATION_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {medicationStatus === 'Started' && (
                <>
                  <div>
                    <label htmlFor={ids.medDuration} className={labelClass}>Duration</label>
                    <select id={ids.medDuration} value={medicationDuration} onChange={e => setMedicationDuration(e.target.value as MedicationDuration)} className={inputClass}>
                      {MEDICATION_DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  {medicationDuration === 'Set duration' && (
                    <div>
                      <label htmlFor={ids.until} className={labelClass}>Until</label>
                      <input id={ids.until} type="date" min={date} value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} {...invalidProps('recurrenceEndDate')} className={fieldClass(Boolean(errors.recurrenceEndDate))} />
                      <FieldError id={errId('recurrenceEndDate')} message={errors.recurrenceEndDate} />
                    </div>
                  )}
                  <TimesSection idBase={ids.times} label="Dose times" requireFirst control={timesControl} error={errors.times} />
                </>
              )}
            </>
          )}

          {/* ── Care Routine ──────────────────────────────────── */}
          {category === 'Care Routine' && (
            <>
              <div>
                <label htmlFor={ids.routineType} className={labelClass}>What changed?</label>
                <select id={ids.routineType} value={routineType} onChange={e => setRoutineType(e.target.value as CareRoutineType)} className={inputClass}>
                  {CARE_ROUTINE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {routineType === 'Other' ? (
                <div>
                  <label htmlFor={ids.routineOther} className={labelClass}>Describe it</label>
                  <input id={ids.routineOther} type="text" value={routineOther} onChange={e => setRoutineOther(e.target.value)} className={inputClass} />
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label htmlFor={ids.routineBrand} className={labelClass}>{routineBrandLabel}</label>
                      <input id={ids.routineBrand} type="text" value={routineBrand} onChange={e => setRoutineBrand(e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={ids.routineItem} className={labelClass}>{routineItemLabel}</label>
                      <input id={ids.routineItem} type="text" value={routineItemName} onChange={e => setRoutineItemName(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  {routineType === 'Changed litter' && (
                    <div>
                      <label htmlFor={ids.litter} className={labelClass}>
                        Litter type {required}
                      </label>
                      <select
                        id={ids.litter}
                        required value={litterType}
                        onChange={e => setLitterType(e.target.value as LitterType)}
                        {...invalidProps('litterType')}
                        className={fieldClass(Boolean(errors.litterType))}
                      >
                        <option value="">Select litter type…</option>
                        {LITTER_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <FieldError id={errId('litterType')} message={errors.litterType} />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Grooming ──────────────────────────────────────── */}
          {category === 'Grooming' && (
            <>
              <div>
                <label htmlFor={ids.title} className={labelClass}>Label (optional)</label>
                <input id={ids.title} type="text" placeholder="e.g. Bath" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              {catIds.length > 0 && (
                <div role="group" aria-labelledby={ids.grooming}>
                  <span id={ids.grooming} className={labelClass}>Brush / tool per cat</span>
                  <div className="space-y-2">
                    {catIds.map(id => (
                      <div key={id} className="flex items-center gap-2">
                        <label htmlFor={`${ids.grooming}-${id}`} className="text-sm text-brand-brown/60 w-24 truncate">{cats.find(c => c.id === id)?.name}</label>
                        <input
                          id={`${ids.grooming}-${id}`}
                          type="text" placeholder="e.g. Slicker brush"
                          value={getValue(groomingTools, id)}
                          onChange={e => setGroomingTools(prev => setValue(prev, id, e.target.value))}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <TimesSection idBase={ids.times} label="Time (optional)" control={timesControl} />
            </>
          )}

          {/* ── Play ──────────────────────────────────────────── */}
          {category === 'Play' && (
            <>
              <div>
                <label htmlFor={ids.playType} className={labelClass}>Activity</label>
                <select id={ids.playType} value={playActivityType} onChange={e => setPlayActivityType(e.target.value as PlayActivityType)} className={inputClass}>
                  {PLAY_ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={ids.playDetail} className={labelClass}>
                  {playActivityType === 'Toy' ? 'Which toy?' : playActivityType === 'Walk' ? 'Route / notes' : 'Describe it'}
                </label>
                <input id={ids.playDetail} type="text" value={playDetail} onChange={e => setPlayDetail(e.target.value)} className={inputClass} />
              </div>
              <TimesSection idBase={ids.times} label="Time (optional)" control={timesControl} />
              <DurationSection id={ids.duration} value={durationMinutes} onChange={setDurationMinutes} />
            </>
          )}

          {/* ── Vet ───────────────────────────────────────────── */}
          {category === 'Vet' && (
            <>
              <div>
                <label htmlFor={ids.title} className={labelClass}>Label (optional)</label>
                <input id={ids.title} type="text" placeholder="e.g. Annual checkup" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              <TimesSection idBase={ids.times} label="Times" requireFirst control={timesControl} error={errors.times} />
              <DurationSection id={ids.duration} label="Expected duration" value={durationMinutes} onChange={setDurationMinutes} />
              <div>
                <label htmlFor={ids.vetChoice} className={labelClass}>Vet</label>
                <select id={ids.vetChoice} value={vetChoice} onChange={e => handleVetChoice(e.target.value)} className={inputClass}>
                  <option value="new">+ Add new vet</option>
                  {vetOptions.map(v => <option key={v.key} value={v.key}>{v.name}</option>)}
                </select>
              </div>
              {/* These read by placeholder alone, which disappears once typed in
                  and is not a reliable name for assistive tech, so each also
                  carries a visually hidden label. */}
              <div className="space-y-2 bg-brand-tan/10 rounded-2xl p-4">
                <div>
                  <label htmlFor={ids.vetName} className="sr-only">Vet clinic name (required)</label>
                  <input id={ids.vetName} type="text" required placeholder="Vet clinic name *" value={vetName} onChange={e => setVetName(e.target.value)} {...invalidProps('vetName')} className={fieldClass(Boolean(errors.vetName))} />
                  <FieldError id={errId('vetName')} message={errors.vetName} />
                </div>
                <div>
                  <label htmlFor={ids.vetPhone} className="sr-only">Vet phone</label>
                  <input id={ids.vetPhone} type="tel" placeholder="Phone" value={vetPhone} onChange={e => setVetPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={ids.vetAddress} className="sr-only">Vet address (required)</label>
                  <input id={ids.vetAddress} type="text" required placeholder="Address *" value={vetAddress} onChange={e => setVetAddress(e.target.value)} {...invalidProps('vetAddress')} className={fieldClass(Boolean(errors.vetAddress))} />
                  <FieldError id={errId('vetAddress')} message={errors.vetAddress} />
                </div>
              </div>
              <div>
                <label htmlFor={ids.cost} className={labelClass}>Estimated cost</label>
                <input
                  id={ids.cost}
                  type="number" min="0" step="0.01" placeholder="$"
                  value={estimatedCost ?? ''}
                  onChange={e => setEstimatedCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* ── Other ─────────────────────────────────────────── */}
          {category === 'Other' && (
            <>
              <div>
                <label htmlFor={ids.title} className={labelClass}>
                  Label {required}
                </label>
                <input id={ids.title} type="text" required value={title} onChange={e => setTitle(e.target.value)} {...invalidProps('title')} className={fieldClass(Boolean(errors.title))} />
                <FieldError id={errId('title')} message={errors.title} />
              </div>
              <TimesSection idBase={ids.times} label="Times" control={timesControl} />
              <DurationSection id={ids.duration} value={durationMinutes} onChange={setDurationMinutes} />
            </>
          )}

          {/* Date + recurrence */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor={ids.date} className={labelClass}>Date {required}</label>
              <input id={ids.date} type="date" required value={date} onChange={e => setDate(e.target.value)} {...invalidProps('date')} className={fieldClass(Boolean(errors.date))} />
              <FieldError id={errId('date')} message={errors.date} />
            </div>
            <div className="flex-1">
              <label htmlFor={ids.recurrence} className={labelClass}>Repeats</label>
              <select id={ids.recurrence} value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)} className={inputClass}>
                {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={ids.notes} className={labelClass}>
              {category === 'Vet' ? 'Notes / reminders to bring' : 'Notes'}
            </label>
            <textarea id={ids.notes} value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>

          {saveError && (
            <p id={ids.saveError} role="alert" className="text-sm text-red-700">
              {saveError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" aria-describedby={saveError ? ids.saveError : undefined} className="flex-1 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2">
              Save
            </button>
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40">
              Cancel
            </button>
            {existing && onDelete && (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="px-4 py-3 text-red-700 hover:text-red-800 transition-colors text-sm font-medium rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40">
                Delete
              </button>
            )}
          </div>
        </form>
    </Dialog>
  )
}
