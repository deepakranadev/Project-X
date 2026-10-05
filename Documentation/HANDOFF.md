# OpenLoby — Cross-Account Session Handoff

## 1. Project Overview

- **Product Name:** OpenLoby
- **Current Product Wedge:** BGMI Points Tables
- **Product Principle:** **Build narrow. Architect broad. Expand one feature at a time.**
- **Core Future Thesis:** **Screenshots in. Points table out.**
- **Current Priority Hierarchy:**
  1. Correctness
  2. Data Integrity
  3. TTPT (Time To Points Table) / Processing Latency
  4. Smoothness / Responsiveness
  5. UX Usability
  6. Visual Polish

---

## 2. Technology Stack & Dependencies

Exact versions from `package.json`:

### Production Dependencies
- **Next.js:** `^16.3.4` (App Router, Turbopack)
- **React & React DOM:** `^19.2.8`
- **TypeScript:** `^6.0.3` (strict type-checking enabled)
- **Tailwind CSS:** `^4.3.3` (with `@tailwindcss/postcss` `^4.3.3`)
- **Formik:** `^2.4.9` (**Strict boundary:** Used *only* for standard modal/configuration forms: Tournament Creation, Team Editor, and Scoring Configuration. **Formik is strictly forbidden in MatchEntry and Team Bulk Entry.**)
- **Radix UI:** `^1.6.7` (Primitives: Sheet, AlertDialog, DropdownMenu)
- **Sonner:** `^2.0.8` (Mounted once in root layout `src/app/layout.tsx`. Mobile collision fix configured via `mobileOffset="calc(80px + env(safe-area-inset-bottom))"` to clear mobile bottom navigation.)
- **Utility Libraries:** `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.6.0`

### Dev & Testing Dependencies
- **Vitest:** `^5.0.0` (Unit, domain, architecture, and component integration testing)
- **Playwright:** `^1.63.0` (Browser end-to-end testing against mobile viewports)
- **Testing Library React:** `^16.3.3`
- **fake-indexeddb:** `^6.2.5` (In-memory IndexedDB runtime for Vitest suite)
- **ESLint:** `^9.39.5` with `eslint-config-next` `^16.3.4` (Strict zero-warning policy: `eslint . --max-warnings=0`)
- **jsdom:** `^29.1.1`

---

## 3. Architecture & Dependency Rules

OpenLoby operates as a **modular monolith** on the frontend with strict unidirectional layer boundaries:

```
src/app  (Next.js App Router: params unwrapping, layouts, metadata, server redirects)
   ↓
src/screens  (Route composition, screen controllers, client repository providers)
   ↓
src/features  (Domain workflows, feature-specific UI, hooks, repository contracts)
   ↓
src/domain  (Pure business logic, scoring algorithms, validation, standings)
   ↑
src/infrastructure  (IndexedDB v4 persistence, storage schema mapping, runtime trust validation)
```

- **`src/app`**: Owns routing and layout shells. Does not contain domain logic.
- **`src/screens`**: Owns composition boundaries. `WorkspaceRepositoryProvider` provides singleton client repositories to feature components.
- **`src/features`**: Feature modules (`tournaments`, `teams`, `scoring`, `matches`, `standings`). Feature components do NOT import concrete infrastructure or screens.
- **`src/domain`**: Pure, browser-neutral business logic and formulas. No `indexedDB`, no React hooks, no DOM types.
- **`src/infrastructure`**: Concrete repository implementations wrapping IndexedDB schema v4 (`openloby_guest_db`). Storage values are treated as untrusted inputs.

---

## 4. Overall Standings Visual & Competitive Architecture (UI-L3)

### Architectural Composition (`src/features/standings/components/`)
1. **`OverallStandings.tsx`**: Route feature orchestrator that reads authoritative snapshot from `useOverallStandings`.
2. **`StandingsHeader.tsx`**: Renders desktop breadcrumbs, context heading with Active status pill, and desktop `Export Points Table →` CTA; renders mobile tournament context and calculation progress bar.
3. **`StandingsTopThree.tsx`**: Compact podium cards derived from the identical authoritative standings rows. On desktop, renders 3 horizontal cards (1st with gold accent and stats, 2nd slate, 3rd bronze). On mobile, renders a 3-column compact tournament leaders podium with the 1st place card highlighted with an orange border.
4. **`StandingsTable.tsx`**: Dense desktop leaderboard table (`RANK`, `TEAM`, `MP`, `WWCD`, `PLACEMENT PTS`, `FINISHES`, `TOTAL`). Top 3 rows receive rank badge styling; teams with missed matches receive truthful `X DNP` badges.
5. **`StandingsMobileList.tsx`**: Dense mobile leaderboard list optimized for 360px–430px viewports with zero horizontal overflow.
6. **`StandingsEmptyState.tsx`**: Truthfully distinguishes between "No finalized matches yet" and "Only draft matches exist" with direct action links to Matches.
7. **`StandingsPublishingActions.tsx`**: Mobile bottom publishing action bar housing the prominent `Export Points Table →` CTA.
8. **`formatStandingsScore.ts`**: Pure helper ensuring integer scores render cleanly (e.g. `12`) while decimal scores format up to 2 decimal places with fixed padding (e.g. `11.50`, `0.25`).

