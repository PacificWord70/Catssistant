/**
 * Turning a thrown save error into something to show the owner.
 *
 * Storage writes throw an error whose message is already written for people
 * (for example, that the browser has run out of room), so that message is shown
 * as-is. Anything that is not an Error carries no such promise, so it gets a
 * plain fallback instead of whatever happened to be thrown.
 */

export const SAVE_FALLBACK_MESSAGE =
  'Something went wrong while saving, so nothing was changed. Please try again.'

export const DELETE_FALLBACK_MESSAGE =
  'Something went wrong while deleting, so nothing was removed. Please try again.'

export function errorMessage(err: unknown, fallback = SAVE_FALLBACK_MESSAGE): string {
  if (err instanceof Error && err.message.trim()) return err.message
  return fallback
}
