---
phase: quick-260717-gbs
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - types/item.ts
  - lib/itemAttributes.ts
  - lib/itemStorage.ts
  - components/ItemForm.tsx
  - app/items/page.tsx
  - components/NavBar.tsx
autonomous: true
requirements: [QUICK-260717-gbs]

must_haves:
  truths:
    - "'My Items' appears in the site nav and routes to /items"
    - "Visiting /items renders a table of household items, or a friendly empty state when none exist (no redirect)"
    - "Default table view shows only current items, with Food/Litter/Medication categories grouped ahead of Toy/Tool/Other"
    - "User can filter rows by category and by status (current / past / all)"
    - "User can sort rows by product name and by category"
    - "User can add an item: create a new catalog product OR pick an existing one, then create a usage record tagged to zero or more cats"
    - "User can mark a current item as past, which sets status='past' and records a dateEnded"
  artifacts:
    - types/item.ts
    - lib/itemAttributes.ts
    - lib/itemStorage.ts
    - components/ItemForm.tsx
    - app/items/page.tsx
  key_links:
    - "HouseholdItem.productId references CatalogProduct.id (joined at render time on the items page)"
    - "HouseholdItem.catIds references existing Cat.id values"
    - "ItemForm onSave routes through lib/itemStorage.ts (saveCatalogProduct + saveHouseholdItem) — never writes localStorage directly"
    - "NavBar MORE_LINKS entry links to the /items route"
---

<objective>
Add a nav-accessible "My Items" page for tracking cat care products/gear, backed by a two-tier localStorage data model: a shared, extensible product catalog and per-household item-usage records that reference catalog products by id, tag cat(s), carry a current/past status, and optional start/end dates.

Purpose: Give owners a central record of the products they use for their cats. The catalog is shaped generically so it can later power a Shopping page and product detail pages — but only the catalog + minimal CRUD needed for THIS feature is built now.

Output: New types file, new localStorage layer (purely additive — existing Cat / ScheduleEvent storage untouched), an add/edit item modal, a filterable/sortable table page at /items, and a nav link.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Storage pattern to mirror exactly (SSR guard, try/catch, safe [] defaults, get/getById/save/delete)
@lib/storage.ts

# Type conventions to follow (PascalCase interfaces, string-literal unions, camelCase fields, id + createdAt)
@types/scheduleEvent.ts

# Page shell + load pattern to mirror (use client, useEffect load, loaded flag, Reveal, brand tokens)
@app/schedule/page.tsx

# Modal pattern to mirror (createPortal, fixed overlay, onSave/onCancel/onDelete props, inputClass, crypto.randomUUID())
@components/ScheduleEventForm.tsx

# Nav structure to extend (PRIMARY_LINKS vs MORE_LINKS)
@components/NavBar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Data layer — item types, category attributes, and localStorage functions</name>
  <files>types/item.ts, lib/itemAttributes.ts, lib/itemStorage.ts</files>
  <action>
Create three new files. Do NOT touch types/cat.ts, types/scheduleEvent.ts, or lib/storage.ts — this task is purely additive.

types/item.ts — define the two-tier model following the exact interface conventions in types/scheduleEvent.ts (PascalCase interfaces, string-literal union types, camelCase fields, id + createdAt on every record):
- Export type ProductCategory as a string-literal union of the six top-level categories in priority order: Food, Litter, Medication, Toy, Tool, Other.
- Export interface CatalogProduct with fields: id (string), name (string), brand (optional string), category (ProductCategory), subCategory (optional string — free-text finer distinction such as "Wet Food" / "Dry Food"), createdAt (string ISO). Keep the shape generic and extensible; do not add Shopping-specific fields now.
- Export type ItemStatus as the union 'current' | 'past'.
- Export interface HouseholdItem with fields: id (string), productId (string — references CatalogProduct.id), status (ItemStatus), dateStarted (optional string ISO date), dateEnded (optional string ISO date — only meaningful when status is 'past'), catIds (string array referencing existing Cat.id values, may be empty), notes (optional string), createdAt (string ISO).

