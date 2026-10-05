# Active Task

## Active Stage
**UI-L3 — Overall Standings**

## Status
**Implementation Complete — Awaiting External Review**
- Working branch: `feat/stitch-ui`
- UI-F1 (Overview), UI-F2 (Teams), UI-F3 (Scoring), UI-F4 (Matches), and UI-L3 MatchEntry are approved and committed (latest commit `a2af986`).
- Overall Standings light UI implementation, compact top-3 podium treatment, responsive decimal-handling leaderboard, truthful empty states, and visual publishing CTA affordance are complete.
- All functional invariants, deterministic tiebreaking, decimal score responsiveness, and workspace geometry are verified.
- All automated quality gates (typecheck, lint, Vitest, Playwright, build, circular check, git diff check) pass cleanly.
- Uncommitted working tree contains only the UI-L3 Overall Standings changes and continuity documents, ready for external review.

---

## Objective
Implement the approved light-theme visual/UX treatment for `/tournaments/[id]/standings` over the existing deterministic standings engine, with full parity to the authoritative Stitch design reference (`Documentation/ui-reference/desktop/standings.png` and `Documentation/ui-reference/mobile/standings.png`), while strictly protecting OpenLoby's competitive and scoring invariants.

---

## Scope
- **Route:** `/tournaments/[id]/standings`
- **Screen File:** `src/screens/tournament-workspace/StandingsRoute.tsx`
- **Feature Components (`src/features/standings/components/`):**
  - `OverallStandings.tsx` (screen composition and state orchestration)
  - `StandingsHeader.tsx` (breadcrumbs, active badge, match count pill, desktop Export CTA, mobile summary bar)
  - `StandingsTopThree.tsx` (compact podium cards on desktop, 3-column tournament leaders on mobile)
  - `StandingsTable.tsx` (responsive desktop leaderboard table with tabular numerals, decimal safety, rank badges)
  - `StandingsMobileList.tsx` (dense mobile leaderboard list with `#1` indicators, team truncate, zero overflow)
  - `StandingsEmptyState.tsx` (truthful distinction between no matches vs draft-only matches)
  - `StandingsPublishingActions.tsx` (mobile bottom publishing bar with dominant Export CTA)
  - `StandingsRows.tsx` (backward-compatible adapter delegating to StandingsTable)
- **Utilities:** `src/features/standings/utils/formatStandingsScore.ts`

---

## Required Behavior Preserved
1. Only FINALIZED matches contribute to standings.
2. DRAFT matches contribute nothing.
3. Reopening a finalized match removes its contribution.
4. Re-finalizing restores its contribution.
5. Deleting a match removes its contribution.
6. DNP does not count as a played match and contributes exactly 0 points.
7. PLAYED with 0 finishes DOES count as a played match and remains distinct from DNP.
8. Raw MatchResults remain persisted source of truth; standings/totals remain runtime-derived.
9. Scoring remains deterministic and domain-owned (`SCORE_SCALE = 100` fixed-point).
10. Decimal scoring responsiveness up to 2 decimal places (no fixed-width clipping, tabular numerals).
11. Competition ranking remains intact; true ties share rank without visual renumbering.
12. Configured tiebreak rules remain authoritative (WWCD, Placement Points, Total Kills, Recent Match).
13. Team IDs never act as competitive tiebreakers.
14. Finalize → Standings immediate update flow preserved.
15. Zero page-level horizontal overflow at 360px, 390px, 430px viewports (`scrollWidth <= clientWidth`).
16. Workspace geometry aligns with sister screens (`max-w-5xl`, `x ≈ 328px` at 1440px, `x ≈ 568px` at 1920px).

---

## Out of Scope
- Functional UI-G1 export (graphics generator, PNG download, template gallery, branding editor)
- AI / OCR / screenshot ingestion
- Player statistics / MVP / fragger leaderboards
- Authentication / Backend / Cloud sync
- Dark mode
- Modifying deterministic scoring / tiebreak formulas in `src/domain/`

---

## Verification Completed
- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npm run test -- --run`: 48 test files passed, 313 tests passed
- `npm run test:e2e`: 9 Playwright tests passed (including mobile viewports and geometry validation)
- `npm run build`: Production Next.js build completed successfully
- `npx madge --circular --extensions ts,tsx src/`: 0 circular dependencies
- `git diff --check`: 0 whitespace issues
- Playwright visual QA and geometry validation executed across 1440px, 1920px, 1024px, 768px, 430px, 390px, and 360px.

---

## Blockers / Unresolved Issues
- None.

---

## Next Planned Stage (Upon Approval)
- **UI-L4 — Responsive / Accessibility / Regression Hardening**
