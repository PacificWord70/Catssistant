import { describe, expect, it } from 'vitest'
import { toLbs, validateWeightEntry, WeightEntryInput } from '@/lib/healthValidation'

const base: WeightEntryInput = {
  weight: '10',
  unit: 'lbs',
  date: '2026-08-20',
  today: '2026-08-24',
}

const check = (over: Partial<WeightEntryInput>) => validateWeightEntry({ ...base, ...over })

describe('toLbs', () => {
  it('passes pounds through untouched', () => {
    expect(toLbs(10, 'lbs')).toBe(10)
  })

  it('converts kilograms', () => {
    expect(toLbs(5, 'kg')).toBeCloseTo(11.02, 2)
  })
})

describe('validateWeightEntry', () => {
  it('accepts a plausible entry', () => {
    expect(check({})).toBeUndefined()
  })

  describe('the weight itself', () => {
    it('rejects an empty box, and one holding only spaces', () => {
      expect(check({ weight: '' })?.field).toBe('weight')
      expect(check({ weight: '   ' })?.field).toBe('weight')
    })

    it('rejects text', () => {
      expect(check({ weight: 'ten' })?.message).toBe('That is not a number.')
    })

    it('rejects zero and negatives', () => {
      expect(check({ weight: '0' })?.message).toMatch(/greater than zero/)
      expect(check({ weight: '-4' })?.message).toMatch(/greater than zero/)
    })

    it('catches a decimal-point typo, the 112-for-11.2 case', () => {
      expect(check({ weight: '112' })?.field).toBe('weight')
      expect(check({ weight: '11.2' })).toBeUndefined()
    })

    it('catches pounds typed into a form set to kilograms', () => {
      // 15kg is 33lbs — plausible. 25kg is 55lbs, which no cat is.
      expect(check({ weight: '15', unit: 'kg' })).toBeUndefined()
      const tooHeavy = check({ weight: '25', unit: 'kg' })
      expect(tooHeavy?.field).toBe('weight')
      expect(tooHeavy?.message).toMatch(/kg is about/)
    })

    it('rejects a weight below a newborn kitten', () => {
      expect(check({ weight: '0.05' })?.message).toMatch(/check the number/)
    })

    it('accepts a kitten and a large adult', () => {
      expect(check({ weight: '0.5' })).toBeUndefined()
      expect(check({ weight: '24' })).toBeUndefined()
    })
  })

  describe('the date', () => {
    it('rejects an empty date', () => {
      expect(check({ date: '' })?.field).toBe('date')
    })

    it('rejects the future, which the input max attribute alone cannot enforce', () => {
      expect(check({ date: '2026-08-25' })?.message).toBe('That date is in the future.')
      expect(check({ date: '2026-08-24' })).toBeUndefined()
    })

    it('rejects a date before the cat was born', () => {
      expect(check({ birthday: '2026-01-01', date: '2025-12-31' })?.message).toBe('That is before this cat was born.')
      expect(check({ birthday: '2026-01-01', date: '2026-01-01' })).toBeUndefined()
    })

    it('ignores the birthday rule when no birthday is on file', () => {
      expect(check({ birthday: undefined, date: '2001-05-05' })).toBeUndefined()
    })

    it('rejects a second reading on a date that already has one', () => {
      expect(check({ existingDates: ['2026-08-20'] })?.message).toMatch(/already a reading/)
      expect(check({ existingDates: ['2026-08-19'] })).toBeUndefined()
    })
  })

  it('reports the weight before the date, so the first box is fixed first', () => {
    expect(check({ weight: '', date: '2030-01-01' })?.field).toBe('weight')
  })
})
