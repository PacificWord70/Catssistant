---
phase: 260710-gvo
plan: 01
subsystem: web-ui-motion
tags: [navbar, framer-motion, scroll-reveal, parallax, hover, design-experiment]
dependency graph:
  requires: []
  provides: [DESIGN-MOTION]
  affects: [components/NavBar.tsx, components/CatCard.tsx, app/page.tsx, app/cats/page.tsx, app/schedule/page.tsx, app/globals.css]
tech-stack:
  added: [framer-motion@^12.42.2]
  patterns: [shared layoutId sliding indicator, whileInView scroll reveal, useScroll/useTransform parallax, whileHover/whileTap hover-lift, prefers-reduced-motion guards]
key-files:
  created:
    - components/motion/Reveal.tsx
    - components/motion/Parallax.tsx
    - components/motion/HoverLift.tsx
  modified:
    - package.json
    - package-lock.json
    - components/NavBar.tsx
    - components/CatCard.tsx
    - app/page.tsx
    - app/cats/page.tsx
    - app/schedule/page.tsx
    - app/globals.css
decisions:
  - "Installed framer-motion@^12.42.2 (React 18/19-compatible peer range) rather than pinning to a v11 line, since v12 is the current npm-resolved release and its peerDependencies (react ^18.0.0 || ^19.0.0) satisfy this project's React 18.3.1."
  - "Isolated the framer-motion dependency commit from the pre-existing, unrelated in-progress Next.js 14->16 upgrade by temporarily reverting package.json/package-lock.json to HEAD + framer-motion only, committing that, then restoring the working tree to the upgrade-plus-framer-motion state (uncommitted, as found)."
metrics:
  duration: ~55 min
  completed: 2026-07-10
status: complete
---

# Phase 260710-gvo Plan 01: Modern animated navbar + motion polish Summary

Added Framer Motion-powered interaction polish across the Catssistant web app: a sliding shared-layoutId nav indicator with shrink-on-scroll navbar, reusable Reveal/Parallax/HoverLift primitives, scroll-triggered reveals on home/cats/schedule, and a consistent site-wide hover-lift treatment on cards and key buttons — all presentation-only, with prefers-reduced-motion honored throughout.

## What Was Built

**Task 1 — Animated navbar (commit a9f7e76)**
- Installed `framer-motion` as a runtime dependency.
- Reworked `components/NavBar.tsx`: primary links now render a `motion.span` with `layoutId="navIndicator"` behind whichever link is hovered (or, absent hover, the active pathname), animated with a spring (`stiffness: 380, damping: 30`).
- Nav is now `sticky top-0 z-50`; a passive scroll listener toggles a `scrolled` state that shrinks bar height (h-16 → h-14), logo height (34 → 28), and switches background from `bg-brand-orange shadow-md` to `bg-brand-orange/95 backdrop-blur-md shadow-card`, eased via `transition-all duration-200`.
- `useReducedMotion()` disables the shared layoutId animation (indicator still shows, just without spring motion) when the OS setting is on.
- Preserved exactly: the `/` early return, the More-menu click-outside effect, `aria-label="More"`, all hrefs/labels, hamburger icon, and CatssistantLogo usage.

**Task 2 — Motion primitives + scroll reveal/parallax (commit b43916a)**
- `components/motion/Reveal.tsx`: `motion.div` fading/sliding in on `whileInView` (`once: true, amount: 0.2`), falls back to a plain always-visible `div` under reduced motion.
- `components/motion/Parallax.tsx`: `useScroll` + `useTransform` maps scroll progress to a small vertical translate (default ±30px), disabled under reduced motion.
- `app/page.tsx`: wraps `<CatTree />` in `Reveal` + `Parallax` (server component still renders the client wrappers as children — no `'use client'` added to the page).
- `app/cats/page.tsx`: heading/CTA row and each `CatCard` wrapped in `Reveal` with an incremental per-card `delay` for a staggered grid entrance.
- `app/schedule/page.tsx`: header row, `ScheduleCalendar`, and the selected-day event list each wrapped in `Reveal` with staggered delays. No state/handler/storage logic touched.

**Task 3 — Site-wide hover-lift (commit 652211a)**
- `components/motion/HoverLift.tsx`: reusable `whileHover`/`whileTap` spring wrapper, reduced-motion aware.
- `app/globals.css`: added a `.hover-lift` utility (translateY(-2px) scale(1.02) + soft shadow/brand-orange-tinted glow on hover, scale(0.98) on active) matching HoverLift's feel, reset to `transform: none` inside `@media (prefers-reduced-motion: reduce)`.
- `components/CatCard.tsx` converted from CSS `group-hover:-translate-y-0.5`/`group-hover:shadow-card` to a `motion.div` with the same lift/scale via `whileHover`/`whileTap` (guarded by `useReducedMotion()`); became a client component (`'use client'` added).
- Applied `.hover-lift` to the "+ Add Cat" CTA (`app/cats/page.tsx`), the "+ Add Event" CTA, and each selected-day event-list item button (`app/schedule/page.tsx`).

## Verification

