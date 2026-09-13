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
- **Radix UI:** `^1.6.7` (Primitives: Sheet, AlertDialog)
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

## 5. Critical MatchEntry Rules (TTPT Hot Path)

MatchEntry is the central latency-critical path. The following invariants must never be broken:

1. **Native Numeric Inputs:** Number inputs use native React controlled/uncontrolled inputs. No Formik or heavyweight form abstraction.
2. **FIN 0 vs Blank:** Finish count `0` is an explicit, valid score that must remain distinct from empty/blank input.
3. **DNP Semantics:** Did Not Play (`DNP`) contributes exactly zero points. A team marked as DNP is excluded from rank scoring.
4. **Debounced Autosave (~500ms):** Autosaves trigger after 500ms of user input inactivity.
5. **Shared Per-Match Write Coordinator:** Coordinated via `MatchWriteCoordinatorRegistry`. All writes for a matchId are serialized through a single tail promise.
6. **`whenIdle()` Barrier:** Any entity or result reads must await `coordinator.whenIdle()` before reading from persistence.
7. **Immediate Unmount Enqueue:** Component unmount synchronously enqueues the latest draft snapshot into the coordinator.
8. **Save/Finalize Serialization:** `runExplicit("save" | "finalize")` locks against concurrent autosaves to eliminate write races.
9. **Finalized Status Guard:** A background autosave draft snapshot can **never** revert a `FINALIZED` match back to `DRAFT`.

---

## 6. Deterministic Scoring Invariants

- **Fixed-Point Scaling:** `SCORE_SCALE = 100` internally to avoid IEEE-754 floating point imprecision.
- **Custom Scoring Precision:** Supports up to 2 decimal places. Precision beyond 2 decimals is strictly rejected.
- **Persisted vs Derived Data:** Only raw `MatchResults` are persisted. Standings, point totals, and rankings are **always derived at runtime**, never persisted.
- **Zero Finishes (Played):** A team with 0 finishes that played the match receives placement points and contributes to match rankings (distinct from DNP).
- **Tie-Break Rules:** Tied scores share standard competition rank (e.g., `1, 1, 3`). Configured tiebreak rules (WWCD, Placement Points, Total Kills, Recent Match) are deterministically executed.
- **Team IDs are Non-Competitive:** Team IDs are presentation fallbacks only; they are strictly forbidden from acting as tiebreakers.
- **AI Scoring Ban:** AI or OCR tools extract visual observations only; deterministic code owns all points calculations.

---

## 7. Team Referential Integrity

- **Historical Match Deletion Guard:** A team cannot be deleted if it has recorded results in any match (draft or finalized).
- **Canonical Team Persistence:** Team edits rebase to canonical persisted records.
- **No Fabricated Team Cap:** The UI must not fabricate or enforce an arbitrary limit (e.g., do not hardcode "16 teams max").

---

## 8. UI Implementation Authority

> **STITCH SOURCE = VISUAL IMPLEMENTATION AUTHORITY.**
> **OPENLOBY EXISTING CODE = BEHAVIOR / DOMAIN / DATA AUTHORITY.**

- Do **not** interpret Stitch or treat it as generic inspiration.
- Transplant exact HTML markup, Tailwind utility classes, inline SVG icons, and typography from the Stitch source.
- Preserve all existing React props, event handlers, repository mutations, validation logic, and accessible labels.
- Do not introduce new third-party icon libraries (use inline SVGs from Stitch).

---

## 9. Current UI Status

### UI-F1 Overview — APPROVED & COMMITTED
- **Status:** Complete, approved, and committed to `origin/feat/workspace-routing`.
- **Desktop (1440px):** Transplanted from Stitch; verified in headless browser.
- **Mobile (390px, 360px, 430px):** Verified; active bottom nav item styling resolved to `text-[#e05305]`.
- **Theme:** Pure light mode.
- **Files Modified/Created for UI-F1:**
  - `src/features/tournaments/components/OverviewHeaderSection.tsx` (created)
  - `src/features/tournaments/components/OverviewLeader.tsx` (created)
  - `src/features/tournaments/components/OverviewNextAction.tsx` (created)
  - `src/features/tournaments/components/OverviewProgress.tsx` (created)
  - `src/features/tournaments/components/OverviewPresentation.tsx` (modified)
  - `src/features/tournaments/components/OverviewSection.tsx` (modified)
  - `src/screens/tournament-workspace/OverviewRoute.tsx` (modified)
  - `src/screens/tournament-workspace/TournamentWorkspaceNavigation.tsx` (modified)
  - `src/screens/tournament-workspace/TournamentWorkspaceShell.tsx` (modified)
  - `src/styles/globals.css` (modified: Tailwind v4 theme hex mapping)

