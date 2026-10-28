'use client'

import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { persistHouseholdItem, removeHouseholdItem } from '@/store/itemsSlice'
import {
  selectAllCats,
  selectCatalog,
  selectHouseholdItems,
  selectItemsLoaded,
} from '@/store/selectors'
import { CatalogProduct, HouseholdItem, ProductCategory } from '@/types/item'
import { CATEGORY_ORDER, PRODUCT_CATEGORIES } from '@/lib/itemAttributes'
import { formatDateKey, todayKey } from '@/lib/dateKeys'
import { errorMessage } from '@/lib/formErrors'
import ItemForm from '@/components/ItemForm'
import HelpButton from '@/components/HelpButton'
import Reveal from '@/components/motion/Reveal'

type CategoryFilter = 'all' | ProductCategory
type StatusFilter = 'current' | 'past' | 'all'
type SortBy = 'category' | 'name'

export default function ItemsPage() {
  const dispatch = useAppDispatch()
  const cats = useAppSelector(selectAllCats)
  const products = useAppSelector(selectCatalog)
  const items = useAppSelector(selectHouseholdItems)
  const loaded = useAppSelector(selectItemsLoaded)

  // Filters and sort are view state — they belong to this screen only.
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('current')
  const [sortBy, setSortBy] = useState<SortBy>('category')
  const [editing, setEditing] = useState<HouseholdItem | 'new' | null>(null)
  /** Why the last "Mark past" didn't save. The button has no form of its own to show it in. */
  const [markPastError, setMarkPastError] = useState<string | null>(null)

  if (!loaded) return null

  // No reload() any more. Dispatching updates the store, and every subscriber
  // re-renders on its own — that manual re-fetch after each write was exactly the
  // bookkeeping the store removes.
  function handleSave(item: HouseholdItem, newProduct?: CatalogProduct) {
    dispatch(persistHouseholdItem(item, newProduct))
    setEditing(null)
  }

  function handleDelete(id: string) {
    dispatch(removeHouseholdItem(id))
    setEditing(null)
  }

  function handleMarkPast(e: React.MouseEvent, item: HouseholdItem) {
    e.stopPropagation()
    setMarkPastError(null)
    // The save can be refused — storage full, or the example household — and
    // an uncaught throw from a click handler would leave the button silently
    // doing nothing.
    try {
      dispatch(
        persistHouseholdItem({
          ...item,
          status: 'past',
          // Local day, not toISOString — that is the UTC day, already tomorrow in a US evening.
          dateEnded: todayKey(),
        }),
      )
    } catch (err) {
      setMarkPastError(errorMessage(err))
    }
  }

  const rows = items
    .map(item => ({ item, product: products.find(p => p.id === item.productId) }))
    .filter((row): row is { item: HouseholdItem; product: CatalogProduct } => !!row.product)
    .filter(row => statusFilter === 'all' || row.item.status === statusFilter)
    .filter(row => categoryFilter === 'all' || row.product.category === categoryFilter)
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.product.name.localeCompare(b.product.name, undefined, { sensitivity: 'base' })
      }
      const orderDiff = CATEGORY_ORDER[a.product.category] - CATEGORY_ORDER[b.product.category]
      if (orderDiff !== 0) return orderDiff
      return a.product.name.localeCompare(b.product.name, undefined, { sensitivity: 'base' })
    })

  const catNames = (ids: string[]) => ids.map(id => cats.find(c => c.id === id)?.name).filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-3xl shadow-soft p-7 min-h-[calc(100vh-8rem)]">
      <Reveal>
        <div className="flex items-center justify-between gap-3 mb-7">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-brand-brown">My Items</h1>
            <HelpButton page="items" />
          </div>
          <button
            onClick={() => setEditing('new')}
            className="hover-lift px-4 py-2 bg-brand-orange text-white rounded-2xl text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft"
          >
            + Add Item
          </button>
        </div>
      </Reveal>

      {markPastError && (
        <p role="alert" className="mb-5 text-sm text-red-700">
          {markPastError}
        </p>
      )}

      {items.length === 0 ? (
        <Reveal delay={0.1}>
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-8xl mb-6 select-none" aria-hidden="true">🧺</div>
            <h2 className="font-display text-3xl text-brand-brown mb-3">No items yet!</h2>
            <p className="text-brand-brown/60 mb-8 max-w-sm">
              Track the food, litter, meds, and gear you use for your cats in one place.
            </p>
            <button
              onClick={() => setEditing('new')}
              className="px-6 py-3 bg-brand-orange text-white rounded-2xl font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft"
            >
              Add Your First Item
            </button>
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-3 mb-5">
              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as CategoryFilter)}
                className="px-3 py-2 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
              >
                <option value="all">All categories</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
              >
                <option value="current">Current</option>
                <option value="past">Past</option>
                <option value="all">All</option>
              </select>

              <select
                aria-label="Sort items"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
              >
                <option value="category">Sort: Category</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            {rows.length === 0 ? (
              <p className="text-brand-brown/60 text-sm py-6">No items match these filters.</p>
            ) : (
              // Five columns do not fit a phone. Scroll the table sideways inside its
              // rounded frame rather than clipping the Status and Actions columns.
              <div className="rounded-2xl border border-brand-tan/30 overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead>
                    <tr className="text-left text-brand-slate border-b border-brand-tan/30">
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Brand</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ item, product }) => (
                      <tr
                        key={item.id}
                        onClick={() => setEditing(item)}
                        className="border-b border-brand-tan/30 last:border-0 hover:bg-brand-tan/10 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-brand-charcoal">
                          {/* The whole row opens the item for mouse users; this button is the
                              same action for keyboard and screen-reader users, who cannot click a <tr>. */}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              setEditing(item)
                            }}
                            className="text-left font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded"
                          >
                            {product.name}
                          </button>
                          {catNames(item.catIds) && (
                            <span className="block text-xs text-brand-brown/60">{catNames(item.catIds)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-brand-charcoal">{product.brand || '—'}</td>
                        <td className="px-4 py-3 text-brand-charcoal">{product.category}</td>
                        <td className="px-4 py-3 text-brand-charcoal">
                          {item.status === 'current'
                            ? 'Current'
                            : item.dateEnded
                              ? `Ended ${formatDateKey(item.dateEnded)}`
                              : 'Past'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'current' && (
                            <button
                              onClick={e => handleMarkPast(e, item)}
                              className="px-3 py-1.5 rounded-xl border border-brand-tan/50 text-xs font-medium text-brand-slate hover:bg-brand-tan/10 transition-colors"
                            >
                              Mark past
                              <span className="sr-only"> — {product.name}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Reveal>
        </>
      )}

      {editing && (
        <ItemForm
          cats={cats}
          products={products}
          existing={editing === 'new' ? undefined : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={editing !== 'new' ? () => handleDelete(editing.id) : undefined}
        />
      )}
    </div>
  )
}
