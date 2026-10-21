import type { CareRoutineType, LitterType, MedicationStatus, ScheduleCategory } from '@/types/scheduleEvent'

/**
 * Rules for the schedule event form, kept pure so they can be tested.
 *
 * The form used to `return` silently when any of these failed, so pressing Save
 * did nothing and gave no hint why. Each rule now names the field it is about,
 * which lets the form put the message under that field and focus it.
 */

export type ScheduleField =
  | 'cats'
  | 'feedingAmounts'
  | 'title'
  | 'recurrenceEndDate'
  | 'litterType'
  | 'times'
  | 'vetName'
  | 'vetAddress'
  | 'date'

/**
 * Top-to-bottom order of the fields in the form. The first invalid one in this
 * order is the one that receives focus, so keyboard and screen-reader users
 * land on the earliest problem rather than an arbitrary one.
 */
export const SCHEDULE_FIELD_ORDER: ScheduleField[] = [
  'cats',
  'feedingAmounts',
  'title',
  'recurrenceEndDate',
  'litterType',
  'times',
  'vetName',
  'vetAddress',
  'date',
]

export type ScheduleErrors = Partial<Record<ScheduleField, string>>

export interface ScheduleDraft {
  category: ScheduleCategory
  catIds: string[]
  title: string
  date: string
  times: string[]
  recurrenceEndDate: string
  /** Whether the "Until" field is on screen. When it is not, its error goes on Date. */
  endDateShown: boolean
  medicationStatus: MedicationStatus
  feedingAmounts: { catId: string; amount: number }[]
  vetName: string
  vetAddress: string
  routineType: CareRoutineType
  litterType: LitterType | ''
}

export function validateScheduleDraft(d: ScheduleDraft): ScheduleErrors {
  const errors: ScheduleErrors = {}

  if (d.catIds.length === 0) errors.cats = 'Pick at least one cat.'
  if (!d.date) errors.date = 'Choose a date.'

  if (d.date && d.recurrenceEndDate && d.recurrenceEndDate < d.date) {
    const message = 'The end date can’t be before the start date.'
    // An end date can outlive the field that set it (switching category away
    // from medication keeps it). Pinning the message to a hidden field would
    // leave the owner nothing to see or fix, so it moves to the date instead.
    if (d.endDateShown) errors.recurrenceEndDate = message
    else errors.date ??= message
  }

  if (d.category === 'Medication' && !d.title.trim()) errors.title = 'Enter the medicine’s name.'
  if (d.category === 'Other' && !d.title.trim()) errors.title = 'Give this event a label.'

  const needsTime =
    d.category === 'Feeding' ||
    d.category === 'Vet' ||
    (d.category === 'Medication' && d.medicationStatus === 'Started')
  if (needsTime && !d.times[0]) errors.times = 'Add at least the first time.'

  if (d.category === 'Feeding') {
    const amountFor = (id: string) => d.feedingAmounts.find(f => f.catId === id)?.amount ?? 0
    if (d.catIds.some(id => !(amountFor(id) > 0))) {
      errors.feedingAmounts = 'Enter an amount greater than zero for each cat.'
    }
  }

  if (d.category === 'Vet') {
    if (!d.vetName.trim()) errors.vetName = 'Enter the vet clinic’s name.'
    if (!d.vetAddress.trim()) errors.vetAddress = 'Enter the clinic’s address.'
  }

  if (d.category === 'Care Routine' && d.routineType === 'Changed litter' && !d.litterType) {
    errors.litterType = 'Choose a litter type.'
  }

  return errors
}

/** The first field with an error, in on-screen order. */
export function firstInvalidField(errors: ScheduleErrors): ScheduleField | undefined {
  return SCHEDULE_FIELD_ORDER.find(f => errors[f])
}