### UI-F2 Teams — NEXT ACTIVE STAGE (NOT STARTED)
- **Status:** Ready to begin. No code changes have been made for UI-F2.
- **Scope:** Transplant the Stitch Teams design into `/tournaments/[id]/teams` (`TeamsRoute.tsx` and feature components).
- **Approved Requirements:**
  - Primary Action: "Add Team" button
  - Secondary Action: "Bulk Add" button
  - Real registered-team counter (no hardcoded "16 teams" capacity)
  - Real team rows, logos, and slot numbers
  - Preserve `TeamEditSheet` (Radix Sheet) and delete `AlertDialog` workflows
  - Preserve historical-match deletion guard
  - Truthful zero-team state (no fabricated placeholder team cards)
  - Primary viewports: 1440px desktop, 390px mobile (360px and 430px sanity checks)
  - Pure light mode only

---

## 10. UI-F1 Theme / Token Note

During UI-F1, the mobile bottom navigation active brand color did not render reliably in the browser even though the intended Tailwind class (`text-brand`) was present in source code.

- **Root Cause & Fix:** Tailwind v4 dynamic theme variable resolution within Next.js navigation components failed to resolve the color token at runtime. This was fixed in commit `affe735` (`fix(theme): map literal hex values in Tailwind v4 theme block to resolve color token rendering`) by mapping literal hex codes in `src/styles/globals.css` and using explicit `text-[#e05305]` styling on active navigation items.
- **Approved Stitch Orange:** `#e05305` is the authoritative active brand color.
- **Durable Instruction:** Do **NOT** casually revert the approved theme/token mapping in `globals.css`. If a future Tailwind utility or color token appears syntactically correct in source but fails to display in the UI, inspect **computed browser styles** directly rather than assuming source string correctness.
- **Scope:** Do not overstate that all CSS variables are broken globally; this note applies specifically to runtime theme token resolution in Tailwind v4 and its interaction with client component navigation elements.

---

## 11. Explicit Scope Boundaries

- **Dark Mode:** Post-beta scope. Do NOT add `next-themes` or dark mode styling now.
- **Export & Graphics:** UI-G1 is scheduled for a future milestone. Do NOT implement fake Export functionality.
- **Backend & Cloud Database:** There is currently NO backend, auth, or cloud database. Persistence is strictly client-side IndexedDB v4. Future backend direction (when authorized): Node TypeScript + Fastify + Mercurius GraphQL + Prisma + PostgreSQL modular monolith.

---

## 12. Prominent Do-Not-Touch List

Unless a reproduced regression requires a surgical fix, **DO NOT MODIFY**:
1. Workspace routing structure (`/tournaments/[id]/(workspace)/*`)
2. `MatchWriteCoordinator` & `MatchWriteCoordinatorRegistry`
3. Domain scoring engine (`src/domain/scoring/*`)
4. Ranking and tiebreaker resolution rules
5. IndexedDB schema version 4 & repository contracts
6. MatchEntry persistence lifecycle, debounced autosave, and non-Formik input model
7. Team deletion historical-match guard
8. Sonner mobile offset configuration
9. Dark mode scope (deferred)
10. Export / Graphic template scope (deferred)

---

## 13. Current Quality Baseline (Executed Verification)

| Check | Command | Result | Notes |
|---|---|---|---|
| **Typecheck** | `npm run typecheck` | **PASS** (exit 0) | Clean TypeScript compilation (`tsc --noEmit`) |
| **ESLint** | `npm run lint` | **PASS** (exit 0) | Clean zero-warning check (`eslint . --max-warnings=0`) |
| **Vitest** | `npm run test` | **PASS** (exit 0) | **310 passed across 47 test files** |
| **Next Build** | `npm run build` | **PASS** (exit 0) | Compiled successfully with Turbopack (10 routes generated) |
| **E2E Tests** | `npm run test:e2e` | **PASS** (exit 0) | **7 passed across 7 test files** (17.1s) |
| **Full Verify** | `npm run verify` | **PASS** (exit 0) | Composite script (`typecheck && lint && test && build`) passed cleanly |
| **Madge Cycles** | `npx madge --circular ...` | **PASS** (exit 0) | **0 circular dependencies** across 138 source files |
| **Git Diff Check** | `git diff --check` | **PASS** (exit 0) | Clean whitespace and diff check |

---

## 13. Git Status & Log

- **Current Branch:** `feat/workspace-routing`
- **Working Tree:** Clean (all UI-F1 components, navigation, and theme styles pushed)
- **Recent Git Commits (`git log -10 --oneline --decorate`):**
  - `a9b864e` `(HEAD -> feat/workspace-routing, origin/feat/workspace-routing)` `chore: update project files`
  - `affe735` `fix(theme): map literal hex values in Tailwind v4 theme block to resolve color token rendering`
  - `5b6e833` `feat: transplant Stitch overview presentation`
  - `eaf0e82` `test: harden workspace routing and mobile navigation`
  - `6a508ae` `refactor: cut workspace navigation over to app routes`
  - `dd08683` `refactor: route matches and harden match persistence`
  - `42da376` `refactor: add routed scoring with session draft safety`
  - `b79b226` `refactor: add routed overview teams and standings`
  - `c2c12de` `refactor: establish tournament workspace route foundation`
  - `968d353` `chore: checkpoint overview visual recovery`
