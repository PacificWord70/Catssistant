'use client'

import { KeyboardEvent, ReactNode, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* Safari does not focus a button when it is clicked, so a dialog opened by mouse
   finds focus still on <body> and would have nowhere to hand it back on close.
   Remembering the last control pressed gives it the button that opened it. */
let lastPressed: HTMLElement | null = null
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    e => {
      const target = e.target instanceof Element ? e.target : null
      lastPressed = target?.closest<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') ?? null
    },
    true,
  )
}

/**
 * A question the dialog asks on top of its own content — "discard your
 * changes?", "delete this?". Rendered by Dialog so every form gets the same
 * focus handling for it instead of each growing its own.
 */
export interface ConfirmRequest {
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Paints the confirm button red. For deletes and discards. */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

interface Props {
  /** id of the element that names the dialog, normally its heading. */
  labelledBy: string
  /** Close without asking. Called from the form's own Cancel, and after a confirmed discard. */
  onClose: () => void
  /**
   * Whether anything has been typed. Backdrop clicks and Escape used to throw
   * away a half-filled form without warning; when this is true they ask first.
   */
  dirty?: boolean
  /** An extra question from the form itself, such as a delete confirmation. */
  confirm?: ConfirmRequest | null
  children: ReactNode
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // Skips anything not rendered, such as inputs inside a collapsed section.
    el => el.getClientRects().length > 0,
  )
}

/**
 * Modal shell shared by the event, item and weight forms.
 *
 * Handles what a modal owes keyboard and screen-reader users: it is announced
 * as a dialog, focus moves into it on open and cannot Tab out behind it, Escape
 * closes it, and focus goes back to whatever opened it afterwards. The page
 * behind stops scrolling while it is up, so a wheel over the backdrop does not
 * move content the owner cannot see.
 */
export default function Dialog({ labelledBy, onClose, dirty = false, confirm, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLDivElement>(null)
  const confirmTitleId = useId()
  const confirmBodyId = useId()
  const [askingDiscard, setAskingDiscard] = useState(false)
  // Captured during the first render, before any autoFocus inside the dialog
  // moves focus away from the button that opened it.
  const [opener] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null
    const active = document.activeElement as HTMLElement | null
    return active && active !== document.body ? active : lastPressed
  })
  // Where focus was inside the dialog before a confirm took it, so dismissing
  // the confirm puts the owner back where they were.
  const focusBeforeConfirm = useRef<HTMLElement | null>(null)

  const discardRequest: ConfirmRequest | null = askingDiscard
    ? {
        title: 'Discard your changes?',
        message: 'What you’ve entered in this form hasn’t been saved and will be lost.',
        confirmLabel: 'Discard',
        cancelLabel: 'Keep editing',
        danger: true,
        onConfirm: onClose,
        onCancel: () => setAskingDiscard(false),
      }
    : null
  const active = confirm ?? discardRequest

  useEffect(() => {
    const panel = panelRef.current
    // A form can name its starting field with data-autofocus; otherwise focus
    // starts on the first control rather than staying on the page underneath.
    // Plain autoFocus is not enough: React applies it once, and in development
    // Strict Mode re-runs this effect, whose cleanup has already handed focus
    // back to the opener.
    if (panel) {
      const preferred = panel.querySelector<HTMLElement>('[data-autofocus]')
      if (preferred) preferred.focus()
      else if (!panel.contains(document.activeElement)) (focusableIn(panel)[0] ?? panel).focus()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (opener && opener.isConnected) opener.focus()
    }
  }, [opener])

  const hasConfirm = active !== null
  useEffect(() => {
    if (hasConfirm) {
      const el = document.activeElement
      if (el instanceof HTMLElement && panelRef.current?.contains(el)) focusBeforeConfirm.current = el
      // Lands on the safe choice, so a stray Enter keeps the work.
      confirmRef.current?.querySelector<HTMLElement>('[data-confirm-cancel]')?.focus()
    } else if (focusBeforeConfirm.current?.isConnected) {
      focusBeforeConfirm.current.focus()
      focusBeforeConfirm.current = null
    }
  }, [hasConfirm])

  function requestClose() {
    if (dirty) setAskingDiscard(true)
    else onClose()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      // Escape backs out one level: out of a question first, then the dialog.
      if (active) active.onCancel()
      else requestClose()
      return
    }
    if (e.key !== 'Tab') return
    const root = (active ? confirmRef.current : panelRef.current) ?? panelRef.current
    if (!root) return
    const items = focusableIn(root)
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const current = document.activeElement
    if (e.shiftKey && (current === first || !root.contains(current))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (current === last || !root.contains(current))) {
      e.preventDefault()
      first.focus()
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      // mousedown, not click: a drag that starts on a field and ends on the
      // backdrop (selecting text, say) fires click on the backdrop and would
      // otherwise count as clicking outside.
      onMouseDown={e => {
        if (e.target === e.currentTarget && !active) requestClose()
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full max-w-md"
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          className="bg-white rounded-3xl p-7 shadow-lg max-h-[90vh] overflow-y-auto focus:outline-none"
        >
          {children}
        </div>

        {active && (
          // Sits over the visible part of the panel rather than inside its
          // scroll area, so it is on screen however far the form was scrolled.
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/85 p-6">
            <div
              ref={confirmRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={confirmTitleId}
              aria-describedby={confirmBodyId}
              className="w-full rounded-3xl border border-brand-tan/30 bg-brand-cream p-6 shadow-card"
            >
              <h3 id={confirmTitleId} className="font-display text-xl text-brand-brown mb-2">
                {active.title}
              </h3>
              <div id={confirmBodyId} className="text-sm text-brand-brown/80 mb-5">
                {active.message}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-confirm-cancel
                  onClick={active.onCancel}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan text-brand-brown bg-white hover:bg-brand-tan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
                >
                  {active.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={active.onConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-2xl font-medium text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 ${
                    active.danger
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-brand-orange hover:bg-brand-orange/90'
                  }`}
                >
                  {active.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
