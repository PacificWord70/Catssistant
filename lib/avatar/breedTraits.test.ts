import { describe, it, expect } from 'vitest'
import { BREED_TRAITS, DEFAULT_TRAITS, drawHairFor, traitsForBreed } from '@/lib/avatar/breedTraits'
import { BREEDS } from '@/lib/breeds'

describe('drawHairFor', () => {
  it('collapses the five stored lengths onto the three drawn ones', () => {
    expect(drawHairFor('Hairless', 'Long')).toBe('None')
    expect(drawHairFor('Long', 'Short')).toBe('Long')
    expect(drawHairFor('Medium', 'Long')).toBe('Short')
    expect(drawHairFor('Short', 'Long')).toBe('Short')
  })

  it('defers to the breed when the owner has not said', () => {
    expect(drawHairFor(undefined, 'Long')).toBe('Long')
    expect(drawHairFor('Unknown', 'None')).toBe('None')
  })
})

describe('traitsForBreed', () => {
  it('uses the first breed listed', () => {
    expect(traitsForBreed(['Sphynx', 'Persian'])).toBe(BREED_TRAITS.Sphynx)
  })

  it('falls back to the default for no breed or an unknown one', () => {
    expect(traitsForBreed(undefined)).toBe(DEFAULT_TRAITS)
    expect(traitsForBreed([])).toBe(DEFAULT_TRAITS)
    expect(traitsForBreed(['Moggie'])).toBe(DEFAULT_TRAITS)
  })

  it('only describes breeds that exist in the breed list', () => {
    // A typo in a trait key would silently fall back to the default face.
    const names = new Set(BREEDS.map(b => b.name))
    expect(Object.keys(BREED_TRAITS).filter(k => !names.has(k))).toEqual([])
  })
})
