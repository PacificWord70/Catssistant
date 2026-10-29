import { describe, it, expect } from 'vitest'
import { catPictureSrc } from '@/lib/catPicture'

describe('catPictureSrc', () => {
  it('returns a usable photo', () => {
    const photo = 'data:image/png;base64,iVBORw0KGgo='
    expect(catPictureSrc({ photoUrl: photo })).toBe(photo)
    expect(catPictureSrc({ photoUrl: '/images/pets/milo.jpg' })).toBe('/images/pets/milo.jpg')
  })

  it('treats an unsafe or missing photo as no photo', () => {
    expect(catPictureSrc({ photoUrl: 'https://evil.example/x.png' })).toBeUndefined()
    expect(catPictureSrc({ photoUrl: undefined })).toBeUndefined()
  })
})