- `npx tsc --noEmit` — clean after every task and at final state.
- `npx next build` (Turbopack, Next 16.2.10) — compiled successfully, all 13 routes generated, no errors.
- All plan-specified automated grep/node checks passed for all three tasks (`layoutId`, `sticky`, `useReducedMotion` in NavBar; `whileInView`/`useTransform`/`useReducedMotion` in the primitives + import references in cats/schedule pages; `whileHover`, `hover-lift`, `prefers-reduced-motion` for Task 3).
- Confirmed via grep that NavBar's `/` early return, More-menu markup, `aria-label="More"`, click-outside effect, and all hrefs/labels are unchanged.
- Confirmed `tsconfig.json` and `next-env.d.ts` are byte-identical to their pre-execution (in-progress-upgrade) state — `npx next build` did touch `next-env.d.ts` transiently (dev vs. build route-types path) and it was restored afterward, per the plan's explicit guidance.

Human smoke check (scroll shrink, sliding pill, reveal/parallax, hover-lift, reduced-motion toggle) is still pending — this is a design-experiment branch for Heidi's visual review, not an autonomous UAT gate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Stale `.next` build cache broke `tsc --noEmit`**
- **Found during:** Task 1, first `tsc` run after installing framer-motion.
- **Issue:** A leftover `.next/dev/types/validator.ts` (generated by a prior `next dev`/build run under a different Next version) referenced `next/types.js`, which no longer resolved, producing a spurious `tsc` error unrelated to any code change in this plan.
- **Fix:** Removed the gitignored `.next/` directory (regenerated automatically by Next.js); re-ran `tsc --noEmit` clean.
- **Files modified:** none (generated artifact only).
- **Commit:** n/a (not tracked).

**2. [Rule 3 - Blocking issue] npm peer-dependency conflict on `framer-motion` install**
- **Found during:** Task 1, `npm install framer-motion`.
- **Issue:** The worktree's pre-existing, uncommitted Next 14→16 upgrade already bumped `eslint-config-next` to a version requiring `eslint@>=9`, while `eslint@^8` remains installed — a pre-existing conflict (documented in the plan's carried-forward notes), not something this plan introduced.
- **Fix:** Used `npm install framer-motion --legacy-peer-deps` to bypass the pre-existing, unrelated conflict; confirmed framer-motion's own peerDependencies (`react ^18.0.0 || ^19.0.0`) are satisfied natively.
- **Files modified:** package.json, package-lock.json (framer-motion entries only — see isolation note below).
- **Commit:** a9f7e76.

**3. [Rule 3 - Blocking issue] Isolating the framer-motion dependency change from the in-progress Next upgrade**
- **Found during:** Task 1, staging.
- **Issue:** `npm install` recorded framer-motion into the *same* `package.json`/`package-lock.json` that already carried the unrelated, uncommitted Next 14→16 bump (`next`, `eslint-config-next`), so a naive `git add` would have swept the out-of-scope upgrade into this plan's commit.
- **Fix:** Temporarily reverted `package.json`/`package-lock.json` to their HEAD (pre-upgrade) content plus only the `framer-motion` dependency line, ran `npm install --legacy-peer-deps` to regenerate a lockfile scoped to exactly that change, committed it, then restored the working tree to the original (Next 16 + framer-motion) uncommitted state the developer had before this plan started, and re-ran `npm install` so `node_modules` matches. Verified via `git diff package.json` that the only remaining unstaged diff is the pre-existing `next`/`eslint-config-next` version bump.
- **Files modified:** package.json, package-lock.json.
- **Commit:** a9f7e76 (framer-motion only; Next upgrade remains uncommitted, untouched, exactly as found).

**4. [Rule 3 - Blocking issue] `next build` transiently rewrote `next-env.d.ts`**
- **Found during:** post-Task-3 optional `npx next build` smoke check.
- **Issue:** Running a production build regenerated `next-env.d.ts` with a build-mode route-types path (`./.next/types/routes.d.ts`) instead of the dev-mode path (`./.next/dev/types/routes.d.ts`) already present from the in-progress upgrade — exactly the auto-migration risk flagged in the plan's context notes.
- **Fix:** Restored `next-env.d.ts` to its pre-build content from a backup taken before any build/install step in this plan.
- **Files modified:** next-env.d.ts (restored, net no-op relative to plan start).
- **Commit:** n/a (out-of-scope file intentionally left uncommitted, matching pre-plan state).

No architectural changes and no data/routing/business-logic changes were made.

## Known Stubs

None — all wiring is functional (Reveal/Parallax/HoverLift are live on real content, not placeholder data).

## Threat Flags

None beyond what's already tracked in the plan's `<threat_model>` (framer-motion install, accepted; passive scroll/motion primitives, mitigated via passive listeners + reduced-motion guards). No new network endpoints, auth paths, or schema changes were introduced.

## Self-Check: PASSED

- FOUND: components/motion/Reveal.tsx
- FOUND: components/motion/Parallax.tsx
- FOUND: components/motion/HoverLift.tsx
- FOUND: components/NavBar.tsx (modified)
- FOUND: components/CatCard.tsx (modified)
- FOUND: app/page.tsx, app/cats/page.tsx, app/schedule/page.tsx (modified)
- FOUND: app/globals.css (modified, `.hover-lift` present)
- FOUND commit a9f7e76 in `git log --oneline`
- FOUND commit b43916a in `git log --oneline`
- FOUND commit 652211a in `git log --oneline`
- `npx tsc --noEmit`: clean
- `npx next build`: succeeds, 13/13 routes generated
