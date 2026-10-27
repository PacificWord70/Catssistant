'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectCatById,
  selectCatsLoaded,
  selectEventsForCat,
  selectHealthRecordsForCat,
} from '@/store/selectors'
import { removeCat } from '@/store/catsSlice'
import CatForm from '@/components/CatForm'
import Dialog from '@/components/Dialog'
import { DELETE_FALLBACK_MESSAGE, errorMessage } from '@/lib/formErrors'

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export default function EditCatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const loaded = useAppSelector(selectCatsLoaded)
  // selectCatById is a factory — it builds a selector for this specific id, so it
  // has to be memoised. Calling it inline would create a new selector every
  // render and throw away the memoisation it exists to provide.
  const selectCat = useMemo(() => selectCatById(id), [id])
  const cat = useAppSelector(selectCat)
  const selectEvents = useMemo(() => selectEventsForCat(id), [id])
  const events = useAppSelector(selectEvents)
  const selectRecords = useMemo(() => selectHealthRecordsForCat(id), [id])
  const records = useAppSelector(selectRecords)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  // Set once the delete has gone through, so the effect below does not race the
  // navigation to /cats with its own replace when the cat vanishes from state.
  const [deleted, setDeleted] = useState(false)
  const dialogTitleId = useId()
  const deleteErrorId = useId()

  useEffect(() => {
    if (loaded && !cat && !deleted) router.replace('/cats')
  }, [loaded, cat, deleted, router])

  if (!cat) return null

  // Mirrors the rule storage applies in deleteCat: an event shared with another
  // cat only loses this one, an event that was this cat's alone goes entirely.
  // Counted here so the owner reads the full cost before agreeing to it.
  const soloEvents = events.filter(e => e.catIds.length === 1).length

  const consequences: string[] = []
  if (records.length > 0) {
    consequences.push(
      `deletes ${cat.name}’s ${plural(records.length, 'weight reading', 'weight readings')}`,
    )
  }
  if (events.length > 0 && soloEvents === events.length) {
    consequences.push(
      `deletes the ${plural(soloEvents, 'event', 'events')} only ${cat.name} was on`,
    )
  } else if (events.length > 0) {
    let part = `removes ${cat.name} from ${plural(events.length, 'event', 'events')}`
    if (soloEvents > 0) {
      part += ` (${plural(soloEvents, 'event', 'events')} that only ${cat.name} was on will be deleted)`
    }
    consequences.push(part)
  }

  function closeDialog() {
    setConfirmingDelete(false)
    setDeleteError('')
  }

  function handleDelete() {
    try {
      dispatch(removeCat(id))
    } catch (err) {
      // Storage writes before state changes, so a refused write leaves the cat
      // and everything attached to it exactly as it was. Stay put and say why.
      setDeleteError(errorMessage(err, DELETE_FALLBACK_MESSAGE))
      return
    }
    setDeleted(true)
    // /cats sends the owner on to onboarding by itself when no cats are left.
    router.push('/cats')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-7 shadow-soft">
        <Link href={`/cats/${id}`} className="text-brand-slate text-sm hover:underline mb-5 inline-block">
          ← Back to profile
        </Link>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 select-none">✏️</div>
          <h1 className="font-display text-3xl text-brand-brown">Edit {cat.name}</h1>
        </div>
        <CatForm existing={cat} />

        {/* Kept apart from Save and Cancel, below a rule, so reaching for Save
            never lands on the one button here that cannot be taken back. */}
        <div className="border-t border-brand-tan/40 pt-6 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-brand-brown/70">
            Removes {cat.name} and everything recorded only for {cat.name}.
          </p>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="px-5 py-2.5 rounded-2xl border border-red-600 text-red-700 font-medium hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 flex-shrink-0"
          >
            Delete this cat
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <Dialog labelledBy={dialogTitleId} onClose={closeDialog}>
          <h2 id={dialogTitleId} className="font-display text-2xl text-brand-brown mb-3">
            Delete {cat.name}?
          </h2>
          <p className="text-sm text-brand-brown/80 mb-5">
            {consequences.length > 0 && <>This also {consequences.join(' and ')}. </>}
            This can’t be undone.
          </p>
          {deleteError && (
            <p id={deleteErrorId} role="alert" className="text-sm text-red-700 mb-4">
              {deleteError}
            </p>
          )}
          <div className="flex gap-3">
            {/* Focus starts on the safe choice, so a stray Enter keeps the cat. */}
            <button
              type="button"
              data-autofocus
              onClick={closeDialog}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-tan text-brand-brown bg-white hover:bg-brand-tan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
            >
              Keep {cat.name}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-describedby={deleteError ? deleteErrorId : undefined}
              className="flex-1 px-4 py-2.5 rounded-2xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