lib/itemAttributes.ts — mirror the constant-catalog style of lib/scheduleAttributes.ts:
- Import ProductCategory from '@/types/item'.
- Export PRODUCT_CATEGORIES as a ProductCategory[] listing all six in priority order (Food, Litter, Medication, Toy, Tool, Other) — used to populate the category select and to derive grouping.
- Export CATEGORY_ORDER as a Record<ProductCategory, number> mapping each category to its rank (Food 0, Litter 1, Medication 2, Toy 3, Tool 4, Other 5) so the page can sort/group with Food/Litter/Medication surfaced first.

lib/itemStorage.ts — mirror lib/storage.ts EXACTLY (same SSR guard, same try/catch around JSON.parse, same safe empty-array default, same find-by-id-then-update-or-push save, same filter-out delete). Import CatalogProduct and HouseholdItem from '@/types/item'. Define two module-level key constants: CATALOG_KEY set to 'catssistant_catalog_products' and ITEMS_KEY set to 'catssistant_household_items'. Export these functions:
- getCatalogProducts(): CatalogProduct[]
- getCatalogProductById(id: string): CatalogProduct | undefined
- saveCatalogProduct(product: CatalogProduct): void
- deleteCatalogProduct(id: string): void
- getHouseholdItems(): HouseholdItem[]
- getHouseholdItemById(id: string): HouseholdItem | undefined
- saveHouseholdItem(item: HouseholdItem): void
- deleteHouseholdItem(id: string): void
Use @/ import paths only (never relative). Every read function must guard with typeof window === 'undefined' returning [], and wrap JSON.parse in try/catch returning [] on failure.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "getHouseholdItems" lib/itemStorage.ts && grep -q "saveCatalogProduct" lib/itemStorage.ts && grep -q "ProductCategory" types/item.ts && grep -q "CATEGORY_ORDER" lib/itemAttributes.ts</automated>
  </verify>
  <done>All three files exist and compile under strict TypeScript. itemStorage exports all eight functions and follows the SSR-guarded, try/catch, safe-default pattern of lib/storage.ts. HouseholdItem.productId, status, catIds, dateStarted, dateEnded and notes match the required shape. Existing Cat/ScheduleEvent files are unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: ItemForm modal — add/edit a household item with new-or-existing catalog product</name>
  <files>components/ItemForm.tsx</files>
  <action>
Create components/ItemForm.tsx as a 'use client' component that mirrors the modal structure of components/ScheduleEventForm.tsx: render via createPortal into document.body inside a fixed inset-0 z-50 overlay (bg-black/40, click-overlay-to-cancel) wrapping an inner panel with classes bg-white rounded-3xl p-7 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto that stops click propagation. Reuse the same inputClass string used in ScheduleEventForm ('w-full px-4 py-2.5 rounded-2xl border border-brand-tan/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white') and the same brand-token label styling.

Props interface (named Props): cats (Cat[]), products (CatalogProduct[]), existing (optional HouseholdItem — edit mode), onSave (callback receiving the built HouseholdItem and an optional newly-created CatalogProduct), onCancel (callback), onDelete (optional callback shown only in edit mode). Import Cat from '@/types/cat', and CatalogProduct, HouseholdItem, ProductCategory, ItemStatus from '@/types/item', and PRODUCT_CATEGORIES from '@/lib/itemAttributes'.

Product source: in ADD mode, offer a toggle between "Pick existing product" and "Add new product". Pick-existing shows a native select listing each catalog product as "name — brand" (fall back to just name when brand is empty); default the toggle to "Add new" when the catalog is empty. Add-new shows: name (text, required), brand (text, optional), category (select populated from PRODUCT_CATEGORIES, required, default Food), subCategory (text, optional, placeholder hinting free-text like "Wet Food"). In EDIT mode, the product is fixed to the existing item's product — display its name read-only and only edit the usage fields below.

Usage fields (both modes): status as a select or radio pair for current / past (default current); dateStarted (date input, optional); dateEnded (date input, optional) shown only when status is past; a cats checkbox grid over the cats prop (following the checkbox grid pattern in ScheduleEventForm — catIds may be left empty); notes (textarea, optional).

