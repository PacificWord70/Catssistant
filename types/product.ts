import { CoatLength, EnergyLevel, HuntingLocation, LifeStage, PreyDrive } from '@/types/cat'

export type ProductCategory =
  | 'Brush'
  | 'Grooming'
  | 'Litter'
  | 'Food'
  | 'Toy'
  | 'Health'
  | 'Furniture'
  | 'Safety'

/**
 * The conditions under which a product suits a cat.
 *
 * Every field is optional, and an absent field means "no constraint" rather
 * than "matches nothing" — a plain water fountain suits any cat, so it leaves
 * all of these unset. A field that IS present must be satisfied for the
 * product to be recommended.
 */
export interface ProductMatch {
  coatLengths?: CoatLength[]
  lifeStages?: LifeStage[]
  energyLevels?: EnergyLevel[]
  preyDrives?: PreyDrive[]
  huntingLocations?: HuntingLocation[]
  /** Only recommend when the cat is known to like (or dislike) electronic toys. */
  likesElectronicToys?: boolean
  /** Any one of these illnesses is enough to match. */
  illnesses?: string[]
  minWeightLbs?: number
  maxWeightLbs?: number
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  /** One line explaining what the product is for. Shown on the results card. */
  description: string
  match: ProductMatch
}
