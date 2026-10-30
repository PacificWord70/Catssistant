import { describe, expect, it } from 'vitest'
import { CatalogProduct } from '@/types/item'
import { foodFactsFromInput, migrateProduct, normaliseFoodFacts } from '@/lib/foodFacts'

describe('normaliseFoodFacts', () => {
  it('keeps positive numbers and known words', () => {
    expect(normaliseFoodFacts({ form: 'wet', gramsPerCan: 156, gramsPerCup: 110, kcal: { amount: 180, per: 'can' } })).toEqual({
      form: 'wet',
      gramsPerCan: 156,
      gramsPerCup: 110,
      kcal: { amount: 180, per: 'can' },
    })
  })

  it('drops zero, negative, infinite, string and unknown values rather than passing them to the maths', () => {
    expect(
      normaliseFoodFacts({
        form: 'frozen',
        gramsPerCan: 0,
        gramsPerCup: -5,
        kcal: { amount: '180', per: 'can' },
        extra: 1,
      }),
    ).toBeUndefined()
    expect(normaliseFoodFacts({ gramsPerCan: Infinity, kcal: { amount: NaN, per: 'kg' } })).toBeUndefined()
    expect(normaliseFoodFacts({ kcal: { amount: 180, per: 'bowl' } })).toBeUndefined()
  })

  it('returns undefined for anything that is not an object', () => {
    expect(normaliseFoodFacts('156')).toBeUndefined()
    expect(normaliseFoodFacts(null)).toBeUndefined()
    expect(normaliseFoodFacts(undefined)).toBeUndefined()
  })

  it('keeps the good fields when only some are bad', () => {
    expect(normaliseFoodFacts({ gramsPerCan: 156, gramsPerCup: 'lots' })).toEqual({ gramsPerCan: 156 })
  })
})

describe('foodFactsFromInput', () => {
  const blank = { form: '' as const, gramsPerCan: '', gramsPerCup: '', kcalAmount: '', kcalPer: 'kg' as const }

  it('is undefined when nothing was typed, so a product without a label saves clean', () => {
    expect(foodFactsFromInput(blank)).toBeUndefined()
  })

  it('parses typed numbers and ignores the calorie basis when no amount was typed', () => {
    expect(foodFactsFromInput({ ...blank, gramsPerCup: '110', kcalPer: 'cup' })).toEqual({ gramsPerCup: 110 })
    expect(foodFactsFromInput({ ...blank, kcalAmount: '3700', kcalPer: 'kg' })).toEqual({ kcal: { amount: 3700, per: 'kg' } })
  })

  it('treats blank, zero, negative and words as not on the label, never as zero', () => {
    expect(foodFactsFromInput({ ...blank, gramsPerCan: '0' })).toBeUndefined()
    expect(foodFactsFromInput({ ...blank, gramsPerCan: '-3' })).toBeUndefined()
    expect(foodFactsFromInput({ ...blank, gramsPerCan: 'a can' })).toBeUndefined()
  })
})

describe('migrateProduct', () => {
  const base: CatalogProduct = { id: 'p', name: 'Kibble', category: 'Food', createdAt: 'x' }

  it('leaves a product without facts alone', () => {
    expect(migrateProduct(base)).toBe(base)
  })

  it('cleans stored facts and drops the key when nothing survives', () => {
    const dirty = { ...base, food: { gramsPerCup: '110', kcal: { amount: 0, per: 'kg' } } } as unknown as CatalogProduct
    expect(migrateProduct(dirty)).toEqual(base)
    expect('food' in migrateProduct(dirty)).toBe(false)
  })

  it('is idempotent', () => {
    const once = migrateProduct({ ...base, food: { gramsPerCup: 110, gramsPerCan: -1 } })
    expect(once.food).toEqual({ gramsPerCup: 110 })
    expect(migrateProduct(once)).toEqual(once)
  })
})
