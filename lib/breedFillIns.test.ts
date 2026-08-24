import { describe, it, expect } from 'vitest'
import { breedFillIns } from '@/lib/breedDefaults'

/**
 * These values get written into the form, not just read for display, so the
 * rules are stricter than the effective* readers: never overwrite an answer,
 * and never invent one the breed does not actually settle.
 */

const blank = { color: undefined, pattern: undefined, coatLength: undefined, energyLevel: undefined }

describe('breedFillIns', () => {
  it('fills everything a breed settles', () => {
    expect(breedFillIns({ breed: ['Russian Blue'], ...blank })).toEqual({
      color: 'Gray',
      pattern: 'Solid',
      coatLength: 'Short',
      energyLevel: 'Medium',
    })
  })

  it('fills only what the breed settles, leaving the rest for the owner', () => {
    // Persians come in every colour and marking, so only the coat is decided.
    expect(breedFillIns({ breed: ['Persian'], ...blank })).toEqual({
      coatLength: 'Long',
      energyLevel: 'Low',
    })
  })

  it('never overwrites an answer the owner already gave', () => {
    const filled = breedFillIns({
      breed: ['Russian Blue'],
      color: 'Cream',
      pattern: 'Tabby',
      coatLength: 'Long',
      energyLevel: 'High',
    })
    expect(filled).toEqual({})
  })

  it('treats Unknown as a blank worth filling', () => {
    const filled = breedFillIns({
      breed: ['Bengal'],
      ...blank,
      coatLength: 'Unknown',
      energyLevel: 'Unknown',
    })
    expect(filled.coatLength).toBe('Short')
    expect(filled.energyLevel).toBe('High')
  })

  it('fills nothing at all without a breed', () => {
    expect(breedFillIns({ breed: [], ...blank })).toEqual({})
  })

  it('fills nothing for a breed it does not recognise', () => {
    expect(breedFillIns({ breed: ['Moggie'], ...blank })).toEqual({})
  })

  it('never writes Unknown into a field', () => {
    // Unknown is what the reader returns when the breed had nothing to say, and
    // storing it would look like the owner had answered.
    const filled = breedFillIns({ breed: ['Moggie'], ...blank })
    expect(Object.values(filled)).not.toContain('Unknown')
  })

  it('resolves on the first breed listed', () => {
    expect(breedFillIns({ breed: ['Sphynx', 'Persian'], ...blank }).coatLength).toBe('Hairless')
  })
})
