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
  chipId?: string
  homeLocation?: string
  vet?: Vet
  personality?: string
  notes?: string
  createdAt: string
}
