# Engineering Notes

A running log of the decisions behind Catssistant and the concepts they rest on.
Organised by topic rather than by date, so it works as a reference.

---

## Stack

### What Vite is, and why this project doesn't use it

Vite is a **build tool**, not a framework. It does two jobs: serve code to the
browser quickly during development, and bundle it into optimised static files
for production. It is used *with* React, not instead of it.

| Piece | Responsibility |
| --- | --- |
| React | UI library — components, state, rendering |
| Vite | Dev server and bundler, nothing more |
| Next.js | Framework — bundler **plus** routing, server rendering, API routes |

Vite replaced Create React App as the default way to start a plain React app,
so it is genuinely the industry standard *for that job*. But Next.js already
includes a bundler, so the two are not both needed. Next.js is a superset:
moving from Next to Vite means giving up file-based routing and server
rendering, then hand-rolling replacements with something like React Router.

Catssistant stays on Next.js. State management, canvas rendering, charting,
performance work, and testing are all framework-agnostic — none of them needed
the migration.

### Why the framework choice barely matters for interviews

What actually gets probed for junior roles is state management, TypeScript
modelling, rendering fundamentals, performance, and testing. Build tooling is
table stakes: worth explaining in a sentence, not worth a rewrite.

---

## TypeScript and domain modelling

### Union types instead of `string`

`color?: string` accepts `"purple"` and `"Tabbby"` — both compile. Narrowing to
a union means only real values are valid and typos fail at build time:

```ts
export type CoatColor = 'Black' | 'White' | 'Gray' | 'Orange' | 'Brown' | 'Cream'
```

The everyday payoff is that the dropdown options and the type cannot drift
apart.

### Absent means unconstrained

`ProductMatch` has all-optional fields, where a missing field means "no
constraint" rather than "matches nothing":

```ts
export interface ProductMatch {
  coatLengths?: CoatLength[]
  illnesses?: string[]
  minWeightLbs?: number
}
```

A water fountain leaves everything unset and suits any cat. A slicker brush
sets `coatLengths: ['Long']`. This keeps matching a plain filter rather than a
pile of special cases.

### Embedding vs normalising

`Recommendation` embeds the whole `Product` instead of holding a `productId`.

The usual advice is to normalise — store the id, look it up — because two
copies of mutable data drift apart. That risk doesn't exist here: the catalogue
is static seed data that never changes at runtime. Embedding keeps the engine a
pure function whose output tests can assert on directly.

**Worth knowing both sides.** If the catalogue ever became editable, this
should be normalised.

### Flat fields over a generic bag

```ts
interface HealthRecord {
  weightLbs?: number   // narrows to number | undefined
}
```

A `Record<string, unknown>` bag would be more open-ended but hands back
`unknown`, forcing a check at every call site. Adding a metric later is one
more optional field.

### Put the unit in the field name

`weightLbs`, not `weight`. A bare `weight` alongside a separate `weightUnit`
invites mixing lbs and kg in one chart series — the classic symptom being a
weight graph that appears to drop 55% when someone switches their preference.

### Derived values shouldn't be stored

`LifeStage` is computed from `birthday`, never saved. A stored life stage goes
stale on its own as the cat ages. `catLifeStage()` returns `undefined` when
there is no birthday, which is meaningfully different from `'Adult'` — the
engine skips age rules rather than guessing.

The off-by-one to watch: subtract a year when this year's birthday hasn't
happened yet, otherwise a cat born in December counts as a year older for most
of the year.

---

## Data migration

Splitting `color` into `color` + `pattern` broke cats already saved in
localStorage, which might hold `color: 'Tabby'`.

```ts
function migrateCat(stored: Cat): Cat {
  const legacyPattern = LEGACY_PATTERN_VALUES.find(p => p === stored.color)
  if (!legacyPattern) return stored
  return { ...stored, color: undefined, pattern: stored.pattern ?? legacyPattern }
}
```

Two properties matter here:

**It transforms on read, not by rewriting storage.** `getCats()` stays free of
side effects; the new shape persists naturally next time a cat is saved.

