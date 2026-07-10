---
phase: 260710-gvo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - components/NavBar.tsx
  - components/motion/Reveal.tsx
  - components/motion/Parallax.tsx
  - components/motion/HoverLift.tsx
  - app/page.tsx
  - app/cats/page.tsx
  - app/schedule/page.tsx
  - components/CatCard.tsx
  - app/globals.css
autonomous: true
requirements: [DESIGN-MOTION]

must_haves:
  truths:
    - "The navbar shows a smoothly sliding indicator (pill) that follows the active nav item and moves to whichever item is hovered."
    - "The navbar shrinks (reduced height/padding, higher-opacity/blurred background) once the page is scrolled and returns to full size at the top."
    - "Major content sections on home, cats list, and schedule fade/slide into view as they enter the viewport."
    - "Decorative imagery moves with a subtle parallax offset on scroll."
    - "Buttons and cards across the app show a consistent, subtle hover lift/scale/glow — not just one special element."
    - "All existing functionality is unchanged: links route correctly, the More menu opens/closes, home still early-returns null, cats/schedule data and forms work exactly as before."
    - "Users with prefers-reduced-motion get a calmed/instant experience with no motion transforms."
  artifacts:
    - "framer-motion listed in package.json dependencies"
    - "components/NavBar.tsx with a layoutId sliding indicator + scroll-shrink behavior"
    - "components/motion/Reveal.tsx, components/motion/Parallax.tsx, components/motion/HoverLift.tsx"
    - "app/page.tsx, app/cats/page.tsx, app/schedule/page.tsx wired with reveal/parallax"
    - "components/CatCard.tsx with Framer Motion hover"
    - "app/globals.css with reduced-motion-aware .hover-lift utility"
  key_links:
    - "The sliding indicator uses a single motion element with a shared layoutId so Framer Motion animates it between items — if the layoutId is not shared across links, the pill will not slide."
    - "Every file using Framer Motion hooks/components must be a client component ('use client') — a missing directive is a build error."
    - "prefers-reduced-motion must be honored via useReducedMotion() in each primitive and a media-query reset in globals.css — otherwise an accessibility regression."
    - "The navbar must be sticky for shrink-on-scroll to be observable; it must still early-return null on '/'."
---

<objective>
Add a modern, animated navbar and tasteful scroll/hover interaction polish across the Catssistant web app using Framer Motion, on the design-experiment branch. This is a purely presentational/interaction-layer change: no data handling, storage, routing, or component business logic changes.

Purpose: Elevate the perceived quality and modernity of the UI (sliding active indicator, shrink-on-scroll navbar, in-view reveals, subtle parallax, consistent hover micro-interactions) without altering behavior — a reviewable proposal on a throwaway experimental branch.

Output: framer-motion dependency added; NavBar animated; three reusable motion primitives (Reveal, Parallax, HoverLift); scroll reveals + parallax on home/cats/schedule; consistent site-wide hover treatment on cards and key buttons; reduced-motion respected throughout.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260710-f7b-overhaul-the-visual-design-of-the-catssi/260710-f7b-SUMMARY.md

# Current interaction-layer surfaces this plan modifies
@components/NavBar.tsx
@components/CatCard.tsx
@components/CatTree.tsx
@app/page.tsx
@app/cats/page.tsx
@app/schedule/page.tsx
@app/layout.tsx
@app/globals.css
@tailwind.config.ts
@package.json

# Notes carried from prior design-experiment work (260710-f7b):
# - This worktree has an in-progress, uncommitted Next.js 14->16 upgrade by another
#   contributor: package.json / package-lock.json / tsconfig.json / next-env.d.ts show as
#   modified. `npm run lint` and `npm run build` are broken by that version drift.
# - Reliable gate is `npx tsc --noEmit` (+ targeted greps). `npx next build` works directly
#   but may auto-migrate tsconfig.json / next-env.d.ts — restore those if touched, they are
#   out of scope for this plan.
# - Only the framer-motion addition belongs to this plan; do NOT stage the unrelated Next
#   upgrade edits already present in package.json / package-lock.json.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Framer Motion and build the animated navbar</name>
  <files>package.json, package-lock.json, components/NavBar.tsx</files>
  <action>
