import { CatalogProduct, FoodFacts } from '@/types/item'
import { FeedingUnit } from '@/types/scheduleEvent'

/**
 * Turns a serving as the owner wrote it — half a can, a quarter cup, 60 g —
 * into the unit a chart needs, using the product's label facts and nothing
 * else. Where the facts do not allow it, the answer is "cannot", with the
 * reason in the owner's terms, and the chart leaves that cat off rather than
 * guess.
 *
 * Two kinds of result are told apart. An *exact* one is unit arithmetic
 * alone: ounces to grams, tablespoons to cups. A *label* one went through a
 * fact from the product — a can's net weight, a cup's weight in grams, the
 * calories — so it is as good as the label, and the chart may say so.
 */

export type FoodChartUnit = 'cup' | 'g' | 'kcal'

export type Converted =
  | { ok: true; value: number; basis: 'exact' | 'label' }
  | { ok: false; reason: string }

export const GRAMS_PER_OUNCE = 28.3495
export const TABLESPOONS_PER_CUP = 16

const cannot = (reason: string): Converted => ({ ok: false, reason })
const exact = (value: number): Converted => ({ ok: true, value, basis: 'exact' })
const label = (value: number): Converted => ({ ok: true, value, basis: 'label' })

function productName(product: CatalogProduct | undefined): string {
  if (!product) return 'the food'
  return product.brand ? `${product.brand} ${product.name}` : product.name
}

/** Serving in grams. Mass units are arithmetic; volumes and cans need the label. */
export function toGrams(amount: number, unit: FeedingUnit, product: CatalogProduct | undefined): Converted {
  const facts: FoodFacts | undefined = product?.food
  switch (unit) {
    case 'g':
      return exact(amount)
    case 'oz':
      return exact(amount * GRAMS_PER_OUNCE)
    case 'can':
      if (!product) return cannot('fed by the can, with no product chosen to say what a can weighs')
      if (!facts?.gramsPerCan) return cannot(`${productName(product)} has no can weight on its label facts`)
      return label(amount * facts.gramsPerCan)
    case 'cup':
    case 'tbsp': {
      const cups = unit === 'tbsp' ? amount / TABLESPOONS_PER_CUP : amount
      if (!product) return cannot('measured by the cup, with no product chosen to say what a cup weighs')
      if (!facts?.gramsPerCup) return cannot(`${productName(product)} has no grams-per-cup on its label facts`)
      return label(cups * facts.gramsPerCup)
    }
  }
}

/**
 * Serving in cups. Volumes are arithmetic; masses need the label's grams per
 * cup. A can is never a cup: pâté has no honest volume, so a can-fed cat
 * belongs on the grams and calories charts, not this one.
 */
export function toCups(amount: number, unit: FeedingUnit, product: CatalogProduct | undefined): Converted {
  const facts = product?.food
  switch (unit) {
    case 'cup':
      return exact(amount)
    case 'tbsp':
      return exact(amount / TABLESPOONS_PER_CUP)
    case 'can':
      return cannot('fed by the can; a can has no cup measure')
    case 'g':
    case 'oz': {
      const grams = unit === 'oz' ? amount * GRAMS_PER_OUNCE : amount
      if (!product) return cannot('weighed out, with no product chosen to say what a cup weighs')
      if (!facts?.gramsPerCup) return cannot(`${productName(product)} has no grams-per-cup on its label facts`)
      return label(grams / facts.gramsPerCup)
    }
  }
}

/**
 * Serving in calories. The label may state them per kilogram, per 100 g, per
 * can or per cup; whichever it is, the serving is first put in that basis.
 * A can-fed cat with calories per can needs no weight at all.
 */
export function toCalories(amount: number, unit: FeedingUnit, product: CatalogProduct | undefined): Converted {
  if (!product) return cannot('no product chosen, so nothing says how many calories the food has')
  const kcal = product.food?.kcal
  if (!kcal) return cannot(`${productName(product)} has no calories on its label facts`)
  switch (kcal.per) {
    case 'can': {
      if (unit === 'can') return label(amount * kcal.amount)
      const grams = toGrams(amount, unit, product)
      if (!grams.ok) return grams
      if (!product.food?.gramsPerCan) return cannot(`${productName(product)} states calories per can but has no can weight`)
      return label((grams.value / product.food.gramsPerCan) * kcal.amount)
    }
    case 'cup': {
      const cups = toCups(amount, unit, product)
      if (cups.ok) return label(cups.value * kcal.amount)
      // Cans and weights without a cup weight cannot reach a per-cup figure.
      return cups
    }
    case 'kg':
    case '100g': {
      const grams = toGrams(amount, unit, product)
      if (!grams.ok) return grams
      const per = kcal.per === 'kg' ? 1000 : 100
      return label((grams.value / per) * kcal.amount)
    }
  }
}

export function convertServing(
  amount: number,
  unit: FeedingUnit,
  product: CatalogProduct | undefined,
  to: FoodChartUnit,
): Converted {
  if (to === 'g') return toGrams(amount, unit, product)
  if (to === 'cup') return toCups(amount, unit, product)
  return toCalories(amount, unit, product)
}

export const FOOD_CHART_UNITS: { unit: FoodChartUnit; label: string }[] = [
  { unit: 'g', label: 'g/day' },
  { unit: 'cup', label: 'cup/day' },
  { unit: 'kcal', label: 'kcal/day' },
]
