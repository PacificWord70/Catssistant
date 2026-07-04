# Technology Stack

**Analysis Date:** 2026-07-04

## Languages

**Primary:**
- TypeScript 5.4.5 - Full codebase, all `.tsx` and `.ts` files
- JavaScript (JSX/TSX) - React components

**Secondary:**
- CSS - Tailwind utilities, globals.css

## Runtime

**Environment:**
- Node.js (version not pinned in package.json, uses system default)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.10 (App Router) - Web framework, routing, server-side rendering, API routes
  - Located: `app/` directory structure, `next.config.mjs`

**UI/Styling:**
- React 18.3.1 - UI library for interactive components
- Tailwind CSS 3.4.4 - Utility-first CSS framework with custom brand color tokens
  - Config: `tailwind.config.ts`

**Dev/Build:**
- TypeScript 5.4.5 - Type checking
- ESLint 8 - Code linting (uses `eslint-config-next` via Next.js)
- PostCSS 8.4.38 - CSS processing pipeline
- Autoprefixer 10.4.19 - Automatic vendor prefixes for CSS

## Key Dependencies

**Critical:**
- next 16.2.10 - Next.js framework with App Router
- react 18.3.1 - React library core
- react-dom 18.3.1 - React DOM bindings

**Fonts & UI:**
- @next/font - Google Fonts integration (Figtree, Tapestry)
  - Figtree (body/sans-serif)
  - Tapestry (display/headings)
  - Loaded from `next/font/google` in `app/layout.tsx`

## Configuration

**Environment:**
- No `.env` files currently in use
- Planned: AWS integration for persistence (currently using localStorage)

**Build:**
- TypeScript config: `tsconfig.json`
  - Strict mode enabled
  - Module resolution: bundler
  - Path alias: `@/*` maps to root directory
- Next.js config: `next.config.mjs` (minimal, uses defaults)
- Tailwind config: `tailwind.config.ts`
  - Custom brand colors: cream, tan, brown, orange, slate, charcoal
  - Custom font families: sans (Figtree), display (Tapestry)
- PostCSS config: `postcss.config.mjs`
  - Tailwind CSS plugin
  - Autoprefixer plugin

## Platform Requirements

**Development:**
- Node.js runtime
- Modern browser with ES2020+ support
- File system access for development
- `npm install` to bootstrap

**Production:**
- Node.js runtime server (or serverless hosting compatible with Next.js)
- Browser with localStorage support
- Geolocation API support (for location detection feature)
- Internet access to Nominatim API (for reverse geocoding)

**Build:**
```bash
npm run build       # Builds optimized Next.js app
npm run dev         # Starts dev server (http://localhost:3000)
npm start           # Starts production server
npm run lint        # Runs ESLint
```

## Notable Absence

**No external HTTP clients:** Fetch API only (native browser API)
**No database driver:** localStorage only (plan to migrate to AWS)
**No testing framework:** None configured (Jest/Vitest not in dependencies)
**No UI component library:** Custom components in `components/`

---

*Stack analysis: 2026-07-04*