Install framer-motion as a runtime dependency (React 18-compatible v11 line) via `npm install framer-motion`. Confirm it lands in package.json `dependencies` and package-lock.json. Do NOT stage or modify the unrelated in-progress Next.js 14->16 changes already present in package.json / package-lock.json / tsconfig.json / next-env.d.ts — only the framer-motion addition belongs to this task (see the 260710-f7b SUMMARY for the version-drift context).

Rework components/NavBar.tsx (keep the top-of-file 'use client'):

- Extract the four primary links into a data array preserving the EXACT existing hrefs/labels: Home '/', My Cats '/cats', Schedule '/schedule', Shopping '/shopping'. Keep the "+ Add Cat" '/cats/new' CTA and the More menu (MORE_LINKS) exactly as they are in behavior and markup.
- Animated active/hover indicator: add a `hoveredHref` state. The indicator target = hoveredHref ?? the active href derived from `usePathname()`. Inside whichever primary link is the current indicator target, render a single `motion.span` positioned behind the label (absolute inset-0, rounded-lg, a translucent white fill such as bg-white/15) carrying a shared `layoutId="navIndicator"` so Framer Motion's shared-layout animation slides the pill between items. Use a spring transition (roughly stiffness 380, damping 30). Set `onMouseEnter`/`onMouseLeave` per link to update/clear hoveredHref. Because only one link renders the layoutId element at a time, the pill animates to the new position on change.
- Shrink-on-scroll: make the nav `sticky top-0 z-50` (so it stays visible while scrolling). Add a `scrolled` boolean state driven by a passive window scroll listener (scrolled = window.scrollY > 8), registered/cleaned up in a useEffect. When scrolled: reduce the inner bar height (h-16 -> h-14) and the logo height (34 -> 28), and switch the background from `bg-brand-orange shadow-md` to `bg-brand-orange/95 backdrop-blur-md shadow-card`. Drive the size/opacity change with CSS transitions (transition-all) and/or a motion.nav so it eases smoothly.
- Reduced motion: call `useReducedMotion()`. When true, still apply the scrolled/active state changes but render them without spring/layout animation (instant) so motion-sensitive users get a calm experience.
- Preserve EXACTLY: the `if (pathname === '/') return null` early return; the click-outside `useEffect` that closes the More menu; every href, label, the `aria-label="More"` button, the three-bar hamburger icon, and the More dropdown markup/behavior; CatssistantLogo usage.

Do not touch app/layout.tsx — sticky positioning on the nav element is sufficient.
  </action>
  <verify>
    <automated>npx tsc --noEmit && node -e "process.exit(require('./package.json').dependencies['framer-motion']?0:1)" && grep -q "layoutId" components/NavBar.tsx && grep -q "sticky" components/NavBar.tsx && grep -q "useReducedMotion" components/NavBar.tsx</automated>
  </verify>
  <done>framer-motion is in package.json dependencies; the navbar renders a single shared-layoutId indicator that follows the active/hovered primary link and the bar compresses + gains background opacity/blur on scroll; the '/' early return, More menu, click-outside, and all hrefs/labels are unchanged; tsc clean.</done>
</task>

<task type="auto">
  <name>Task 2: Motion primitives + scroll reveal/parallax on key pages</name>
  <files>components/motion/Reveal.tsx, components/motion/Parallax.tsx, app/page.tsx, app/cats/page.tsx, app/schedule/page.tsx</files>
  <action>
Create two reusable client primitives (each begins with 'use client'):

- components/motion/Reveal.tsx: renders a `motion.div` with initial { opacity: 0, y: 24 }, whileInView { opacity: 1, y: 0 }, viewport { once: true, amount: 0.2 }, transition { duration: 0.5, ease: 'easeOut' }. Accept props: children, className, and optional `delay` (fed into transition.delay for staggering). Call `useReducedMotion()`; when true, render children with no offset and no animation (fully visible immediately). Because viewport.once is true, revealed content never re-hides and stays interactive.
- components/motion/Parallax.tsx: uses `useScroll()` + `useTransform()` to map scroll progress to a small vertical translate (about 20-40px range) on a `motion.div`. Accept props: children, className, and an optional `speed`/`offset` to tune magnitude. Guard with `useReducedMotion()`; when true, apply no transform.

