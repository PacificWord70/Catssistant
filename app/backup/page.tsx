'use client'

import { ChangeEvent, useId, useState } from 'react'
import Dialog from '@/components/Dialog'
import HelpButton from '@/components/HelpButton'
import Reveal from '@/components/motion/Reveal'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loadHousehold } from '@/store/catsSlice'
import { selectIsExample, selectIsExamplePreview } from '@/store/selectors'
import {
  backupFileName,
  buildBackup,
  describePlan,
  describeResult,
  MergePlan,
  parseBackup,
  planMerge,
} from '@/lib/backup'
import { errorMessage } from '@/lib/formErrors'
import {
  PartialWriteError,
  readAllCollections,
  StoredCollections,
  writeAllCollections,
} from '@/lib/storage'
import { StorageWriteError } from '@/lib/storageSafety'

/**
 * Far bigger than anything this app writes — the browser's own storage limit
 * is a few megabytes — so a file this size is not one of ours, and reading it
 * into memory to find that out is not worth it.
 */
const MAX_FILE_BYTES = 20 * 1024 * 1024

const CARD = 'bg-white rounded-3xl shadow-soft border border-brand-tan/30 p-6'
const PRIMARY_BTN =
  'px-5 py-2.5 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2'
const SECONDARY_BTN =
  'px-5 py-2.5 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40'

/** What the confirm step is showing: the file's contents and the plan worked out from them. */
interface Pending {
  fileName: string
  imported: StoredCollections
  plan: MergePlan
}

/**
 * Storage's own messages are written for a single save ("your change wasn't
 * saved"). These say the same things in terms of a whole backup.
 */
function exportErrorMessage(err: unknown): string {
  if (err instanceof StorageWriteError && err.reason === 'unreadable') {
    return 'Some of your saved information couldn’t be read, so it has been set aside rather than left out of a backup that would look complete. Download again to back up everything else.'
  }
  return 'Something went wrong making the backup. Please try again.'
}

function importErrorMessage(err: unknown): string {
  if (err instanceof PartialWriteError) return err.message
  if (err instanceof StorageWriteError && err.reason === 'quota') {
    return 'There isn’t enough room to add everything in this backup, so nothing was changed. Removing a few photos you no longer need may make room.'
  }
  if (err instanceof StorageWriteError && err.reason === 'unknown') {
    return 'Something went wrong while restoring, so nothing was changed. Please try again.'
  }
  return errorMessage(err)
}

