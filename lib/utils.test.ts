import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { catAgeLabel, catAgeShort, catHumanAge, catLifeStage, catWeightLbs, coatLabel } from '@/lib/utils'

/**
 * Every function here reads `new Date()`, so the clock is pinned. Without this
 * the expected values would rot: a test asserting "3 yrs old" starts failing on
 * its own birthday.
 */
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 5, 15)) // 15 June 2026
})
afterEach(() => vi.useRealTimers())

describe('catWeightLbs', () => {
  it('leaves pounds alone', () => {
    expect(catWeightLbs({ weight: 10, weightUnit: 'lbs' })).toBe(10)
  })

  it('converts kilograms', () => {
    expect(catWeightLbs({ weight: 5, weightUnit: 'kg' })).toBeCloseTo(11.02, 2)
  })

  it('returns undefined rather than 0 when no weight is recorded', () => {
    // 0 would be a real weight and would sort as the lightest cat.
    expect(catWeightLbs({ weight: undefined, weightUnit: 'lbs' })).toBeUndefined()
  })
})

describe('catLifeStage', () => {
  it('distinguishes no birthday from adult', () => {
    expect(catLifeStage(undefined)).toBeUndefined()
  })

  it('calls a cat under one a kitten', () => {
    expect(catLifeStage('2026-01-01')).toBe('Kitten')
  })

  it('turns adult on the first birthday', () => {
    expect(catLifeStage('2025-06-15')).toBe('Adult')
  })

  it('is still a kitten the day before its first birthday', () => {
    expect(catLifeStage('2025-06-16')).toBe('Kitten')
  })

  it('turns senior at ten', () => {
    expect(catLifeStage('2016-06-15')).toBe('Senior')
  })

  it('is still adult the day before turning ten', () => {
    expect(catLifeStage('2016-06-16')).toBe('Adult')
  })

  it('handles a leap-day birthday in a non-leap year', () => {
    // Born 29 Feb 2016; by June 2026 that is ten years, whatever the calendar does.
    expect(catLifeStage('2016-02-29')).toBe('Senior')
  })
})

describe('coatLabel', () => {
  it('joins colour and pattern', () => {
    expect(coatLabel({ color: 'Black', pattern: 'Tabby' })).toBe('Black Tabby')
  })

  it('leaves Solid implicit', () => {
    // "Black" reads better than "Black Solid".
    expect(coatLabel({ color: 'Black', pattern: 'Solid' })).toBe('Black')
  })

  it('copes with only one field set', () => {
    expect(coatLabel({ color: 'Gray', pattern: undefined })).toBe('Gray')
    expect(coatLabel({ color: undefined, pattern: 'Calico' })).toBe('Calico')
  })

  it('returns an empty string when nothing is known', () => {
    expect(coatLabel({ color: undefined, pattern: undefined })).toBe('')
  })
})

describe('catAgeShort', () => {
  it('reports months under a year', () => {
    expect(catAgeShort('2026-01-15')).toBe('5 mo')
  })

  it('reports whole years past one', () => {
    expect(catAgeShort('2023-06-15')).toBe('3 yrs')
  })

  it('uses the singular at exactly one year', () => {
    expect(catAgeShort('2025-06-15')).toBe('1 yr')
  })

  it('handles a birthday in the current month', () => {
    expect(catAgeShort('2026-06-01')).toBe('< 1 mo')
  })
})

describe('catAgeLabel', () => {
  it('spells out months', () => {
    expect(catAgeLabel('2026-01-15')).toBe('5 months old')
  })

  it('uses the singular for one month', () => {
    expect(catAgeLabel('2026-05-15')).toBe('1 month old')
  })

  it('omits months when the age is a whole number of years', () => {
    expect(catAgeLabel('2023-06-15')).toBe('3 years old')
  })

  it('includes the remainder otherwise', () => {
    expect(catAgeLabel('2023-01-15')).toBe('3 yrs, 5 mos old')
  })

  it('handles a newborn', () => {
    expect(catAgeLabel('2026-06-10')).toBe('Less than a month old')
  })
})

describe('catHumanAge', () => {
  it('treats a kitten as roughly 15 human years per cat year', () => {
    expect(catHumanAge('2025-06-15')).toBe('15')
  })

  it('adds nine for the second year', () => {
    expect(catHumanAge('2024-06-15')).toBe('24')
  })

  it('adds four a year after that', () => {
    expect(catHumanAge('2023-06-15')).toBe('28')
  })

  it('guards against a birthday in the future', () => {
    // A mistyped year should not produce a negative human age.
    expect(catHumanAge('2027-01-01')).toBe('< 1')
  })
})
