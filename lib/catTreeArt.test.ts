import { describe, it, expect } from 'vitest'
import {
  clearRect,
  cropRect,
  floodMask,
  lineMask,
  recolourLines,
  type Rgba,
} from '@/lib/catTreeArt'

const BLACK = [0, 0, 0, 255]
const CREAM = [243, 226, 208, 255]
const CLEAR = [0, 0, 0, 0]

/** Builds an image from rows of pixels. */
function image(rows: number[][][]): Rgba {
  return {
    data: new Uint8ClampedArray(rows.flat(2)),
    width: rows[0].length,
    height: rows.length,
  }
}

const px = (img: Rgba, x: number, y: number) =>
  Array.from(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4))

describe('recolourLines', () => {
  it('moves the line and leaves the fill alone', () => {
    const img = image([[BLACK, CREAM]])
    recolourLines(img, [74, 53, 39])
    expect(px(img, 0, 0)).toEqual([74, 53, 39, 255])
    expect(px(img, 1, 0)).toEqual(CREAM)
  })

  it('keeps an anti-aliased edge between the two', () => {
    const img = image([[[120, 113, 104, 255]]]) // half black, half cream
    recolourLines(img, [74, 53, 39])
    expect(px(img, 0, 0)).toEqual([120, 113, 104, 255])
  })

  it('leaves transparent pixels transparent', () => {
    const img = image([[CLEAR]])
    recolourLines(img, [74, 53, 39])
    expect(px(img, 0, 0)).toEqual(CLEAR)
  })
})

describe('floodMask', () => {
  it('stops at the linework', () => {
    // Two cream cells either side of a line: seeding one must not reach the other.
    const img = image([[CREAM, BLACK, CREAM]])
    expect(Array.from(floodMask(img, [[0, 0]]))).toEqual([1, 0, 0])
  })

  it('selects nothing from a transparent seed', () => {
    const img = image([[CLEAR, CREAM]])
    expect(Array.from(floodMask(img, [[0, 0]]))).toEqual([0, 0])
  })
})

describe('lineMask', () => {
  it('takes only the dark pixels inside the rectangle', () => {
    const img = image([[BLACK, CREAM, BLACK]])
    expect(Array.from(lineMask(img, { x: 0, y: 0, w: 2, h: 1 }))).toEqual([1, 0, 0])
  })
})

describe('cropRect and clearRect', () => {
  it('lift a sprite out and leave a hole behind', () => {
    const img = image([
      [CREAM, BLACK],
      [CREAM, CREAM],
    ])
    const sprite = cropRect(img, { x: 1, y: 0, w: 1, h: 2 })
    expect(px(sprite, 0, 0)).toEqual(BLACK)
    clearRect(img, { x: 1, y: 0, w: 1, h: 2 })
    expect(px(img, 1, 0)).toEqual(CLEAR)
    expect(px(img, 0, 0)).toEqual(CREAM)
  })
})
