import { describe, it, expect } from 'vitest'
import {
  COAT_TONES,
  EAR_PINK,
  PARTS,
  POSE_BY_ENERGY,
  POSES,
  portraitColours,
  portraitKey,
  portraitPlan,
  poseFor,
} from '@/lib/portrait'
import { PORTRAIT_REGIONS } from '@/lib/portraitRegions'
import { toDateKey } from '@/lib/dateKeys'
import { CoatColor, CoatPattern } from '@/types/cat'

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

const COLORS: CoatColor[] = [
  'Black',
  'White',
  'Gray',
  'Orange',
  'Brown',
  'Cream',
  'Silver',
  'Chocolate',
  'Lilac',
]
const PATTERNS: CoatPattern[] = [
  'Solid',
  'Tabby',
  'Calico',
  'Tortoiseshell',
  'Tuxedo',
  'Colorpoint',
]

describe('poseFor', () => {
  it('a kitten is the kitten pose whatever its energy', () => {
    expect(poseFor({ birthday: monthsAgo(3), breed: [], energyLevel: 'Low' })).toBe('kitten')
    expect(poseFor({ birthday: monthsAgo(3), breed: ['Bengal'] })).toBe('kitten')
  })

  it('adults pose by energy level', () => {
    expect(poseFor({ ...adult, energyLevel: 'Low' })).toBe('lying')
    expect(poseFor({ ...adult, energyLevel: 'Medium' })).toBe('sit-tail-out')
    expect(poseFor({ ...adult, energyLevel: 'High' })).toBe('stretch-curl')
    expect(poseFor({ ...adult, energyLevel: 'Unknown' })).toBe('sit-tail-curl')
    expect(poseFor({ ...adult })).toBe('sit-tail-curl')
  })

  it('a senior poses by energy too', () => {
    expect(poseFor({ birthday: yearsAgo(13), breed: [], energyLevel: 'Low' })).toBe('lying')
  })

  it('no birthday is treated as an adult', () => {
    expect(poseFor({ breed: [], energyLevel: 'Medium' })).toBe('sit-tail-out')
  })

  it('energy falls back to the breed', () => {
    expect(poseFor({ ...adult, breed: ['Bengal'] })).toBe(POSE_BY_ENERGY.High)
    expect(poseFor({ ...adult, breed: ['Persian'] })).toBe(POSE_BY_ENERGY.Low)
  })

  it('every energy level maps to a real pose', () => {
    for (const pose of Object.values(POSE_BY_ENERGY)) expect(POSES).toContain(pose)
  })
})