On submit: validate that a product is resolved — in add-new require a non-empty name and a category; in pick-existing require a selected productId. If adding a new product, build a CatalogProduct with id crypto.randomUUID(), createdAt new Date().toISOString(), and the entered name/brand/category/subCategory (omit optional fields that are empty). Build the HouseholdItem with id existing?.id ?? crypto.randomUUID(), productId set to the existing/selected/new product id, status, dateStarted or undefined, dateEnded or undefined (force undefined when status is current), catIds, notes trimmed or undefined, and createdAt existing?.createdAt ?? new Date().toISOString(). Call onSave(item, newProduct) passing the new product only when one was created. Render a Cancel button (calls onCancel), a Save button, and — only in edit mode — a Delete button wired to onDelete, matching the button styling used in ScheduleEventForm.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "createPortal" components/ItemForm.tsx && grep -q "onSave" components/ItemForm.tsx && grep -q "PRODUCT_CATEGORIES" components/ItemForm.tsx</automated>
  </verify>
  <done>ItemForm compiles, portals into document.body as a brand-styled modal, supports both add (new-or-existing product) and edit (fixed product, editable usage fields) modes, builds a CatalogProduct only when adding new, and always builds a HouseholdItem with a valid productId. dateEnded is only set when status is past. Mutations are surfaced via onSave — the component never touches localStorage directly.</done>
</task>

<task type="auto">
  <name>Task 3: My Items page (filter/sort/table) and NavBar link</name>
  <files>app/items/page.tsx, components/NavBar.tsx</files>
  <action>
Create app/items/page.tsx as a 'use client' page that mirrors the shell and load pattern of app/schedule/page.tsx: on mount load cats via getCats() (from '@/lib/storage') and load products/items via getCatalogProducts() and getHouseholdItems() (from '@/lib/itemStorage'); keep a loaded flag and return null until loaded. Wrap content in the standard shell div (bg-white rounded-3xl shadow-soft p-7 min-h-[calc(100vh-8rem)]) with a header row (flex items-center justify-between mb-7) containing an h1 (font-display text-3xl text-brand-brown) reading "My Items" and an "+ Add Item" button styled like the Add buttons on the cats/schedule pages (hover-lift px-4 py-2 bg-brand-orange text-white rounded-2xl text-sm font-semibold hover:bg-brand-orange/90 transition-colors shadow-soft). Use Reveal from '@/components/motion/Reveal' to wrap sections as the other pages do. Import ItemForm, CATEGORY_ORDER and PRODUCT_CATEGORIES from their modules, plus types from '@/types/item' and Cat from '@/types/cat'.

State: categoryFilter ('all' or a ProductCategory, default 'all'); statusFilter ('current' | 'past' | 'all', default 'current'); sortBy ('category' | 'name', default 'category'); editing (HouseholdItem | 'new' | null). Render filter/sort controls as native selects above the table (category filter populated from PRODUCT_CATEGORIES plus an "All categories" option; status filter with Current/Past/All; sort select with "Category" and "Name").

Rows: build a joined row list by mapping each HouseholdItem to its CatalogProduct via getCatalogProductById-style lookup against the loaded products (match productId to product id). Apply the status filter (default keeps only status==='current'; 'all' keeps everything). Apply the category filter (compare the joined product.category). Sort: when sortBy is 'name', sort alphabetically by product name (case-insensitive); when sortBy is 'category', sort by CATEGORY_ORDER[product.category] so Food/Litter/Medication come first, tie-broken by product name — this is the default grouping.

Table: render a semantic table (brand-styled: header row text-brand-slate, row dividers border-brand-tan/30, hover:bg-brand-tan/10, rounded container) with columns Product (product.name), Brand (product.brand or an em-dash), Category (product.category), Status, and a right-aligned actions cell. The Status column shows "Current" for current items and the formatted dateEnded for past items (format the ISO date via new Date(iso).toLocaleDateString(); if a past item has no dateEnded show "Past"). Clicking a row opens ItemForm in edit mode (set editing to that item). In the actions cell, current rows get a small "Mark past" button; clicking it (stopPropagation so it does not also open the edit modal) calls a handleMarkPast that sets the item's status to 'past' and dateEnded to today's ISO date (new Date().toISOString().slice(0,10)), saves via saveHouseholdItem, and reloads items.

Empty state: when there are zero household items in storage, render a friendly centered empty-state message (brand-styled, in the spirit of components/EmptyState.tsx) inviting the user to add their first item with a button that opens the add modal — do NOT redirect (unlike /cats). When items exist but the current filters produce zero rows, show a lightweight "No items match these filters" line instead.

