# Testing Patterns

**Analysis Date:** 2026-07-04

## Test Framework

**Current Status:** Not detected

No test framework is configured in this project. The `package.json` includes only linting (`eslint`) and build tools (`typescript`, `tailwindcss`) — no test runner (Jest, Vitest, Playwright, Cypress) is present.

**Assertion Library:** Not applicable

**Run Commands:**
```bash
npm run lint      # ESLint check only
npm run dev       # Development server (no test runner)
npm run build     # Build (TypeScript compilation)
```

## Test File Organization

**Test Files:** None found in source code

- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files in `app/`, `components/`, `lib/`, or `types/` directories
- Any test files discovered are in `node_modules/` (dependencies' own test suites)

**Suggested Structure (if tests are added):**
- Co-located: `lib/__tests__/storage.test.ts` next to `lib/storage.ts`
- Or: `tests/lib/storage.test.ts` at project root

**Naming:** Not established — when tests are added, follow community conventions: `functionName.test.ts` or `functionName.spec.ts`

## Coverage

**Requirements:** Not enforced

- No coverage thresholds configured
- No coverage reporting tools present
- TypeScript strict mode (`strict: true` in `tsconfig.json`) provides some safety, but not unit test coverage

**View Coverage:** No command available

If Jest or Vitest is added later:
```bash
# Example (not yet configured)
npm run test:coverage
```

## Test Types

### Unit Tests
**Not implemented.** When added, focus on:
- `lib/storage.ts`: localStorage get/set/delete operations (mock `localStorage`)
- `lib/utils.ts`: date/age calculation functions (`catHumanAge`, `catAgeShort`, `catAgeLabel`)
- `lib/breeds.ts`: slug generation (`breedSlug`)

### Integration Tests
**Not implemented.** Would benefit from testing:
- Form submission flow in `CatForm.tsx` → storage → router redirect
- Cat list fetching on mount in `app/cats/page.tsx` → redirect if empty
- Navigation patterns across pages

### E2E Tests
**Not implemented.** Framework suggestions: Playwright or Cypress could verify:
- Full user flow: add cat → view profile → edit → delete
- Photo upload and preview rendering
- Location detection via Nominatim API
- Phone number formatting in vet section

## Mocking Strategy

**Framework:** None configured yet

**Patterns to establish (when testing is added):**

### localStorage Mocking
Example approach for `lib/storage.ts`:
```typescript
// Pseudo-code — adapt to your test runner
const mockStorage: Record<string, string> = {}

beforeEach(() => {
  mockStorage.clear()
  jest.spyOn(window, 'localStorage', 'get').mockReturnValue({
    getItem: (key) => mockStorage[key] ?? null,
    setItem: (key, value) => { mockStorage[key] = value },
    removeItem: (key) => { delete mockStorage[key] },
    // ... other localStorage methods
  })
})
```

### API Mocking
`CatForm.tsx` calls Nominatim OpenStreetMap API for location detection (line 135):
```typescript
const res = await fetch(
  `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
  { headers: { 'Accept-Language': 'en' } }
)
```
Would need mock fetch or `msw` (Mock Service Worker) to stub responses.

### Geolocation Mocking
`CatForm.tsx` uses `navigator.geolocation.getCurrentPosition()` — mock with:
```typescript
// Pseudo-code
navigator.geolocation.getCurrentPosition = jest.fn((success) => {
  success({ coords: { latitude: 37.7749, longitude: -122.4194 } })
})
```

**What NOT to Mock:**
- `Next.js` routing (`useRouter`, `useParams`) — test real navigation when possible
- Internal storage functions (`getCats`, `saveCat`) — test their contract directly
- TypeScript types — testing is runtime only

## Fixtures and Factories

**Not established.** When adding tests, create:

**Test Data Fixtures:**
```typescript
// tests/fixtures/cats.ts
export const sampleCat: Cat = {
  id: 'test-cat-1',
  name: 'Whiskers',
  breed: ['American Shorthair'],
  birthday: '2020-01-15',
  photoUrl: 'data:image/png;base64,...',
  weight: 12,
  weightUnit: 'lbs',
  createdAt: '2024-01-01T00:00:00Z',
}

export const sampleCats: Cat[] = [sampleCat, { ...sampleCat, id: 'test-cat-2', name: 'Mittens' }]
```

**Location:** Suggested `tests/fixtures/` or `tests/factories/`

## Error Handling in Tests

**Current Reality:** No error handling tests exist.

**When testing is added, cover:**
- `getCats()` handles corrupted localStorage JSON → returns `[]`
- `saveCat()` validates required fields before storage
- `CatForm.tsx` submission prevents invalid phone numbers (`isPhoneValid`)
- Location detection gracefully degrades if geolocation is denied or API fails
- Photo upload fails gracefully if file is missing or oversized

## TypeScript in Tests

**Advantages already in place:**
- Strict TypeScript (`strict: true`) catches type errors before runtime
- Type-safe props and state prevent entire categories of bugs
- `Cat` interface ensures data shape consistency

**Testing benefits:**
- Test type assertions like `expectType<Cat>()` to verify inference
- Snapshot tests will catch unintended type changes

---

*Testing analysis: 2026-07-04*

## Next Steps: Adding a Test Framework

When ready to add testing, recommended approach:

1. **Choose a framework:**
   - `jest` + `@testing-library/react` for unit/component tests
   - `vitest` (lighter, faster) as an alternative to Jest
   - `playwright` or `cypress` for E2E if full user flows need verification

2. **Install and configure:**
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest
   # Create jest.config.js and setup file
   ```

3. **Start with high-value tests:**
   - `lib/storage.ts` (pure functions, easy to test)
   - `lib/utils.ts` (date calculations)
   - `CatForm.tsx` submission logic (critical user flow)

4. **Add pre-commit hooks:**
   Consider adding `lint-staged` to run tests before commits (follow CLAUDE.md guidance on commit discipline).

5. **Reference this document** when establishing mocking and fixture patterns — build incrementally rather than enforcing full coverage immediately.
