import { describe, it, expect } from 'vitest'
import { catPictureSrc, isDrawnPicture, standInPictureFor, standInTreeCat } from '@/lib/catPicture'
import { toDateKey } from '@/lib/dateKeys'

/**
 * The stand-in is chosen by what reads first: a kitten is small before it is
 * any colour, a tuxedo is a white front before it is black, and after that
 * only the base colour counts. Breed and coat length do not change the pick.
 */

function yearsAgo(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return toDateKey(d)
}

function monthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return toDateKey(d)
}

const adult = { birthday: yearsAgo(4), breed: [] as string[] }

describe('standInTreeCat', () => {
  it('gives every kitten Pickle, whatever its colour', () => {
    expect(standInTreeCat({ birthday: monthsAgo(3), breed: [], color: 'Black' })).toBe('pickle')
    expect(
      standInTreeCat({ birthday: monthsAgo(3), breed: [], color: 'Gray', pattern: 'Tuxedo' }),
    ).toBe('pickle')
  })

  it('gives every tuxedo Miso, whatever its base colour', () => {
    expect(standInTreeCat({ ...adult, color: 'Black', pattern: 'Tuxedo' })).toBe('miso')
    expect(standInTreeCat({ ...adult, color: 'Gray', pattern: 'Tuxedo' })).toBe('miso')
    expect(standInTreeCat({ ...adult, color: undefined, pattern: 'Tuxedo' })).toBe('miso')
  })

  it('picks by base colour after that', () => {
    expect(standInTreeCat({ ...adult, color: 'Orange' })).toBe('biscuit')
    expect(standInTreeCat({ ...adult, color: 'Brown' })).toBe('biscuit')
    expect(standInTreeCat({ ...adult, color: 'Black' })).toBe('noodle')
    expect(standInTreeCat({ ...adult, color: 'Chocolate' })).toBe('noodle')
    expect(standInTreeCat({ ...adult, color: 'Gray' })).toBe('pepper')
    expect(standInTreeCat({ ...adult, color: 'Silver' })).toBe('pepper')
    expect(standInTreeCat({ ...adult, color: 'Lilac' })).toBe('pepper')
    expect(standInTreeCat({ ...adult, color: 'White' })).toBe('mochi')
    expect(standInTreeCat({ ...adult, color: 'Cream' })).toBe('mochi')
  })

  it('ignores the pattern unless it is tuxedo', () => {
    expect(standInTreeCat({ ...adult, color: 'Black', pattern: 'Tabby' })).toBe('noodle')
    expect(standInTreeCat({ ...adult, color: 'Orange', pattern: 'Calico' })).toBe('biscuit')
    expect(standInTreeCat({ ...adult, color: 'Gray', pattern: 'Colorpoint' })).toBe('pepper')
  })

  it('falls back to Mochi for a cat nothing describes', () => {
    expect(
      standInTreeCat({ birthday: undefined, breed: [], color: undefined, pattern: undefined }),
    ).toBe('mochi')
    expect(standInTreeCat({ ...adult, color: undefined, pattern: 'Tortoiseshell' })).toBe('mochi')
  })

  it('lets the breed fill in a missing colour or pattern', () => {
    expect(standInTreeCat({ ...adult, breed: ['Russian Blue'], color: undefined })).toBe('pepper')
    expect(standInTreeCat({ ...adult, breed: ['Bombay'], color: undefined })).toBe('noodle')
  })

  it('does not let a senior or adult become Pickle', () => {
    expect(standInTreeCat({ birthday: yearsAgo(12), breed: [], color: 'White' })).toBe('mochi')
  })
})

describe('standInPictureFor', () => {
  it('returns the drawing path', () => {
    expect(standInPictureFor({ ...adult, color: 'Gray' })).toBe('/images/cats/cat-pepper.png')
  })
})

describe('catPictureSrc', () => {
  it('prefers a usable photo', () => {
    const photo = 'data:image/png;base64,iVBORw0KGgo='
    expect(catPictureSrc({ ...adult, color: 'Gray', photoUrl: photo })).toBe(photo)
  })

  it('treats an unsafe photo as no photo', () => {
    expect(catPictureSrc({ ...adult, color: 'Gray', photoUrl: 'https://evil.example/x.png' })).toBe(
      '/images/cats/cat-pepper.png',
    )
    expect(catPictureSrc({ ...adult, color: 'Gray', photoUrl: undefined })).toBe(
      '/images/cats/cat-pepper.png',
    )
  })
})

describe('isDrawnPicture', () => {
  it('recognises the tree cats and nothing else', () => {
    expect(isDrawnPicture('/images/cats/cat-miso.png')).toBe(true)
    expect(isDrawnPicture('/images/pets/milo.jpg')).toBe(false)
    expect(isDrawnPicture('data:image/png;base64,iVBORw0KGgo=')).toBe(false)
    expect(isDrawnPicture(undefined)).toBe(false)
  })
})
