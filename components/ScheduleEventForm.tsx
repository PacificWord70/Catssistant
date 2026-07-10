'use client'

import { useState, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Cat } from '@/types/cat'
import { ScheduleEvent, ScheduleCategory, Recurrence, MedicationStatus, MedicationDuration, CareRoutineType, LitterType, PlayActivityType, PerCatValue, FeedingAmount, FeedingUnit } from '@/types/scheduleEvent'
import { SCHEDULE_CATEGORIES, MEDICATION_STATUSES, MEDICATION_DURATIONS, CARE_ROUTINE_TYPES, LITTER_TYPES, PLAY_ACTIVITY_TYPES, FEEDING_UNITS, DURATION_OPTIONS_MINUTES } from '@/lib/scheduleAttributes'
import { toDateKey, formatDurationLabel } from '@/lib/scheduleUtils'

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

export default function ScheduleEventForm({ cats, existing, defaultDate, onSave, onCancel, onDelete }: Props) {
  const [catIds, setCatIds] = useState<string[]>(existing?.catIds ?? (cats.length === 1 ? [cats[0].id] : []))
  const initialCategory = existing?.category ?? 'Feeding'
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

  const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (catIds.length === 0 || !date) return
    if (recurrenceEndDate && recurrenceEndDate < date) return
    const finalTitle = fallbackTitle().trim()
    if (!finalTitle) return
    if (category === 'Medication' && !title.trim()) return
    if (category === 'Feeding' && (!times[0] || catIds.some(id => getFeedingAmount(id).amount <= 0))) return
    if (category === 'Medication' && medicationStatus === 'Started' && !times[0]) return
    if (category === 'Vet' && (!times[0] || !vetName.trim() || !vetAddress.trim())) return
    if (category === 'Care Routine' && routineType === 'Changed litter' && !litterType) return

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
  }

  function TimesSection({ label = 'Times', requireFirst = false }: { label?: string; requireFirst?: boolean }) {
    return (
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">
          {label} {requireFirst && <span className="text-brand-orange">*</span>}
        </label>
        <div className="space-y-2">
          {times.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="time" required={requireFirst && i === 0}
                value={t} onChange={e => updateTime(i, e.target.value)}
                className={inputClass}
              />
              <button type="button" onClick={() => removeTime(i)} className="px-3 text-brand-slate hover:text-brand-brown">×</button>
            </div>
          ))}
          <button type="button" onClick={addTime} className="text-sm text-brand-slate hover:underline">
            + Add {times.length > 0 ? 'another' : 'a'} time
          </button>
        </div>
      </div>
    )
  }

  function DurationSection({ label = 'Expected duration' }: { label?: string }) {
    return (
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">{label}</label>
        <select
          value={durationMinutes ?? ''}
          onChange={e => setDurationMinutes(e.target.value ? Number(e.target.value) : undefined)}
          className={inputClass}
        >
          <option value="">Not sure</option>
          {DURATION_OPTIONS_MINUTES.map(m => <option key={m} value={m}>{formatDurationLabel(m)}</option>)}
        </select>
      </div>
    )
  }

  const routineBrandLabel = routineType === 'Changed litter' ? 'Litter brand' : 'Food brand'
  const routineItemLabel = routineType === 'Changed litter' ? 'Litter name' : 'Food name'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-3xl p-7 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-brand-brown mb-5">{existing ? 'Edit Event' : 'Add Event'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Cats */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              Cats <span className="text-brand-orange">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 bg-brand-tan/10 rounded-2xl p-4">
              {cats.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    type="checkbox"
                    checked={catIds.includes(c.id)}
                    onChange={() => toggleCat(c.id)}
                    className="rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">Category</label>
            <select value={category} onChange={e => handleCategoryChange(e.target.value as ScheduleCategory)} className={inputClass}>
              {SCHEDULE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Feeding ───────────────────────────────────────── */}
          {category === 'Feeding' && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Food brand</label>
                  <input type="text" value={foodBrand} onChange={e => setFoodBrand(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Food name</label>
                  <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)} className={inputClass} />
                </div>
              </div>
              {catIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">
                    Amount per cat <span className="text-brand-orange">*</span>
                  </label>
                  <div className="space-y-2">
                    {catIds.map(id => {
                      const row = getFeedingAmount(id)
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="text-sm text-brand-brown/60 w-20 truncate">{cats.find(c => c.id === id)?.name}</span>
                          <input
                            type="number" min="0.01" step="0.25" required
                            value={row.amount || ''}
                            onChange={e => setFeedingField(id, { amount: e.target.value ? parseFloat(e.target.value) : 0 })}
                            className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
                          />
                          <select
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
                </div>
              )}
              <TimesSection label="Feeding times" requireFirst />
            </>
          )}

          {/* ── Medication ────────────────────────────────────── */}
          {category === 'Medication' && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">
                  Medicine name <span className="text-brand-orange">*</span>
                </label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Status</label>
                <select value={medicationStatus} onChange={e => handleMedicationStatusChange(e.target.value as MedicationStatus)} className={inputClass}>
                  {MEDICATION_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              {medicationStatus === 'Started' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">Duration</label>
                    <select value={medicationDuration} onChange={e => setMedicationDuration(e.target.value as MedicationDuration)} className={inputClass}>
                      {MEDICATION_DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  {medicationDuration === 'Set duration' && (
                    <div>
                      <label className="block text-sm font-medium text-brand-charcoal mb-1">Until</label>
                      <input type="date" min={date} value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className={inputClass} />
                    </div>
                  )}
                  <TimesSection label="Dose times" requireFirst />
                </>
              )}
            </>
          )}

          {/* ── Care Routine ──────────────────────────────────── */}
          {category === 'Care Routine' && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">What changed?</label>
                <select value={routineType} onChange={e => setRoutineType(e.target.value as CareRoutineType)} className={inputClass}>
                  {CARE_ROUTINE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {routineType === 'Other' ? (
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Describe it</label>
                  <input type="text" value={routineOther} onChange={e => setRoutineOther(e.target.value)} className={inputClass} />
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-brand-charcoal mb-1">{routineBrandLabel}</label>
                      <input type="text" value={routineBrand} onChange={e => setRoutineBrand(e.target.value)} className={inputClass} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-brand-charcoal mb-1">{routineItemLabel}</label>
                      <input type="text" value={routineItemName} onChange={e => setRoutineItemName(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  {routineType === 'Changed litter' && (
                    <div>
                      <label className="block text-sm font-medium text-brand-charcoal mb-1">
                        Litter type <span className="text-brand-orange">*</span>
                      </label>
                      <select
                        required value={litterType}
                        onChange={e => setLitterType(e.target.value as LitterType)}
                        className={inputClass}
                      >
                        <option value="">Select litter type…</option>
                        {LITTER_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
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
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Label (optional)</label>
                <input type="text" placeholder="e.g. Bath" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              {catIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">Brush / tool per cat</label>
                  <div className="space-y-2">
                    {catIds.map(id => (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-sm text-brand-brown/60 w-24 truncate">{cats.find(c => c.id === id)?.name}</span>
                        <input
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
              <TimesSection label="Time (optional)" />
            </>
          )}

          {/* ── Play ──────────────────────────────────────────── */}
          {category === 'Play' && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Activity</label>
                <select value={playActivityType} onChange={e => setPlayActivityType(e.target.value as PlayActivityType)} className={inputClass}>
                  {PLAY_ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">
                  {playActivityType === 'Toy' ? 'Which toy?' : playActivityType === 'Walk' ? 'Route / notes' : 'Describe it'}
                </label>
                <input type="text" value={playDetail} onChange={e => setPlayDetail(e.target.value)} className={inputClass} />
              </div>
              <TimesSection label="Time (optional)" />
              <DurationSection />
            </>
          )}

          {/* ── Vet ───────────────────────────────────────────── */}
          {category === 'Vet' && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Label (optional)</label>
                <input type="text" placeholder="e.g. Annual checkup" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              <TimesSection label="Times" requireFirst />
              <DurationSection label="Expected duration" />
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Vet</label>
                <select value={vetChoice} onChange={e => handleVetChoice(e.target.value)} className={inputClass}>
                  <option value="new">+ Add new vet</option>
                  {vetOptions.map(v => <option key={v.key} value={v.key}>{v.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 bg-brand-tan/10 rounded-2xl p-4">
                <input type="text" required placeholder="Vet clinic name *" value={vetName} onChange={e => setVetName(e.target.value)} className={inputClass} />
                <input type="tel" placeholder="Phone" value={vetPhone} onChange={e => setVetPhone(e.target.value)} className={inputClass} />
                <input type="text" required placeholder="Address *" value={vetAddress} onChange={e => setVetAddress(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Estimated cost</label>
                <input
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
                <label className="block text-sm font-medium text-brand-charcoal mb-1">
                  Label <span className="text-brand-orange">*</span>
                </label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
              </div>
              <TimesSection label="Times" />
              <DurationSection />
            </>
          )}

          {/* Date + recurrence */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-brand-charcoal mb-1">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-brand-charcoal mb-1">Repeats</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)} className={inputClass}>
                {RECURRENCES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">
              {category === 'Vet' ? 'Notes / reminders to bring' : 'Notes'}
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft">
              Save
            </button>
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors">
              Cancel
            </button>
            {existing && onDelete && (
              <button type="button" onClick={onDelete} className="px-4 py-3 text-red-400 hover:text-red-500 transition-colors text-sm font-medium">
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
