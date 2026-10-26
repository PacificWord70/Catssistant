---
status: complete
---

# Fix review bugs, accessibility and security

From the 2026-10-03 review of every page, the test suite and the security
posture. Heidi asked for all eight bugs fixed plus anything weak on
accessibility or security, and the docs brought up to date.

## Data layer
- An unreadable read must never be treated as empty: back up the raw value and
  refuse to overwrite it (cats, events, health records, items)
- Valid JSON that isn't an array is handled the same way
- Writes that hit the storage quota throw a plain-language error the UI shows
- Deleting a cat cascades to its events and health records
- Month grid is DST-proof (America/Santiago drops the last day)

## Forms
- Photos: type-checked, downscaled to ~512px JPEG (also strips EXIF GPS)
- Save errors shown inline instead of failing silently
- Inline validation instead of silent returns
- Dialog semantics: role, focus trap, Escape, focus restore
- Confirm before discarding a dirty form or deleting (series delete says so)
- Labels tied to inputs

## Pages
- `/cats/new?prospective=1` works under Next 16's async searchParams
- Local date keys everywhere (items off by a day in US evenings)
- Last vet visit ignores future visits; Log weight works with no cat selected;
  Health chart defaults to Weight
- NavBar, calendar, BreedTag, items table, breeds filters, home pills: a11y
- About page made accurate, including the Nominatim disclosure

## Security
- Next upgraded within 16.x, `npm audit fix`
- CSP, HSTS, Permissions-Policy, COOP in netlify.toml
- Photo URLs and vet phone links sanitised before rendering

## Docs
- CLAUDE.md and .planning brought up to date (Health, tests, stale notes)
