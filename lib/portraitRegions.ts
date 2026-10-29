import type { Pose } from '@/lib/portrait'

/**
 * Which numbered region of each portrait pose is which part of the cat.
 *
 * The region maps (public/images/portraits/{pose}-regions.png) number the
 * enclosed areas of Heidi's lined drawing by size, largest first. These names
 * were assigned by looking at a numbered render of each map, not inferred, so
 * if a drawing is re-exported the numbering may change and this has to be
 * checked again against a fresh render.
 *
 * Parts the colour rules care about. Anything unlisted is `base`.
 */
export type Part =
  | 'head'
  | 'body'
  | 'leg'
  | 'haunch'
  | 'bib'
  | 'belly'
  | 'paw'
  | 'tail'
  | 'tailTip'
  | 'earTipLeft'
  | 'earTipRight'
  | 'earInner'

export const PORTRAIT_REGIONS: Record<Pose, Record<number, Part>> = {
  'sit-tail-out': {
    1: 'head', 2: 'leg', 3: 'leg', 4: 'bib', 5: 'tailTip', 6: 'tail',
    7: 'earInner', 8: 'earInner', 9: 'haunch', 10: 'earTipLeft', 11: 'haunch',
    12: 'earTipRight', 13: 'paw', 14: 'paw', 15: 'paw', 16: 'paw',
  },
  'sit-tail-curl': {
    1: 'head', 2: 'leg', 3: 'leg', 4: 'bib', 5: 'tail', 6: 'tailTip',
    7: 'earInner', 8: 'earInner', 9: 'haunch', 10: 'haunch', 11: 'earTipLeft',
    12: 'earTipRight', 13: 'paw', 14: 'paw', 15: 'paw', 16: 'paw',
  },
  'stretch-up': {
    1: 'body', 2: 'head', 3: 'tail', 4: 'tailTip', 5: 'leg', 6: 'paw',
    7: 'earInner', 8: 'leg', 9: 'paw', 10: 'leg', 11: 'earInner', 12: 'paw',
    13: 'paw', 14: 'earTipLeft', 15: 'earTipRight',
  },
  lying: {
    1: 'head', 2: 'body', 3: 'paw', 4: 'bib', 5: 'tailTip', 6: 'tail',
    7: 'earInner', 8: 'earInner', 9: 'earTipRight', 10: 'earTipLeft',
  },
  'stretch-curl': {
    1: 'body', 2: 'head', 3: 'tailTip', 4: 'tail', 5: 'leg', 6: 'earInner',
    7: 'paw', 8: 'leg', 9: 'earInner', 10: 'leg', 11: 'paw', 12: 'belly',
    13: 'paw', 14: 'earTipLeft', 15: 'earTipRight', 16: 'paw',
  },
  kitten: {
    1: 'head', 2: 'leg', 3: 'leg', 4: 'bib', 5: 'tailTip', 6: 'earInner',
    7: 'tail', 8: 'earInner', 9: 'earTipLeft', 10: 'paw', 11: 'paw',
  },
}
