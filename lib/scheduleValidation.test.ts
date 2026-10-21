import { describe, expect, it } from 'vitest'
import { ScheduleDraft, firstInvalidField, validateScheduleDraft } from '@/lib/scheduleValidation'
import { SAVE_FALLBACK_MESSAGE, errorMessage } from '@/lib/formErrors'

const base: ScheduleDraft = {
  category: 'Grooming',
  catIds: ['a'],
  title: '',
  date: '2026-10-26',
  times: [],
  recurrenceEndDate: '',
  endDateShown: false,
  medicationStatus: 'Started',
  feedingAmounts: [],
  vetName: '',
  vetAddress: '',
  routineType: 'Changed food',
  litterType: '',
}

const check = (over: Partial<ScheduleDraft>) => validateScheduleDraft({ ...base, ...over })

describe('validateScheduleDraft', () => {
  it('accepts a minimal grooming event', () => {
    expect(check({})).toEqual({})
  })

  it('needs at least one cat and a date', () => {
    expect(check({ catIds: [] }).cats).toBeTruthy()
    expect(check({ date: '' }).date).toBeTruthy()
  })

  it('puts an early end date on the Until field when it is shown', () => {
    const errors = check({ recurrenceEndDate: '2026-10-01', endDateShown: true })
    expect(errors.recurrenceEndDate).toBeTruthy()
    expect(errors.date).toBeUndefined()
  })

  it('moves an early end date onto Date when Until is hidden', () => {
    const errors = check({ recurrenceEndDate: '2026-10-01', endDateShown: false })
    expect(errors.recurrenceEndDate).toBeUndefined()
    expect(errors.date).toBeTruthy()
  })

  it('needs a medicine name, and a first dose time while started', () => {
    const errors = check({ category: 'Medication', times: [''] })
    expect(errors.title).toBeTruthy()
    expect(errors.times).toBeTruthy()
    expect(check({ category: 'Medication', title: 'Gabapentin', medicationStatus: 'Stopped' })).toEqual({})
  })

  it('needs a label for Other', () => {
    expect(check({ category: 'Other' }).title).toBeTruthy()
    expect(check({ category: 'Other', title: 'Nail trim' })).toEqual({})
  })

  it('needs a time and a positive amount for every fed cat', () => {
    const errors = check({
      category: 'Feeding',
      catIds: ['a', 'b'],
      times: ['08:00'],
      feedingAmounts: [{ catId: 'a', amount: 0.5 }],
    })
    expect(errors.feedingAmounts).toBeTruthy()
    expect(errors.times).toBeUndefined()
    expect(
      check({
        category: 'Feeding',
        catIds: ['a'],
        times: ['08:00'],
        feedingAmounts: [{ catId: 'a', amount: 0.5 }],
      }),
    ).toEqual({})
  })

  it('treats a NaN amount as missing', () => {
    const errors = check({ category: 'Feeding', times: ['08:00'], feedingAmounts: [{ catId: 'a', amount: NaN }] })
    expect(errors.feedingAmounts).toBeTruthy()
  })

  it('needs a time, clinic name and address for a vet visit', () => {
    const errors = check({ category: 'Vet', times: [''], vetName: ' ', vetAddress: '' })
    expect(Object.keys(errors).sort()).toEqual(['times', 'vetAddress', 'vetName'])
  })

  it('needs a litter type only when the litter changed', () => {
    expect(check({ category: 'Care Routine', routineType: 'Changed litter' }).litterType).toBeTruthy()
    expect(check({ category: 'Care Routine', routineType: 'Changed food' })).toEqual({})
  })
})

describe('firstInvalidField', () => {
  it('picks the earliest field on screen, not the first rule checked', () => {
    expect(firstInvalidField({ date: 'x', cats: 'y' })).toBe('cats')
    expect(firstInvalidField({ vetAddress: 'x', times: 'y' })).toBe('times')
  })

  it('returns undefined when everything is fine', () => {
    expect(firstInvalidField({})).toBeUndefined()
  })
})

describe('errorMessage', () => {
  it('shows an Error’s own message', () => {
    expect(errorMessage(new Error('Your browser is out of room.'))).toBe('Your browser is out of room.')
  })

  it('falls back for non-Errors and empty messages', () => {
    expect(errorMessage('boom')).toBe(SAVE_FALLBACK_MESSAGE)
    expect(errorMessage(new Error('  '))).toBe(SAVE_FALLBACK_MESSAGE)
    expect(errorMessage(undefined, 'custom')).toBe('custom')
  })
})
