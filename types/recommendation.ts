import { Product } from '@/types/product'

/**
 * A product matched to a cat, with the reasoning kept alongside it.
 *
 * The product is embedded rather than referenced by id. Normally you would
 * normalise this (store productId and look it up), but the catalogue is static
 * seed data that never changes at runtime — there is no second copy to drift
 * out of sync. Embedding keeps the engine a pure function whose output can be
 * asserted on directly in tests.
 */
export interface Recommendation {
  product: Product
  /** Number of criteria the cat satisfied. Higher sorts first. */
  score: number
  /**
   * Why this was recommended, in the user's words rather than field names —
   * e.g. "Long coats mat easily" instead of "coatLengths includes Long".
   */
  reasons: string[]
}
