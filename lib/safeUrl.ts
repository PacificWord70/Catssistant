/**
 * Guards for strings from storage that end up in `src` or `href` attributes.
 *
 * Everything in localStorage is reachable by anyone with the device, a browser
 * extension, or a future import/sync feature, so it is treated as untrusted at
 * the point it is rendered. React escapes text but not URLs: a `javascript:`
 * href runs when clicked, and an unexpected `src` can make a request to any
 * host. Both helpers allowlist what the app actually produces and return
 * `undefined` for everything else, so callers fall back rather than render.
 */

// Exactly what `lib/photo.ts` emits (canvas re-encodes) plus the other raster
// types a browser will decode in an <img>. SVG is left out on purpose: it is a
// document format, and nothing in the app produces one. The payload is checked
// against the base64 alphabet so nothing can ride along after the comma.
const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/

// Whitespace and control characters are rejected outright rather than trimmed.
// Browsers strip leading spaces and silently drop tabs and newlines inside URLs,
// which is how `java\nscript:` slips past a naive prefix check. Backslashes go
// too: browsers read `/\evil.example` as the protocol-relative `//evil.example`.
const UNSAFE_CHARS = /[\s\u0000-\u001f\u007f\\]/

/**
 * Returns `url` if it is safe to use as an image source, otherwise `undefined`.
 *
 * Allowed: base64 raster data URLs and same-origin paths (`/images/...`, but
 * never the protocol-relative `//host`). Remote `https:` images are refused to
 * match the CSP's `img-src`, which would block them anyway — refusing here means
 * the caller falls back to the avatar instead of showing a broken image. When
 * photos move to cloud storage with accounts, allow that one host here and in
 * the CSP together.
 */
export function safeImageSrc(url: unknown): string | undefined {
  if (typeof url !== 'string' || url === '') return undefined
  if (DATA_IMAGE.test(url)) return url
  if (UNSAFE_CHARS.test(url)) return undefined

  if (url.startsWith('/')) return url.startsWith('//') ? undefined : url

  return undefined
}

/**
 * Builds a `tel:` href from a free-text phone number, or `undefined` if it has
 * no digits. Only digits and a leading `+` survive, which is all a dialler
 * needs, and leaves nothing that could change what the link points at.
 */
export function telHref(phone: unknown): string | undefined {
  if (typeof phone !== 'string') return undefined
  const digits = phone.replace(/\D/g, '')
  if (!digits) return undefined
  return `tel:${phone.trim().startsWith('+') ? '+' : ''}${digits}`
}
