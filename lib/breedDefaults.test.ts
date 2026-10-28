import { describe, it, expect } from 'vitest'
import {
  effectiveCoatLength,
  effectiveColor,
  effectiveEnergy,
  effectivePattern,
} from '@/lib/breedDefaults'

/**
 * The rule these all share: what the owner entered wins, and the breed only
 * fills gaps. Nothing here writes back to the cat, so a fallback must never
 * become indistinguishable from an answer.
 */

describe('effectiveEnergy', () => {
  it('keeps what the owner entered', () => {
    expect(effectiveEnergy({ breed: ['Bengal'], energyLevel: 'Low' })).toBe('Low')
  })

  it('falls back to the breed', () => {
    expect(effectiveEnergy({ breed: ['Persian'], energyLevel: undefined })).toBe('Low')
    expect(effectiveEnergy({ breed: ['Bengal'], energyLevel: undefined })).toBe('High')
  })

  it('treats Unknown as unanswered rather than as an answer', () => {
    // Unknown is what the dropdown shows when someone actively does not know,
    // so a breed default is more use than echoing it back.
    expect(effectiveEnergy({ breed: ['Ragdoll'], energyLevel: 'Unknown' })).toBe('Low')
  })

  it('stays Unknown when there is no breed to ask', () => {
    expect(effectiveEnergy({ breed: [], energyLevel: undefined })).toBe('Unknown')
  })

  it('ignores a breed it does not recognise', () => {
    expect(effectiveEnergy({ breed: ['Moggie'], energyLevel: undefined })).toBe('Unknown')
  })

  it('resolves on the first breed listed', () => {
    expect(effectiveEnergy({ breed: ['Persian', 'Bengal'], energyLevel: undefined })).toBe('Low')
  })
})

describe('effectiveCoatLength', () => {
  it('keeps what the owner entered', () => {
    expect(effectiveCoatLength({ breed: ['Persian'], coatLength: 'Short' })).toBe('Short')
  })

  it('falls back to the breed', () => {
    expect(effectiveCoatLength({ breed: ['Persian'], coatLength: undefined })).toBe('Long')
    expect(effectiveCoatLength({ breed: ['Siamese'], coatLength: undefined })).toBe('Short')
  })

  it('maps a hairless breed onto Hairless', () => {
    expect(effectiveCoatLength({ breed: ['Sphynx'], coatLength: undefined })).toBe('Hairless')
  })

  it('treats Unknown as unanswered', () => {
    expect(effectiveCoatLength({ breed: ['Maine Coon'], coatLength: 'Unknown' })).toBe('Long')
  })

  it('returns undefined with no breed and nothing entered', () => {
    expect(effectiveCoatLength({ breed: [], coatLength: undefined })).toBeUndefined()
  })
})

describe('effectivePattern', () => {
  it('keeps what the owner entered', () => {
    expect(effectivePattern({ breed: ['Siamese'], pattern: 'Tabby' })).toBe('Tabby')
  })

  it('fills in a breed defined by its markings', () => {
    expect(effectivePattern({ breed: ['Siamese'], pattern: undefined })).toBe('Colorpoint')
    expect(effectivePattern({ breed: ['Bombay'], pattern: undefined })).toBe('Solid')
  })

  it('maps a spotted breed onto Tabby', () => {
    // CoatPattern has no Spotted of its own yet, and spotted is a tabby marking.
    expect(effectivePattern({ breed: ['Bengal'], pattern: undefined })).toBe('Tabby')
  })

  it('calls a ticked breed Solid', () => {
    // Banding each hair produces no marking shape to draw.
    expect(effectivePattern({ breed: ['Abyssinian'], pattern: undefined })).toBe('Solid')
  })

  it('guesses nothing for a breed whose pattern varies', () => {
    // A Maine Coon can be anything, so a guess would be worse than a blank.
    expect(effectivePattern({ breed: ['Maine Coon'], pattern: undefined })).toBeUndefined()
    expect(effectivePattern({ breed: ['Persian'], pattern: undefined })).toBeUndefined()
  })
})

describe('effectiveColor', () => {
  it('keeps what the owner entered', () => {
    expect(effectiveColor({ breed: ['Bombay'], color: 'White' })).toBe('White')
  })

  it('fills in only breeds their colour defines', () => {
    expect(effectiveColor({ breed: ['Bombay'], color: undefined })).toBe('Black')
    expect(effectiveColor({ breed: ['Russian Blue'], color: undefined })).toBe('Gray')
    expect(effectiveColor({ breed: ['Chartreux'], color: undefined })).toBe('Gray')
  })

  it('says nothing for a breed that comes in any colour', () => {
    // Text callers need to be able to stay silent rather than invent a colour.
    expect(effectiveColor({ breed: ['Persian'], color: undefined })).toBeUndefined()
    expect(effectiveColor({ breed: ['Maine Coon'], color: undefined })).toBeUndefined()
  })

  it('says nothing with no breed at all', () => {
    expect(effectiveColor({ breed: [], color: undefined })).toBeUndefined()
  })
})