export default function BackupPage() {
  const dispatch = useAppDispatch()
  const isExample = useAppSelector(selectIsExample)
  const isPreview = useAppSelector(selectIsExamplePreview)
  const uid = useId()
  const ids = {
    file: `${uid}-file`,
    fileHint: `${uid}-file-hint`,
    dialogHeading: `${uid}-dialog-heading`,
  }

  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)

  function handleExport() {
    setExportStatus(null)
    setExportError(null)
    try {
      const now = new Date()
      const backup = buildBackup(readAllCollections(), now)
      const fileName = backupFileName(now)
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      // The click has already handed the blob to the download; the URL is only
      // holding memory now.
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setExportStatus(`Your backup is downloading as ${fileName}.`)
    } catch (err) {
      setExportError(exportErrorMessage(err))
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const file = input.files?.[0]
    // Cleared straight away so picking the same file again still fires a change.
    input.value = ''
    setImportStatus(null)
    setImportError(null)
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setImportError('That file is far larger than a Catssistant backup, so it wasn’t opened.')
      return
    }

    let text: string
    try {
      text = await file.text()
    } catch {
      setImportError('That file couldn’t be opened. Please try choosing it again.')
      return
    }

    try {
      const imported = parseBackup(text)
      // Read now, not at confirm time only, so the summary describes this
      // device as it is — and an unreadable collection stops things here.
      const plan = planMerge(readAllCollections(), imported)
      setPending({ fileName: file.name, imported, plan })
    } catch (err) {
      setImportError(importErrorMessage(err))
    }
  }

  function handleConfirm() {
    if (!pending) return
    try {
      // Planned again from a fresh read, in case anything was saved in another
      // tab while the summary was open; the plan shown is then at most stale
      // in its counts, never in what it writes.
      const device = readAllCollections()
      const plan = planMerge(device, pending.imported)
      writeAllCollections(plan.next, device)
      // Every slice reloads from storage, so each page shows the merged data
      // without the owner having to refresh. If the backup brought cats with
      // it, that also ends the example household; if not, the example stays.
      dispatch(loadHousehold())
      setImportStatus(describeResult(plan))
    } catch (err) {
      setImportError(importErrorMessage(err))
    }
    setPending(null)
  }

  const summary = pending ? describePlan(pending.plan) : []

  return (
    <div>
      <div className="max-w-2xl mx-auto py-6 space-y-6">
        <Reveal>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl text-brand-brown">Back up &amp; restore</h1>
            <HelpButton page="backup" />
          </div>
          <p className="text-brand-brown/70">
            Save a copy of everything you’ve entered to a file, and bring it back later — on a new
            browser, or after clearing this one.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <section aria-labelledby={`${uid}-export-heading`} className={CARD}>
            <h2 id={`${uid}-export-heading`} className="font-display text-xl text-brand-brown mb-2">
              Download a backup
            </h2>
            <p className="text-sm text-brand-brown/70 mb-4">
              One file with your cats (photos included), their schedule, health readings and
              household items. Keep it somewhere you’ll be able to find it again.
            </p>
            {/* The file is built from storage, which the example never touches,
                so this is a description of what happens, not a filter. During
                a preview that cuts the other way: the owner's real records are
                exactly what the download holds, even though the pages are
                showing Biscuit and friends. */}
            {isExample && (
              <p className="text-sm text-brand-brown/80 bg-brand-cream border border-brand-tan/50 rounded-2xl px-4 py-3 mb-4">
                {isPreview
                  ? 'The preview isn’t part of backups. Downloading now saves your own cats and records, not the example household.'
                  : 'The example household isn’t part of backups. A backup holds only the cats and records you’ve added yourself.'}
              </p>
            )}
            <button type="button" onClick={handleExport} className={PRIMARY_BTN}>
              Download backup
            </button>
            <div role="status" className="mt-3 text-sm text-brand-brown">
              {exportStatus}
            </div>
            {exportError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {exportError}
              </p>
            )}
          </section>
        </Reveal>

        <Reveal delay={0.1}>
          <section aria-labelledby={`${uid}-import-heading`} className={CARD}>
            <h2 id={`${uid}-import-heading`} className="font-display text-xl text-brand-brown mb-2">
              Restore from a backup
            </h2>
            <p id={ids.fileHint} className="text-sm text-brand-brown/70 mb-4">
              Restoring adds to what’s already here and never deletes anything. Entries only in the
              backup are added, entries only here stay, and where both have the same entry,
              whichever was changed most recently is kept. You’ll see what will change before
              anything does.
            </p>
            <label
              htmlFor={ids.file}
              className="block text-sm font-medium text-brand-charcoal mb-1"
            >
              Backup file
            </label>
            <input
              id={ids.file}
              type="file"
              accept="application/json,.json"
              aria-describedby={ids.fileHint}
              onChange={handleFile}
              className="block w-full text-sm text-brand-brown file:mr-3 file:px-4 file:py-2 file:rounded-2xl file:border-0 file:bg-brand-orange file:text-white file:font-semibold hover:file:bg-brand-orange/90 file:cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
            />
            <div role="status" className="mt-3 text-sm text-brand-brown">
              {importStatus}
            </div>
            {importError && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {importError}
              </p>
            )}
          </section>
        </Reveal>
      </div>

      {pending && (
        <Dialog labelledBy={ids.dialogHeading} onClose={() => setPending(null)}>
          {pending.plan.hasChanges ? (
            <>
              <h2 id={ids.dialogHeading} className="font-display text-2xl text-brand-brown mb-2">
                Restore this backup?
              </h2>
              <p className="text-sm text-brand-brown/70 mb-4 break-words">
                From {pending.fileName}
              </p>
              <div className="space-y-4 mb-4">
                {summary.map(group => (
                  <div key={group.title}>
                    <h3 className="text-sm font-semibold text-brand-charcoal mb-1">
                      {group.title}
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-brand-brown space-y-0.5">
                      {group.lines.map(line => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-sm text-brand-brown/80 mb-5">Nothing will be deleted.</p>
              <div className="flex gap-3">
                <button type="button" onClick={handleConfirm} className={`flex-1 ${PRIMARY_BTN}`}>
                  Restore
                </button>
                <button type="button" onClick={() => setPending(null)} className={SECONDARY_BTN}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id={ids.dialogHeading} className="font-display text-2xl text-brand-brown mb-2">
                Nothing to restore
              </h2>
              <p className="text-sm text-brand-brown/80 mb-5">
                Everything in {pending.fileName} is already here, or has been changed here more
                recently. Nothing needs to change.
              </p>
              <button type="button" onClick={() => setPending(null)} className={PRIMARY_BTN}>
                Close
              </button>
            </>
          )}
        </Dialog>
      )}
    </div>
  )
}
