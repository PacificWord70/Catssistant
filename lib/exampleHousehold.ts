/**
 * The example household a first-time visitor looks around before adding a cat.
 *
 * It is shown whenever no real cats are saved, and lives only in the Redux
 * store: nothing here is ever written to storage, so it cannot reach a backup
 * or mix with an owner's own records. Every id starts with `example-`, which a
 * real record's random UUID never does, so even a stray reference could not
 * land on someone's actual cat.
 *
 * Every date is worked out from `today` rather than written in, so the
 * calendar always has breakfast on it this morning and a vet visit coming up
 * next week, however long after this was written someone opens it. That is
 * also why this is a function and not a constant: a fixed date would drift
 * into the past and the example would look abandoned.
 *
 * The six cats are the characters Heidi is drawing for the home page cat tree,
 * each sitting by the button it belongs to. Keep these pairings when the art
 * lands, since the profiles were written to match the poses:
 *
 * - Biscuit, orange tabby, peeks out of the cat house — My Cats
 * - Noodle, black cat, lies on the top bed swatting the hanging toy — Shopping
 * - Miso, tuxedo, sits upright staring, because he knows when dinner is — Schedule
 * - Pepper, grey senior, loafs in the half-moon bowl that looks like a scale pan — Health Home
 * - Mochi, cream longhair, curled asleep in the hammock — About
 * - Pickle, calico kitten, on the small ledge — Resources
 *
 * Mochi is a solid cream rather than a calico so the two never read as the
 * same cat. Pickle is recorded as White + Calico because the avatar draws a
 * calico as its base colour with orange patches (lib/avatar/palette.ts):
 * Orange + Calico would have no visible patches, while white with orange reads
 * as a calico at a glance.
 */

import { Cat, Vet } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { ScheduleEvent } from '@/types/scheduleEvent'
import { parseDateKey, toDateKey } from '@/lib/dateKeys'

export const EXAMPLE_ID_PREFIX = 'example-'

export function isExampleId(id: string): boolean {
  return id.startsWith(EXAMPLE_ID_PREFIX)
}

export const EXAMPLE_REFUSAL_MESSAGE =
  'This is the example household, so changes aren’t saved. Add your first cat to start your own.'

/**
 * Thrown by a save or delete while the example is showing. Forms already show
 * a thrown error's message inline, so the refusal reaches the visitor through
 * the same path as "storage is full" without any form knowing about examples.
 */
export class ExampleHouseholdError extends Error {
  constructor() {
    super(EXAMPLE_REFUSAL_MESSAGE)
    this.name = 'ExampleHouseholdError'
  }
}

export interface ExampleHousehold {
  cats: Cat[]
  events: ScheduleEvent[]
  healthRecords: HealthRecord[]
  products: CatalogProduct[]
  items: HouseholdItem[]
}

const id = (name: string) => `${EXAMPLE_ID_PREFIX}${name}`

const BISCUIT = id('biscuit')
const NOODLE = id('noodle')
const MISO = id('miso')
const PEPPER = id('pepper')
const MOCHI = id('mochi')
const PICKLE = id('pickle')
const ADULTS = [BISCUIT, NOODLE, MISO, PEPPER, MOCHI]
const EVERYONE = [...ADULTS, PICKLE]

/** 555-01xx numbers are reserved for fiction, so this can never ring a real clinic. */
const VET: Vet = {
  name: 'Maple Street Animal Clinic',
  phone: '+1 555 555 0100',
  address: '123 Maple Street, Portland, OR',
}

/**
 * Builds the whole example for the day `today` names (a local YYYY-MM-DD key).
 * Pure: the same day always gives the same household.
 */
