import { describe, expect, it } from 'vitest'
import { CatalogProduct } from '@/types/item'
import { GRAMS_PER_OUNCE, convertServing, toCalories, toCups, toGrams } from '@/lib/foodConversion'

const product = (food: CatalogProduct['food']): CatalogProduct => ({
  id: 'p',
  name: 'Chicken pâté',
  brand: 'Hearth & Paw',
  category: 'Food',
  createdAt: 'x',
  food,
})

const wet = product({ form: 'wet', gramsPerCan: 156, kcal: { amount: 180, per: 'can' } })
const dry = product({ form: 'dry', gramsPerCup: 110, kcal: { amount: 3800, per: 'kg' } })
const bare = product(undefined)

describe('grams', () => {
  it('does mass units by arithmetic alone, product or not', () => {
    expect(toGrams(60, 'g', undefined)).toEqual({ ok: true, value: 60, basis: 'exact' })
    const oz = toGrams(3, 'oz', undefined)
    expect(oz.ok && oz.value).toBeCloseTo(3 * GRAMS_PER_OUNCE)
  })

  it('weighs a can by the label, and refuses without one', () => {
    expect(toGrams(0.5, 'can', wet)).toEqual({ ok: true, value: 78, basis: 'label' })
    expect(toGrams(0.5, 'can', bare).ok).toBe(false)
    expect(toGrams(0.5, 'can', undefined).ok).toBe(false)
  })

  it('weighs cups and tablespoons by the label grams per cup', () => {
    expect(toGrams(0.25, 'cup', dry)).toEqual({ ok: true, value: 27.5, basis: 'label' })
    const tbsp = toGrams(4, 'tbsp', dry)
    expect(tbsp.ok && tbsp.value).toBeCloseTo(27.5)
    expect(toGrams(0.25, 'cup', wet).ok).toBe(false)
  })
})

describe('cups', () => {
  it('does volume units by arithmetic alone', () => {
    expect(toCups(0.5, 'cup', undefined)).toEqual({ ok: true, value: 0.5, basis: 'exact' })
    expect(toCups(8, 'tbsp', undefined)).toEqual({ ok: true, value: 0.5, basis: 'exact' })
  })

  it('never turns a can into cups', () => {
    const r = toCups(1, 'can', wet)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.reason).toMatch(/can/)
  })

  it('turns a weight into cups only through the label', () => {
    expect(toCups(55, 'g', dry)).toEqual({ ok: true, value: 0.5, basis: 'label' })
    expect(toCups(55, 'g', undefined).ok).toBe(false)
  })
})

describe('calories', () => {
  it('needs a product with calories', () => {
    expect(toCalories(1, 'can', undefined).ok).toBe(false)
    expect(toCalories(1, 'can', bare).ok).toBe(false)
  })

  it('uses calories per can directly for a can', () => {
    expect(toCalories(0.5, 'can', wet)).toEqual({ ok: true, value: 90, basis: 'label' })
  })

  it('goes through grams for a per-kilogram label', () => {
    const r = toCalories(0.25, 'cup', dry)
    expect(r.ok && r.value).toBeCloseTo(27.5 * 3.8)
    const g = toCalories(100, 'g', dry)
    expect(g.ok && g.value).toBeCloseTo(380)
  })

  it('reaches a per-can label from grams when the can weight is known', () => {
    const r = toCalories(78, 'g', wet)
    expect(r.ok && r.value).toBeCloseTo(90)
  })

  it('handles per-100g and per-cup labels', () => {
    const per100 = product({ gramsPerCup: 100, kcal: { amount: 400, per: '100g' } })
    expect(toCalories(50, 'g', per100)).toEqual({ ok: true, value: 200, basis: 'label' })
    const perCup = product({ kcal: { amount: 400, per: 'cup' } })
    expect(toCalories(0.5, 'cup', perCup)).toEqual({ ok: true, value: 200, basis: 'label' })
    expect(toCalories(50, 'g', perCup).ok).toBe(false)
  })
})

describe('convertServing', () => {
  it('routes by the chart unit', () => {
    expect(convertServing(1, 'can', wet, 'g')).toEqual({ ok: true, value: 156, basis: 'label' })
    expect(convertServing(1, 'can', wet, 'cup').ok).toBe(false)
    expect(convertServing(1, 'can', wet, 'kcal')).toEqual({ ok: true, value: 180, basis: 'label' })
  })
})
