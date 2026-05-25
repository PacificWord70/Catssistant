'use client'

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Cat } from '@/types/cat'
import { saveCat } from '@/lib/storage'

const COMMON_BREEDS = [
  'American Shorthair', 'Bengal', 'Birman', 'British Shorthair',
  'Domestic Shorthair', 'Domestic Longhair', 'Maine Coon', 'Persian',
  'Ragdoll', 'Russian Blue', 'Scottish Fold', 'Siamese',
  'Siberian', 'Sphynx', 'Turkish Angora',
]

function newCat(): Cat {
  return {
    id: crypto.randomUUID(),
    name: '',
    breed: [],
    weightUnit: 'lbs',
    createdAt: new Date().toISOString(),
  }
}

interface Props {
  existing?: Cat
}

export default function CatForm({ existing }: Props) {
  const router = useRouter()
  const [cat, setCat] = useState<Cat>(existing ?? newCat())
  const [breedInput, setBreedInput] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(existing?.photoUrl)
  const fileRef = useRef<HTMLInputElement>(null)

  function updateField<K extends keyof Cat>(key: K, value: Cat[K]) {
    setCat(prev => ({ ...prev, [key]: value }))
  }

  function updateVet(field: 'name' | 'phone' | 'address', value: string) {
    setCat(prev => ({
      ...prev,
      vet: {
        name: prev.vet?.name ?? '',
        phone: prev.vet?.phone ?? '',
        address: prev.vet?.address ?? '',
        [field]: value,
      },
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
    saveCat(cat)
    router.push(`/cats/${cat.id}`)
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-32 h-32 rounded-full bg-brand-tan/20 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-brand-tan hover:border-brand-orange transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Cat photo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl select-none">🐱</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm text-brand-slate hover:underline"
        >
          {photoPreview ? 'Change photo' : 'Add photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">
          Name <span className="text-brand-orange">*</span>
        </label>
        <input
          type="text"
          required
          value={cat.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="What's your cat's name?"
          className={inputClass}
        />
      </div>

      {/* Breed */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Breed</label>
        <p className="text-xs text-gray-400 mb-2">Add multiple for mixed breeds</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={breedInput}
            onChange={e => setBreedInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addBreed(breedInput)
              }
            }}
            list="breed-suggestions"
            placeholder="Type or pick a breed..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
          />
          <datalist id="breed-suggestions">
            {COMMON_BREEDS.map(b => <option key={b} value={b} />)}
          </datalist>
          <button
            type="button"
            onClick={() => addBreed(breedInput)}
            className="px-4 py-2.5 bg-brand-tan text-white rounded-xl text-sm font-medium hover:bg-brand-brown transition-colors"
          >
            Add
          </button>
        </div>
        {cat.breed.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cat.breed.map(b => (
              <span
                key={b}
                className="flex items-center gap-1 px-3 py-1 bg-brand-tan/20 text-brand-brown rounded-full text-sm"
              >
                {b}
                <button
                  type="button"
                  onClick={() => removeBreed(b)}
                  className="text-brand-tan hover:text-brand-brown font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Birthday */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Birthday</label>
        <input
          type="date"
          value={cat.birthday ?? ''}
          onChange={e => updateField('birthday', e.target.value || undefined)}
          className={inputClass}
        />
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Weight</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.1"
            value={cat.weight ?? ''}
            onChange={e =>
              updateField('weight', e.target.value ? parseFloat(e.target.value) : undefined)
            }
            placeholder="0.0"
            className="flex-1 px-4 py-2.5 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
          />
          <select
            value={cat.weightUnit}
            onChange={e => updateField('weightUnit', e.target.value as 'lbs' | 'kg')}
            className="px-3 py-2.5 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white"
          >
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>

      {/* Chip ID */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Microchip ID</label>
        <input
          type="text"
          value={cat.chipId ?? ''}
          onChange={e => updateField('chipId', e.target.value || undefined)}
          placeholder="15-digit chip number"
          className={`${inputClass} font-mono`}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Home location</label>
        <p className="text-xs text-gray-400 mb-1">Rough area for weather info (e.g. &quot;Seattle, WA&quot;)</p>
        <input
          type="text"
          value={cat.homeLocation ?? ''}
          onChange={e => updateField('homeLocation', e.target.value || undefined)}
          placeholder="City, State"
          className={inputClass}
        />
      </div>

      {/* Vet */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-2">Vet info</label>
        <div className="space-y-2 bg-brand-cream rounded-xl p-4">
          <input
            type="text"
            placeholder="Vet clinic name"
            value={cat.vet?.name ?? ''}
            onChange={e => updateVet('name', e.target.value)}
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={cat.vet?.phone ?? ''}
            onChange={e => updateVet('phone', e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Address"
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
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-brand-charcoal mb-1">Notes</label>
        <textarea
          value={cat.notes ?? ''}
          onChange={e => updateField('notes', e.target.value || undefined)}
          placeholder="Anything else to note..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 pb-8">
        <button
          type="submit"
          className="flex-1 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-sm"
        >
          Save Cat
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-xl font-medium hover:bg-brand-tan/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
