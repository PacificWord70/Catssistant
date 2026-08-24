/**
 * Rules for a weight entry, kept pure so they can be tested.
 *
 * `today` is passed in rather than read from the clock here. A function that
 * calls `new Date()` internally can only be tested on the day you write the
 * test — injecting it means "no future dates" is assertable against a fixed
 * day.
 */

export type WeightEntryField = 'weight' | 'date'

export interface WeightEntryError {
  field: WeightEntryField
  message: string
}

export interface WeightEntryInput {
  /** Raw text straight from the input, not a number — "" and "abc" are cases. */
  weight: string
  unit: 'lbs' | 'kg'
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** ISO date for the current day, injected. */
  today: string
  /** The cat's birthday, if it has one on file. */
  birthday?: string
  /** Dates that already have a reading for this cat. */
  existingDates?: string[]
}

const LBS_PER_KG = 2.20462

/**
 * Heaviest cat ever recorded was in the mid-40s of pounds, and that was a
 * welfare case. Anything past this is a typo — 112 for 11.2, or pounds typed
 * into a form set to kilograms.
 */
const MAX_LBS = 40

/** A newborn kitten is around a quarter of a pound. Below this is a slip. */
const MIN_LBS = 0.1

export function toLbs(value: number, unit: 'lbs' | 'kg'): number {
  return unit === 'kg' ? value * LBS_PER_KG : value
}

export function validateWeightEntry(input: WeightEntryInput): WeightEntryError | undefined {
  const { weight, unit, date, today, birthday, existingDates = [] } = input

  if (!weight.trim()) {
    return { field: 'weight', message: 'Enter a weight.' }
  }

  const value = Number(weight)
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return { field: 'weight', message: 'That is not a number.' }
  }
  if (value <= 0) {
    return { field: 'weight', message: 'Weight has to be greater than zero.' }
  }

  // Range is checked in pounds so one bound covers both units — 20kg is out of
  // range for the same reason 44lbs is.
  const lbs = toLbs(value, unit)
  if (lbs < MIN_LBS) {
    return { field: 'weight', message: `That is under ${MIN_LBS} lbs — check the number.` }
  }
  if (lbs > MAX_LBS) {
    return {
      field: 'weight',
      message:
        unit === 'kg'
          ? `${value}kg is about ${lbs.toFixed(0)} lbs, heavier than any cat on record — check the number.`
          : `${value} lbs is heavier than any cat on record — check the number.`,
    }
  }

  if (!date) {
    return { field: 'date', message: 'Pick the date this weight was taken.' }
  }
  // The input's `max` attribute is only a browser hint; it can be typed or
  // pasted past, so the rule is enforced here too.
  if (date > today) {
    return { field: 'date', message: 'That date is in the future.' }
  }
  if (birthday && date < birthday) {
    return { field: 'date', message: 'That is before this cat was born.' }
  }
  if (existingDates.includes(date)) {
    return { field: 'date', message: 'There is already a reading for that date.' }
  }

  return undefined
}
