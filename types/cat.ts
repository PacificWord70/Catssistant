export interface Vet {
  name: string
  phone: string
  address: string
}

export type CoatLength = 'Hairless' | 'Short' | 'Medium' | 'Long' | 'Unknown'
/** The cat's base coat colour. Tints the avatar's body layer. */
export type CoatColor = 'Black' | 'White' | 'Gray' | 'Orange' | 'Brown' | 'Cream'
/** Markings drawn over the base colour. 'Solid' means no overlay. */
export type CoatPattern = 'Solid' | 'Tabby' | 'Calico' | 'Tortoiseshell' | 'Tuxedo' | 'Colorpoint'
export type EnergyLevel = 'Low' | 'Medium' | 'High' | 'Unknown'
export type PreyDrive = 'Mouse' | 'Bird' | 'Bug' | 'Unknown'
export type HuntingLocation = 'Indoor' | 'Outdoor'
export type YesNoUnknown = 'Yes' | 'No' | 'Unknown'

export interface Cat {
  id: string
  name: string
  breed: string[]
  birthday?: string
  photoUrl?: string
  weight?: number
  weightUnit: 'lbs' | 'kg'
  color?: CoatColor
  pattern?: CoatPattern
  coatLength?: CoatLength
  chipId?: string
  locationCountry?: string
  locationRegion?: string
  locationCity?: string
  vet?: Vet
  personality?: string
  energyLevel?: EnergyLevel
  huntingPreyDrive?: PreyDrive[]
  huntingLocation?: HuntingLocation[]
  likesElectronicToys?: YesNoUnknown
  knownIllnesses?: string[]
  notes?: string
  createdAt: string
}