### Mobile Presentation Decisions
- Focused mobile layout prioritizing `RANK`, `TEAM`, `MP`, `FIN`, and `TOTAL` (in bold primary orange).
- Left-edge accent bar for top-3 positions.
- Verified 0px page-level horizontal overflow (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`) across 360px, 390px, and 430px viewports.
- Mobile bottom navigation from `TournamentWorkspaceShell` remains accessible to allow fast switching between workspace tabs while publishing actions sit directly in the content stream.

### Desktop Workspace Geometry
- Aligned to standard OpenLoby workspace container:
  - Container: `w-full flex-1 px-4 pt-4 pb-24 md:py-8 md:px-10 flex flex-col items-center`, `data-purpose="standings-main"`
  - Content width: `w-full max-w-5xl space-y-4 md:space-y-6`
  - 1440x900: `x = 328px`, `width = 1024px`, margins = `0px`
  - 1920x1080: `x = 568px`, `width = 1024px`, margins = `0px`

### Preserved Competitive & Scoring Invariants
1. Only `FINALIZED` matches contribute to standings.
2. `DRAFT` matches contribute nothing.
3. Reopening a match removes its contribution immediately; re-finalizing restores it.
4. Deleting a match removes its contribution immediately.
5. `DNP` contributes 0 points and 0 `matchesPlayed`.
6. Played match with 0 finishes counts as 1 `matchesPlayed` and remains distinct from `DNP`.
7. Raw `MatchResults` are persisted; standings and totals are runtime-derived.
8. Scoring remains domain-owned with `SCORE_SCALE = 100` fixed-point arithmetic.
9. True ties share competitive rank (e.g., both tied teams display `1` or `2` without fake sequential renumbering).
10. Team IDs never act as competitive tiebreakers.

### Export Points Table CTA Behavior
- Visual-only affordance conforming to the frozen contract until UI-G1 (Graphics & Templates) is implemented.
- Disabled when 0 finalized matches exist.
- When clicked, displays an informative toast: `"Points table export will be available in a future release."`
- Does not create fake downloads, synthetic PNGs, or unapproved routes.

---

## 5. Frozen Routing Architecture (ROUTE-R0 – ROUTE-R5)

1. **Root Redirect:** `/` → `/tournaments/new` (or last active tournament).
2. **Creation Route:** `/tournaments/new`
3. **Workspace Root:** `/tournaments/[id]` → Redirects server-side to `/tournaments/[id]/overview`.
4. **Active Workspace Routes:**
   - `/tournaments/[id]/overview`
   - `/tournaments/[id]/teams`
   - `/tournaments/[id]/scoring`
   - `/tournaments/[id]/matches`
   - `/tournaments/[id]/standings`
   - `/tournaments/[id]/matches/[matchId]` (MatchEntry)
5. **No Hash Routing:** Never reintroduce hash-based navigation or monolithic workspace tab state.

---

## 6. Current Quality Baseline

| Check | Command | Result | Notes |
|---|---|---|---|
| **Typecheck** | `npm run typecheck` | **PASS** (exit 0) | Clean TypeScript compilation (`tsc --noEmit`) |
| **ESLint** | `npm run lint` | **PASS** (exit 0) | Clean zero-warning check (`eslint . --max-warnings=0`) |
| **Vitest** | `npm run test -- --run` | **PASS** (exit 0) | **313 passed across 48 test files** |
| **Next Build** | `npm run build` | **PASS** (exit 0) | Compiled successfully with Turbopack (10 routes generated) |
| **E2E Tests** | `npm run test:e2e` | **PASS** (exit 0) | **9 passed across 9 test files** (23.8s) |
| **Madge Cycles** | `npx madge --circular ...` | **PASS** (exit 0) | **0 circular dependencies** across 159 source files |
| **Git Diff Check** | `git diff --check` | **PASS** (exit 0) | Clean whitespace and diff check |

---

## 7. Next Planned Stage

Upon external review and approval of UI-L3 Overall Standings:
- **UI-L4 — Responsive / Accessibility / Regression Hardening**
