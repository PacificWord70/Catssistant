export interface Vet {
  name: string
  phone: string
  address: string
}

export type CoatLength = 'Hairless' | 'Short' | 'Medium' | 'Long' | 'Unknown'
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
  color?: string
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
