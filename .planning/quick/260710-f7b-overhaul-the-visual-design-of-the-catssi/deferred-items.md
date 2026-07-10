# Deferred Items — 260710-f7b

## `npm run lint` / `next lint` broken (pre-existing, out of scope)

**Discovered during:** Task 1 verification

**Issue:** This worktree's `package.json` pins `"next": "14.2.35"`, but the shared `node_modules`
(resolved from the parent repo directory, since this worktree is nested inside
`.claude/worktrees/` under the main repo) has `next@16.2.10` installed — matching the version
noted in `.claude/CLAUDE.md` ("Next.js 16.2.10"). This drift is already visible as an
uncommitted change on `main` (`git status` shows `M package.json`, `M package-lock.json`,
`M next-env.d.ts`, `M tsconfig.json` — an in-progress Next 14→16 upgrade by another
contributor).

Running `next lint` (v16 CLI) against this project throws:
```
Invalid project directory provided, no such directory: <path>\lint
```
This is a CLI argument-parsing change between Next 14 and Next 16, not something caused by
this plan's className/token edits.

**Why not fixed here:** Fixing it would mean either upgrading `package.json`'s `next` version
(a dependency change — CLAUDE.md: "Do not add packages/dependencies without discussing with
the team first") or downgrading the shared `node_modules` (destructive to the in-progress
upgrade on `main`). Both are out of scope for a purely presentational quick task.

**Verification used instead:** `npx tsc --noEmit` (passed clean) plus the plan's own
`node -e` token-presence checks (passed) for all three tasks. `npm run build` was skipped for
the same reason (Task 3 originally called for it) — see SUMMARY.md for details.

**Recommended follow-up:** Resolve the Next 14→16 package.json upgrade on `main` first (separate
from this design work), then lint/build will work normally again.
