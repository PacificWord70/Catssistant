import { describe, it, expect } from 'vitest'
import { tonesFor } from '@/lib/avatar/palette'

/**
 * These guard the rule that markings have to stay visible against the coat.
 * Getting it wrong is silent — the layer still draws, it just cannot be seen —
 * so it is worth pinning the exact colours rather than trusting a glance.
 */

describe('tonesFor - tonal patterns', () => {
  it('uses a darker tone of the coat for tabby', () => {
    expect(tonesFor('Gray', 'Tabby').marking).toBe('#6F757B')
  })

  it('uses a darker tone for colorpoint', () => {
    expect(tonesFor('Cream', 'Colorpoint').marking).toBe('#D0B892')
  })

  it('uses the shade tone when the coat is solid', () => {
    expect(tonesFor('Black', 'Solid').marking).toBe('#26262A')
  })

  it('falls back to the shade tone when no pattern is set', () => {
    expect(tonesFor('Orange', undefined).marking).toBe(tonesFor('Orange', undefined).shade)
  })
})

describe('tonesFor - two-colour patterns', () => {
  it('gives a black tuxedo a white bib', () => {
    // Regression: this was tinted with the shade tone, so the bib came out
    // near-black on a black cat and vanished.
    expect(tonesFor('Black', 'Tuxedo').marking).toBe('#F4F1EC')
  })

  it('gives a black tortoiseshell orange patches', () => {
    expect(tonesFor('Black', 'Tortoiseshell').marking).toBe('#E08A45')
  })

  it('gives a grey calico orange patches', () => {
    // Grey and orange sit at almost the same brightness but read as obviously
    // different, so the orange must survive the contrast check.
    expect(tonesFor('Gray', 'Calico').marking).toBe('#E08A45')
  })
})

describe('tonesFor - contrast fallback', () => {
  it('does not paint orange markings on an orange cat', () => {
    expect(tonesFor('Orange', 'Tortoiseshell').marking).not.toBe(tonesFor('Orange', 'Tortoiseshell').base)
    expect(tonesFor('Orange', 'Tortoiseshell').marking).toBe('#3A3A3E')
  })

  it('does not paint a white bib on a white cat', () => {
    expect(tonesFor('White', 'Tuxedo').marking).toBe('#3A3A3E')
  })

  it('rejects a partner that is merely too close, not just identical', () => {
    // A cream tuxedo's white bib is a different colour and still invisible.
    expect(tonesFor('Cream', 'Tuxedo').marking).toBe('#3A3A3E')
  })

  it('rejects a near-match on a silver coat too', () => {
    expect(tonesFor('Silver', 'Tuxedo').marking).toBe('#3A3A3E')
  })
})

describe('tonesFor - fallbacks', () => {
  it('shows skin rather than coat colour for a hairless cat', () => {
    expect(tonesFor('Black', 'Solid', 'Hairless').base).toBe('#E5BCA8')
  })

  it('uses a neutral tan when no colour is recorded', () => {
    expect(tonesFor(undefined, 'Tabby').base).toBe('#DEC3A6')
  })

  it('keeps the shade tone when a two-colour pattern has no coat to pair with', () => {
    const tones = tonesFor(undefined, 'Tuxedo')
    expect(tones.marking).toBe(tones.shade)
  })
})

describe('tonesFor - the added coats', () => {
  it.each([
    ['Silver', '#C7CBD0'],
    ['Chocolate', '#6B4630'],
    ['Lilac', '#B9A8A8'],
  ] as const)('resolves %s', (color, expected) => {
    expect(tonesFor(color, 'Tabby').base).toBe(expected)
  })
})
