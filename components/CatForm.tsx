'use client'

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Cat } from '@/types/cat'
import { saveCat } from '@/lib/storage'
import { BREEDS } from '@/lib/breeds'
import { COAT_LENGTHS, ENERGY_LEVELS, PREY_DRIVES, HUNTING_LOCATIONS, KNOWN_ILLNESSES, YES_NO_UNKNOWN } from '@/lib/catAttributes'
import BreedTag from '@/components/BreedTag'

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
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(existing?.photoUrl)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const country = getCountry(cat.locationCountry)
  const dialCode = country?.dialCode ?? '+1'

  async function detectLocation() {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Round to ~1km precision — city/region lookup doesn't need exact GPS coordinates
          const lat = coords.latitude.toFixed(2)
          const lon = coords.longitude.toFixed(2)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
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
          setDetectingLocation(false)
        }
      },
      () => setDetectingLocation(false)
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
    updateField('breed', [...cat.breed, trimmed])
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

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPhotoPreview(result)
      updateField('photoUrl', result)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cat.name.trim()) return
    const phone = cat.vet?.phone ?? ''
    if (phone && !isPhoneValid(phone)) return
    saveCat(cat)
    router.push(`/cats/${cat.id}`)
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-32 h-32 rounded-full bg-brand-tan/20 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-brand-tan hover:border-brand-orange transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview
            ? <img src={photoPreview} alt="Cat photo" className="w-full h-full object-cover" />
            : <span className="text-4xl select-none">🐱</span>}
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-brand-slate hover:underline">
          {photoPreview ? 'Change photo' : 'Add photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">
          Name <span className="text-brand-orange">*</span>
        </label>
        <input
          type="text" required
          value={cat.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="What's your cat's name?"
          className={inputClass}
        />
      </div>

      {/* Breed */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Breed</label>
        <p className="text-xs text-brand-brown/60 mb-2">Add multiple for mixed breeds</p>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1" ref={breedBoxRef}>
            <input
              type="text"
              value={breedInput}
              onChange={e => { setBreedInput(e.target.value); setBreedOpen(true) }}
              onFocus={() => setBreedOpen(true)}
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
                          onMouseDown={e => { e.preventDefault(); addBreed(b); setBreedOpen(false); setBreedTooltip(null) }}
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
          <button type="button" onClick={() => { addBreed(breedInput); setBreedOpen(false) }} className="px-4 py-2.5 bg-brand-tan text-white rounded-2xl text-sm font-medium hover:bg-brand-brown transition-colors">
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

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Color</label>
        <select
          value={cat.color ?? ''}
          onChange={e => updateField('color', e.target.value || undefined)}
          className={inputClass}
        >
          <option value="">Select a color…</option>
          <optgroup label="Solids">
            <option>Black</option>
            <option>White</option>
            <option>Gray</option>
            <option>Orange</option>
            <option>Brown</option>
            <option>Cream</option>
          </optgroup>
          <optgroup label="Patterns">
            <option>Tabby</option>
            <option>Calico</option>
            <option>Tortoiseshell</option>
            <option>Tuxedo</option>
            <option>Colorpoint</option>
          </optgroup>
        </select>
      </div>

      {/* Coat length */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Coat length</label>
        <select
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
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Birthday</label>
        <input type="date" value={cat.birthday ?? ''} onChange={e => updateField('birthday', e.target.value || undefined)} className={inputClass} />
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Weight</label>
        <div className="flex gap-2">
          <input
            type="number" min="0" step="0.1"
            value={cat.weight ?? ''}
            onChange={e => updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.0"
            className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
          />
          <select value={cat.weightUnit} onChange={e => updateField('weightUnit', e.target.value as 'lbs' | 'kg')} className="px-3 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white">
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>

      {/* Energy level */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Energy level</label>
        <select
          value={cat.energyLevel ?? ''}
          onChange={e => updateField('energyLevel', (e.target.value || undefined) as Cat['energyLevel'])}
          className={inputClass}
        >
          <option value="">Select energy level…</option>
          {ENERGY_LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      {/* Hunting */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-2">Hunting</label>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-brand-brown/60 mb-1">Prey drive — what do they go after?</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 bg-brand-tan/10 rounded-2xl p-4">
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
            <p className="text-xs text-brand-brown/60 mb-1">Where do they hunt?</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 bg-brand-tan/10 rounded-2xl p-4">
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
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-2">Known illnesses</label>
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
          <input
            type="text"
            value={illnessInput}
            onChange={e => setIllnessInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomIllness() } }}
            placeholder="Other illness…"
            className={inputClass}
          />
          <button type="button" onClick={addCustomIllness} className="px-4 py-2.5 bg-brand-tan text-white rounded-2xl text-sm font-medium hover:bg-brand-brown transition-colors">
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
                  <button type="button" onClick={() => toggleIllness(i)} className="text-brand-slate hover:text-brand-brown">×</button>
                </span>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Microchip */}
      {!prospective && (
        <div>
          <label className="block text-sm font-medium text-brand-charcoal mb-1">Microchip ID</label>
          <div className="relative">
            <input
              type="text" inputMode="numeric" maxLength={15}
              value={cat.chipId ?? ''}
              onChange={e => updateField('chipId', e.target.value.replace(/\D/g, '').slice(0, 15) || undefined)}
              onBlur={e => { const p = padChipId(e.target.value); updateField('chipId', p || undefined) }}
              placeholder="15-digit chip number"
              className={`${inputClass} font-mono pr-12`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-brown/40 pointer-events-none font-mono">
              {(cat.chipId ?? '').length}/15
            </span>
          </div>
        </div>
      )}

      {/* Home location */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-brand-charcoal">Home location</label>
          <button
            type="button" onClick={detectLocation} disabled={detectingLocation}
            title="Detect my location"
            className="text-xs text-brand-slate hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            {detectingLocation ? 'Detecting…' : '📍 Detect'}
          </button>
        </div>
        <div className="space-y-2">
          {/* Country */}
          <select
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
              <input
                type="text"
                list="region-suggestions"
                value={cat.locationRegion ?? ''}
                onChange={e => updateField('locationRegion', e.target.value || undefined)}
                placeholder={country.regionLabel}
                className={inputClass}
              />
              {country.regions && (
                <datalist id="region-suggestions">
                  {country.regions.map(r => <option key={r} value={r} />)}
                </datalist>
              )}
            </>
          )}

          {/* City / Town */}
          <input
            type="text"
            value={cat.locationCity ?? ''}
            onChange={e => updateField('locationCity', e.target.value || undefined)}
            placeholder="City / Town"
            className={inputClass}
          />
        </div>
      </div>

      {/* Vet */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-2">Vet info</label>
        <div className="space-y-2 bg-brand-tan/10 rounded-2xl p-4">
          <input
            type="text" placeholder="Vet clinic name"
            value={cat.vet?.name ?? ''}
            onChange={e => updateVet('name', e.target.value)}
            className={inputClass}
          />
          <div>
            <input
              type="tel"
              placeholder={`${dialCode} 555 000 0000`}
              value={cat.vet?.phone ?? ''}
              onChange={e => updateVet('phone', formatPhone(e.target.value, dialCode))}
              className={`${inputClass} ${cat.vet?.phone && !isPhoneValid(cat.vet.phone) ? 'border-red-400 focus:ring-red-300' : ''}`}
            />
            {cat.vet?.phone && !isPhoneValid(cat.vet.phone) && (
              <p className="text-xs text-red-400 mt-1 px-1">Enter a valid phone number</p>
            )}
          </div>
          <input
            type="text" placeholder="Address"
            value={cat.vet?.address ?? ''}
            onChange={e => updateVet('address', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Personality */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Personality</label>
        <textarea
          value={cat.personality ?? ''}
          onChange={e => updateField('personality', e.target.value || undefined)}
          placeholder="Describe their personality, favorite activities, sleeping positions..."
          rows={3} className={`${inputClass} resize-none`}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Notes</label>
        <textarea
          value={cat.notes ?? ''}
          onChange={e => updateField('notes', e.target.value || undefined)}
          placeholder="Anything else to note..."
          rows={2} className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-8">
        <button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft">
          Save Cat
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors">
          Cancel
        </button>
      </div>

    </form>
  )
}