Wire the primitives into the key pages WITHOUT changing any data/routing/handler logic:

- app/page.tsx (Home, currently a server component rendering CatTree): import the client Reveal and Parallax wrappers (a server component may render client components and pass CatTree as children). Wrap `<CatTree />` so the card gently reveals and receives a subtle parallax offset on scroll. Keep the existing outer div's inline margin/minHeight. Do NOT add 'use client' to page.tsx and do NOT modify components/CatTree.tsx internals. (Home is short so parallax is subtle by design.)
- app/cats/page.tsx: wrap the page-shell heading block and each CatCard (or the grid container) in Reveal, giving the cards an incremental `delay` for a staggered entrance. Do NOT change getCats, the onboarding redirect, `if (!loaded) return null`, or the `cats.map` data flow — wrap presentation only.
- app/schedule/page.tsx: wrap the header block, the ScheduleCalendar, and the selected-day event-list section in Reveal. Do NOT touch any state, handlers (handleSave/handleDelete/shiftMonth/goToday), storage calls, buildMonthGrid usage, or `if (!loaded) return null`.

Keep all reveals `once: true` so content is never left hidden or non-interactive after animating in.
  </action>
  <verify>
    <automated>npx tsc --noEmit && test -f components/motion/Reveal.tsx && test -f components/motion/Parallax.tsx && grep -q "whileInView" components/motion/Reveal.tsx && grep -q "useTransform" components/motion/Parallax.tsx && grep -q "useReducedMotion" components/motion/Reveal.tsx && grep -q "useReducedMotion" components/motion/Parallax.tsx && grep -q "@/components/motion/Reveal" app/cats/page.tsx && grep -q "@/components/motion/Reveal" app/schedule/page.tsx</automated>
  </verify>
  <done>Reveal and Parallax primitives exist, use whileInView / useScroll+useTransform respectively, and both honor useReducedMotion; home, cats list, and schedule reveal their major sections on scroll with subtle parallax on decorative imagery; no data/routing/handler logic changed; tsc clean.</done>
</task>

<task type="auto">
  <name>Task 3: Site-wide hover micro-interactions on cards and buttons</name>
  <files>components/motion/HoverLift.tsx, components/CatCard.tsx, app/globals.css, app/cats/page.tsx, app/schedule/page.tsx</files>
  <action>
Create components/motion/HoverLift.tsx ('use client'): a `motion.div` wrapper with whileHover { y: -2, scale: 1.02 } and whileTap { scale: 0.98 }, a snappy spring transition, accepting children + className. Call `useReducedMotion()`; when true, apply no hover/tap transform.

To reach the long tail of plain `<button>`/`<Link>` elements consistently without wrapping every one in a motion component, ALSO add reusable utility classes to app/globals.css:
- `.hover-lift`: a transition on transform + box-shadow; on :hover translateY(-2px) with an elevated shadow plus a soft brand-orange glow (reuse the shadow-card feel); on :active translateY(0) scale(.98). Keep the lift distance/scale identical to HoverLift so the whole app reads as one system.
- Wrap the transform rules in an `@media (prefers-reduced-motion: reduce)` block that resets transform to none, so motion-sensitive users get no movement.

Apply the hover treatment broadly and consistently (presentation-only, className changes and wrapping only — never alter onClick/href/data):
- components/CatCard.tsx: convert the inner card div from the current CSS `group-hover:-translate-y-0.5` / `group-hover:shadow-card` to a Framer Motion hover (via HoverLift or a direct motion.div with whileHover) giving the same subtle lift + glow. Keep the Link wrapper, image, breed tags, and all data rendering identical.
- app/cats/page.tsx: apply `.hover-lift` to the "+ Add Cat" CTA.
- app/schedule/page.tsx: apply `.hover-lift` to the "+ Add Event" CTA and to the selected-day event-list item buttons.

