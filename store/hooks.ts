import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/types'

/**
 * Typed wrappers around the react-redux hooks. Use these, never the raw ones.
 *
 * The plain `useSelector` types its state argument as `unknown`, so every call
 * site would need its own annotation. `useAppSelector` knows the real shape, so
 * `state.cats.items` autocompletes and a typo like `state.cat.items` fails to
 * compile.
 *
 * `useAppDispatch` matters for thunks: the default dispatch type only accepts
 * plain action objects and rejects the functions our thunks return.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