**It is idempotent.** After the first pass, no `color` holds a pattern, so the
branch stops matching. Running it a thousand times equals running it once —
the property you want in any migration, since you can't control how many times
it runs.

---

## Canvas rendering

The avatar is drawn entirely with Canvas 2D primitives — no image files.

### Buffer size vs display size

A canvas has two independent sizes. Set only the CSS size and the browser
stretches a small buffer across more physical pixels, which looks soft on
retina screens.

```ts
const dpr = window.devicePixelRatio || 1
canvas.width = size * dpr          // drawing buffer, device pixels
canvas.style.width = `${size}px`   // display size, CSS pixels
ctx.scale(dpr, dpr)                // draw in CSS pixels regardless
```

This is the canvas gotcha most often asked about.

### A normalised coordinate space

A second scale sits on top of the DPR one:

```ts
ctx.scale(size / AVATAR_VIEWBOX, size / AVATAR_VIEWBOX)  // viewbox is 100
```

Every drawing function works in a fixed 100×100 box, so one code path renders a
28px icon and a 210px portrait — no branching, no per-size magic numbers.

### Path2D reused as a clip

`headPath()` returns a shape rather than drawing one. It gets filled for the
silhouette, then reused as a clipping region:

```ts
ctx.save()
ctx.clip(headPath())
// stripes and patches drawn here are trimmed to the head
ctx.restore()
```

Without this, every stripe would need its own bounds calculation.

`save()`/`restore()` push and pop the whole context state — transform, clip,
fill style, alpha. Forgetting `restore()` leaks the clip into everything drawn
afterwards.

### Draw order is the painter's algorithm

Canvas has no z-index; later draws cover earlier ones. Order in the avatar:
fur ruff → ears → head → clipped markings → face. Reorder and the face ends up
behind the skull.

### Transforms are cumulative

```ts
ctx.setTransform(1, 0, 0, 1, 0, 0)  // reset to identity first
```

Without the reset, a re-render scales on top of the previous scale and the
drawing flies off-canvas. Easy to hit when a React component re-renders.

### Tinting a bitmap (for the hand-drawn layers)

Recipe for recolouring a PNG on canvas:

```ts
octx.drawImage(img, 0, 0)
octx.globalCompositeOperation = 'multiply'      // apply colour, keep shading
octx.fillRect(0, 0, w, h)
octx.globalCompositeOperation = 'destination-in'
octx.drawImage(img, 0, 0)                       // restore the alpha mask
```

`multiply` preserves the shading in the artwork rather than flattening it, but
paints the transparent areas too — `destination-in` re-applies the original
alpha. Done on an offscreen canvas so the tint affects only that layer.

---

## Redux Toolkit

### The problem it solves here

Before the store, every page did this independently:

```tsx
const [cats, setCats] = useState<Cat[]>([])
useEffect(() => { setCats(getCats()) }, [])
```

Three pages, three private copies of the same list. Renaming a cat on the
profile page left the grid showing the old name until it remounted.

A **store** is one shared box of state living outside the component tree. One
cat list; everyone reads it; change it once and everything updates.

### Vocabulary

| Term | What it is |
| --- | --- |
| Store | The single state object. One per app. |
| Slice | A named section of it (`cats`, `schedule`, `items`) |
| Action | A message describing what happened (`catSaved`) |
| Reducer | `(state, action) => newState`. Where the change happens. |
| Selector | A function that reads one piece out |
| Thunk | A function that gets `dispatch`, for side effects |

Flow: component **dispatches** → **reducer** produces new state → **selectors**
notify only subscribed components → those re-render.

### Reducers look like they mutate, but don't

```ts
if (index >= 0) state.items[index] = cat
else state.items.push(cat)
```

Illegal in plain Redux. Redux Toolkit runs reducers through **Immer**, which
records writes against a draft and produces a new immutable object. Readable
code, immutability preserved.

### Side effects go in thunks

Reducers must be pure — same input, same output, always. A reducer touching
`localStorage` gives different results depending on when it ran, which breaks
DevTools replay. So:

```ts
export function persistCat(cat: Cat) {
  return (dispatch: AppDispatch) => {
    writeToStorage(cat)   // side effect first
    dispatch(catSaved(cat))  // then the plain action
  }
}
```

### Infer types, don't declare them

```ts
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

Adding a slice updates every selector's types automatically. Hand-writing this
shape is the standard way Redux types silently go stale.

These live in their own file so slices can import `AppDispatch` without a
circular dependency on the store. `import type` is erased at compile time, so
there's no runtime cycle either way.

### Memoise selectors that derive

```ts
export const selectCatalogById = createSelector([selectCatalog], catalog =>
  new Map(catalog.map(p => [p.id, p])),
)
```

A plain function returning a **new** array, object, or Map hands back a
different reference every call, so subscribers re-render on any state change
anywhere. `createSelector` memoises: it only recomputes when its inputs change.

Selectors that just read an existing value (`state.cats.items`) don't need it —
the reference is already stable.

**Selector factories must be memoised at the call site:**

```ts
const selectCat = useMemo(() => selectCatById(id), [id])
```

`selectCatById(id)` *returns* a selector. Calling it inline builds a new one
every render and throws away the memoisation it exists to provide.

### What doesn't belong in the store

Worth being able to argue, because "put everything in Redux" is the usual
overcorrection:

- **Form fields** — `CatForm` keeps them in `useState`. Dispatching per keystroke
  would re-render subscribers for a half-typed value nothing else needs. Only the
  *saved* cat goes in.
- **View state** — which calendar month is showing, which filters are set. It
  belongs to one screen and shouldn't survive navigating away.
- **Genuinely static data** — `lib/breeds.ts`, the option lists. Plain imports;
  nothing to keep in sync.

The real test for store membership is not "is it user-specific" but **"does it
change at runtime, and do multiple components need to see the change?"** That's
why the product catalogue is in the store despite being conceptually shared: it's
mutable, so it has the same staleness problem as anything else.

### The lint rule that confirmed it

`react-hooks/set-state-in-effect` fired five times on exactly the
read-storage-into-useState pattern the store replaced, and went silent as each
page was converted. Useful signal that the change was right rather than merely
different.

---

## React patterns

### Dependency arrays and object identity

```ts
const { color, pattern, coatLength } = cat
useEffect(() => { /* draw */ }, [color, pattern, coatLength, size])
```

Depending on `cat` would redraw on every parent render — callers build cat
objects inline, so identity changes even when the contents don't. Destructuring
the three values that actually affect the drawing fixes it, and still satisfies
the exhaustive-deps lint rule.

### Portalled tooltips and `position: fixed`

A real bug that shipped in this codebase:

```ts
// wrong — scroll counted twice
setPos({ top: rect.top + window.scrollY, left: rect.left + window.scrollX })
// right
setPos({ top: rect.top, left: rect.left })
```

`getBoundingClientRect()` returns **viewport-relative** coordinates, and
`position: fixed` positions **relative to the viewport**. Adding scroll offset
double-counts it, so the tooltip drifts further from the cursor the further
down the page you are. Scroll offset is only needed for `position: absolute`
elements in document flow.

---

## Accessibility

A `<canvas>` is opaque to screen readers — there is no DOM inside it to
announce. It needs describing explicitly:

```tsx
<canvas role="img" aria-label={`${cat.name}: ${description}`} />
```

---

## Git

### `.gitignore` doesn't untrack anything

Adding a pattern only stops *new* files matching it from being added. Files
already committed under that path keep being tracked and keep showing up in
diffs. Removing one needs `git rm --cached`.

This is why adding `*.png` left the existing brand logos and design mockups
alone, and only blocked new images.

### Ignoring a folder's contents vs the folder

Git won't descend into an excluded directory, so a negation inside one never
matches:

```gitignore
public/art-assets/           # can't un-ignore anything inside this
!public/art-assets/README.md # never applies
```

Ignoring the contents instead leaves the directory itself visible, so the
negation works:

```gitignore
public/art-assets/*
!public/art-assets/README.md
```
