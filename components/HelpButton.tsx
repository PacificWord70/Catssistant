'use client'

import { useId, useState } from 'react'
import Dialog from '@/components/Dialog'
import { HelpPage, PAGE_HELP } from '@/lib/pageHelp'
import { startExamplePreview } from '@/store/catsSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectIsExample } from '@/store/selectors'

interface DialogProps {
  page: HelpPage
  onClose: () => void
}

/**
 * The notes for one page, and the offer to see that page filled in with the
 * example household. Its own component rather than part of HelpButton so the
 * example banner can reopen the same notes from its "Show notes" without
 * owning a help button of its own.
 *
 * The offer is left out while the example is already showing — on a first
 * visit or mid-preview — since there would be nothing to switch to.
 */
export function HelpDialog({ page, onClose }: DialogProps) {
  const dispatch = useAppDispatch()
  const isExample = useAppSelector(selectIsExample)
  const headingId = useId()
  const help = PAGE_HELP[page]

  function tryExample() {
    dispatch(startExamplePreview())
    onClose()
  }

  return (
    <Dialog labelledBy={headingId} onClose={onClose}>
      <h2 id={headingId} className="font-display text-2xl text-brand-brown mb-2">
        How {help.title} works
      </h2>
      <p className="text-sm text-brand-brown/70 mb-4">{help.intro}</p>
      <ul className="space-y-3 mb-6">
        {help.notes.map(note => (
          <li key={note.text} className="flex gap-3 text-sm text-brand-charcoal">
            <span aria-hidden="true" className="shrink-0 text-lg leading-5">
              {note.emoji}
            </span>
            <span>{note.text}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-2xl border border-brand-tan text-brand-brown bg-white hover:bg-brand-tan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
        >
          Got it
        </button>
        {!isExample && (
          <button
            type="button"
            onClick={tryExample}
            className="px-4 py-2.5 rounded-2xl bg-brand-orange text-white font-medium hover:bg-brand-orange/90 transition-colors shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2"
          >
            Try it with the example household
          </button>
        )}
      </div>
    </Dialog>
  )
}

interface Props {
  page: HelpPage
}

/**
 * A round "?" beside a page's heading, for an owner who has added their cat
 * and is not sure what the page is for. Sized to sit on the heading's line
 * without stretching it, and kept to an icon so it reads as help rather than
 * as another action alongside Add Cat or Add Event.
 */
export default function HelpButton({ page }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="How this page works"
        aria-haspopup="dialog"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-tan/60 bg-white font-display text-base font-semibold text-brand-brown shadow-soft transition-colors hover:bg-brand-tan/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true">?</span>
      </button>
      {open && <HelpDialog page={page} onClose={() => setOpen(false)} />}
    </>
  )
}
