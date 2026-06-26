export interface Vet {
  name: string
  phone: string
  address: string
}

export interface Cat {
  id: string
  name: string
  breed: string[]
  birthday?: string
  photoUrl?: string
  weight?: number
  weightUnit: 'lbs' | 'kg'
  color?: string
  chipId?: string
  locationCountry?: string
  locationRegion?: string
  locationCity?: string
  vet?: Vet
  personality?: string
  notes?: string
  createdAt: string
}
