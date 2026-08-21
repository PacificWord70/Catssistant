import { CoatColor, CoatLength, CoatPattern, EnergyLevel, HuntingLocation, PreyDrive, YesNoUnknown } from '@/types/cat'

export const COAT_LENGTHS: CoatLength[] = ['Hairless', 'Short', 'Medium', 'Long', 'Unknown']

export const COAT_COLORS: CoatColor[] = [
  'Black',
  'White',
  'Gray',
  'Orange',
  'Brown',
  'Cream',
  'Silver',
  'Chocolate',
  'Lilac',
]

export const COAT_PATTERNS: CoatPattern[] = ['Solid', 'Tabby', 'Calico', 'Tortoiseshell', 'Tuxedo', 'Colorpoint']

export const ENERGY_LEVELS: EnergyLevel[] = ['Low', 'Medium', 'High', 'Unknown']

export const PREY_DRIVES: PreyDrive[] = ['Mouse', 'Bird', 'Bug', 'Unknown']

export const HUNTING_LOCATIONS: HuntingLocation[] = ['Indoor', 'Outdoor']

export const YES_NO_UNKNOWN: YesNoUnknown[] = ['Yes', 'No', 'Unknown']

export const KNOWN_ILLNESSES: string[] = [
  'Diabetes',
  'Chronic Kidney Disease',
  'Hyperthyroidism',
  'FIV',
  'FeLV',
  'Asthma',
  'Dental Disease',
  'Obesity',
  'Inflammatory Bowel Disease',
  'Heart Disease (HCM)',
  'Arthritis',
  'Allergies',
]
