/**
 * Turning a picked file into a cat photo small enough to live in localStorage.
 *
 * A phone photo read straight to a data URL is several megabytes of base64, and
 * localStorage holds roughly 5MB for the whole app — one photo could fill it and
 * every later save would fail. So photos are downscaled and re-encoded in the
 * browser before they are stored.
 *
 * Re-encoding through a canvas also matters for privacy, not just size: a canvas
 * holds pixels only, so the JPEG it produces carries none of the original file's
 * EXIF metadata — including the GPS coordinates most phones embed in every
 * photo. Storing the original file would quietly keep the owner's home location
 * on record, which is exactly what the privacy rules in CLAUDE.md forbid.
 *
 * The decisions (which types, what size, which quality, when to give up) are
 * pure functions below so they can be tested without a DOM. Only
 * `prepareCatPhoto` touches the browser.
 */

export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Value for the file input's `accept` attribute. It is only a hint to the picker. */
export const PHOTO_ACCEPT = ACCEPTED_PHOTO_TYPES.join(',')

/** Longest side of the stored photo. Avatars and profile headers never show it larger. */
export const PHOTO_MAX_SIDE = 512

/** Qualities tried in order. One step down, then give up rather than turn a photo to mush. */
export const PHOTO_QUALITIES = [0.82, 0.6] as const

/** Ceiling for one encoded photo, so a handful of cats still leaves room for everything else. */
export const PHOTO_MAX_BYTES = 350 * 1024

export const PHOTO_MESSAGES = {
  wrongType: 'That file type isn’t supported. Please choose a JPEG, PNG or WebP photo.',
  unreadable: 'We couldn’t read that photo. It may be damaged — please try a different one.',
  tooBig: 'That photo is still too large after shrinking it. Please try a smaller or simpler one.',
} as const

export type PhotoResult = { ok: true; dataUrl: string } | { ok: false; message: string }

/**
 * Checks the file's reported MIME type. The input's `accept` attribute can be
 * bypassed by picking "All files", so it cannot be relied on alone.
 */
export function isAcceptedPhotoType(type: string): boolean {
  return (ACCEPTED_PHOTO_TYPES as readonly string[]).includes(type)
}

/**
 * Scales dimensions so the longest side is at most `maxSide`, keeping the
 * aspect ratio. Never upscales — enlarging a small photo only adds bytes.
 */
export function fitWithin(
  width: number,
  height: number,
  maxSide = PHOTO_MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxSide) return { width, height }
  const scale = maxSide / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Decoded size in bytes of a base64 data URL. Measures the payload the URL
 * stands for; localStorage stores the string itself, which is about a third
 * larger, so the budget above is deliberately conservative.
 */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const base64 = comma === -1 ? dataUrl : dataUrl.slice(comma + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

/**
 * Encodes at each quality in turn and returns the first result within budget.
 * `encode` is injected so this is testable without a canvas.
 */
export function encodeWithinBudget(
  encode: (quality: number) => string,
  maxBytes = PHOTO_MAX_BYTES,
  qualities: readonly number[] = PHOTO_QUALITIES,
): PhotoResult {
  for (const quality of qualities) {
    const dataUrl = encode(quality)
    if (dataUrlBytes(dataUrl) <= maxBytes) return { ok: true, dataUrl }
  }
  return { ok: false, message: PHOTO_MESSAGES.tooBig }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode failed'))
    }
    img.src = url
  })
}

/**
 * Validates, downscales and re-encodes a picked file as a JPEG data URL.
 * Resolves rather than rejects, so the caller only has one shape to handle.
 */
export async function prepareCatPhoto(file: File): Promise<PhotoResult> {
  if (!isAcceptedPhotoType(file.type)) return { ok: false, message: PHOTO_MESSAGES.wrongType }

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return { ok: false, message: PHOTO_MESSAGES.unreadable }
  }

  // naturalWidth/Height already reflect the EXIF orientation in current
  // browsers, and drawing the image applies it too. That has to happen here:
  // once the EXIF block is gone, a sideways phone photo would stay sideways.
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight)
  if (!width || !height) return { ok: false, message: PHOTO_MESSAGES.unreadable }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return { ok: false, message: PHOTO_MESSAGES.unreadable }

  // JPEG has no alpha. Without a fill, transparent areas of a PNG or WebP
  // come out black.
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  return encodeWithinBudget(quality => canvas.toDataURL('image/jpeg', quality))
}
