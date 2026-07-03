import { CareRoutineType, FeedingUnit, LitterType, MedicationDuration, MedicationStatus, PlayActivityType, ScheduleCategory } from '@/types/scheduleEvent'

export const SCHEDULE_CATEGORIES: ScheduleCategory[] = ['Feeding', 'Medication', 'Care Routine', 'Vet', 'Grooming', 'Play', 'Other']

export const MEDICATION_STATUSES: MedicationStatus[] = ['Started', 'Stopped']

export const MEDICATION_DURATIONS: MedicationDuration[] = ['Forever', 'Set duration']

export const CARE_ROUTINE_TYPES: CareRoutineType[] = ['Changed food', 'Changed litter', 'Other']

export const LITTER_TYPES: LitterType[] = ['Clay', 'Clumping Clay', 'Crystal/Silica', 'Pellet', 'Corn/Wheat', 'Pine', 'Walnut', 'Paper', 'Other']

export const PLAY_ACTIVITY_TYPES: PlayActivityType[] = ['Toy', 'Walk', 'Other']

export const FEEDING_UNITS: FeedingUnit[] = ['cup', 'oz', 'g', 'can', 'tbsp']

export const DURATION_OPTIONS_MINUTES: number[] = [15, 30, 45, 60, 90, 120]
