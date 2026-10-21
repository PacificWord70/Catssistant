import { describe, expect, it } from 'vitest'
import {
  PHOTO_MAX_BYTES,
  PHOTO_MESSAGES,
  dataUrlBytes,
  encodeWithinBudget,
  fitWithin,
  isAcceptedPhotoType,
} from '@/lib/photo'

/** A data URL whose decoded payload is exactly `bytes` long. */
function fakeJpeg(bytes: number): string {
  return `data:image/jpeg;base64,${Buffer.alloc(bytes).toString('base64')}`
}

describe('isAcceptedPhotoType', () => {
  it('accepts JPEG, PNG and WebP', () => {
    expect(isAcceptedPhotoType('image/jpeg')).toBe(true)
    expect(isAcceptedPhotoType('image/png')).toBe(true)
    expect(isAcceptedPhotoType('image/webp')).toBe(true)
  })

  it('rejects other images, other files and an unknown type', () => {
    expect(isAcceptedPhotoType('image/gif')).toBe(false)
    expect(isAcceptedPhotoType('image/heic')).toBe(false)
    expect(isAcceptedPhotoType('image/svg+xml')).toBe(false)
    expect(isAcceptedPhotoType('application/pdf')).toBe(false)
    expect(isAcceptedPhotoType('')).toBe(false)
  })
})

describe('fitWithin', () => {
  it('scales a landscape photo by its width', () => {
    expect(fitWithin(4032, 3024, 512)).toEqual({ width: 512, height: 384 })
  })

  it('scales a portrait photo by its height', () => {
    expect(fitWithin(3024, 4032, 512)).toEqual({ width: 384, height: 512 })
  })

  it('leaves a photo already small enough alone rather than enlarging it', () => {
    expect(fitWithin(300, 200, 512)).toEqual({ width: 300, height: 200 })
    expect(fitWithin(512, 512, 512)).toEqual({ width: 512, height: 512 })
  })

  it('never rounds a very thin image down to zero', () => {
    expect(fitWithin(10000, 2, 512).height).toBe(1)
  })
})

describe('dataUrlBytes', () => {
  it('measures the decoded payload, allowing for padding', () => {
    expect(dataUrlBytes(fakeJpeg(0))).toBe(0)
    expect(dataUrlBytes(fakeJpeg(1))).toBe(1)
    expect(dataUrlBytes(fakeJpeg(2))).toBe(2)
    expect(dataUrlBytes(fakeJpeg(3))).toBe(3)
    expect(dataUrlBytes(fakeJpeg(1000))).toBe(1000)
  })
})

describe('encodeWithinBudget', () => {
  it('keeps the first encoding when it fits', () => {
    const tried: number[] = []
    const result = encodeWithinBudget(q => {
      tried.push(q)
      return fakeJpeg(1000)
    }, 2000)
    expect(result.ok).toBe(true)
    expect(tried).toEqual([0.82])
  })

  it('lowers quality once when the first try is too big', () => {
    const tried: number[] = []
    const result = encodeWithinBudget(q => {
      tried.push(q)
      return fakeJpeg(q > 0.7 ? 3000 : 1500)
    }, 2000)
    expect(result).toEqual({ ok: true, dataUrl: fakeJpeg(1500) })
    expect(tried).toEqual([0.82, 0.6])
  })

  it('gives up with a friendly message rather than going lower still', () => {
    const tried: number[] = []
    const result = encodeWithinBudget(q => {
      tried.push(q)
      return fakeJpeg(5000)
    }, 2000)
    expect(result).toEqual({ ok: false, message: PHOTO_MESSAGES.tooBig })
    expect(tried).toHaveLength(2)
  })

  it('defaults to a budget of about 350KB', () => {
    expect(encodeWithinBudget(() => fakeJpeg(PHOTO_MAX_BYTES)).ok).toBe(true)
    expect(encodeWithinBudget(() => fakeJpeg(PHOTO_MAX_BYTES + 1)).ok).toBe(false)
  })
})