export function buildExampleHousehold(today: string): ExampleHousehold {
  const start = parseDateKey(today)
  if (!start) throw new Error(`Not a date key: ${today}`)

  /* Built from parts rather than by adding milliseconds, so a day that crosses
     a daylight-saving change still lands on the right date. */
  const day = (offset: number) =>
    toDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset))
  const yearsAgo = (years: number, extraDays = 0) =>
    toDateKey(new Date(start.getFullYear() - years, start.getMonth(), start.getDate() - extraDays))
  /** A creation time for a record "made" `daysAgo` days back, at local noon. */
  const made = (daysAgo: number, minutes = 0) =>
    new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() - daysAgo,
      12,
      minutes,
    ).toISOString()

  const home = {
    weightUnit: 'lbs' as const,
    locationCity: 'Portland',
    locationRegion: 'Oregon',
    locationCountry: 'United States',
    vet: VET,
  }

  /* The grid lists newest first. The five adults were "added" together, a
     minute apart so they keep this order; Pickle came home a couple of months
     ago, so the kitten leads the grid the way a new arrival would. */
  const cats: Cat[] = [
    {
      ...home,
      id: BISCUIT,
      name: 'Biscuit',
      breed: ['Domestic Shorthair'],
      birthday: yearsAgo(5, 40),
      weight: 12.4,
      color: 'Orange',
      pattern: 'Tabby',
      coatLength: 'Short',
      personality: 'Greets every visitor at the door, then follows them from room to room.',
      energyLevel: 'Medium',
      huntingPreyDrive: ['Mouse'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'No',
      createdAt: made(180, 50),
    },
    {
      ...home,
      id: NOODLE,
      name: 'Noodle',
      breed: ['Bombay'],
      birthday: yearsAgo(2, 95),
      weight: 10.2,
      color: 'Black',
      pattern: 'Solid',
      coatLength: 'Short',
      personality: 'Will swat anything that dangles, and most things that don’t.',
      energyLevel: 'High',
      huntingPreyDrive: ['Bug', 'Bird'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'Yes',
      createdAt: made(180, 40),
    },
    {
      ...home,
      id: MISO,
      name: 'Miso',
      breed: ['Domestic Shorthair'],
      birthday: yearsAgo(7, 200),
      weight: 11.6,
      color: 'Black',
      pattern: 'Tuxedo',
      coatLength: 'Short',
      personality: 'Sits by the food bowl at 5:55 every evening and stares until dinner arrives.',
      energyLevel: 'Medium',
      huntingPreyDrive: ['Bird'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'Unknown',
      createdAt: made(180, 30),
    },
    {
      ...home,
      id: PEPPER,
      name: 'Pepper',
      breed: ['Domestic Shorthair'],
      birthday: yearsAgo(13, 60),
      weight: 9.4,
      color: 'Gray',
      pattern: 'Solid',
      coatLength: 'Short',
      personality: 'Calm and dignified. Spends most afternoons in a sunny loaf.',
      energyLevel: 'Low',
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'No',
      knownIllnesses: ['Hyperthyroidism'],
      notes: 'Thyroid tablet twice a day, hidden in a pill pocket.',
      createdAt: made(180, 20),
    },
    {
      ...home,
      id: MOCHI,
      name: 'Mochi',
      breed: ['Domestic Longhair'],
      birthday: yearsAgo(4, 150),
      weight: 9.8,
      color: 'Cream',
      pattern: 'Solid',
      coatLength: 'Long',
      personality: 'Gentle and sleepy. Purrs the moment she’s picked up.',
      energyLevel: 'Low',
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'No',
      notes: 'Needs brushing every week or her coat mats behind the ears.',
      createdAt: made(180, 10),
    },
    {
      ...home,
      id: PICKLE,
      name: 'Pickle',
      breed: ['Domestic Shorthair'],
      birthday: day(-125),
      weight: 4,
      color: 'White',
      pattern: 'Calico',
      coatLength: 'Short',
      personality: 'Curious about everything, and climbs whatever is tallest.',
      energyLevel: 'High',
      huntingPreyDrive: ['Bug', 'Mouse'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'Yes',
      createdAt: made(65),
    },
  ]

  const event = (
    over: Partial<ScheduleEvent> &
      Pick<ScheduleEvent, 'id' | 'catIds' | 'category' | 'title' | 'date'>,
  ): ScheduleEvent => ({
    times: [],
    recurrence: 'none',
    createdAt: made(120),
    ...over,
    id: id(over.id),
  })

  const events: ScheduleEvent[] = [
    event({
      id: 'breakfast',
      catIds: ADULTS,
      category: 'Feeding',
      title: 'Breakfast',
      date: day(-120),
      times: ['07:30'],
      recurrence: 'daily',
      foodBrand: 'Hearth & Paw',
      foodName: 'Chicken pâté',
      feedingAmounts: [
        { catId: BISCUIT, amount: 0.5, unit: 'can' },
        { catId: NOODLE, amount: 0.5, unit: 'can' },
        { catId: MISO, amount: 0.5, unit: 'can' },
        { catId: PEPPER, amount: 0.5, unit: 'can' },
        { catId: MOCHI, amount: 0.5, unit: 'can' },
      ],
    }),
    event({
      id: 'dinner',
      catIds: ADULTS,
      category: 'Feeding',
      title: 'Dinner',
      date: day(-120),
      times: ['18:00'],
      recurrence: 'daily',
      foodBrand: 'Hearth & Paw',
      foodName: 'Indoor adult dry',
      feedingAmounts: [
        { catId: BISCUIT, amount: 0.25, unit: 'cup' },
        { catId: NOODLE, amount: 0.25, unit: 'cup' },
        { catId: MISO, amount: 0.25, unit: 'cup' },
        { catId: PEPPER, amount: 0.2, unit: 'cup' },
        { catId: MOCHI, amount: 0.2, unit: 'cup' },
      ],
      notes: 'Miso will remind you.',
    }),
    /* Kittens eat little and often, so Pickle gets her own three meals. */
    event({
      id: 'kitten-meals',
      catIds: [PICKLE],
      category: 'Feeding',
      title: 'Kitten meals',
      date: day(-60),
      times: ['07:30', '12:30', '18:00'],
      recurrence: 'daily',
      foodBrand: 'Hearth & Paw',
      foodName: 'Kitten formula',
      feedingAmounts: [{ catId: PICKLE, amount: 40, unit: 'g' }],
    }),
    event({
      id: 'thyroid-meds',
      catIds: [PEPPER],
      category: 'Medication',
      title: 'Methimazole 2.5 mg',
      date: day(-150),
      times: ['08:00', '20:00'],
      recurrence: 'daily',
      medicationStatus: 'Started',
      medicationDuration: 'Forever',
      notes: 'Half a tablet, hidden in a pill pocket.',
    }),
    event({
      id: 'ear-drops',
      catIds: [BISCUIT],
      category: 'Medication',
      title: 'Ear drops',
      date: day(-45),
      times: ['09:00'],
      recurrence: 'daily',
      recurrenceEndDate: day(-36),
      medicationStatus: 'Started',
      medicationDuration: 'Set duration',
      notes: 'Ten-day course for a mild ear infection.',
    }),
    /* A medication event marks a moment, so a finished course is a Started
       and a Stopped. Without the second, the health card would count the
       drops as still being given. */
    event({
      id: 'ear-drops-stopped',
      catIds: [BISCUIT],
      category: 'Medication',
      title: 'Ear drops',
      date: day(-35),
      medicationStatus: 'Stopped',
      notes: 'Course finished. All clear at the recheck.',
    }),
    event({
      id: 'litter',
      catIds: EVERYONE,
      category: 'Care Routine',
      title: 'Full litter change',
      date: day(-118),
      times: ['10:00'],
      recurrence: 'weekly',
      routineType: 'Changed litter',
      routineBrand: 'Clean Paws',
      routineItemName: 'Unscented clumping litter',
      litterType: 'Clumping Clay',
      notes: 'Scoop daily; empty and wash the boxes on this day.',
    }),
    event({
      id: 'senior-food',
      catIds: [PEPPER],
      category: 'Care Routine',
      title: 'Switched to senior food',
      date: day(-70),
      routineType: 'Changed food',
      routineBrand: 'Hearth & Paw',
      routineItemName: 'Senior chicken pâté',
      notes: 'Mixed in over a week. Took to it straight away.',
    }),
    event({
      id: 'vet-checkup',
      catIds: [PEPPER],
      category: 'Vet',
      title: 'Thyroid bloodwork',
      date: day(-21),
      times: ['14:30'],
      durationMinutes: 45,
      vetName: VET.name,
      vetPhone: VET.phone,
      vetAddress: VET.address,
      estimatedCost: 160,
      notes: 'T4 back in range. Same dose, recheck in a few weeks.',
    }),
    event({
      id: 'vet-recheck',
      catIds: [PEPPER],
      category: 'Vet',
      title: 'Thyroid recheck',
      date: day(5),
      times: ['10:15'],
      durationMinutes: 30,
      vetName: VET.name,
      vetPhone: VET.phone,
      vetAddress: VET.address,
      estimatedCost: 95,
      notes: 'Bring the pill pockets — she’s calmer with a treat.',
    }),
    event({
      id: 'kitten-vaccines',
      catIds: [PICKLE],
      category: 'Vet',
      title: 'Kitten vaccines',
      date: day(9),
      times: ['16:00'],
      durationMinutes: 30,
      vetName: VET.name,
      vetPhone: VET.phone,
      vetAddress: VET.address,
      estimatedCost: 75,
      notes: 'FVRCP booster and rabies.',
    }),
    event({
      id: 'brushing',
      catIds: [MOCHI],
      category: 'Grooming',
      title: 'Brushing',
      date: day(-116),
      times: ['19:30'],
      recurrence: 'weekly',
      groomingTools: [{ catId: MOCHI, value: 'Slicker brush and wide-tooth comb' }],
    }),
    event({
      id: 'nail-trim',
      catIds: [BISCUIT, NOODLE, MISO, PEPPER],
      category: 'Grooming',
      title: 'Nail trim',
      date: day(-100),
      recurrence: 'monthly',
      groomingTools: [
        { catId: BISCUIT, value: 'Nail clippers' },
        { catId: NOODLE, value: 'Nail clippers' },
        { catId: MISO, value: 'Nail clippers' },
        { catId: PEPPER, value: 'Nail clippers and a towel' },
      ],
    }),
    event({
      id: 'wand-play',
      catIds: [NOODLE, PICKLE],
      category: 'Play',
      title: 'Feather wand session',
      date: day(-55),
      times: ['17:00'],
      durationMinutes: 15,
      recurrence: 'weekly',
      playActivityType: 'Toy',
      playDetail: 'Feather wand',
    }),
    event({
      id: 'harness-walk',
      catIds: [BISCUIT],
      category: 'Play',
      title: 'Harness walk',
      date: day(-110),
      times: ['11:00'],
      durationMinutes: 30,
      recurrence: 'weekly',
      playActivityType: 'Walk',
      playDetail: 'Round the back garden',
    }),
    event({
      id: 'wash-beds',
      catIds: EVERYONE,
      category: 'Other',
      title: 'Wash the cat beds',
      date: day(-90),
      durationMinutes: 30,
      recurrence: 'monthly',
      notes: 'Hammock and the top bed too.',
    }),
  ]

  /** Readings for one cat: [days ago, pounds, note?]. */
  const readings = (catId: string, series: [number, number, string?][]): HealthRecord[] =>
    series.map(([daysAgo, weightLbs, notes]) => ({
      id: `${catId}-weight-${daysAgo}`,
      catId,
      date: day(-daysAgo),
      weightLbs,
      notes,
      createdAt: made(daysAgo),
    }))

  const healthRecords: HealthRecord[] = [
    // Slowly settling once the thyroid dose was right, which is what the vet wants to see.
    ...readings(PEPPER, [
      [168, 9.9],
      [140, 9.8],
      [112, 9.7],
      [84, 9.6],
      [56, 9.5],
      [21, 9.4, 'Weighed at the vet'],
      [2, 9.4],
    ]),
    // Roughly a pound a month, as a healthy kitten should.
    ...readings(PICKLE, [
      [63, 2.1, 'First weigh-in at home'],
      [49, 2.6],
      [35, 3.0],
      [21, 3.4],
      [7, 3.8],
      [1, 4.0],
    ]),
    ...readings(NOODLE, [
      [150, 10.1],
      [120, 10.3],
      [90, 10.2],
      [60, 10.2],
      [30, 10.1],
      [3, 10.2],
    ]),
    ...readings(BISCUIT, [
      [120, 12.8],
      [60, 12.6],
      [10, 12.4, 'Fewer treats is working'],
    ]),
  ]

  const product = (
    name: string,
    over: Omit<CatalogProduct, 'id' | 'name' | 'createdAt'>,
  ): CatalogProduct => ({
    id: id(`product-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
    name,
    createdAt: made(170),
    ...over,
  })

  const products = {
    pate: product('Chicken pâté', {
      brand: 'Hearth & Paw',
      category: 'Food',
      subCategory: 'Wet Food',
    }),
    dry: product('Indoor adult dry', {
      brand: 'Hearth & Paw',
      category: 'Food',
      subCategory: 'Dry Food',
    }),
    senior: product('Senior chicken pâté', {
      brand: 'Hearth & Paw',
      category: 'Food',
      subCategory: 'Wet Food',
    }),
    kitten: product('Kitten formula', {
      brand: 'Hearth & Paw',
      category: 'Food',
      subCategory: 'Dry Food',
    }),
    salmon: product('Salmon kibble', {
      brand: 'Ocean Bowl',
      category: 'Food',
      subCategory: 'Dry Food',
    }),
    litter: product('Unscented clumping litter', { brand: 'Clean Paws', category: 'Litter' }),
    methimazole: product('Methimazole 2.5 mg', { category: 'Medication', subCategory: 'Tablet' }),
    earDrops: product('Ear drops', { category: 'Medication', subCategory: 'Drops' }),
    wand: product('Feather wand', { brand: 'Whiskerworks', category: 'Toy' }),
    mice: product('Crinkle mice', { brand: 'Whiskerworks', category: 'Toy' }),
    brush: product('Slicker brush', { category: 'Tool', subCategory: 'Grooming' }),
    clippers: product('Nail clippers', { category: 'Tool', subCategory: 'Grooming' }),
    fountain: product('Water fountain', { category: 'Other' }),
    pillPockets: product('Pill pockets', {
      brand: 'Hearth & Paw',
      category: 'Other',
      subCategory: 'Treats',
    }),
  }

  const item = (
    name: string,
    over: Omit<HouseholdItem, 'id' | 'createdAt' | 'status'> & { status?: HouseholdItem['status'] },
  ): HouseholdItem => ({
    id: id(`item-${name}`),
    status: 'current',
    createdAt: made(160),
    ...over,
  })

  const items: HouseholdItem[] = [
    item('pate', {
      productId: products.pate.id,
      dateStarted: day(-170),
      catIds: [BISCUIT, NOODLE, MISO, MOCHI],
    }),
    item('dry', { productId: products.dry.id, dateStarted: day(-170), catIds: ADULTS }),
    item('senior', { productId: products.senior.id, dateStarted: day(-70), catIds: [PEPPER] }),
    item('kitten', { productId: products.kitten.id, dateStarted: day(-63), catIds: [PICKLE] }),
    item('salmon', {
      productId: products.salmon.id,
      status: 'past',
      dateStarted: day(-400),
      dateEnded: day(-170),
      catIds: [BISCUIT, NOODLE, MISO, PEPPER, MOCHI],
      notes: 'Noodle kept leaving it. Switched to Hearth & Paw.',
    }),
    item('litter', { productId: products.litter.id, dateStarted: day(-300), catIds: EVERYONE }),
    item('methimazole', {
      productId: products.methimazole.id,
      dateStarted: day(-150),
      catIds: [PEPPER],
      notes: 'Refill every 30 days.',
    }),
    item('ear-drops', {
      productId: products.earDrops.id,
      status: 'past',
      dateStarted: day(-45),
      dateEnded: day(-36),
      catIds: [BISCUIT],
    }),
    item('wand', { productId: products.wand.id, dateStarted: day(-55), catIds: [NOODLE, PICKLE] }),
    item('mice', {
      productId: products.mice.id,
      dateStarted: day(-60),
      catIds: [NOODLE, PICKLE, BISCUIT],
    }),
    item('brush', { productId: products.brush.id, dateStarted: day(-200), catIds: [MOCHI] }),
    item('clippers', {
      productId: products.clippers.id,
      dateStarted: day(-300),
      catIds: [BISCUIT, NOODLE, MISO, PEPPER],
    }),
    item('fountain', { productId: products.fountain.id, dateStarted: day(-240), catIds: EVERYONE }),
    item('pill-pockets', {
      productId: products.pillPockets.id,
      dateStarted: day(-150),
      catIds: [PEPPER],
    }),
  ]

  return { cats, events, healthRecords, products: Object.values(products), items }
}
