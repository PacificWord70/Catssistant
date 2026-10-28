import { describe, it, expect } from 'vitest'
import { safeImageSrc, telHref } from '@/lib/safeUrl'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg=='

describe('safeImageSrc', () => {
  it.each([
    PNG,
    'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    'data:image/webp;base64,UklGRg==',
    'data:image/gif;base64,R0lGODlh',
    '/images/pets/milo.jpg',
    '/images/cats/cat-miso.png',
  ])('allows %s', url => {
    expect(safeImageSrc(url)).toBe(url)
  })

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['javascript: upper-case', 'JaVaScRiPt:alert(1)'],
    ['data:text/html', 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    ['data:image/svg+xml', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
    ['non-base64 data:image', 'data:image/png,<svg onload=alert(1)>'],
    ['junk after the payload', `${PNG}"onerror="alert(1)`],
    ['protocol-relative', '//evil.example/cat.png'],
    ['backslash protocol-relative', '/\\evil.example/cat.png'],
    ['plain http', 'http://example.com/cat.jpg'],
    ['blob:', 'blob:https://example.com/1234'],
    ['relative path', 'cat.png'],
    ['leading space before javascript:', ' javascript:alert(1)'],
    ['tab inside the scheme', 'java\tscript:alert(1)'],
    ['newline inside the scheme', 'java\nscript:alert(1)'],
    ['leading space before a path', ' /images/cat.png'],
    ['newline before protocol-relative', '/\n/evil.example'],
    ['NUL byte', '/images/cat.png\u0000'],
    ['https with no host', 'https://'],
    ['remote https, blocked by the CSP', 'https://example.com/cat.jpg'],
    ['empty string', ''],
  ])('rejects %s', (_label, url) => {
    expect(safeImageSrc(url)).toBeUndefined()
  })

  it('rejects non-strings', () => {
    expect(safeImageSrc(undefined)).toBeUndefined()
    expect(safeImageSrc(null)).toBeUndefined()
    expect(safeImageSrc(42)).toBeUndefined()
    expect(safeImageSrc({ toString: () => '/images/cat.png' })).toBeUndefined()
  })
})

describe('telHref', () => {
  it('keeps digits and a leading plus', () => {
    expect(telHref('+1 (555) 123-4567')).toBe('tel:+15551234567')
    expect(telHref('  +44 20 7946 0958 ')).toBe('tel:+442079460958')
    expect(telHref('555.123.4567')).toBe('tel:5551234567')
  })

  it('drops a plus that is not leading', () => {
    expect(telHref('555+1234')).toBe('tel:5551234')
  })

  it('strips anything that could change what the link points at', () => {
    expect(telHref('555"onclick="alert(1)')).toBe('tel:5551')
    expect(telHref('javascript:alert(1)')).toBe('tel:1')
    expect(telHref('123?x=1#frag')).toBe('tel:1231')
  })

  it('returns undefined when there are no digits', () => {
    expect(telHref('')).toBeUndefined()
    expect(telHref('   ')).toBeUndefined()
    expect(telHref('+')).toBeUndefined()
    expect(telHref('call reception')).toBeUndefined()
    expect(telHref(undefined)).toBeUndefined()
  })
})
