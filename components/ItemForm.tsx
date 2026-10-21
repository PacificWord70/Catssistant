'use client'

import { useId, useState, FormEvent } from 'react'
import { Cat } from '@/types/cat'
import { CatalogProduct, HouseholdItem, ProductCategory, ItemStatus } from '@/types/item'
import { PRODUCT_CATEGORIES } from '@/lib/itemAttributes'
import { DELETE_FALLBACK_MESSAGE, errorMessage } from '@/lib/formErrors'
import Dialog, { ConfirmRequest } from '@/components/Dialog'

interface Props {
  cats: Cat[]
  products: CatalogProduct[]
  existing?: HouseholdItem
  onSave: (item: HouseholdItem, newProduct?: CatalogProduct) => void
  onCancel: () => void
  onDelete?: () => void
}

function productLabel(p: CatalogProduct): string {
  return p.brand ? `${p.name} — ${p.brand}` : p.name
}

export default function ItemForm({ cats, products, existing, onSave, onCancel, onDelete }: Props) {
  const existingProduct = existing ? products.find(p => p.id === existing.productId) : undefined

  const [productMode, setProductMode] = useState<'existing' | 'new'>(products.length === 0 ? 'new' : 'existing')
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Food')
  const [subCategory, setSubCategory] = useState('')

  const [status, setStatus] = useState<ItemStatus>(existing?.status ?? 'current')
  const [dateStarted, setDateStarted] = useState(existing?.dateStarted ?? '')
  const [dateEnded, setDateEnded] = useState(existing?.dateEnded ?? '')
  const [catIds, setCatIds] = useState<string[]>(existing?.catIds ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const [nameError, setNameError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // Every field in one string, so "has anything changed?" is one comparison.
  // The first render's copy is the baseline; useState keeps only that one.
  const snapshot = JSON.stringify([productMode, selectedProductId, name, brand, category, subCategory, status, dateStarted, dateEnded, catIds, notes])
  const [initialSnapshot] = useState(snapshot)
  const dirty = snapshot !== initialSnapshot

  const uid = useId()
  const ids = {
    heading: `${uid}-heading`,
    product: `${uid}-product`,
    name: `${uid}-name`,
    nameError: `${uid}-name-error`,
    brand: `${uid}-brand`,
    category: `${uid}-category`,
    subCategory: `${uid}-sub-category`,
    status: `${uid}-status`,
    dateStarted: `${uid}-date-started`,
    dateEnded: `${uid}-date-ended`,
    cats: `${uid}-cats`,
    notes: `${uid}-notes`,
    saveError: `${uid}-save-error`,
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'
  const labelClass = 'block text-sm font-medium text-brand-charcoal mb-1'
  const required = <span className="text-brand-orange" aria-hidden="true">*</span>

  function toggleCat(id: string) {
    setCatIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  function handleStatusChange(next: ItemStatus) {
    setStatus(next)
    if (next === 'current') setDateEnded('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)

    let productId: string
    let newProduct: CatalogProduct | undefined

    if (existing) {
      productId = existing.productId
    } else if (productMode === 'existing' && products.length > 0) {
      // The select always holds one of the listed products, so this is not
      // something the owner can get wrong.
      productId = selectedProductId || products[0].id
    } else {
      // This used to return silently, so Save simply did nothing.
      if (!name.trim()) {
        setNameError('Give the product a name.')
        document.getElementById(ids.name)?.focus()
        return
      }
      newProduct = {
        id: crypto.randomUUID(),
        name: name.trim(),
        brand: brand.trim() || undefined,
        category,
        subCategory: subCategory.trim() || undefined,
        createdAt: new Date().toISOString(),
      }
      productId = newProduct.id
    }

    const item: HouseholdItem = {
      id: existing?.id ?? crypto.randomUUID(),
      productId,
      status,
      dateStarted: dateStarted || undefined,
      dateEnded: status === 'past' ? (dateEnded || undefined) : undefined,
      catIds,
      notes: notes.trim() || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }

    // The page's handler writes to storage, which can throw — when the browser
    // is out of room, say. The modal stays open with the entry intact and the
    // reason shown, rather than the save vanishing.
    try {
      onSave(item, newProduct)
    } catch (err) {
      setSaveError(errorMessage(err))
    }
  }

  const deleteConfirm: ConfirmRequest | null =
    confirmingDelete && existing && onDelete
      ? {
          title: 'Delete this item?',
          message: (
            <p>
              {existingProduct ? <>“{productLabel(existingProduct)}”</> : 'This item'} will be removed from your
              household items. The product stays in your catalog. This can’t be undone.
            </p>
          ),
          confirmLabel: 'Delete item',
          cancelLabel: 'Keep it',
          danger: true,
          onCancel: () => setConfirmingDelete(false),
          onConfirm: () => {
            setConfirmingDelete(false)
            try {
              onDelete()
            } catch (err) {
              setSaveError(errorMessage(err, DELETE_FALLBACK_MESSAGE))
            }
          },
        }
      : null

  const toggleClass = (on: boolean) =>
    `flex-1 py-2 rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 ${on ? 'bg-white shadow-sm text-brand-brown' : 'text-brand-slate'}`

  return (
    <Dialog labelledBy={ids.heading} onClose={onCancel} dirty={dirty} confirm={deleteConfirm}>
        <h2 id={ids.heading} className="font-display text-2xl text-brand-brown mb-5">{existing ? 'Edit Item' : 'Add Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* ── Product ───────────────────────────────────────── */}
          {existing ? (
            <div>
              <span className={labelClass}>Product</span>
              <p className="px-4 py-2.5 rounded-2xl bg-brand-tan/10 text-brand-charcoal text-sm">
                {existingProduct ? productLabel(existingProduct) : 'Unknown product'}
              </p>
            </div>
          ) : (
            <>
              {products.length > 0 && (
                <div role="group" aria-label="Product source" className="flex gap-2 bg-brand-tan/10 rounded-2xl p-1">
                  <button
                    type="button"
                    aria-pressed={productMode === 'existing'}
                    onClick={() => setProductMode('existing')}
                    className={toggleClass(productMode === 'existing')}
                  >
                    Pick existing product
                  </button>
                  <button
                    type="button"
                    aria-pressed={productMode === 'new'}
                    onClick={() => setProductMode('new')}
                    className={toggleClass(productMode === 'new')}
                  >
                    Add new product
                  </button>
                </div>
              )}

              {productMode === 'existing' && products.length > 0 ? (
                <div>
                  <label htmlFor={ids.product} className={labelClass}>
                    Product {required}
                  </label>
                  <select
                    id={ids.product}
                    required
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className={inputClass}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{productLabel(p)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor={ids.name} className={labelClass}>
                      Name {required}
                    </label>
                    <input
                      id={ids.name}
                      type="text" required value={name}
                      onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(null) }}
                      aria-invalid={nameError ? true : undefined}
                      aria-describedby={nameError ? ids.nameError : undefined}
                      className={nameError ? inputClass.replace('border-brand-tan/50', 'border-red-400') : inputClass}
                    />
                    {nameError && <p id={ids.nameError} className="text-xs text-red-700 mt-1 px-1">{nameError}</p>}
                  </div>
                  <div>
                    <label htmlFor={ids.brand} className={labelClass}>Brand</label>
                    <input id={ids.brand} type="text" value={brand} onChange={e => setBrand(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor={ids.category} className={labelClass}>
                      Category {required}
                    </label>
                    <select id={ids.category} required value={category} onChange={e => setCategory(e.target.value as ProductCategory)} className={inputClass}>
                      {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={ids.subCategory} className={labelClass}>Sub-category</label>
                    <input
                      id={ids.subCategory}
                      type="text"
                      placeholder='e.g. "Wet Food"'
                      value={subCategory}
                      onChange={e => setSubCategory(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Usage ─────────────────────────────────────────── */}
          <div>
            <label htmlFor={ids.status} className={labelClass}>Status</label>
            <select id={ids.status} value={status} onChange={e => handleStatusChange(e.target.value as ItemStatus)} className={inputClass}>
              <option value="current">Current</option>
              <option value="past">Past</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor={ids.dateStarted} className={labelClass}>Date started</label>
              <input id={ids.dateStarted} type="date" value={dateStarted} onChange={e => setDateStarted(e.target.value)} className={inputClass} />
            </div>
            {status === 'past' && (
              <div className="flex-1">
                <label htmlFor={ids.dateEnded} className={labelClass}>Date ended</label>
                <input id={ids.dateEnded} type="date" value={dateEnded} onChange={e => setDateEnded(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          <fieldset className="min-w-0">
            <legend className={labelClass}>Cats</legend>
            <div className="grid grid-cols-2 gap-2 bg-brand-tan/10 rounded-2xl p-4">
              {cats.map(c => (
                <label key={c.id} htmlFor={`${ids.cats}-${c.id}`} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    id={`${ids.cats}-${c.id}`}
                    type="checkbox"
                    checked={catIds.includes(c.id)}
                    onChange={() => toggleCat(c.id)}
                    className="rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={ids.notes} className={labelClass}>Notes</label>
            <textarea id={ids.notes} value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>

          {saveError && (
            <p id={ids.saveError} role="alert" className="text-sm text-red-700">
              {saveError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" aria-describedby={saveError ? ids.saveError : undefined} className="flex-1 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 focus-visible:ring-offset-2">
              Save
            </button>
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40">
              Cancel
            </button>
            {existing && onDelete && (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="px-4 py-3 text-red-700 hover:text-red-800 transition-colors text-sm font-medium rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40">
                Delete
              </button>
            )}
          </div>
        </form>
    </Dialog>
  )
}
