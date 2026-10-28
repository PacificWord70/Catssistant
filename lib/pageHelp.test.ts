import { describe, it, expect } from 'vitest'
import { HelpPage, PAGE_HELP, helpPageForPath } from '@/lib/pageHelp'

const PAGES: HelpPage[] = ['cats', 'schedule', 'health', 'items', 'backup']

describe('page help', () => {
  it('has a title, an intro and three to five notes for every page', () => {
    for (const page of PAGES) {
      const help = PAGE_HELP[page]
      expect(help.title.trim()).not.toBe('')
      expect(help.intro.trim()).not.toBe('')
      expect(help.notes.length).toBeGreaterThanOrEqual(3)
      expect(help.notes.length).toBeLessThanOrEqual(5)
      for (const note of help.notes) {
        expect(note.emoji.trim()).not.toBe('')
        expect(note.text.trim()).not.toBe('')
      }
    }
  })

  it('makes no claims about where data lives', () => {
    const copy = JSON.stringify(PAGE_HELP).toLowerCase()
    for (const phrase of ['on your device', 'on this device', 'never leaves', 'no tracking']) {
      expect(copy).not.toContain(phrase)
    }
  })

  it('maps each page route, and its sub-routes, to its notes', () => {
    expect(helpPageForPath('/cats')).toBe('cats')
    expect(helpPageForPath('/cats/example-biscuit')).toBe('cats')
    expect(helpPageForPath('/cats/example-biscuit/edit')).toBe('cats')
    expect(helpPageForPath('/schedule')).toBe('schedule')
    expect(helpPageForPath('/health')).toBe('health')
    expect(helpPageForPath('/items')).toBe('items')
    expect(helpPageForPath('/backup')).toBe('backup')
    expect(helpPageForPath('/')).toBeNull()
    expect(helpPageForPath('/about')).toBeNull()
  })
})
