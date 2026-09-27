/**
 * Pixel work on Heidi's cat tree drawing, done in the browser at load time so
 * the repo only ever holds her one file. Nothing here moves a line: the outline
 * colour changes, and regions are *selected* from the drawing as it is, never
 * re-traced.
 *
 * Everything operates on raw RGBA buffers so it can be tested without a canvas.
 */

export interface Rgba {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Lifts the black linework to `colour` by taking the per-channel maximum.
 *
 * Every fill in the drawing is lighter than the outline colour on all three
 * channels, so fills come through untouched and only the line moves. The
 * anti-aliased edge between line and fill is a mix of the two, so the max lands
 * between them too and the edge stays smooth without having to find it.
 */
export function recolourLines(img: Rgba, colour: [number, number, number]): void {
  const { data } = img
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    data[i] = Math.max(data[i], colour[0])
    data[i + 1] = Math.max(data[i + 1], colour[1])
    data[i + 2] = Math.max(data[i + 2], colour[2])
  }
}

/**
 * Selects the connected fill under each seed: pixels within `tolerance` of the
 * seed's own colour, flooding outward until the linework stops it. Returns one
 * byte per pixel, 1 for selected.
 */
export function floodMask(img: Rgba, seeds: [number, number][], tolerance = 24): Uint8Array {
  const { data, width, height } = img
  const mask = new Uint8Array(width * height)
  for (const [sx, sy] of seeds) {
    const s = (sy * width + sx) * 4
    const target = [data[s], data[s + 1], data[s + 2]]
    if (data[s + 3] === 0) continue
    const stack = [sy * width + sx]
    while (stack.length) {
      const p = stack.pop()!
      if (mask[p]) continue
      const i = p * 4
      if (
        data[i + 3] < 200 ||
        Math.abs(data[i] - target[0]) > tolerance ||
        Math.abs(data[i + 1] - target[1]) > tolerance ||
        Math.abs(data[i + 2] - target[2]) > tolerance
      ) {
        continue
      }
      mask[p] = 1
      const x = p % width
      if (x > 0) stack.push(p - 1)
      if (x < width - 1) stack.push(p + 1)
      if (p >= width) stack.push(p - width)
      if (p < width * (height - 1)) stack.push(p + width)
    }
  }
  return mask
}

/** Selects the linework inside a rectangle — for a perch that is only a line. */
export function lineMask(img: Rgba, rect: Rect, threshold = 160): Uint8Array {
  const { data, width } = img
  const mask = new Uint8Array(width * img.height)
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] > 40 && data[i] + data[i + 1] + data[i + 2] < threshold * 3) {
        mask[y * width + x] = 1
      }
    }
  }
  return mask
}

/**
 * Grows a mask by `radius` pixels, so a fill selection also covers the
 * anti-aliased pixels where it meets the outline instead of leaving a ring.
 */
export function dilate(mask: Uint8Array, width: number, radius = 1): Uint8Array {
  const height = mask.length / width
  const out = new Uint8Array(mask.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) out[ny * width + nx] = 1
        }
      }
    }
  }
  return out
}

/** Copies the masked pixels into a new, otherwise transparent, buffer. */
export function extractMasked(img: Rgba, mask: Uint8Array): Rgba {
  const data = new Uint8ClampedArray(img.data.length)
  for (let p = 0; p < mask.length; p++) {
    if (!mask[p]) continue
    const i = p * 4
    data[i] = img.data[i]
    data[i + 1] = img.data[i + 1]
    data[i + 2] = img.data[i + 2]
    data[i + 3] = img.data[i + 3]
  }
  return { data, width: img.width, height: img.height }
}

/** Copies a rectangle out into its own buffer. */
export function cropRect(img: Rgba, rect: Rect): Rgba {
  const data = new Uint8ClampedArray(rect.w * rect.h * 4)
  for (let y = 0; y < rect.h; y++) {
    const from = ((rect.y + y) * img.width + rect.x) * 4
    data.set(img.data.subarray(from, from + rect.w * 4), y * rect.w * 4)
  }
  return { data, width: rect.w, height: rect.h }
}

/** Makes a rectangle fully transparent — the hole a lifted-out sprite leaves. */
export function clearRect(img: Rgba, rect: Rect): void {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    const from = (y * img.width + rect.x) * 4
    img.data.fill(0, from, from + rect.w * 4)
  }
}
