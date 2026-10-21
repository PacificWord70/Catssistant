'use client'

import { useState, useRef, useEffect, useId, ChangeEvent, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Cat } from '@/types/cat'
import { useAppDispatch } from '@/store/hooks'
import { persistCat } from '@/store/catsSlice'
import { BREEDS } from '@/lib/breeds'
import { breedFillIns } from '@/lib/breedDefaults'
import { COAT_COLORS, COAT_LENGTHS, COAT_PATTERNS, ENERGY_LEVELS, PREY_DRIVES, HUNTING_LOCATIONS, KNOWN_ILLNESSES, YES_NO_UNKNOWN } from '@/lib/catAttributes'
import BreedTag from '@/components/BreedTag'
import { PHOTO_ACCEPT, prepareCatPhoto } from '@/lib/photo'
import { errorMessage } from '@/lib/formErrors'
import { safeImageSrc } from '@/lib/safeUrl'

// ─── Country data ─────────────────────────────────────────────────────────────

interface CountryDef {
  name: string
  dialCode: string
  regionLabel: string | null   // null = no region field shown
  regions?: string[]           // if present, shown as a datalist
}

const COUNTRIES: CountryDef[] = [
  { name: 'United States',   dialCode: '+1',   regionLabel: 'State',       regions: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'] },
  { name: 'Canada',          dialCode: '+1',   regionLabel: 'Province',    regions: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'] },
  { name: 'United Kingdom',  dialCode: '+44',  regionLabel: 'County' },
  { name: 'Australia',       dialCode: '+61',  regionLabel: 'State',       regions: ['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'] },
  { name: 'New Zealand',     dialCode: '+64',  regionLabel: 'Region' },
  { name: 'Ireland',         dialCode: '+353', regionLabel: 'County' },
  { name: 'Germany',         dialCode: '+49',  regionLabel: 'State',       regions: ['Baden-Württemberg','Bavaria','Berlin','Brandenburg','Bremen','Hamburg','Hesse','Lower Saxony','Mecklenburg-Vorpommern','North Rhine-Westphalia','Rhineland-Palatinate','Saarland','Saxony','Saxony-Anhalt','Schleswig-Holstein','Thuringia'] },
  { name: 'France',          dialCode: '+33',  regionLabel: 'Region' },
  { name: 'Spain',           dialCode: '+34',  regionLabel: 'Region' },
  { name: 'Italy',           dialCode: '+39',  regionLabel: 'Region' },
  { name: 'Netherlands',     dialCode: '+31',  regionLabel: null },
  { name: 'Belgium',         dialCode: '+32',  regionLabel: null },
  { name: 'Switzerland',     dialCode: '+41',  regionLabel: 'Canton' },
  { name: 'Austria',         dialCode: '+43',  regionLabel: 'State' },
  { name: 'Sweden',          dialCode: '+46',  regionLabel: null },
  { name: 'Norway',          dialCode: '+47',  regionLabel: null },
  { name: 'Denmark',         dialCode: '+45',  regionLabel: null },
  { name: 'Finland',         dialCode: '+358', regionLabel: null },
  { name: 'Portugal',        dialCode: '+351', regionLabel: null },
  { name: 'Japan',           dialCode: '+81',  regionLabel: 'Prefecture' },
  { name: 'South Korea',     dialCode: '+82',  regionLabel: null },
  { name: 'China',           dialCode: '+86',  regionLabel: 'Province' },
  { name: 'India',           dialCode: '+91',  regionLabel: 'State' },
  { name: 'Brazil',          dialCode: '+55',  regionLabel: 'State' },
  { name: 'Mexico',          dialCode: '+52',  regionLabel: 'State' },
  { name: 'Argentina',       dialCode: '+54',  regionLabel: 'Province' },
  { name: 'South Africa',    dialCode: '+27',  regionLabel: 'Province' },
  { name: 'Singapore',       dialCode: '+65',  regionLabel: null },
  { name: 'Other',           dialCode: '+',    regionLabel: 'Region' },
]

function getCountry(name?: string) {
  return COUNTRIES.find(c => c.name === name) ?? null
}

// ─── Phone formatter ──────────────────────────────────────────────────────────

function formatPhone(raw: string, dialCode = '+1'): string {
  const trimmed = raw.trimStart()
  if (trimmed.startsWith('+')) {
    // International typed manually — keep as-is, just clean non-digit non-space chars
    const cleaned = '+' + trimmed.slice(1).replace(/[^\d\s]/g, '')
    return cleaned.replace(/\d/g, '').length < 20 ? cleaned.trimEnd() : raw
  }
  // Bare digits — prefix with country's dial code and group in blocks of 3/4
  const digits = trimmed.replace(/\D/g, '').slice(0, 12)
  if (!digits) return ''
  const parts: string[] = []
  let i = 0
  while (i < digits.length) { parts.push(digits.slice(i, i + 3)); i += 3 }
  return `${dialCode} ${parts.join(' ')}`
}

function isPhoneValid(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

function padChipId(value: string): string {
  const clean = value.replace(/\D/g, '')
  return clean ? clean.padStart(15, '0') : ''
}

const COMMON_BREEDS = [...BREEDS.map(b => b.name), 'Dog', 'Unknown']
const BREED_MAP = new Map(BREEDS.map(b => [b.name, b]))

function newCat(): Cat {
  return {
    id: crypto.randomUUID(),
    name: '',
    breed: [],
    weightUnit: 'lbs',
    createdAt: new Date().toISOString(),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { existing?: Cat; prospective?: boolean }

export default function CatForm({ existing, prospective }: Props) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  // Form fields stay local state on purpose. Only the *saved* cat belongs in the
  // store — putting every keystroke there would dispatch an action per character
  // and re-render subscribers for a value nothing else has any use for yet.
  const [cat, setCat] = useState<Cat>(existing ?? newCat())
  const [breedInput, setBreedInput] = useState('')
  const [breedOpen, setBreedOpen] = useState(false)
  const [breedTooltip, setBreedTooltip] = useState<{ name: string; top: number; left: number } | null>(null)
  const breedBoxRef = useRef<HTMLDivElement>(null)
  const [illnessInput, setIllnessInput] = useState('')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (breedBoxRef.current && !breedBoxRef.current.contains(e.target as Node)) {
        setBreedOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(safeImageSrc(existing?.photoUrl))
  const [detectingLocation, setDetectingLocation] = useState(false)
  // State updates land on the next render, so two quick clicks could both see
  // `detectingLocation` as false. The ref flips synchronously and is what
  // actually keeps a second request from going out.
  const lookupInFlight = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [processingPhoto, setProcessingPhoto] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const uid = useId()
  const ids = {
    photoError: `${uid}-photo-error`,
    name: `${uid}-name`,
    nameError: `${uid}-name-error`,
    breed: `${uid}-breed`,
    breedHint: `${uid}-breed-hint`,
    color: `${uid}-color`,
    pattern: `${uid}-pattern`,
    coatLength: `${uid}-coat-length`,
    birthday: `${uid}-birthday`,
    weight: `${uid}-weight`,
    energy: `${uid}-energy`,
    hunting: `${uid}-hunting`,
    preyDrive: `${uid}-prey-drive`,
    huntingLocation: `${uid}-hunting-location`,
    illnessOther: `${uid}-illness-other`,
    chip: `${uid}-chip`,
    chipCount: `${uid}-chip-count`,
    location: `${uid}-location`,
    country: `${uid}-country`,
    region: `${uid}-region`,
    regionList: `${uid}-region-suggestions`,
    city: `${uid}-city`,
    vet: `${uid}-vet`,
    vetName: `${uid}-vet-name`,
    vetPhone: `${uid}-vet-phone`,
    vetPhoneError: `${uid}-vet-phone-error`,
    vetAddress: `${uid}-vet-address`,
    personality: `${uid}-personality`,
    notes: `${uid}-notes`,
    submitError: `${uid}-submit-error`,
  }

  const country = getCountry(cat.locationCountry)
  const dialCode = country?.dialCode ?? '+1'

  async function detectLocation() {
    if (!navigator.geolocation || lookupInFlight.current) return
    lookupInFlight.current = true
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Round to ~1km precision — city/region lookup doesn't need exact GPS coordinates
          const lat = coords.latitude.toFixed(2)
          const lon = coords.longitude.toFixed(2)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            // The default referrer policy sends only the site's origin, never the
            // path (which on an edit page carries the cat's id). Nominatim's usage
            // policy asks apps to identify themselves, and a browser can't set
            // User-Agent, so the origin is the one signal it gets — keep it.
            { headers: { 'Accept-Language': 'en' } }
          )
          if (!res.ok) throw new Error('Location lookup failed')
          const data = await res.json()
          const city    = data.address?.city || data.address?.town || data.address?.village || undefined
          const region  = data.address?.state || data.address?.province || undefined
          const country = data.address?.country || undefined
          setCat(prev => ({ ...prev, locationCity: city, locationRegion: region, locationCountry: country }))
        } catch {
          // Nominatim unreachable or returned unexpected data — leave fields as-is, user can enter manually
        } finally {
          lookupInFlight.current = false
          setDetectingLocation(false)
        }
      },
      () => {
        lookupInFlight.current = false
        setDetectingLocation(false)
      }
    )
  }

  function updateField<K extends keyof Cat>(key: K, value: Cat[K]) {
    setCat(prev => ({ ...prev, [key]: value }))
  }

  function handleCountryChange(name: string) {
    const next = getCountry(name)
    setCat(prev => ({
      ...prev,
      locationCountry: name || undefined,
      locationRegion: undefined,
      // Reset phone prefix if phone is empty or only a dial code
      vet: prev.vet ? {
        ...prev.vet,
        phone: prev.vet.phone && isPhoneValid(prev.vet.phone) ? prev.vet.phone : '',
      } : prev.vet,
    }))
  }

  function updateVet(field: 'name' | 'phone' | 'address', value: string) {
    setCat(prev => ({
      ...prev,
      vet: { name: prev.vet?.name ?? '', phone: prev.vet?.phone ?? '', address: prev.vet?.address ?? '', [field]: value },
    }))
  }

  function addBreed(breed: string) {
    const trimmed = breed.trim()
    if (!trimmed || cat.breed.includes(trimmed)) return

    setCat(prev => {
      const withBreed = { ...prev, breed: [...prev.breed, trimmed] }
      // Fill the blanks this breed settles, so the owner can see the assumption
      // sitting in the field and correct it before saving rather than having the
      // app decide quietly. Anything already answered is left alone, and breeds
      // that vary — a Persian's colour, say — fill nothing.
      return { ...withBreed, ...breedFillIns(withBreed) }
    })
    setBreedInput('')
  }

  function removeBreed(breed: string) {
    updateField('breed', cat.breed.filter(b => b !== breed))
  }

  function toggleIllness(illness: string) {
    const current = cat.knownIllnesses ?? []
    const next = current.includes(illness) ? current.filter(i => i !== illness) : [...current, illness]
    updateField('knownIllnesses', next.length ? next : undefined)
  }

  function addCustomIllness() {
    const trimmed = illnessInput.trim()
    if (!trimmed || (cat.knownIllnesses ?? []).includes(trimmed)) return
    updateField('knownIllnesses', [...(cat.knownIllnesses ?? []), trimmed])
    setIllnessInput('')
  }

  function togglePreyDrive(drive: (typeof PREY_DRIVES)[number]) {
    const current = cat.huntingPreyDrive ?? []
    const next = current.includes(drive) ? current.filter(d => d !== drive) : [...current, drive]
    updateField('huntingPreyDrive', next.length ? next : undefined)
  }

  function toggleHuntingLocation(location: (typeof HUNTING_LOCATIONS)[number]) {
    const current = cat.huntingLocation ?? []
    const next = current.includes(location) ? current.filter(l => l !== location) : [...current, location]
    updateField('huntingLocation', next.length ? next : undefined)
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const file = input.files?.[0]
    // Cleared so picking the same file again after a rejection still fires change.
    input.value = ''
    if (!file) return
    setPhotoError(null)
    setProcessingPhoto(true)
    // Downscaled and re-encoded before it goes anywhere near storage — see
    // lib/photo.ts. That also drops the file's EXIF data, GPS location included.
    const result = await prepareCatPhoto(file)
    setProcessingPhoto(false)
    if (!result.ok) {
      setPhotoError(result.message)
      return
    }
    setPhotoPreview(result.dataUrl)
    updateField('photoUrl', result.dataUrl)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    // Both of these used to return silently, so Save looked broken. Each now
    // says what is wrong and takes focus to the field.
    if (!cat.name.trim()) {
      setNameError('Your cat needs a name.')
      document.getElementById(ids.name)?.focus()
      return
    }
    const phone = cat.vet?.phone ?? ''
    if (phone && !isPhoneValid(phone)) {
      document.getElementById(ids.vetPhone)?.focus()
      return
    }
    try {
      // Writes to localStorage and updates the store together, so every open view
      // of this cat reflects the change immediately.
      dispatch(persistCat(cat))
    } catch (err) {
      // Storage can refuse the write, most often because the browser is out of
      // room. Staying on the form keeps everything typed so far.
      setSubmitError(errorMessage(err))
      return
    }
    // Adding a cat returns to the grid, where the new one is visible alongside
    // the others. Editing returns to the profile that was being edited.
    router.push(existing ? `/cats/${cat.id}` : '/cats')
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'
  const labelClass = 'block text-sm font-medium text-brand-charcoal mb-1'
  // Text-only buttons had no focus indicator, so keyboard users could not see
  // where they were.
  const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40'
  const phoneInvalid = Boolean(cat.vet?.phone && !isPhoneValid(cat.vet.phone))

  return (
    // noValidate: the browser's bubble covered the name only, and vanished on
    // its own. Both checks are made in handleSubmit and shown under the field.
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        {/* A mouse shortcut only. The button below is the real control, so
            this stays out of the tab order and the accessibility tree. */}
        <div
          aria-hidden="true"
          className="w-32 h-32 rounded-full bg-brand-tan/20 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-brand-tan hover:border-brand-orange transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview
            ? <img src={photoPreview} alt="Cat photo" className="w-full h-full object-cover" />
            : <span className="text-4xl select-none">🐱</span>}
        </div>
        <button
          type="button" onClick={() => fileRef.current?.click()} disabled={processingPhoto}
          aria-describedby={photoError ? ids.photoError : undefined}
          className={`text-sm text-brand-slate hover:underline disabled:opacity-50 rounded-lg px-1 ${focusRing}`}
        >
          {processingPhoto ? 'Preparing photo…' : photoPreview ? 'Change photo' : 'Add photo'}
        </button>
        <input ref={fileRef} type="file" accept={PHOTO_ACCEPT} onChange={handlePhotoChange} className="hidden" tabIndex={-1} aria-hidden="true" />
        {photoError && (
          <p id={ids.photoError} role="alert" className="text-sm text-red-700 text-center max-w-xs">
            {photoError}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor={ids.name} className={labelClass}>
          Name <span className="text-brand-orange" aria-hidden="true">*</span>
        </label>
        <input
          id={ids.name}
          type="text" required
          value={cat.name}
          onChange={e => { updateField('name', e.target.value); if (e.target.value.trim()) setNameError(null) }}
          placeholder="What's your cat's name?"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? ids.nameError : undefined}
          className={nameError ? inputClass.replace('border-brand-tan/50', 'border-red-400') : inputClass}
        />
        {nameError && <p id={ids.nameError} className="text-xs text-red-700 mt-1 px-1">{nameError}</p>}
      </div>

      {/* Breed */}
      <div>
        <label htmlFor={ids.breed} className={labelClass}>Breed</label>
        <p id={ids.breedHint} className="text-xs text-brand-brown/60 mb-2">Add multiple for mixed breeds</p>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1" ref={breedBoxRef}>
            <input
              id={ids.breed}
              type="text"
              aria-describedby={ids.breedHint}
              value={breedInput}
              onChange={e => { setBreedInput(e.target.value); setBreedOpen(true) }}
              onFocus={() => setBreedOpen(true)}
              // onFocus only fires when focus is gained, so it does nothing if the
              // input already has it. Clicking a focused input still has to reopen
              // the list after Escape has closed it.
              onClick={() => setBreedOpen(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addBreed(breedInput) }
                if (e.key === 'Escape') setBreedOpen(false)
              }}
              placeholder="Type or pick a breed..."
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
            />
            {breedOpen && (() => {
              const q = breedInput.toLowerCase()
              const filtered = COMMON_BREEDS.filter(b =>
                !cat.breed.includes(b) && b.toLowerCase().includes(q)
              )
              if (!filtered.length) return null
              return (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-brand-tan/40 rounded-2xl shadow-lg max-h-56 overflow-y-auto overflow-x-hidden">
                  {filtered.map(b => {
                    const info = BREED_MAP.get(b)
                    return (
                      <li key={b}>
                        <button
                          type="button"
                          // The list deliberately stays open after a pick. This is a
                          // multi-select and the list already drops anything chosen,
                          // so closing it made adding a second breed impossible
                          // without clicking away first: preventDefault keeps focus
                          // in the input, and onFocus cannot refire on an input that
                          // never lost focus.
                          onMouseDown={e => { e.preventDefault(); addBreed(b); setBreedTooltip(null) }}
                          onMouseEnter={e => {
                            if (!info) return
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setBreedTooltip({ name: b, top: rect.top - 8, left: rect.left })
                          }}
                          onMouseLeave={() => setBreedTooltip(null)}
                          className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-brand-charcoal hover:bg-brand-tan/10 transition-colors whitespace-nowrap"
                        >
                          <span className="truncate">{b}</span>
                          {info && <span className="flex-shrink-0 text-xs text-brand-brown/60">{info.origin}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </div>
          <button type="button" onClick={() => { addBreed(breedInput); setBreedOpen(false) }} aria-label="Add breed" className={`px-4 py-2.5 bg-brand-tan text-white rounded-2xl text-sm font-medium hover:bg-brand-brown transition-colors ${focusRing}`}>
            Add
          </button>
        </div>
        {cat.breed.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cat.breed.map(b => (
              <BreedTag key={b} name={b} onRemove={() => removeBreed(b)} />
            ))}
          </div>
        )}
        {breedTooltip && (() => {
          const info = BREED_MAP.get(breedTooltip.name)
          if (!info) return null
          return createPortal(
            <div
              className="fixed z-[9999] w-56 bg-white border border-brand-tan/40 rounded-2xl shadow-lg p-3 pointer-events-none"
              style={{ top: breedTooltip.top, left: breedTooltip.left, transform: 'translateY(-100%)' }}
            >
              <p className="font-semibold text-xs text-brand-brown mb-1">{breedTooltip.name}</p>
              <p className="text-xs text-brand-brown/60 leading-relaxed line-clamp-4">{info.description}</p>
            </div>,
            document.body
          )
        })()}
      </div>

      {/* Coat colour and pattern — kept separate so the avatar can tint the
          base colour and pick a markings layer independently. */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor={ids.color} className={labelClass}>Color</label>
          <select
            id={ids.color}
            value={cat.color ?? ''}
            onChange={e => updateField('color', (e.target.value || undefined) as Cat['color'])}
            className={inputClass}
          >
            <option value="">Select a color…</option>
            {COAT_COLORS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor={ids.pattern} className={labelClass}>Pattern</label>
          <select
            id={ids.pattern}
            value={cat.pattern ?? ''}
            onChange={e => updateField('pattern', (e.target.value || undefined) as Cat['pattern'])}
            className={inputClass}
          >
            <option value="">Select a pattern…</option>
            {COAT_PATTERNS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Coat length */}
      <div>
        <label htmlFor={ids.coatLength} className={labelClass}>Coat length</label>
        <select
          id={ids.coatLength}
          value={cat.coatLength ?? ''}
          onChange={e => updateField('coatLength', (e.target.value || undefined) as Cat['coatLength'])}
          className={inputClass}
        >
          <option value="">Select coat length…</option>
          {COAT_LENGTHS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Birthday */}
      <div>
        <label htmlFor={ids.birthday} className={labelClass}>Birthday</label>
        <input id={ids.birthday} type="date" value={cat.birthday ?? ''} onChange={e => updateField('birthday', e.target.value || undefined)} className={inputClass} />
      </div>

      {/* Weight */}
      <div>
        <label htmlFor={ids.weight} className={labelClass}>Weight</label>
        <div className="flex gap-2">
          <input
            id={ids.weight}
            type="number" min="0" step="0.1"
            value={cat.weight ?? ''}
            onChange={e => updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.0"
            className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
          />
          <select aria-label="Weight unit" value={cat.weightUnit} onChange={e => updateField('weightUnit', e.target.value as 'lbs' | 'kg')} className="px-3 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white">
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>

      {/* Energy level */}
      <div>
        <label htmlFor={ids.energy} className={labelClass}>Energy level</label>
        <select
          id={ids.energy}
          value={cat.energyLevel ?? ''}
          onChange={e => updateField('energyLevel', (e.target.value || undefined) as Cat['energyLevel'])}
          className={inputClass}
        >
          <option value="">Select energy level…</option>
          {ENERGY_LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Hunting */}
      <div role="group" aria-labelledby={ids.hunting}>
        <span id={ids.hunting} className="block text-sm font-medium text-brand-charcoal mb-2">Hunting</span>
        <div className="space-y-2">
          <div>
            <p id={ids.preyDrive} className="text-xs text-brand-brown/60 mb-1">Prey drive — what do they go after?</p>
            <div role="group" aria-labelledby={ids.preyDrive} className="flex flex-wrap gap-x-4 gap-y-2 bg-brand-tan/10 rounded-2xl p-4">
              {PREY_DRIVES.map(drive => (
                <label key={drive} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    type="checkbox"
                    checked={(cat.huntingPreyDrive ?? []).includes(drive)}
                    onChange={() => togglePreyDrive(drive)}
                    className="rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40"
                  />
                  {drive}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-brand-charcoal ml-auto">
                Likes electronic toys?
                <select
                  value={cat.likesElectronicToys ?? ''}
                  onChange={e => updateField('likesElectronicToys', (e.target.value || undefined) as Cat['likesElectronicToys'])}
                  className="px-2 py-1 rounded-lg border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
                >
                  <option value="">Select…</option>
                  {YES_NO_UNKNOWN.map(v => <option key={v}>{v}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div>
            <p id={ids.huntingLocation} className="text-xs text-brand-brown/60 mb-1">Where do they hunt?</p>
            <div role="group" aria-labelledby={ids.huntingLocation} className="flex flex-wrap gap-x-4 gap-y-2 bg-brand-tan/10 rounded-2xl p-4">
              {HUNTING_LOCATIONS.map(location => (
                <label key={location} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    type="checkbox"
                    checked={(cat.huntingLocation ?? []).includes(location)}
                    onChange={() => toggleHuntingLocation(location)}
                    className="rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40"
                  />
                  {location}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Known illnesses */}
      <fieldset className="min-w-0">
        <legend className="block text-sm font-medium text-brand-charcoal mb-2">Known illnesses</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-brand-tan/10 rounded-2xl p-4">
          {KNOWN_ILLNESSES.map(illness => (
            <label key={illness} className="flex items-center gap-2 text-sm text-brand-charcoal">
              <input
                type="checkbox"
                checked={(cat.knownIllnesses ?? []).includes(illness)}
                onChange={() => toggleIllness(illness)}
                className="rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40"
              />
              {illness}
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <label htmlFor={ids.illnessOther} className="sr-only">Other illness</label>
          <input
            id={ids.illnessOther}
            type="text"
            value={illnessInput}
            onChange={e => setIllnessInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomIllness() } }}
            placeholder="Other illness…"
            className={inputClass}
          />
          <button type="button" onClick={addCustomIllness} aria-label="Add illness" className={`px-4 py-2.5 bg-brand-tan text-white rounded-2xl text-sm font-medium hover:bg-brand-brown transition-colors ${focusRing}`}>
            Add
          </button>
        </div>
        {(() => {
          const custom = (cat.knownIllnesses ?? []).filter(i => !KNOWN_ILLNESSES.includes(i))
          if (!custom.length) return null
          return (
            <div className="flex flex-wrap gap-2 mt-2">
              {custom.map(i => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-tan/20 text-brand-charcoal text-sm">
                  {i}
                  <button type="button" onClick={() => toggleIllness(i)} aria-label={`Remove ${i}`} className={`text-brand-slate hover:text-brand-brown rounded-full ${focusRing}`}>×</button>
                </span>
              ))}
            </div>
          )
        })()}
      </fieldset>

      {/* Microchip */}
      {!prospective && (
        <div>
          <label htmlFor={ids.chip} className={labelClass}>Microchip ID</label>
          <div className="relative">
            <input
              id={ids.chip}
              aria-describedby={ids.chipCount}
              type="text" inputMode="numeric" maxLength={15}
              value={cat.chipId ?? ''}
              onChange={e => updateField('chipId', e.target.value.replace(/\D/g, '').slice(0, 15) || undefined)}
              onBlur={e => { const p = padChipId(e.target.value); updateField('chipId', p || undefined) }}
              placeholder="15-digit chip number"
              className={`${inputClass} font-mono pr-12`}
            />
            <span id={ids.chipCount} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-brown/40 pointer-events-none font-mono">
              {(cat.chipId ?? '').length}/15
            </span>
          </div>
        </div>
      )}

      {/* Home location */}
      <div role="group" aria-labelledby={ids.location}>
        <div className="flex items-center justify-between mb-2">
          <span id={ids.location} className="block text-sm font-medium text-brand-charcoal">Home location</span>
          {/* Disabled while a lookup is in flight, so repeated clicks cannot
              fire a burst of requests at a free, rate-limited public service. */}
          <button
            type="button" onClick={detectLocation} disabled={detectingLocation}
            title="Detect my location"
            aria-label="Detect my location"
            aria-busy={detectingLocation}
            className={`text-xs text-brand-slate hover:underline disabled:opacity-50 flex items-center gap-1 rounded-lg px-1 ${focusRing}`}
          >
            {detectingLocation ? 'Detecting…' : '📍 Detect'}
          </button>
        </div>
        <div className="space-y-2">
          {/* Country */}
          <label htmlFor={ids.country} className="sr-only">Country</label>
          <select
            id={ids.country}
            value={cat.locationCountry ?? ''}
            onChange={e => handleCountryChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>

          {/* State / Province / Region — only if country has one */}
          {country?.regionLabel && (
            <>
              <label htmlFor={ids.region} className="sr-only">{country.regionLabel}</label>
              <input
                id={ids.region}
                type="text"
                list={country.regions ? ids.regionList : undefined}
                value={cat.locationRegion ?? ''}
                onChange={e => updateField('locationRegion', e.target.value || undefined)}
                placeholder={country.regionLabel}
                className={inputClass}
              />
              {country.regions && (
                <datalist id={ids.regionList}>
                  {country.regions.map(r => <option key={r} value={r} />)}
                </datalist>
              )}
            </>
          )}

          {/* City / Town */}
          <label htmlFor={ids.city} className="sr-only">City / Town</label>
          <input
            id={ids.city}
            type="text"
            value={cat.locationCity ?? ''}
            onChange={e => updateField('locationCity', e.target.value || undefined)}
            placeholder="City / Town"
            className={inputClass}
          />
        </div>
      </div>

      {/* Vet */}
      <div role="group" aria-labelledby={ids.vet}>
        <span id={ids.vet} className="block text-sm font-medium text-brand-charcoal mb-2">Vet info</span>
        <div className="space-y-2 bg-brand-tan/10 rounded-2xl p-4">
          <label htmlFor={ids.vetName} className="sr-only">Vet clinic name</label>
          <input
            id={ids.vetName}
            type="text" placeholder="Vet clinic name"
            value={cat.vet?.name ?? ''}
            onChange={e => updateVet('name', e.target.value)}
            className={inputClass}
          />
          <div>
            <label htmlFor={ids.vetPhone} className="sr-only">Vet phone</label>
            <input
              id={ids.vetPhone}
              type="tel"
              placeholder={`${dialCode} 555 000 0000`}
              value={cat.vet?.phone ?? ''}
              onChange={e => updateVet('phone', formatPhone(e.target.value, dialCode))}
              aria-invalid={phoneInvalid ? true : undefined}
              aria-describedby={phoneInvalid ? ids.vetPhoneError : undefined}
              className={phoneInvalid ? `${inputClass.replace('border-brand-tan/50', 'border-red-400')} focus:ring-red-300` : inputClass}
            />
            {phoneInvalid && (
              <p id={ids.vetPhoneError} className="text-xs text-red-700 mt-1 px-1">Enter a valid phone number</p>
            )}
          </div>
          <label htmlFor={ids.vetAddress} className="sr-only">Vet address</label>
          <input
            id={ids.vetAddress}
            type="text" placeholder="Address"
            value={cat.vet?.address ?? ''}
            onChange={e => updateVet('address', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Personality */}
      <div>
        <label htmlFor={ids.personality} className={labelClass}>Personality</label>
        <textarea
          id={ids.personality}
          value={cat.personality ?? ''}
          onChange={e => updateField('personality', e.target.value || undefined)}
          placeholder="Describe their personality, favorite activities, sleeping positions..."
          rows={3} className={`${inputClass} resize-none`}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor={ids.notes} className={labelClass}>Notes</label>
        <textarea
          id={ids.notes}
          value={cat.notes ?? ''}
          onChange={e => updateField('notes', e.target.value || undefined)}
          placeholder="Anything else to note..."
          rows={2} className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      {submitError && (
        <p id={ids.submitError} role="alert" className="text-sm text-red-700">
          {submitError}
        </p>
      )}
      <div className="flex gap-3 pt-2 pb-8">
        {/* Held while a photo is still being shrunk, so the save cannot go out
            without it. */}
        <button type="submit" disabled={processingPhoto} aria-describedby={submitError ? ids.submitError : undefined} className={`flex-1 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft disabled:opacity-60 ${focusRing} focus-visible:ring-offset-2`}>
          Save Cat
        </button>
        <button type="button" onClick={() => router.back()} className={`px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors ${focusRing}`}>
          Cancel
        </button>
      </div>

    </form>
  )
}
