'use client'

import { useEffect, useState } from 'react'
import { getCats } from '@/lib/storage'
import {
  getCatalogProducts,
  getHouseholdItems,
  saveCatalogProduct,
  saveHouseholdItem,
  deleteHouseholdItem,
} from '@/lib/itemStorage'
import { Cat } from '@/types/cat'
import { CatalogProduct, HouseholdItem, ProductCategory } from '@/types/item'
import { CATEGORY_ORDER, PRODUCT_CATEGORIES } from '@/lib/itemAttributes'
import ItemForm from '@/components/ItemForm'
import Reveal from '@/components/motion/Reveal'

type CategoryFilter = 'all' | ProductCategory
type StatusFilter = 'current' | 'past' | 'all'
type SortBy = 'category' | 'name'

export default function ItemsPage() {
  const [cats, setCats] = useState<Cat[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [items, setItems] = useState<HouseholdItem[]>([])
  const [loaded, setLoaded] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('current')
  const [sortBy, setSortBy] = useState<SortBy>('category')
  const [editing, setEditing] = useState<HouseholdItem | 'new' | null>(null)

  useEffect(() => {
    setCats(getCats())
    setProducts(getCatalogProducts())
    setItems(getHouseholdItems())
    setLoaded(true)
  }, [])

  if (!loaded) return null

  function reload() {
    setProducts(getCatalogProducts())
    setItems(getHouseholdItems())
  }

  function handleSave(item: HouseholdItem, newProduct?: CatalogProduct) {
    if (newProduct) saveCatalogProduct(newProduct)
    saveHouseholdItem(item)
    reload()
    setEditing(null)
  }

  function handleDelete(id: string) {
    deleteHouseholdItem(id)
    reload()
    setEditing(null)
  }

  function handleMarkPast(e: React.MouseEvent, item: HouseholdItem) {
    e.stopPropagation()
    saveHouseholdItem({
      ...item,
      status: 'past',
      dateEnded: new Date().toISOString().slice(0, 10),
    })
    reload()
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
        <div className="flex items-center justify-between mb-7">
          <h1 className="font-display text-3xl text-brand-brown">My Items</h1>
          <button
            onClick={() => setEditing('new')}
            className="hover-lift px-4 py-2 bg-brand-orange text-white rounded-2xl text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft"
          >
            + Add Item
          </button>
        </div>
      </Reveal>

      {items.length === 0 ? (
        <Reveal delay={0.1}>
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-8xl mb-6 select-none">🧺</div>
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
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as CategoryFilter)}
                className="px-3 py-2 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
              >
                <option value="all">All categories</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white text-sm"
              >
                <option value="current">Current</option>
                <option value="past">Past</option>
                <option value="all">All</option>
              </select>

              <select
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
              <div className="rounded-2xl border border-brand-tan/30 overflow-hidden">
                <table className="w-full text-sm">
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
                          {product.name}
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
                              ? new Date(item.dateEnded).toLocaleDateString()
                              : 'Past'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'current' && (
                            <button
                              onClick={e => handleMarkPast(e, item)}
                              className="px-3 py-1.5 rounded-xl border border-brand-tan/50 text-xs font-medium text-brand-slate hover:bg-brand-tan/10 transition-colors"
                            >
                              Mark past
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
