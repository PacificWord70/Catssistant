# External Integrations

**Analysis Date:** 2026-07-04

## APIs & External Services

**Location Services:**
- **Nominatim (OpenStreetMap)** - Free reverse geocoding service
  - What it's used for: Converting device GPS coordinates to city/region/country
  - Endpoint: `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json`
  - Implementation: `components/CatForm.tsx` lines 135-139, `detectLocation()` function
  - Auth: None required (public API)
  - Rate limits: Follows Nominatim usage policy (1 request per second recommended)
  - Note: User must grant browser geolocation permission via `navigator.geolocation`

**Fonts:**
- **Google Fonts API** - Web font delivery
  - Fonts: Figtree (body), Tapestry (headings)
  - Implementation: `app/layout.tsx` lines 2, 7-18, via `next/font/google`
  - Auto-optimized by Next.js (fonts self-hosted at build time, not dynamically loaded)

## Data Storage

**Databases:**
- None configured. Persistence is entirely **localStorage** (browser-only)

**Local Storage:**
- localStorage only — no backend database
  - Keys used:
    - `catssistant_cats` - Array of Cat objects
    - `catssistant_schedule_events` - Array of ScheduleEvent objects
  - Implementation: `lib/storage.ts` (getCats, saveCat, deleteCat, getScheduleEvents, saveScheduleEvent, deleteScheduleEvent)
  - Capacity: ~5-10MB per domain (varies by browser)

**File Storage:**
- **Local only** - Cat photos stored as Data URLs in localStorage (base64-encoded)
- Planned: Migration to AWS S3 (not yet implemented)

**Caching:**
- Browser cache (Next.js static assets)
- No Redis, Memcached, or distributed caching

## Authentication & Identity

**Auth Provider:**
- None. App is entirely **client-side, no user accounts**
- All data is stored locally on the user's device via localStorage
- No login, no accounts, no backend authentication

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Browser console only (console.log in development)
- No centralized logging service

**Analytics:**
- None. Privacy-first design means no passive tracking, behavioral analytics, or data collection

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase
- Deployment target: Any Node.js-compatible hosting (Vercel, AWS, etc.)

**CI Pipeline:**
- None configured in repository (no GitHub Actions, GitLab CI, etc.)

## Environment Configuration

**Required env vars:**
- None. Application requires zero environment variables.

**Secrets location:**
- No secrets used
- API keys: None
- Database credentials: N/A (localStorage only)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

**Geolocation:**
- `navigator.geolocation.getCurrentPosition()` - Request user's GPS coordinates
  - Requires user permission grant
  - Called in: `components/CatForm.tsx` line 132, `detectLocation()` function
  - Coordinates sent to Nominatim for reverse geocoding

**DOM APIs:**
- `localStorage` - Read/write persistent data
  - Guarded by `typeof window === 'undefined'` check in `lib/storage.ts` to work in SSR
- `createPortal` (React) - Render tooltips to document.body to avoid overflow clipping
  - Used in: `components/CatForm.tsx` (breed tooltips), `components/BreedTag.tsx`
- `FileReader` - Read uploaded cat photos as Data URLs
  - Used in: `components/CatForm.tsx` line 217, `handlePhotoChange()`

## Data Flow

1. **User enters location or clicks "Detect":**
   - Browser calls `navigator.geolocation.getCurrentPosition()`
   - User grants/denies permission dialog
   - If granted, coordinates sent to Nominatim API

2. **Nominatim returns location data:**
   - Reverse geocode response parsed in `CatForm.tsx` lines 139-143
   - city, region, country extracted and saved to cat profile

3. **Cat data saved:**
   - `saveCat()` in `lib/storage.ts` serializes Cat object to JSON
   - Stored in localStorage under `catssistant_cats` key
   - No backend transmission

---

*Integration audit: 2026-07-04*
