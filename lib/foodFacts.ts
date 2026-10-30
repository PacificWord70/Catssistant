import { CaloriePer, CatalogProduct, FoodFacts, FoodForm } from '@/types/item'

/**
 * Label facts as they are allowed to exist in the app: positive finite
 * numbers and known words, or absent. Everything that reaches the food
 * conversion arithmetic passes through here first — the item form on save,
 * the catalog on read, a backup on import — so a zero, a negative, a string
 * or a stray key from an old or hand-edited file can never make a chart
 * divide by nothing or plot a nonsense number.
 */

const FORMS: readonly FoodForm[] = ['wet', 'dry']
const PERS: readonly CaloriePer[] = ['kg', '100g', 'can', 'cup']

/** A positive finite number, or undefined for anything else, a numeric string included. */
function positive(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

/** The facts worth keeping from an untrusted value, or undefined when none survive. */
export function normaliseFoodFacts(value: unknown): FoodFacts | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const v = value as Record<string, unknown>
  const facts: FoodFacts = {}
  if (FORMS.includes(v.form as FoodForm)) facts.form = v.form as FoodForm
  const can = positive(v.gramsPerCan)
  if (can !== undefined) facts.gramsPerCan = can
  const cup = positive(v.gramsPerCup)
  if (cup !== undefined) facts.gramsPerCup = cup
  if (typeof v.kcal === 'object' && v.kcal !== null) {
    const k = v.kcal as Record<string, unknown>
    const amount = positive(k.amount)
    if (amount !== undefined && PERS.includes(k.per as CaloriePer)) facts.kcal = { amount, per: k.per as CaloriePer }
  }
  return Object.keys(facts).length > 0 ? facts : undefined
}

/** What the item form holds while typing: text, so a half-typed number is never fought. */
export interface FoodFactsInput {
  form: FoodForm | ''
  gramsPerCan: string
  gramsPerCup: string
  kcalAmount: string
  kcalPer: CaloriePer
}

/** Parses the form's text once, on save. Blank or nonsense is "not on the label", never zero. */
export function foodFactsFromInput(input: FoodFactsInput): FoodFacts | undefined {
  const num = (text: string) => positive(parseFloat(text))
  return normaliseFoodFacts({
    form: input.form || undefined,
    gramsPerCan: num(input.gramsPerCan),
    gramsPerCup: num(input.gramsPerCup),
    kcal: { amount: num(input.kcalAmount), per: input.kcalPer },
  })
}

/**
 * On-read migration for a stored product, in the same spirit as migrateCat:
 * the stored shape is left alone and the clean one is what the app sees.
 * Idempotent, so running it on an already-clean product changes nothing.
 */
export function migrateProduct(stored: CatalogProduct): CatalogProduct {
  if (!('food' in stored)) return stored
  const food = normaliseFoodFacts(stored.food)
  if (food === undefined) {
    const { food: _dropped, ...rest } = stored
    return rest
  }
  return { ...stored, food }
}