describe('portraitColours', () => {
  it('a solid cat is the base tone all over, with pink ears', () => {
    const c = portraitColours('Gray', 'Solid')
    for (const part of PARTS) {
      expect(c[part]).toBe(part === 'earInner' ? EAR_PINK : COAT_TONES.Gray.base)
    }
  })

  it('a tabby has pale underparts and dark tips', () => {
    const c = portraitColours('Orange', 'Tabby')
    expect(c.body).toBe(COAT_TONES.Orange.base)
    expect(c.bib).toBe(COAT_TONES.Orange.light)
    expect(c.belly).toBe(COAT_TONES.Orange.light)
    expect(c.paw).toBe(COAT_TONES.Orange.light)
    expect(c.tailTip).toBe(COAT_TONES.Orange.shade)
    expect(c.earTipLeft).toBe(COAT_TONES.Orange.shade)
    expect(c.earTipRight).toBe(COAT_TONES.Orange.shade)
  })

  it('a tuxedo has a white front over the coat colour', () => {
    const c = portraitColours('Black', 'Tuxedo')
    expect(c.body).toBe(COAT_TONES.Black.base)
    expect(c.head).toBe(COAT_TONES.Black.base)
    expect(c.bib).toBe(COAT_TONES.White.base)
    expect(c.belly).toBe(COAT_TONES.White.base)
    expect(c.paw).toBe(COAT_TONES.White.base)
  })

  it('a colorpoint is pale with the shade on its extremities', () => {
    const c = portraitColours('Brown', 'Colorpoint')
    expect(c.body).toBe(COAT_TONES.Brown.light)
    expect(c.head).toBe(COAT_TONES.Brown.light)
    expect(c.tail).toBe(COAT_TONES.Brown.light)
    expect(c.leg).toBe(COAT_TONES.Brown.shade)
    expect(c.paw).toBe(COAT_TONES.Brown.shade)
    expect(c.tailTip).toBe(COAT_TONES.Brown.shade)
    expect(c.earTipLeft).toBe(COAT_TONES.Brown.shade)
  })

  it('a white colorpoint still has points that differ from its body', () => {
    const c = portraitColours('White', 'Colorpoint')
    expect(c.earTipLeft).not.toBe(c.body)
  })

  it('a calico is white, orange and black whatever the coat colour', () => {
    const c = portraitColours('Gray', 'Calico')
    expect(c.body).toBe(COAT_TONES.White.base)
    expect(c.bib).toBe(COAT_TONES.White.base)
    expect(c.earTipLeft).toBe(COAT_TONES.Orange.base)
    expect(c.haunch).toBe(COAT_TONES.Orange.base)
    expect(c.tailTip).toBe(COAT_TONES.Orange.base)
    expect(c.earTipRight).toBe(COAT_TONES.Black.base)
    expect(c.tail).toBe(COAT_TONES.Black.base)
    expect(Object.values(c)).not.toContain(COAT_TONES.Gray.base)
  })

  it('a tortoiseshell is the coat colour with orange patches', () => {
    const c = portraitColours('Black', 'Tortoiseshell')
    expect(c.body).toBe(COAT_TONES.Black.base)
    expect(c.earTipLeft).toBe(COAT_TONES.Orange.base)
    expect(c.tailTip).toBe(COAT_TONES.Orange.base)
    expect(c.belly).toBe(COAT_TONES.Orange.base)
    expect(c.haunch).toBe(COAT_TONES.Orange.base)
    expect(c.earTipRight).toBe(COAT_TONES.Black.base)
  })

  it('every colour and pattern gives every part a hex colour and pink ears', () => {
    for (const color of COLORS) {
      for (const pattern of PATTERNS) {
        const c = portraitColours(color, pattern)
        for (const part of PARTS) expect(c[part]).toMatch(/^#[0-9a-f]{6}$/)
        expect(c.earInner).toBe(EAR_PINK)
      }
    }
  })
})

describe('portraitPlan', () => {
  it('uses the owner’s colour and pattern', () => {
    const plan = portraitPlan({
      ...adult,
      color: 'Black',
      pattern: 'Tuxedo',
      energyLevel: 'Medium',
    })
    expect(plan.pose).toBe('sit-tail-out')
    expect(plan.showInner).toBe(true)
    expect(plan.colours.bib).toBe(COAT_TONES.White.base)
  })

  it('a solid cat is drawn with the clean outline only', () => {
    expect(portraitPlan({ ...adult, color: 'Gray', pattern: 'Solid' }).showInner).toBe(false)
  })

  it('falls back to the breed, then to cream and solid', () => {
    const blue = portraitPlan({ ...adult, breed: ['Russian Blue'] })
    expect(blue.colours.body).toBe(COAT_TONES.Gray.base)
    expect(blue.showInner).toBe(false)

    const unknown = portraitPlan({ ...adult })
    expect(unknown.colours.body).toBe(COAT_TONES.Cream.base)
    expect(unknown.showInner).toBe(false)
    expect(unknown.pose).toBe('sit-tail-curl')
  })
})

describe('portraitKey', () => {
  it('is the same for the same appearance and differs otherwise', () => {
    const a = portraitKey(
      portraitPlan({ ...adult, color: 'Gray', pattern: 'Tabby', energyLevel: 'Medium' }),
    )
    const b = portraitKey(
      portraitPlan({
        ...adult,
        color: 'Gray',
        pattern: 'Tabby',
        breed: ['Maine Coon'],
        energyLevel: 'Medium',
      }),
    )
    const c = portraitKey(portraitPlan({ ...adult, color: 'Gray', pattern: 'Solid' }))
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('portrait regions', () => {
  it('names a part for every pose, and only parts the colour rules know', () => {
    for (const pose of POSES) {
      const regions = PORTRAIT_REGIONS[pose]
      expect(Object.keys(regions).length).toBeGreaterThan(0)
      for (const part of Object.values(regions)) expect(PARTS).toContain(part)
    }
  })
})
