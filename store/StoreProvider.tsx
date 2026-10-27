'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { loadHousehold } from '@/store/catsSlice'

/**
 * Makes the store available to every component below it.
 *
 * This is its own client component so `app/layout.tsx` can stay a server
 * component. Wrapping children here means the layout imports one client boundary
 * rather than becoming client-rendered itself.
 *
 * It also does the initial load from localStorage. Doing it once here rather than
 * per page is the point of the store: pages used to each read storage on mount,
 * which is what react-hooks/set-state-in-effect was flagging.
 */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  // Guards against running twice. In development React's Strict Mode
  // deliberately double-invokes effects to surface side effects like this one.
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    // localStorage isn't available during server rendering, so the reads have to
    // happen in an effect — after the component has mounted in the browser.
    // One thunk for every slice, because whether storage holds any cats decides
    // whether the slices get the owner's records or the example household.
    store.dispatch(loadHousehold())
  }, [])

  return <Provider store={store}>{children}</Provider>
}
