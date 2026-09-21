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
- **`src/features`**: Owns workflows (tournaments, teams, scoring, matches, standings). Feature React components have zero concrete infrastructure imports.
- **`src/domain`**: Pure, browser-neutral business logic. Zero dependencies on Next.js, React, or IndexedDB.
- **`src/infrastructure`**: Concrete IndexedDB implementation. Schema version 4. Runtime trust boundary sanitizes untrusted stored data before domain ingestion.
- **`src/shared`**: Reusable UI primitives (`Button`, `Input`, `Sheet`, `AlertDialog`, `Sonner`, `cn`). Created for genuine reuse only.

---

## 4. Frozen Routing Architecture (ROUTE-R0 – ROUTE-R5)

Tournament workspace routing (ROUTE-R0 through ROUTE-R5) is **complete and strictly frozen**.

### Active Route Map
- `/tournaments/[id]` → Server-side redirect (`src/app/tournaments/[id]/page.tsx`) to `/tournaments/[id]/overview`
- `/tournaments/[id]/overview` → Tournament Overview dashboard (`OverviewRoute.tsx`)
- `/tournaments/[id]/teams` → Team setup & roster management (`TeamsRoute.tsx`)
- `/tournaments/[id]/scoring` → Scoring preset & custom configuration (`ScoringRoute.tsx`)
- `/tournaments/[id]/matches` → Match list, creation, and continuation (`MatchesRoute.tsx`)
- `/tournaments/[id]/matches/[matchId]` → MatchEntry form (`MatchEntryRoute.tsx`)
- `/tournaments/[id]/standings` → Overall standings points table (`StandingsRoute.tsx`)

### Routing Invariants
1. **Link-Based Navigation:** Desktop sidebar and mobile bottom nav use standard Next.js `<Link>` elements.
2. **Segment-Driven Active State:** Active tab highlights derive from Next.js `useSelectedLayoutSegment()`.
3. **No Hash Routing:** Hash routes (`#teams`, `#scoring`, `#matches`, `#standings`) are eliminated.
4. **No Monolithic Workspace:** `TournamentWorkspaceScreen.tsx` is deleted. Each sub-route renders its dedicated route component inside `TournamentWorkspaceShell.tsx`.
5. **Direct Refresh & History:** Every sub-route survives hard browser refresh and browser back/forward navigation.
6. **Cross-Tournament MatchEntry Guard:** `MatchEntryRoute` validates that the requested `matchId` belongs to the current `tournamentId`. Mismatches redirect to `/tournaments/[id]/matches`.
7. **Finalized MatchEntry Protection:** Directly accessing a `FINALIZED` match renders a read-only banner and disables edits.
8. **Scoring Draft Safety:** Scoring edits are session-drafted. Unsaved changes discard on route navigation to prevent stale leaks, with rebase to persisted config.
9. **MatchEntry WRITE→READ→WRITE Protection:** Immediate unmounts flush pending draft snapshots to the write coordinator; immediate remounts await `whenIdle()` before reading draft state.

---

## 5. UI Status & Progress

### Approved & Committed Stages
1. **UI-F1 Overview** — Complete and committed.
2. **UI-F2 Teams** — Complete and committed.
3. **UI-F3 Scoring** — Complete and committed.
4. **UI-F4 Matches** — Complete and committed (`276bf5a feat: align matches workspace desktop layout`). Outer desktop wrapper aligned with Teams and Scoring (`max-w-5xl`, balanced whitespace).

### Current Stage: UI-L3 MatchEntry (UI-F5) — IMPLEMENTATION COMPLETE, AWAITING REVIEW
- **Visual Design:** Full parity with authoritative Stitch reference (`Documentation/ui-reference/desktop/match-entry.png` and `Documentation/ui-reference/mobile/match-entry.png`).
- **Workspace Parity:** Outer desktop shell matches sister screens (`max-w-5xl`, `x = 328px` at 1440px, `x = 568px` at 1920px).
- **Responsive Layout:** Responsive CSS Grid where action buttons (`Save Draft`, `Finalize Match`) sit top-right on desktop (matching desktop Stitch) and flow to the bottom on mobile (matching mobile Stitch).
- **Single DOM Button Invariant:** Exactly ONE `Finalize Match` button and ONE `Save Draft` button exist in the DOM to avoid locator ambiguity in automated tests.
- **Mobile Overflow:** 0px document overflow across 360px, 390px, and 430px viewports (`scrollWidth === clientWidth`).

---

## 6. MatchEntry Invariants (TTPT Hot Path)

