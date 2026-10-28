/**
 * What each page's help button says (components/HelpButton.tsx).
 *
 * Written for an owner who has added their cat and is not sure what to do
 * next: one sentence on what the page is for, then a handful of things it can
 * do and where to find them. Each note names a control the way the page
 * labels it, so the reader can look up from the dialog and find it. Keep
 * them to what the page actually does; this is not the place for promises.
 *
 * One map rather than a `help` prop on every page, so the copy can be read
 * and edited in one sitting and a test can check no page was left blank.
 */

export type HelpPage = 'cats' | 'schedule' | 'health' | 'items' | 'backup'

export interface HelpNote {
  /** Decoration only; marked aria-hidden where it is rendered. */
  emoji: string
  text: string
}

export interface PageHelp {
  /** The page's name as its heading shows it, for "How {title} works". */
  title: string
  intro: string
  notes: HelpNote[]
}

export const PAGE_HELP: Record<HelpPage, PageHelp> = {
  cats: {
    title: 'My Cats',
    intro: 'Every cat in your home gets a card here, with a full profile behind it.',
    notes: [
      {
        emoji: '🐱',
        text: 'Add Cat, top right, opens the profile form: name, breeds, coat, birthday, weight and your vet.',
      },
      {
        emoji: '🪪',
        text: 'Click a card to open the profile. The edit link at the bottom of it changes anything later.',
      },
      {
        emoji: '🎨',
        text: 'No photo yet? The card draws an avatar from the coat colour and pattern you entered.',
      },
      {
        emoji: '🔍',
        text: 'With four or more cats, a search box appears above the grid to find one by name or breed.',
      },
    ],
  },
  schedule: {
    title: 'Schedule',
    intro: 'Everything that happens for your cats, from breakfast to the vet, on one calendar.',
    notes: [
      {
        emoji: '🗓️',
        text: 'Calendar or List — switch at the top; the list shows the next 30 days and can search and sort.',
      },
      {
        emoji: '➕',
        text: 'Add Event picks a category, which cats it is for, the times, and whether it repeats.',
      },
      {
        emoji: '🍽️',
        text: 'Meals and play sit in the corner of each day so the unusual things stand out.',
      },
      {
        emoji: '🐾',
        text: 'The Cats and Categories chips narrow what is shown, so you can look at one cat’s meds on their own.',
      },
      {
        emoji: '⚖️',
        text: 'Log Weight is here too, for the number you get at the vet. It goes on the Health page.',
      },
    ],
  },
  health: {
    title: 'Health',
    intro: 'Weight over time for each cat, with the events that explain the changes.',
    notes: [
      {
        emoji: '⚖️',
        text: 'Log weight adds a dated reading, and the chart begins with the first one.',
      },
      {
        emoji: '📈',
        text: 'Pick two or more cats to compare them on one chart, with a stat card each.',
      },
      {
        emoji: '🩺',
        text: 'Turn on vet visits, diet changes or medication to see them on the weight line.',
      },
      {
        emoji: '🗓️',
        text: 'Food, play, vet visits and grooming are charted from the schedule; an empty one offers to add the first event.',
      },
      {
        emoji: '⏳',
        text: 'The time range runs from three months to two years, or everything you have recorded.',
      },
    ],
  },
  items: {
    title: 'My Items',
    intro: 'The food, litter, medicine and gear you use, and which cat each one is for.',
    notes: [
      {
        emoji: '🧺',
        text: 'Add Item takes a product name, brand and category, when you started it, and the cats who use it.',
      },
      {
        emoji: '🔎',
        text: 'The menus above the table filter by category or status and sort by category or name.',
      },
      {
        emoji: '⏹️',
        text: 'Mark past when you stop using something. It keeps its end date and shows under the Past filter.',
      },
      {
        emoji: '✏️',
        text: 'Click a row to change an item or add a note about it.',
      },
    ],
  },
  backup: {
    title: 'Back up & restore',
    intro: 'A copy of everything you have entered, as one file you keep.',
    notes: [
      {
        emoji: '💾',
        text: 'Download backup saves your cats, schedule, health readings and items to a single file.',
      },
      {
        emoji: '📂',
        text: 'Restore from a backup adds whatever is missing here; nothing already here is deleted.',
      },
      {
        emoji: '🔀',
        text: 'Where both have the same entry, the one changed most recently is kept, and you see the plan before anything changes.',
      },
      {
        emoji: '🐾',
        text: 'The example household is never part of a backup, previews included.',
      },
    ],
  },
}

/** The page a route belongs to, for the banner's "Show notes" on that route. */
export function helpPageForPath(pathname: string): HelpPage | null {
  if (pathname === '/cats' || pathname.startsWith('/cats/')) return 'cats'
  if (pathname.startsWith('/schedule')) return 'schedule'
  if (pathname.startsWith('/health')) return 'health'
  if (pathname.startsWith('/items')) return 'items'
  if (pathname.startsWith('/backup')) return 'backup'
  return null
}
