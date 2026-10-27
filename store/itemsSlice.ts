import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CatalogProduct, HouseholdItem } from '@/types/item'
import {
  deleteHouseholdItem as removeItemFromStorage,
  getCatalogProducts,
  getHouseholdItems,
  saveCatalogProduct as writeProductToStorage,
  saveHouseholdItem as writeItemToStorage,
} from '@/lib/itemStorage'
import { refuseWhileExample } from '@/store/exampleSlice'
import type { AppDispatch, RootState } from '@/store/types'

/**
 * Household items, and the product catalogue they reference.
 *
 * Two collections in one slice because they are always used together — an item
 * is meaningless without the product it points at, and every screen showing one
 * shows the other. Splitting them would mean two slices that always load and
 * change in step.
 *
 * The catalogue is in the store despite being conceptually shared rather than
 * per-person: users can add to it at runtime, so it has the same staleness
 * problem as anything else mutable. A product added while creating an item has
 * to appear in every other dropdown immediately. Genuinely static reference data
 * — lib/breeds.ts, the coat and category option lists — stays a plain import,
 * because there is nothing to keep in sync.
 */
interface ItemsState {
  items: HouseholdItem[]
  catalog: CatalogProduct[]
  loaded: boolean
}

const initialState: ItemsState = {
  items: [],
  catalog: [],
  loaded: false,
}

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    itemsLoaded(
      state,
      action: PayloadAction<{ items: HouseholdItem[]; catalog: CatalogProduct[] }>,
    ) {
      state.items = action.payload.items
      state.catalog = action.payload.catalog
      state.loaded = true
    },

    householdItemSaved(state, action: PayloadAction<HouseholdItem>) {
      const item = action.payload
      const index = state.items.findIndex(i => i.id === item.id)
      if (index >= 0) state.items[index] = item
      else state.items.push(item)
    },

    householdItemDeleted(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload)
    },

    catalogProductSaved(state, action: PayloadAction<CatalogProduct>) {
      const product = action.payload
      const index = state.catalog.findIndex(p => p.id === product.id)
      if (index >= 0) state.catalog[index] = product
      else state.catalog.push(product)
    },
  },
})

export const { itemsLoaded, householdItemSaved, householdItemDeleted, catalogProductSaved } =
  itemsSlice.actions
export default itemsSlice.reducer

// ─── Thunks ───────────────────────────────────────────────────────────────────

export function loadItems() {
  return (dispatch: AppDispatch) => {
    dispatch(itemsLoaded({ items: getHouseholdItems(), catalog: getCatalogProducts() }))
  }
}

/**
 * Saves an item, optionally alongside its product — one created inline, or an
 * existing one the owner edited. Either way the product is upserted by id, so
 * an edit shows on every item that uses it.
 *
 * The product is written first: an item references a product by id, so storing
 * the item before its product would leave a dangling reference if the second
 * write failed.
 */
export function persistHouseholdItem(item: HouseholdItem, product?: CatalogProduct) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    refuseWhileExample(getState)
    if (product) dispatch(catalogProductSaved(writeProductToStorage(product)))
    dispatch(householdItemSaved(writeItemToStorage(item)))
  }
}

export function removeHouseholdItem(id: string) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    refuseWhileExample(getState)
    removeItemFromStorage(id)
    dispatch(householdItemDeleted(id))
  }
}