The effect must be subtle and identical everywhere (same lift/scale/glow) so it feels site-wide, not like a couple of special elements.
  </action>
  <verify>
    <automated>npx tsc --noEmit && test -f components/motion/HoverLift.tsx && grep -q "whileHover" components/motion/HoverLift.tsx && grep -q "useReducedMotion" components/motion/HoverLift.tsx && grep -q "hover-lift" app/globals.css && grep -q "prefers-reduced-motion" app/globals.css && grep -Eq "whileHover|HoverLift" components/CatCard.tsx</automated>
  </verify>
  <done>HoverLift primitive and the reduced-motion-aware .hover-lift utility exist; CatCard and the key CTAs/event-item buttons show a consistent subtle lift/scale/glow on hover; no click/route/data behavior changed; tsc clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry -> local build | A new third-party package (framer-motion) is installed and executes at build/runtime |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-gvo-SC | Tampering | `npm install framer-motion` | low | accept | framer-motion is a first-tier, widely-used animation library (tens of millions of weekly downloads, published by Framer; verify at npmjs.com/package/framer-motion). Install is user-approved for this experimental branch. Not [ASSUMED]/[SUS]/[SLOP] — no blocking checkpoint required. Pin to the installed version in package-lock.json. |
| T-gvo-01 | Denial of Service | scroll/parallax listeners | low | mitigate | Use passive scroll handling and Framer Motion's own useScroll/whileInView (no heavy per-frame layout thrash); primitives honor prefers-reduced-motion to avoid motion-triggered discomfort. |
</threat_model>

<verification>
- `npx tsc --noEmit` is clean across all edits (primary gate — `npm run lint`/`npm run build` may fail due to the pre-existing Next 14->16 version drift in this worktree; see the 260710-f7b SUMMARY).
- framer-motion is present in package.json `dependencies`; the unrelated in-progress Next upgrade edits are NOT staged as part of this plan's commits.
- If a full build check is desired, run `npx next build` directly; if it auto-migrates tsconfig.json / next-env.d.ts, restore those files (they belong to the separate in-progress upgrade and are out of scope here).

Human smoke check (design-experiment review by Heidi): run `npm run dev`, then on `/cats` and `/schedule`:
- Scroll down — the navbar shrinks and its background gains opacity/blur; scroll back up — it restores.
- Hover the primary nav items — the pill slides smoothly to the hovered item; the active item keeps the pill at rest.
- Scroll the page — sections fade/slide into view; decorative imagery drifts subtly (parallax).
- Hover cards and the Add Cat / Add Event buttons — a consistent subtle lift/glow.
- Confirm nothing regressed: all nav links route correctly, the More menu opens/closes and closes on outside click, `/` still shows the cat-tree home with no navbar, and the add-cat / add-event forms still open, save, and display data exactly as before.
- Enable the OS "reduce motion" setting and reload — animations should calm to instant with no transforms.
</verification>

<success_criteria>
- framer-motion added to dependencies (only that dependency change belongs to this plan).
- Navbar: sliding shared-layoutId active/hover indicator + shrink-on-scroll (height/padding down, background opacity/blur up), while `/` early-return, More menu, click-outside, and all hrefs/labels are preserved.
- Reveal + Parallax primitives created and applied to home, cats list, and schedule for in-view fade/slide + subtle parallax on decorative imagery.
- HoverLift primitive + `.hover-lift` utility created and applied so cards (CatCard) and key buttons share a consistent subtle lift/scale/glow site-wide.
- prefers-reduced-motion honored in all three primitives and in globals.css.
- No data handling, storage, routing, or business-logic changes; all existing functionality works unchanged.
- `npx tsc --noEmit` passes.
</success_criteria>

<output>
Create `.planning/quick/260710-gvo-implement-modern-navbar-animated-active-/260710-gvo-SUMMARY.md` when done.
</output>
