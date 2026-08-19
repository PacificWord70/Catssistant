/**
 * A single dated health measurement for one cat.
 *
 * Metrics are flat optional fields rather than a generic `metrics` bag. A bag
 * would be more open-ended, but flat fields stay type-safe and readable —
 * `record.weightLbs` narrows to `number | undefined`, where a bag would hand
 * back `unknown` and need checking at every call site. Adding a metric later
 * means adding one optional field here.
 *
 * Weight is stored canonically in pounds, with the unit in the field name so
 * it cannot be misread. The form converts on the way in and out, which keeps
 * a chart series from mixing lbs and kg points.
 */
export interface HealthRecord {
  id: string
  catId: string
  /** ISO date, YYYY-MM-DD. Day precision is enough for these trends. */
  date: string
  weightLbs?: number
  notes?: string
  createdAt: string
}
