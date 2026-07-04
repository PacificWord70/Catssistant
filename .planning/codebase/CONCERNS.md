# Codebase Concerns

**Analysis Date:** 2026-07-04

## Tech Debt

**Image Storage as Base64:**
- Issue: Photos are converted to base64 data URLs and stored directly in localStorage via `CatForm.tsx` line 220
- Files: `components/CatForm.tsx`, `lib/storage.ts`
- Impact: Base64 encoding increases data size by ~33%. With multiple cats and large photos, localStorage can quickly exceed 5-10MB limit, causing data loss or app crashes. No size validation on upload.
- Fix approach: Implement image compression before encoding, set file size limits (e.g., 500KB), or migrate to file-based storage (AWS S3) and store URLs only

**No Data Backup or Export:**
- Issue: Users cannot export their cat data; all data lives only in browser localStorage
- Files: `lib/storage.ts` (getCats, getScheduleEvents functions)
- Impact: If user clears browser cache, reinstalls browser, or switches devices, all data is lost permanently. No way to migrate to new browser.
- Fix approach: Add export-to-JSON button, implement cloud sync (AWS), or add localStorage backup to IndexedDB

**localStorage as Permanent Storage:**
- Issue: App uses localStorage as primary persistence layer; CLAUDE.md notes "swap to AWS later"
- Files: `lib/storage.ts`
- Impact: No multi-device sync, no account system, data at risk from cache clearing. Cannot scale to mobile app.
- Fix approach: Define API contract, migrate to backend storage (AWS DynamoDB), implement user authentication

## Known Bugs

**Monthly Schedule Recurrence Edge Case:**
- Symptoms: Monthly recurring events may jump dates when crossing months with fewer days (e.g., Jan 31 recurring monthly)
- Files: `lib/scheduleUtils.ts` line 86 — comment acknowledges: "JS Date rolls over short months, close enough for reminders"
- Trigger: Create a recurring event on the 31st, set to monthly recurrence. On February, the event shifts forward.
- Workaround: Users should pick days 1-28 for monthly recurring events

**Geolocation Privacy Contradiction:**
- Symptoms: App uses browser geolocation API despite CLAUDE.md requirement: "never from device GPS"
- Files: `components/CatForm.tsx` line 132-149 (detectLocation function)
- Trigger: User clicks "Detect my location" button
- Violates: Project privacy-first architecture principle
- Fix approach: Remove browser geolocation entirely; only allow manual city/country entry

**Missing Recurrence Validation:**
- Symptoms: Recurrence end date can be before event start date; no validation
- Files: `components/ScheduleEventForm.tsx` (handleSubmit at line 141)
- Trigger: Create event on Jan 15 with recurrence end date of Jan 10
- Workaround: None; event will silently not recur
- Fix approach: Add validation in ScheduleEventForm that recurrenceEndDate >= date

**No Date Validation for Vet Events:**
- Symptoms: Vet event date starts empty; form allows submission with empty date for new Vet events
- Files: `components/ScheduleEventForm.tsx` line 43 (initializes date as empty string for Vet category)
- Trigger: Create new Vet event without selecting a date, form submits
- Workaround: None; event saved with invalid state
- Fix approach: Require date field for all event types, prevent form submission if date is empty

## Security Considerations

**Geolocation Data in URL:**
- Risk: When user clicks "Detect" button, exact GPS coordinates are sent to Nominatim API in the URL query string
- Files: `components/CatForm.tsx` line 135-137 (fetch to nominatim.openstreetmap.org)
- Current mitigation: HTTPS over HTTPS, but coordinates are in plaintext URL
- Recommendations: 
  - Remove geolocation feature entirely (contradicts privacy-first architecture)
  - If needed, hash coordinates before sending to API
  - Use POST request instead of GET to keep data out of URL

**Phone Numbers Stored in Plaintext:**
- Risk: Vet phone numbers stored in localStorage without encryption
- Files: `types/cat.ts` (Vet interface), `lib/storage.ts` (saveCat)
- Current mitigation: localStorage is client-side only; browser same-origin policy
- Recommendations: 
  - Document that this is PII
  - Add data sensitivity indicator in UI
  - Implement browser encryption for sensitive fields before storing
  - Add data retention/deletion prompts

**No Content Security Policy:**
- Risk: No CSP headers to prevent XSS attacks
- Files: `app/layout.tsx` (root layout)
- Current mitigation: React escapes by default; no dynamic script injection observed
- Recommendations: Add CSP headers in next.config.js or via middleware

**Unvalidated External API (Nominatim):**
- Risk: Nominatim API response parsed without validation; arbitrary location data written to cat profile
- Files: `components/CatForm.tsx` line 139 (JSON.parse without schema validation)
- Current mitigation: Used only for auto-fill; user can override
- Recommendations: 
  - Validate API response shape
  - Add error handling for malformed responses
  - Rate limit API calls

## Performance Bottlenecks

**getCats() Called on Every Page Load:**
- Problem: No caching; reads localStorage on every render in multiple places
- Files: `app/cats/page.tsx`, `app/schedule/page.tsx`, `app/cats/[id]/edit/page.tsx`
- Cause: React state initialized in useEffect without memoization
- Improvement path: 
  - Create CatsContext with memoization
  - Cache getCats() result in React state
  - Use useMemo for derived data (e.g., catNames in schedule page)

