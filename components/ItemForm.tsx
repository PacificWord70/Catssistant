'use client'

import { useState, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Cat } from '@/types/cat'
import { CatalogProduct, HouseholdItem, ProductCategory, ItemStatus } from '@/types/item'
import { PRODUCT_CATEGORIES } from '@/lib/itemAttributes'

interface Props {
  cats: Cat[]
  products: CatalogProduct[]
  existing?: HouseholdItem
  onSave: (item: HouseholdItem, newProduct?: CatalogProduct) => void
  onCancel: () => void
  onDelete?: () => void
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

  const inputClass = 'w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'

  function toggleCat(id: string) {
    setCatIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  function handleStatusChange(next: ItemStatus) {
    setStatus(next)
    if (next === 'current') setDateEnded('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    let productId: string
    let newProduct: CatalogProduct | undefined

    if (existing) {
      productId = existing.productId
    } else if (productMode === 'existing') {
      if (!selectedProductId) return
      productId = selectedProductId
    } else {
      if (!name.trim() || !category) return
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

    onSave(item, newProduct)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-3xl p-7 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-brand-brown mb-5">{existing ? 'Edit Item' : 'Add Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Product ───────────────────────────────────────── */}
          {existing ? (
            <div>
              <label className="block text-sm font-medium text-brand-charcoal mb-1">Product</label>
              <p className="px-4 py-2.5 rounded-2xl bg-brand-tan/10 text-brand-charcoal text-sm">
                {existingProduct ? (existingProduct.brand ? `${existingProduct.name} — ${existingProduct.brand}` : existingProduct.name) : 'Unknown product'}
              </p>
            </div>
          ) : (
            <>
              {products.length > 0 && (
                <div className="flex gap-2 bg-brand-tan/10 rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => setProductMode('existing')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${productMode === 'existing' ? 'bg-white shadow-sm text-brand-brown' : 'text-brand-slate'}`}
                  >
                    Pick existing product
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductMode('new')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${productMode === 'new' ? 'bg-white shadow-sm text-brand-brown' : 'text-brand-slate'}`}
                  >
                    Add new product
                  </button>
                </div>
              )}

              {productMode === 'existing' && products.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-brand-charcoal mb-1">
                    Product <span className="text-brand-orange">*</span>
                  </label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className={inputClass}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.brand ? `${p.name} — ${p.brand}` : p.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">
                      Name <span className="text-brand-orange">*</span>
                    </label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">Brand</label>
                    <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">
                      Category <span className="text-brand-orange">*</span>
                    </label>
                    <select required value={category} onChange={e => setCategory(e.target.value as ProductCategory)} className={inputClass}>
                      {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-charcoal mb-1">Sub-category</label>
                    <input
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
            <label className="block text-sm font-medium text-brand-charcoal mb-1">Status</label>
            <select value={status} onChange={e => handleStatusChange(e.target.value as ItemStatus)} className={inputClass}>
              <option value="current">Current</option>
              <option value="past">Past</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-brand-charcoal mb-1">Date started</label>
              <input type="date" value={dateStarted} onChange={e => setDateStarted(e.target.value)} className={inputClass} />
            </div>
            {status === 'past' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-brand-charcoal mb-1">Date ended</label>
                <input type="date" value={dateEnded} onChange={e => setDateEnded(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">Cats</label>
            <div className="grid grid-cols-2 gap-2 bg-brand-tan/10 rounded-2xl p-4">
              {cats.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    type="checkbox"
                    checked={catIds.includes(c.id)}
                    onChange={() => toggleCat(c.id)}
                    className="rounded border-brand-tan/50 text-brand-orange focus:ring-brand-orange/40"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-charcoal mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft">
              Save
            </button>
            <button type="button" onClick={onCancel} className="px-6 py-3 bg-white text-brand-brown border border-brand-tan rounded-2xl font-medium hover:bg-brand-tan/10 transition-colors">
              Cancel
            </button>
            {existing && onDelete && (
              <button type="button" onClick={onDelete} className="px-4 py-3 text-red-400 hover:text-red-500 transition-colors text-sm font-medium">
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