The following invariants must never be broken:

1. **Native Numeric Inputs:** Placement and Finishes inputs use native React controlled inputs (`<input type="number">`). Formik and heavyweight form abstractions remain strictly banned.
2. **React.memo Hot Path:** `MatchResultRow` is memoized; numeric input changes only re-render the single row being edited.
3. **Keyboard / Enter Progression:** Pressing `Enter` advances focus: Placement → Finishes → Next Team Placement. `next.select()` is invoked on focus transition so users can overwrite numbers immediately without backspacing.
4. **Played Zero Finishes vs Blank / DNP:** Finish count `0` is an explicit, valid score that is stored as `0` and displayed as `"0"`, distinct from blank or DNP (`null`).
5. **DNP Semantics:** Did Not Play (`DNP`) sets `placement = null` and `kills = null`, contributes exactly 0 points, and excludes the team from scoring. Inputs are disabled with placeholder dash (`—`), and row displays a `DNP` badge.
6. **Autofill Placements:** `Auto-fill placements` assigns sequential placements to all participating non-DNP teams in slot order without modifying persistence semantics.
7. **Debounced Autosave (~500ms):** Autosaves trigger after 500ms of user input inactivity via `useMatchPersistence`.
8. **Shared Per-Match Write Coordinator:** Coordinated via `MatchWriteCoordinatorRegistry`. All writes for a `matchId` are serialized through a single tail promise.
9. **`whenIdle()` Barrier:** Any entity or result reads must await `coordinator.whenIdle()` before reading from persistence.
10. **Immediate Unmount Enqueue:** Component unmount synchronously enqueues the latest draft snapshot into the coordinator.
11. **Save/Finalize Serialization:** `runExplicit("save" | "finalize")` locks against concurrent autosaves to eliminate write races.
12. **Finalized Status Guard:** A background autosave draft snapshot can **never** revert a `FINALIZED` match back to `DRAFT`.
13. **Finalized Direct URL Read-Only:** Accessing a finalized match locks all inputs and action buttons in read-only state.

---

## 7. Deterministic Scoring Invariants

- **Fixed-Point Scaling:** `SCORE_SCALE = 100` internally to avoid IEEE-754 floating point imprecision.
- **Custom Scoring Precision:** Supports up to 2 decimal places. Precision beyond 2 decimals is strictly rejected.
- **Persisted vs Derived Data:** Only raw `MatchResults` are persisted. Standings, point totals, and rankings are **always derived at runtime**, never persisted.
- **Tie-Break Rules:** Tied scores share standard competition rank (e.g., `1, 1, 3`). Configured tiebreak rules (WWCD, Placement Points, Total Kills, Recent Match) are deterministically executed.
- **Team IDs are Non-Competitive:** Team IDs are presentation fallbacks only; they are strictly forbidden from acting as tiebreakers.
- **AI Scoring Ban:** AI or OCR tools extract visual observations only; deterministic code owns all points calculations.

---

## 8. Explicit Scope Boundaries

- **Dark Mode:** Post-beta scope. Do NOT add `next-themes` or dark mode styling.
- **Export & Graphics (UI-G1):** Scheduled for a future milestone. Do NOT implement fake Export functionality.
- **Backend & Cloud Database:** Persistence is strictly client-side IndexedDB v4.
- **OCR / Screenshot AI:** Deferred until manual core is complete and locked.

---

## 9. Current Quality Baseline

| Check | Command | Result | Notes |
|---|---|---|---|
| **Typecheck** | `npm run typecheck` | **PASS** (exit 0) | Clean TypeScript compilation (`tsc --noEmit`) |
| **ESLint** | `npm run lint` | **PASS** (exit 0) | Clean zero-warning check (`eslint . --max-warnings=0`) |
| **Vitest** | `npm run test` | **PASS** (exit 0) | **310 passed across 47 test files** |
| **Next Build** | `npm run build` | **PASS** (exit 0) | Compiled successfully with Turbopack (10 routes generated) |
| **E2E Tests** | `npm run test:e2e` | **PASS** (exit 0) | **7 passed across 7 test files** (17.6s) |
| **Madge Cycles** | `npx madge --circular ...` | **PASS** (exit 0) | **0 circular dependencies** across 153 source files |
| **Git Diff Check** | `git diff --check` | **PASS** (exit 0) | Clean whitespace and diff check |

---

## 10. Next Planned Work

Upon external review and approval of UI-L3 MatchEntry:
- **UI-L3 — Overall Standings** (`/tournaments/[id]/standings`)
