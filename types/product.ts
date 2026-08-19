import { CoatLength, EnergyLevel, HuntingLocation, LifeStage, PreyDrive } from '@/types/cat'

/**
 * Categories for the curated recommendation catalogue. Deliberately distinct
 * from ProductCategory in types/item.ts, which categorises what a user already
 * owns — these are finer-grained because recommendations need to tell a slicker
 * brush apart from a nail clipper, where an inventory just says "Tool".
 */
export type RecommendedCategory =
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

/**
 * A product the app can recommend. Separate from CatalogProduct in
 * types/item.ts: that records something a user owns, this is a curated entry
 * carrying the criteria that decide who it suits.
 */
export interface RecommendedProduct {
  id: string
  name: string
  category: RecommendedCategory
  /** One line explaining what the product is for. Shown on the results card. */
  description: string
  match: ProductMatch
}
