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
 *
 * Each cat also carries a health story, so the Health charts have something
 * true-to-life to show and the Schedule shows the events behind each bend in
 * a line. They are the common ones an owner is likely to meet:
 *
 * - Pepper: hyperthyroidism. Weight slides despite a big appetite, a diagnosis
 *   and daily tablets, then a slow regain
 * - Noodle: an overweight young indoor cat. A measured weight-control diet and
 *   more play, and a gentle loss of about 2% a month
 * - Miso: urinary crystals. A same-day vet visit, a prescription urinary diet
 *   with more wet food, and a clear recheck
 * - Pickle: a rescued kitten. Weekly weigh-ins, a vaccine series, deworming,
 *   and a cold that flattens her growth for a week or two
 * - Biscuit: ear drops and a dental cleaning; weight steady
 * - Mochi: the healthy baseline to compare the others against
 *
 * The history reaches back about two years, because the charts offer a two
 * year range. Doses and findings are kept general: this is a demo of the
 * app, not veterinary advice.
 */

import { Cat, Vet } from '@/types/cat'
import { HealthRecord } from '@/types/healthRecord'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import { FeedingUnit, ScheduleEvent } from '@/types/scheduleEvent'
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

  /* Key moments, in days from today, that more than one record hangs off.
     Named once so a feeding change, its care-routine entry and the vet visit
     behind it can never drift apart. */
  const HISTORY = -730 // two years: the longest chart range
  const PEPPER_DIAGNOSED = -270
  const PEPPER_SENIOR_FOOD = -70
  const NOODLE_DIET = -210
  const MISO_VET = -121
  const MISO_DIET = MISO_VET + 1 // prescription food collected the next day
  const PICKLE_HOME = -70

  const home = {
    weightUnit: 'lbs' as const,
    locationCity: 'Portland',
    locationRegion: 'Oregon',
    locationCountry: 'United States',
    vet: VET,
  }

  /* The grid lists newest first. The five adults were "added" together, a
     minute apart so they keep this order, back when the history begins;
     Pickle came home ten weeks ago, so the kitten leads the grid the way a
     new arrival would. */
  const cats: Cat[] = [
    {
      ...home,
      id: BISCUIT,
      name: 'Biscuit',
      breed: ['Domestic Shorthair'],
      birthday: yearsAgo(5, 40),
      weight: 12.5,
      color: 'Orange',
      pattern: 'Tabby',
      coatLength: 'Short',
      personality: 'Greets every visitor at the door, then follows them from room to room.',
      energyLevel: 'Medium',
      huntingPreyDrive: ['Mouse'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'No',
      createdAt: made(-HISTORY, 50),
    },
    {
      ...home,
      id: NOODLE,
      name: 'Noodle',
      breed: ['Bombay'],
      birthday: yearsAgo(2, 95),
      weight: 11.6,
      color: 'Black',
      pattern: 'Solid',
      coatLength: 'Short',
      personality: 'Will swat anything that dangles, and most things that don’t.',
      energyLevel: 'High',
      huntingPreyDrive: ['Bug', 'Bird'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'Yes',
      notes:
        'On a weight-control diet: measured portions, no topping up, two play sessions a day. Goal is about 11 lb.',
      createdAt: made(-HISTORY, 40),
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
      notes:
        'Prescription urinary food only, since the crystals. If he strains in the litter box again, call the vet the same day.',
      createdAt: made(-HISTORY, 30),
    },
    {
      ...home,
      id: PEPPER,
      name: 'Pepper',
      breed: ['Domestic Shorthair'],
      birthday: yearsAgo(13, 60),
      weight: 10.2,
      color: 'Gray',
      pattern: 'Solid',
      coatLength: 'Short',
      personality: 'Calm and dignified. Spends most afternoons in a sunny loaf.',
      energyLevel: 'Low',
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'No',
      knownIllnesses: ['Hyperthyroidism'],
      notes: 'Thyroid tablet twice a day, hidden in a pill pocket.',
      createdAt: made(-HISTORY, 20),
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
      createdAt: made(-HISTORY, 10),
    },
    {
      ...home,
      id: PICKLE,
      name: 'Pickle',
      breed: ['Domestic Shorthair'],
      // About six weeks old when she was found, so sixteen weeks today.
      birthday: day(PICKLE_HOME - 42),
      weight: 3.6,
      color: 'White',
      pattern: 'Calico',
      coatLength: 'Short',
      personality: 'Curious about everything, and climbs whatever is tallest.',
      energyLevel: 'High',
      huntingPreyDrive: ['Bug', 'Mouse'],
      huntingLocation: ['Indoor'],
      likesElectronicToys: 'Yes',
      notes: 'Found under the porch at about six weeks old. Spay booked for when she’s big enough.',
      createdAt: made(-PICKLE_HOME),
    },
  ]

  /* An event is "made" the day it starts, or a fortnight before a future one,
     so the timestamps read like an owner keeping the schedule as they went. */
  const event = (
    over: Partial<ScheduleEvent> &
      Pick<ScheduleEvent, 'id' | 'catIds' | 'category' | 'title' | 'date'>,
  ): ScheduleEvent => {
    const offset = Math.round((parseDateKey(over.date)!.getTime() - start.getTime()) / 86_400_000)
    return {
      times: [],
      recurrence: 'none',
      createdAt: made(offset < 0 ? -offset : 14),
      ...over,
      id: id(over.id),
    }
  }

  /** A vet visit at the household's clinic. */
  const vet = (
    over: Partial<ScheduleEvent> & Pick<ScheduleEvent, 'id' | 'catIds' | 'title' | 'date'>,
  ): ScheduleEvent =>
    event({
      category: 'Vet',
      durationMinutes: 30,
      vetName: VET.name,
      vetPhone: VET.phone,
      vetAddress: VET.address,
      ...over,
    })

  /**
   * One feeding event. A change of food or portion is the old event ending the
   * day before (recurrenceEndDate) and a new one starting, which is how an
   * owner would record it and what makes the planned food chart step.
   */
  const meal = (
    over: Partial<ScheduleEvent> &
      Pick<ScheduleEvent, 'id' | 'title' | 'date' | 'times' | 'foodBrand' | 'foodName'>,
    amounts: [catId: string, amount: number, unit: FeedingUnit][],
  ): ScheduleEvent =>
    event({
      category: 'Feeding',
      recurrence: 'daily',
      catIds: amounts.map(([catId]) => catId),
      feedingAmounts: amounts.map(([catId, amount, unit]) => ({ catId, amount, unit })),
      ...over,
    })

  const events: ScheduleEvent[] = [
    // ─── Feeding ─────────────────────────────────────────────────────────────
    meal(
      {
        id: 'breakfast-before',
        title: 'Breakfast',
        date: day(HISTORY),
        recurrenceEndDate: day(MISO_DIET - 1),
        times: ['07:30'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Chicken pâté',
      },
      [
        [BISCUIT, 0.5, 'can'],
        [NOODLE, 0.5, 'can'],
        [MISO, 0.5, 'can'],
        [MOCHI, 0.5, 'can'],
      ],
    ),
    meal(
      {
        id: 'breakfast',
        title: 'Breakfast',
        date: day(MISO_DIET),
        times: ['07:30'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Chicken pâté',
        notes: 'Miso has his own urinary food now, so keep him away from this one.',
      },
      [
        [BISCUIT, 0.5, 'can'],
        [NOODLE, 0.5, 'can'],
        [MOCHI, 0.5, 'can'],
      ],
    ),
    /* Pepper eats on her own, so the pill pocket goes in first and nobody else
       finishes her bowl. */
    meal(
      {
        id: 'pepper-breakfast-before',
        title: 'Pepper’s breakfast',
        date: day(HISTORY),
        recurrenceEndDate: day(PEPPER_SENIOR_FOOD - 1),
        times: ['07:45'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Chicken pâté',
      },
      [[PEPPER, 0.5, 'can']],
    ),
    meal(
      {
        id: 'pepper-breakfast',
        title: 'Pepper’s breakfast',
        date: day(PEPPER_SENIOR_FOOD),
        times: ['07:45'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Senior chicken pâté',
        notes: 'Fed in the bedroom. Pill pocket first.',
      },
      [[PEPPER, 0.5, 'can']],
    ),
    meal(
      {
        id: 'dinner-before',
        title: 'Dinner',
        date: day(HISTORY),
        recurrenceEndDate: day(NOODLE_DIET - 1),
        times: ['18:00'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Indoor adult dry',
        notes: 'Noodle’s bowl gets topped up whenever he asks.',
      },
      [
        [BISCUIT, 0.25, 'cup'],
        [NOODLE, 0.4, 'cup'],
        [MISO, 0.25, 'cup'],
        [PEPPER, 0.2, 'cup'],
        [MOCHI, 0.2, 'cup'],
      ],
    ),
    meal(
      {
        id: 'dinner-without-noodle',
        title: 'Dinner',
        date: day(NOODLE_DIET),
        recurrenceEndDate: day(MISO_DIET - 1),
        times: ['18:00'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Indoor adult dry',
        notes: 'Noodle has his own measured dinner now.',
      },
      [
        [BISCUIT, 0.25, 'cup'],
        [MISO, 0.25, 'cup'],
        [PEPPER, 0.2, 'cup'],
        [MOCHI, 0.2, 'cup'],
      ],
    ),
    meal(
      {
        id: 'dinner',
        title: 'Dinner',
        date: day(MISO_DIET),
        times: ['18:00'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Indoor adult dry',
        notes: 'Miso will remind you.',
      },
      [
        [BISCUIT, 0.25, 'cup'],
        [PEPPER, 0.2, 'cup'],
        [MOCHI, 0.2, 'cup'],
      ],
    ),
    /* Two smaller measured meals rather than one big bowl: 0.3 cup a day of a
       lighter food, down from 0.4 of the regular one. */
    meal(
      {
        id: 'noodle-diet',
        title: 'Noodle’s weight-control kibble',
        date: day(NOODLE_DIET),
        times: ['12:00', '18:00'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Weight control dry',
        notes: 'Use the measuring scoop, level, every time. No top-ups.',
      },
      [[NOODLE, 0.15, 'cup']],
    ),
    /* Wet twice a day for the extra water, and a little of the matching dry. */
    meal(
      {
        id: 'miso-urinary-wet',
        title: 'Miso’s urinary wet food',
        date: day(MISO_DIET),
        times: ['07:30', '18:00'],
        foodBrand: 'Northpaw Veterinary',
        foodName: 'Urinary care chicken stew',
        notes: 'A splash of warm water in it helps too.',
      },
      [[MISO, 0.5, 'can']],
    ),
    meal(
      {
        id: 'miso-urinary-dry',
        title: 'Miso’s urinary dry food',
        date: day(MISO_DIET),
        times: ['18:00'],
        foodBrand: 'Northpaw Veterinary',
        foodName: 'Urinary care dry',
      },
      [[MISO, 0.15, 'cup']],
    ),
    /* Kittens eat little and often, so Pickle gets her own three meals. */
    meal(
      {
        id: 'kitten-meals',
        title: 'Kitten meals',
        date: day(PICKLE_HOME),
        times: ['07:30', '12:30', '18:00'],
        foodBrand: 'Hearth & Paw',
        foodName: 'Kitten formula',
      },
      [[PICKLE, 40, 'g']],
    ),

    // ─── Medication ──────────────────────────────────────────────────────────
    event({
      id: 'thyroid-meds',
      catIds: [PEPPER],
      category: 'Medication',
      title: 'Methimazole 2.5 mg',
      date: day(PEPPER_DIAGNOSED),
      times: ['08:00', '20:00'],
      recurrence: 'daily',
      medicationStatus: 'Started',
      medicationDuration: 'Forever',
      notes: 'Dose as prescribed, hidden in a pill pocket. Ongoing, with regular bloodwork.',
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
      id: 'miso-pain-relief',
      catIds: [MISO],
      category: 'Medication',
      title: 'Pain relief from the vet',
      date: day(MISO_VET),
      times: ['08:00'],
      recurrence: 'daily',
      recurrenceEndDate: day(MISO_VET + 4),
      medicationStatus: 'Started',
      medicationDuration: 'Set duration',
      notes: 'Five days, to settle his bladder while the new food starts working.',
    }),
    event({
      id: 'miso-pain-relief-stopped',
      catIds: [MISO],
      category: 'Medication',
      title: 'Pain relief from the vet',
      date: day(MISO_VET + 5),
      medicationStatus: 'Stopped',
      notes: 'Course finished. Peeing normally again.',
    }),
    /* Two doses two weeks apart is one course: the first is the Started, the
       last is the Stopped, so the card does not count a finished dewormer. */
    event({
      id: 'pickle-dewormer',
      catIds: [PICKLE],
      category: 'Medication',
      title: 'Kitten dewormer',
      date: day(PICKLE_HOME + 2),
      times: ['10:00'],
      medicationStatus: 'Started',
      medicationDuration: 'Set duration',
      notes: 'First dose, given at the new-kitten exam. Second one in two weeks.',
    }),
    event({
      id: 'pickle-dewormer-stopped',
      catIds: [PICKLE],
      category: 'Medication',
      title: 'Kitten dewormer',
      date: day(PICKLE_HOME + 16),
      medicationStatus: 'Stopped',
      notes: 'Second and last dose given this morning.',
    }),
    event({
      id: 'pickle-flea',
      catIds: [PICKLE],
      category: 'Medication',
      title: 'Kitten flea treatment',
      date: day(PICKLE_HOME + 2),
      times: ['10:00'],
      recurrence: 'monthly',
      medicationStatus: 'Started',
      medicationDuration: 'Forever',
      notes: 'Kitten-safe spot-on from the clinic, on the back of the neck.',
    }),
    event({
      id: 'pickle-antibiotic',
      catIds: [PICKLE],
      category: 'Medication',
      title: 'Amoxicillin-clavulanate liquid',
      date: day(-40),
      times: ['08:00', '20:00'],
      recurrence: 'daily',
      recurrenceEndDate: day(-31),
      medicationStatus: 'Started',
      medicationDuration: 'Set duration',
      notes: 'Twice a day for ten days, with food. Finish the whole bottle.',
    }),
    event({
      id: 'pickle-antibiotic-stopped',
      catIds: [PICKLE],
      category: 'Medication',
      title: 'Amoxicillin-clavulanate liquid',
      date: day(-30),
      medicationStatus: 'Stopped',
      notes: 'Course finished. No more sneezing.',
    }),

    // ─── Care routine ────────────────────────────────────────────────────────
    event({
      id: 'litter',
      catIds: EVERYONE,
      category: 'Care Routine',
      title: 'Full litter change',
      date: day(-698),
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
      date: day(PEPPER_SENIOR_FOOD),
      routineType: 'Changed food',
      routineBrand: 'Hearth & Paw',
      routineItemName: 'Senior chicken pâté',
      notes: 'Mixed in over a week. Took to it straight away.',
    }),
    event({
      id: 'noodle-food-change',
      catIds: [NOODLE],
      category: 'Care Routine',
      title: 'Switched to weight-control food',
      date: day(NOODLE_DIET),
      routineType: 'Changed food',
      routineBrand: 'Hearth & Paw',
      routineItemName: 'Weight control dry',
      notes: 'Mixed in over a week, as the vet suggested.',
    }),
    event({
      id: 'miso-food-change',
      catIds: [MISO],
      category: 'Care Routine',
      title: 'Switched to urinary diet',
      date: day(MISO_DIET),
      routineType: 'Changed food',
      routineBrand: 'Northpaw Veterinary',
      routineItemName: 'Urinary care',
      notes: 'Prescription food only from now on: nothing else, not even treats.',
    }),

    // ─── Vet: Pepper's thyroid ───────────────────────────────────────────────
    vet({
      id: 'pepper-diagnosis',
      catIds: [PEPPER],
      title: 'Weight loss check',
      date: day(PEPPER_DIAGNOSED),
      times: ['15:00'],
      durationMinutes: 45,
      estimatedCost: 280,
      notes:
        'Losing weight though she’s eating more than ever. Bloodwork: T4 high, kidneys normal. Diagnosed hyperthyroid; starting methimazole.',
    }),
    vet({
      id: 'pepper-recheck-3wk',
      catIds: [PEPPER],
      title: 'Thyroid recheck (3 weeks)',
      date: day(PEPPER_DIAGNOSED + 21),
      times: ['15:00'],
      estimatedCost: 140,
      notes: 'T4 coming down, kidney values still fine. Same dose.',
    }),
    vet({
      id: 'pepper-recheck-3mo',
      catIds: [PEPPER],
      title: 'Thyroid recheck',
      date: day(PEPPER_DIAGNOSED + 90),
      times: ['15:00'],
      estimatedCost: 140,
      notes: 'T4 in the normal range. Weight starting to come back.',
    }),
    vet({
      id: 'pepper-recheck-6mo',
      catIds: [PEPPER],
      title: 'Thyroid recheck',
      date: day(PEPPER_DIAGNOSED + 180),
      times: ['15:00'],
      estimatedCost: 140,
      notes: 'Still in range. Next bloodwork in about three months.',
    }),
    vet({
      id: 'vet-checkup',
      catIds: [PEPPER],
      title: 'Thyroid bloodwork',
      date: day(-25),
      times: ['14:30'],
      durationMinutes: 45,
      estimatedCost: 160,
      notes:
        'Routine bloodwork. T4 still in range, kidneys fine. Same dose, recheck in a few weeks.',
    }),
    vet({
      id: 'vet-recheck',
      catIds: [PEPPER],
      title: 'Thyroid recheck',
      date: day(5),
      times: ['10:15'],
      estimatedCost: 95,
      notes: 'Bring the pill pockets — she’s calmer with a treat.',
    }),

    // ─── Vet: Noodle's weight ────────────────────────────────────────────────
    vet({
      id: 'noodle-checkup',
      catIds: [NOODLE],
      title: 'Annual checkup',
      date: day(NOODLE_DIET),
      times: ['11:00'],
      estimatedCost: 90,
      notes:
        'About 2 lb overweight. Plan: weight-control food, measured meals, more play. Aim to lose slowly, 1–2% a month.',
    }),
    vet({
      id: 'noodle-weigh-in',
      catIds: [NOODLE],
      title: 'Weigh-in with the vet nurse',
      date: day(NOODLE_DIET + 90),
      times: ['11:00'],
      durationMinutes: 15,
      notes: 'Losing at a good pace. Keep going.',
    }),

    // ─── Vet: Miso's bladder ─────────────────────────────────────────────────
    vet({
      id: 'miso-urinary',
      catIds: [MISO],
      title: 'Straining in the litter box',
      date: day(MISO_VET),
      times: ['09:30'],
      durationMinutes: 60,
      estimatedCost: 240,
      notes:
        'Seen the same day: straining can mean a blockage in a male cat, which is an emergency. Not blocked. Urinalysis showed struvite crystals. Prescription urinary diet and more water.',
    }),
    vet({
      id: 'miso-recheck',
      catIds: [MISO],
      title: 'Urinalysis recheck',
      date: day(MISO_VET + 42),
      times: ['09:30'],
      estimatedCost: 85,
      notes: 'No crystals. Stay on the urinary food for good.',
    }),

    // ─── Vet: Pickle's kitten care ───────────────────────────────────────────
    vet({
      id: 'pickle-first-exam',
      catIds: [PICKLE],
      title: 'New kitten exam',
      date: day(PICKLE_HOME + 2),
      times: ['10:00'],
      estimatedCost: 120,
      notes:
        'About six weeks old and healthy. FeLV/FIV test negative. First dewormer dose and flea treatment.',
    }),
    vet({
      id: 'pickle-fvrcp-1',
      catIds: [PICKLE],
      title: 'Kitten vaccines',
      date: day(PICKLE_HOME + 14),
      times: ['16:00'],
      estimatedCost: 60,
      notes: 'First FVRCP, at eight weeks.',
    }),
    vet({
      id: 'pickle-cold',
      catIds: [PICKLE],
      title: 'Sneezing and runny eyes',
      date: day(-40),
      times: ['12:00'],
      estimatedCost: 95,
      notes:
        'Upper respiratory infection, common in shelter and stray kittens. Antibiotic for ten days; keep her eating and her eyes clean.',
    }),
    vet({
      id: 'pickle-fvrcp-2',
      catIds: [PICKLE],
      title: 'Kitten vaccines',
      date: day(-21),
      times: ['16:00'],
      estimatedCost: 60,
      notes: 'Second FVRCP. Pushed back a week while she got over her cold.',
    }),
    vet({
      id: 'kitten-vaccines',
      catIds: [PICKLE],
      title: 'Kitten vaccines',
      date: day(9),
      times: ['16:00'],
      estimatedCost: 75,
      notes: 'Final FVRCP booster and rabies.',
    }),
    vet({
      id: 'pickle-spay',
      catIds: [PICKLE],
      title: 'Spay',
      date: day(60),
      times: ['08:00'],
      durationMinutes: undefined,
      estimatedCost: 350,
      notes: 'Drop off at 8, collect in the afternoon. No food after midnight the night before.',
    }),

    // ─── Vet: Biscuit and Mochi ──────────────────────────────────────────────
    vet({
      id: 'biscuit-dental',
      catIds: [BISCUIT],
      title: 'Dental cleaning',
      date: day(-150),
      times: ['08:00'],
      durationMinutes: undefined,
      estimatedCost: 650,
      notes:
        'Under anaesthetic, bloodwork first. Scale and polish, one small tooth out. Soft food for a few days.',
    }),
    vet({
      id: 'biscuit-ears',
      catIds: [BISCUIT],
      title: 'Scratching his ear',
      date: day(-45),
      times: ['17:30'],
      estimatedCost: 85,
      notes: 'Mild ear infection. Ten days of drops.',
    }),
    vet({
      id: 'biscuit-ears-recheck',
      catIds: [BISCUIT],
      title: 'Ear recheck',
      date: day(-35),
      times: ['17:30'],
      durationMinutes: 15,
      estimatedCost: 40,
      notes: 'All clear.',
    }),
    vet({
      id: 'mochi-checkup-last-year',
      catIds: [MOCHI],
      title: 'Annual checkup',
      date: day(-425),
      times: ['13:00'],
      estimatedCost: 90,
      notes: 'Healthy. Vaccines up to date.',
    }),
    vet({
      id: 'mochi-checkup',
      catIds: [MOCHI],
      title: 'Annual checkup',
      date: day(-60),
      times: ['13:00'],
      estimatedCost: 90,
      notes: 'Healthy, weight right where it should be. Keep up the brushing.',
    }),

    // ─── Grooming ────────────────────────────────────────────────────────────
    event({
      id: 'brushing',
      catIds: [MOCHI],
      category: 'Grooming',
      title: 'Brushing',
      date: day(-696),
      times: ['19:30'],
      recurrence: 'weekly',
      groomingTools: [{ catId: MOCHI, value: 'Slicker brush and wide-tooth comb' }],
    }),
    event({
      id: 'nail-trim',
      catIds: [BISCUIT, NOODLE, MISO, PEPPER],
      category: 'Grooming',
      title: 'Nail trim',
      date: day(-700),
      recurrence: 'monthly',
      groomingTools: [
        { catId: BISCUIT, value: 'Nail clippers' },
        { catId: NOODLE, value: 'Nail clippers' },
        { catId: MISO, value: 'Nail clippers' },
        { catId: PEPPER, value: 'Nail clippers and a towel' },
      ],
    }),

    // ─── Play ────────────────────────────────────────────────────────────────
    event({
      id: 'noodle-play-before',
      catIds: [NOODLE],
      category: 'Play',
      title: 'Feather wand session',
      date: day(HISTORY + 3),
      recurrenceEndDate: day(NOODLE_DIET - 1),
      times: ['17:00'],
      durationMinutes: 15,
      recurrence: 'weekly',
      playActivityType: 'Toy',
      playDetail: 'Feather wand',
    }),
    /* Part of the weight plan: two short sessions every day, ending with a
       meal, so the play chart steps up the day the diet starts. */
    event({
      id: 'noodle-play',
      catIds: [NOODLE],
      category: 'Play',
      title: 'Noodle’s play sessions',
      date: day(NOODLE_DIET),
      times: ['08:30', '17:45'],
      durationMinutes: 15,
      recurrence: 'daily',
      playActivityType: 'Toy',
      playDetail: 'Wand, then crinkle mice to chase. Feed right after.',
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
      date: day(-400),
      times: ['11:00'],
      durationMinutes: 30,
      recurrence: 'weekly',
      playActivityType: 'Walk',
      playDetail: 'Round the back garden',
    }),

    // ─── Other ───────────────────────────────────────────────────────────────
    event({
      id: 'wash-beds',
      catIds: EVERYONE,
      category: 'Other',
      title: 'Wash the cat beds',
      date: day(-690),
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
    /* Steady for a year, then six months of loss on a big appetite, the
       diagnosis, and a slow climb back once the dose is right. Weighed more
       often around the diagnosis, as the vet asked. */
    ...readings(PEPPER, [
      [600, 11.0],
      [570, 11.1],
      [540, 11.0],
      [510, 11.0],
      [480, 11.0],
      [450, 10.9],
      [420, 10.6],
      [390, 10.3, 'Eating more but losing weight'],
      [360, 10.0],
      [330, 9.8, 'Always hungry, and drinking a lot'],
      [300, 9.5],
      [285, 9.4, 'Booked a vet visit'],
      [-PEPPER_DIAGNOSED, 9.3, 'Weighed at the vet. Hyperthyroid; tablets start today'],
      [-PEPPER_DIAGNOSED - 21, 9.3, '3-week recheck'],
      [230, 9.4],
      [-PEPPER_DIAGNOSED - 90, 9.5, 'Weighed at the vet'],
      [150, 9.7],
      [120, 9.8],
      [-PEPPER_DIAGNOSED - 180, 9.9, 'Weighed at the vet'],
      [60, 10.0],
      [21, 10.1, 'Weighed at the vet'],
      [2, 10.2],
    ]),
    /* A year of creeping up on generous portions, then about 2% a month off
       once the diet and the play sessions start. */
    ...readings(NOODLE, [
      [575, 11.0],
      [545, 11.3],
      [515, 11.6],
      [485, 11.9],
      [455, 12.2],
      [425, 12.4],
      [395, 12.6],
      [365, 12.8],
      [335, 12.9],
      [305, 13.1],
      [275, 13.2],
      [240, 13.3],
      [-NOODLE_DIET, 13.4, 'Vet says about 2 lb over. Diet starts today'],
      [180, 13.15],
      [150, 12.9],
      [-NOODLE_DIET - 90, 12.65, 'Weighed at the vet. Good pace'],
      [90, 12.4],
      [60, 12.15, 'Halfway there'],
      [30, 11.9],
      [4, 11.6, 'Nearly at goal weight'],
    ]),
    // Steady through the urinary scare: the problem was crystals, not weight.
    ...readings(MISO, [
      [700, 11.5],
      [580, 11.7],
      [460, 11.6],
      [340, 11.5],
      [240, 11.7],
      [-MISO_VET, 11.6, 'Weighed at the vet'],
      [-MISO_VET - 42, 11.5, 'Weighed at the recheck'],
      [20, 11.6],
    ]),
    /* Weekly, as for any young kitten: about a pound a month, with a flat
       week or two while the cold put her off her food. */
    ...readings(PICKLE, [
      [70, 1.3, 'First weigh-in at home. About six weeks old'],
      [63, 1.55],
      [56, 1.8, 'Weighed at the vet'],
      [49, 2.05],
      [42, 2.3, 'Sneezing a bit'],
      [35, 2.3, 'Off her food with the cold'],
      [28, 2.4, 'Eating properly again'],
      [21, 2.75, 'Weighed at the vet'],
      [14, 3.05],
      [7, 3.35],
      [1, 3.6],
    ]),
    ...readings(BISCUIT, [
      [600, 12.5],
      [420, 12.6],
      [240, 12.4],
      [150, 12.5, 'Weighed before his dental'],
      [45, 12.4, 'Weighed at the vet'],
      [10, 12.5],
    ]),
    // The healthy baseline: the same give or take a couple of ounces.
    ...readings(MOCHI, [
      [650, 9.7],
      [425, 9.8, 'Annual checkup'],
      [300, 9.9],
      [180, 9.8],
      [60, 9.8, 'Annual checkup'],
      [15, 9.7],
    ]),
  ]

  const product = (
    name: string,
    over: Omit<CatalogProduct, 'id' | 'name' | 'createdAt'>,
  ): CatalogProduct => ({
    id: id(`product-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
    name,
    createdAt: made(-HISTORY),
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
    weightControl: product('Weight control dry', {
      brand: 'Hearth & Paw',
      category: 'Food',
      subCategory: 'Dry Food',
    }),
    urinaryWet: product('Urinary care chicken stew', {
      brand: 'Northpaw Veterinary',
      category: 'Food',
      subCategory: 'Wet Food',
    }),
    urinaryDry: product('Urinary care dry', {
      brand: 'Northpaw Veterinary',
      category: 'Food',
      subCategory: 'Dry Food',
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
    flea: product('Kitten flea treatment', { category: 'Medication', subCategory: 'Spot-on' }),
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
    createdAt: made(-HISTORY),
    ...over,
  })

  const items: HouseholdItem[] = [
    item('pate', {
      productId: products.pate.id,
      dateStarted: day(HISTORY),
      catIds: [BISCUIT, NOODLE, MOCHI],
    }),
    item('dry', {
      productId: products.dry.id,
      dateStarted: day(HISTORY),
      catIds: [BISCUIT, PEPPER, MOCHI],
    }),
    item('senior', {
      productId: products.senior.id,
      dateStarted: day(PEPPER_SENIOR_FOOD),
      catIds: [PEPPER],
    }),
    item('weight-control', {
      productId: products.weightControl.id,
      dateStarted: day(NOODLE_DIET),
      catIds: [NOODLE],
      notes: 'Measured with the level scoop.',
    }),
    item('urinary-wet', {
      productId: products.urinaryWet.id,
      dateStarted: day(MISO_DIET),
      catIds: [MISO],
      notes: 'Prescription, ordered through the clinic.',
    }),
    item('urinary-dry', {
      productId: products.urinaryDry.id,
      dateStarted: day(MISO_DIET),
      catIds: [MISO],
      notes: 'Prescription, ordered through the clinic.',
    }),
    item('kitten', {
      productId: products.kitten.id,
      dateStarted: day(PICKLE_HOME),
      catIds: [PICKLE],
    }),
    item('salmon', {
      productId: products.salmon.id,
      status: 'past',
      dateStarted: day(HISTORY - 300),
      dateEnded: day(HISTORY - 1),
      catIds: [BISCUIT, NOODLE, MISO, PEPPER, MOCHI],
      notes: 'Noodle kept leaving it. Switched to Hearth & Paw.',
    }),
    item('litter', { productId: products.litter.id, dateStarted: day(-800), catIds: EVERYONE }),
    item('methimazole', {
      productId: products.methimazole.id,
      dateStarted: day(PEPPER_DIAGNOSED),
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
    item('flea', {
      productId: products.flea.id,
      dateStarted: day(PICKLE_HOME + 2),
      catIds: [PICKLE],
      notes: 'One tube a month.',
    }),
    item('wand', {
      productId: products.wand.id,
      dateStarted: day(HISTORY),
      catIds: [NOODLE, PICKLE],
    }),
    item('mice', {
      productId: products.mice.id,
      dateStarted: day(NOODLE_DIET),
      catIds: [NOODLE, PICKLE, BISCUIT],
    }),
    item('brush', { productId: products.brush.id, dateStarted: day(-760), catIds: [MOCHI] }),
    item('clippers', {
      productId: products.clippers.id,
      dateStarted: day(-800),
      catIds: [BISCUIT, NOODLE, MISO, PEPPER],
    }),
    item('fountain', {
      productId: products.fountain.id,
      dateStarted: day(MISO_DIET),
      catIds: EVERYONE,
      notes: 'Bought for Miso, but everyone drinks from it.',
    }),
    item('pill-pockets', {
      productId: products.pillPockets.id,
      dateStarted: day(PEPPER_DIAGNOSED),
      catIds: [PEPPER],
    }),
  ]

  return { cats, events, healthRecords, products: Object.values(products), items }
}
