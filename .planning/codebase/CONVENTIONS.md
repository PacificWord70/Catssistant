# Coding Conventions

**Analysis Date:** 2026-07-04

## Naming Patterns

**Files:**
- React components: PascalCase (`CatCard.tsx`, `BreedTag.tsx`, `CatForm.tsx`)
- Utilities and helpers: camelCase (`storage.ts`, `utils.ts`, `breeds.ts`)
- Type definitions: PascalCase (`cat.ts` contains `Cat`, `Vet` interfaces)
- Pages follow Next.js conventions: lowercase with brackets for dynamic routes (`[id]`, `[id]/edit`)

**Functions:**
- camelCase throughout (`getCats`, `saveCat`, `catHumanAge`, `catAgeShort`, `breedSlug`)
- Helper functions scoped to module level or exported from `lib/` modules
- Type guards and utility functions exported individually, not as namespaced objects

**Variables:**
- camelCase for variables and state: `cat`, `setCat`, `photoPreview`, `breedInput`, `hovered`
- Constants in ALLCAPS when they represent fixed configuration: `STORAGE_KEY`, `SCHEDULE_KEY`, `COAT_LENGTHS`, `COUNTRIES`
- Array/enum constants: ALLCAPS (`BREEDS`, `PERCHES`, `FEATURE_TABS`, `KNOWN_ILLNESSES`, `PREY_DRIVES`)

**Types:**
- Interfaces: PascalCase (`Cat`, `Vet`, `Breed`, `Props`, `CountryDef`, `ScheduleEvent`)
- Type aliases for unions: PascalCase (`CoatLength`, `EnergyLevel`, `PreyDrive`, `YesNoUnknown`, `Continent`)
- Props interfaces always named `Props` (singular) and defined at component file scope

## Code Style

**Formatting:**
- Tailwind CSS for styling — utility-first approach
- Inline styles used sparingly for dynamic positioning (e.g., `CatTree.tsx` absolute positioning)
- Custom Tailwind colors defined in config: `brand-orange`, `brand-tan`, `brand-brown`, `brand-slate`, `brand-cream`, `brand-charcoal`, `brand-pink`
- No external CSS-in-JS library used

**Linting:**
- ESLint configured via `eslint-config-next` (default Next.js config)
- Run: `npm run lint` — uses Next.js linter rules
- Strict TypeScript enabled (`strict: true` in `tsconfig.json`)
- No Prettier or custom ESLint config files present — using Next.js defaults

## Import Organization

**Order:**
1. External packages (Next.js, React, third-party)
2. Internal type imports (`import type { ... }`)
3. Internal module imports from `lib/` and `components/`
4. Local component/type imports

**Example from `CatCard.tsx`:**
```typescript
import Link from 'next/link'
import { Cat } from '@/types/cat'
import { catAgeShort } from '@/lib/utils'
import BreedTag from '@/components/BreedTag'
```

**Path Aliases:**
- `@/*` maps to repository root (configured in `tsconfig.json`)
- All imports use `@/path` notation, never relative paths like `../../../`
- This applies to: components, lib utilities, types, and app pages

## Error Handling

**Patterns:**
- `try-catch` blocks around JSON operations — see `lib/storage.ts` for `JSON.parse` safety
- Returns safe defaults on error: `getCats()` returns empty array `[]`, not throwing
- Early returns for null/undefined checks: `if (!cat) return null`
- Guard against SSR in browser APIs: `if (typeof window === 'undefined') return []`
- Form validation before submission — check required fields before `saveCat()`
- Async error handling in `CatForm.tsx` — `detectLocation()` catches Nominatim API failures with `finally` block

**Error boundaries:** None currently implemented — app crashes will propagate to browser console.

## Logging

**Framework:** No dedicated logging library. Uses browser `console` implicitly.

**Patterns:**
- No explicit logging statements observed in source code
- Development relies on browser DevTools console for debugging
- Error states render as `null` or empty states rather than logging
- No production monitoring/observability integration

## Comments

**When to Comment:**
- Section dividers using `─── Comment ───────────────────────────────────` pattern (see `CatForm.tsx` lines 12, 57, 80, 100)
- Comments mark logical sections: country data, phone formatter, helpers, component
- Inline comments for non-obvious logic: `// Reset phone prefix if phone is empty or only a dial code`
- Commented render conditions for component variants: `// Removable chip — form use`, `// Inline text — profile page`, `// Pill — card use`

**JSDoc/TSDoc:**
- Not used in current codebase
- TypeScript interfaces are self-documenting through clear naming

## Function Design

**Size:** Generally small and focused (5-20 lines is typical).

**Parameters:**
- Use object destructuring for component props: `{ cat }: Props`
- Single parameter for utilities unless multiple related values
- Generic type constraints for reusable functions: `updateField<K extends keyof Cat>`

**Return Values:**
- Functions return typed values: `Cat | undefined`, `string`, `void`
- No implicit `undefined` — explicitly return `[]` or `null` for empty states
- React components return JSX or `null` (not undefined)

## Module Design

**Exports:**
- Named exports for utilities: `export function getCats()`, `export const BREEDS`
- Default export for React components: `export default function CatCard()`
- Type-only exports: `export interface Cat`, `export type CoatLength`

**Barrel Files:**
- Not used — imports reference specific files directly
- Example: `import { Cat } from '@/types/cat'` not from a barrel

**Constants and Data:**
- Constants at module level: `const COUNTRIES`, `const PERCHES`, `const STORAGE_KEY`
- Enums represented as `type` unions with constant arrays: `COAT_LENGTHS: CoatLength[]`
- Static data (breeds, cat attributes) in dedicated `lib/` files, imported into components as needed

## Styling Patterns

**Tailwind Classes:**
- Responsive design using Tailwind breakpoints: `sm:`, `md:`, `lg:`
- Consistent spacing: `gap-4`, `p-7`, `px-4 py-2.5`
- Rounded corners use fixed values: `rounded-2xl`, `rounded-3xl`, `rounded-xl` (design system tokens)
- Hover states: `hover:shadow-md`, `hover:bg-brand-orange/90`, `hover:underline`
- Transitions for interactive elements: `transition-colors`, `transition-all duration-200`

**Input Classes:**
- Standard input pattern defined as const string (see `CatForm.tsx` line 234):
  ```typescript
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white'
  ```

## Client/Server Boundaries

**Page Components:**
- Pages using hooks, router, or browser APIs must have `'use client'` at the top
- Example: `app/cats/page.tsx`, `app/cats/[id]/page.tsx`, `app/cats/new/page.tsx`
- Pages without interactivity can be Server Components (not observed yet)

**Storage Access:**
- `lib/storage.ts` is the single source of truth for localStorage mutations
- Components must import from storage, never write `localStorage` directly
- Storage functions guard against SSR with `typeof window === 'undefined'`

---

*Convention analysis: 2026-07-04*
