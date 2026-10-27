export type ScheduleCategory = 'Feeding' | 'Medication' | 'Care Routine' | 'Vet' | 'Grooming' | 'Play' | 'Other'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type MedicationStatus = 'Started' | 'Stopped'
export type MedicationDuration = 'Forever' | 'Set duration'
export type CareRoutineType = 'Changed food' | 'Changed litter' | 'Other'
export type LitterType = 'Clay' | 'Clumping Clay' | 'Crystal/Silica' | 'Pellet' | 'Corn/Wheat' | 'Pine' | 'Walnut' | 'Paper' | 'Other'
export type PlayActivityType = 'Toy' | 'Walk' | 'Other'
export type FeedingUnit = 'cup' | 'oz' | 'g' | 'can' | 'tbsp'

export interface PerCatValue {
  catId: string
  value: string
}

export interface FeedingAmount {
  catId: string
  amount: number
  unit: FeedingUnit
}

export interface ScheduleEvent {
  id: string
  catIds: string[]
  category: ScheduleCategory
  title: string
  date: string              // ISO date (YYYY-MM-DD) — first/only occurrence
  times: string[]           // HH:MM, 24h — zero or more per event
  durationMinutes?: number  // expected duration (Vet, Play, Other)
  recurrence: Recurrence
  recurrenceEndDate?: string // stop generating occurrences after this date
  notes?: string

  // Medication
  medicationStatus?: MedicationStatus
  medicationDuration?: MedicationDuration

  // Care Routine
  routineType?: CareRoutineType
  routineBrand?: string
  routineItemName?: string
  litterType?: LitterType
  routineOther?: string

  // Feeding
  foodBrand?: string
  foodName?: string
  feedingAmounts?: FeedingAmount[]

  // Grooming
  groomingTools?: PerCatValue[]

  // Play
  playActivityType?: PlayActivityType
  playDetail?: string

  // Vet
  vetName?: string
  vetPhone?: string
  vetAddress?: string
  estimatedCost?: number

  createdAt: string
  /** Last saved, ISO timestamp. Absent on older records; see Cat.updatedAt. */
  updatedAt?: string
}