**Schedule Grid Expansion for Full Month:**
- Problem: expandEvents() expands all recurring events for full month even if not displayed
- Files: `lib/scheduleUtils.ts` line 45 (buildMonthGrid calls expandEvents)
- Cause: No lazy evaluation of recurrence
- Improvement path: Expand events only for visible date range; use virtualization for large event lists

**No Pagination for Cat List:**
- Problem: All cats rendered in grid; no limit on displayed cards
- Files: `app/cats/page.tsx`
- Cause: Simple .map() with no pagination
- Improvement path: Add pagination or infinite scroll if > 50 cats

## Fragile Areas

**CatForm Component:**
- Files: `components/CatForm.tsx` (657 lines)
- Why fragile: Large monolithic component handling photo upload, location detection, vet data, illness management, breed selection with custom tooltips. Multiple useState calls and event handlers with interdependencies.
- Safe modification: Extract sub-forms (VetSection, LocationSection, HuntingSection) into separate components
- Test coverage gaps: No tests for photo base64 conversion, location detection error cases, or form validation edge cases

**Schedule Type Mapping:**
- Files: `components/ScheduleEventForm.tsx`, `types/scheduleEvent.ts`
- Why fragile: ScheduleEvent interface has 50+ optional fields for different category types. Form must conditionally include/exclude fields based on category. Easy to save incomplete data.
- Safe modification: Use discriminated unions (one interface per category) instead of single interface with optional fields
- Test coverage gaps: No tests verifying that saved events have correct fields for their category

**Date Calculations:**
- Files: `lib/utils.ts` (catHumanAge, catAgeShort, catAgeLabel), `lib/scheduleUtils.ts` (toDateKey, parseDateKey, expandEvents)
- Why fragile: Date math using getMonth() and getFullYear() without timezone awareness. Edge cases around month boundaries and DST.
- Safe modification: Use date library (date-fns or dayjs) instead of native Date object
- Test coverage gaps: No tests for edge cases like leap year, DST transitions, or date parsing from strings

## Scaling Limits

**localStorage Size:**
- Current capacity: 5-10MB per origin (browser-dependent)
- Limit: ~10-20 cats with medium photos (if each cat + photo = ~500KB)
- Scaling path: 
  - Migrate to IndexedDB (500MB+)
  - Implement AWS backend for multi-device sync
  - Add cloud photo storage (S3)

**No API Rate Limiting:**
- Current state: Nominatim API calls unlimited
- Limit: Nominatim public API has 1 request/second guideline
- Scaling path: Add rate limiting, use API key tier, or cache results

## Dependencies at Risk

**No Explicit Testing Framework:**
- Risk: No test infrastructure; cannot catch regressions
- Impact: Every change risks breaking production
- Migration plan: 
  - Add Vitest or Jest
  - Start with critical paths (storage.ts, scheduleUtils.ts)
  - Aim for 70%+ coverage before migration to production backend

**Nominatim Dependency:**
- Risk: Public, rate-limited API with no SLA; could return unexpected data
- Impact: Location detection may fail silently; users see stale UI state
- Migration plan: 
  - Add error boundaries and user feedback
  - Consider commercial geocoding API (Google Maps, Mapbox) with fallback
  - Or remove feature entirely (aligns with privacy-first architecture)

**Next.js 16.2.10:**
- Risk: Very recent version (2026-07-04); possible undiscovered bugs
- Current status: No major issues observed in codebase
- Migration plan: Monitor for patch releases; test before updating

## Missing Critical Features

**Data Export / Backup:**
- Problem: No way to export cat data as JSON or CSV
- Blocks: Users cannot migrate to new device or switch browsers
- Priority: High — add before user launches

**Schedule Notifications:**
- Problem: No reminders or notifications for upcoming events
- Blocks: Schedule feature is informational only, not actionable
- Priority: Medium — add in next phase

**Multi-Device Sync:**
- Problem: No account system; data cannot sync across devices
- Blocks: Cannot use app on mobile and desktop simultaneously
- Priority: High — required for iOS app launch

**Search / Filter:**
- Problem: No way to search cats by name or breed
- Blocks: UX degrades with 20+ cats
- Priority: Medium — add if app grows

## Test Coverage Gaps

**No Tests at All:**
- What's not tested: All storage logic, date calculations, schedule recurrence, form validation, component rendering
- Files: All `*.ts` and `*.tsx` files in `app/` and `components/`
- Risk: Critical bugs in data persistence and schedule features could go unnoticed
- Priority: High — add tests for `lib/` files first (highest impact)

**Critical Untested Paths:**
1. **Photo Upload:** `components/CatForm.tsx` line 213-223
   - Risk: Large files could crash the app; no size validation
   - Test: Verify photo size limits and error handling

2. **Schedule Recurrence Expansion:** `lib/scheduleUtils.ts` line 66-94
   - Risk: Monthly recurrence bugs affect core feature
   - Test: Edge cases for month boundaries, leap years, DST

3. **localStorage Error Handling:** `lib/storage.ts` line 9-14
   - Risk: If storage quota exceeded, caught but not reported to user
   - Test: Mock full localStorage, verify graceful degradation

4. **Location Detection API:** `components/CatForm.tsx` line 129-149
   - Risk: Network error or unexpected API response not handled
   - Test: Mock Nominatim failures, verify UI feedback

---

*Concerns audit: 2026-07-04*