Wiring: an "+ Add Item" click sets editing to 'new'. Render ItemForm when editing is non-null, passing cats, the loaded products, existing (undefined when 'new'), onCancel to clear editing, onDelete (only for a real item) that deletes via deleteHouseholdItem and reloads, and onSave(item, newProduct) that first calls saveCatalogProduct(newProduct) when a newProduct is present, then saveHouseholdItem(item), then reloads products+items and clears editing. Import the storage functions used (getCatalogProducts, getHouseholdItems, saveCatalogProduct, saveHouseholdItem, deleteHouseholdItem) from '@/lib/itemStorage'.

NavBar: in components/NavBar.tsx add a single entry { href: '/items', label: 'My Items' } to the MORE_LINKS array as its first item. Rationale: the primary bar is already at capacity (4 primary links + the Add Cat CTA + More menu), so placing My Items in the More menu keeps the primary bar and its sliding indicator uncluttered while remaining nav-accessible. Do not modify PRIMARY_LINKS or any other part of NavBar.
  </action>
  <verify>
    <automated>npx tsc --noEmit && test -f app/items/page.tsx && grep -q "/items" components/NavBar.tsx && grep -q "statusFilter" app/items/page.tsx && grep -q "CATEGORY_ORDER" app/items/page.tsx</automated>
  </verify>
  <done>Navigating to /items renders the My Items table. The default view shows only current items with Food/Litter/Medication grouped first. Category, status (current/past/all), and sort (name/category) controls change the rows as expected. "+ Add Item" opens ItemForm; saving a new-product item creates both a catalog product and a usage record and the row appears. A current item can be marked past (records dateEnded) and its Status cell then shows the formatted end date. With no items, a non-redirecting empty state is shown. "My Items" appears in the More menu and links to /items. PRIMARY_LINKS is unchanged.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user input → localStorage | Product names, brand, subCategory, and notes are free-text entered by the user and persisted to localStorage. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-gbs-01 | Tampering | ItemForm / itemStorage free-text fields | low | accept | Values are stored as data and rendered as React text nodes (auto-escaped), matching the existing app's handling of cat/schedule free-text. No dangerouslySetInnerHTML introduced. |
| T-gbs-02 | Information Disclosure | localStorage records | low | accept | Data stays client-side in the user's own browser; feature adds no network transmission and no GPS/behavioral data, consistent with the privacy-first constraint. |
| T-gbs-SC | Tampering | package installs | low | accept | No new dependencies added — feature uses only existing Next.js/React/Tailwind stack. No npm install occurs in this plan. |
</threat_model>

<verification>
- `npx tsc --noEmit` passes with all new files present (strict mode, no type errors).
- Manual smoke on the design-experiment branch (`npm run dev`, visit http://localhost:3000/items):
  1. With no items, the empty state shows (no redirect); "+ Add Item" opens the modal.
  2. Add an item via "Add new product" (e.g. name + category Food) tagged to a cat — the row appears under the default current view.
  3. Category, status, and sort selects change the visible rows; default view keeps only current items with Food/Litter/Medication first.
  4. "Mark past" on a current row moves it to past status and its Status cell shows a formatted end date; switching the status filter to Past reveals it.
  5. "My Items" is present in the More menu and links to /items.
- Existing Cat and Schedule pages/data behave unchanged (purely additive: lib/storage.ts and existing types untouched).
</verification>

<success_criteria>
- Two-tier model implemented: CatalogProduct (id, name, brand?, category, subCategory?, createdAt) and HouseholdItem (id, productId, status, dateStarted?, dateEnded?, catIds, notes?, createdAt), persisted via a new lib/itemStorage.ts that mirrors lib/storage.ts.
- /items page delivers table view, default current-only filtering, Food/Litter/Medication-first grouping, category+status filters, name+category sorts, add flow (new or existing product), and mark-past with end-date.
- "My Items" reachable from the nav.
- No changes to existing Cat/ScheduleEvent data, types, or storage. Conventions followed (camelCase, @/ imports, brand-* tokens, rounded-3xl/shadow-soft, createPortal modal).
</success_criteria>

<output>
Create `.planning/quick/260717-gbs-add-a-my-items-page-nav-accessible-for-t/260717-gbs-SUMMARY.md` when done.
</output>
