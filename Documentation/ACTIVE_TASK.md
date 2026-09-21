# Active Task

## Active Stage
**UI-L3 — MatchEntry** (UI-F5)

## Status
**Implementation Complete — Awaiting External Review**
- Working branch: `feat/stitch-ui`
- UI-F1 (Overview), UI-F2 (Teams), UI-F3 (Scoring), and UI-F4 (Matches) are approved and committed.
- MatchEntry visual transplant and responsive layout implementation are complete.
- All functional invariants, keyboard flows, write coordination, and autosave semantics are verified.
- All automated quality gates (typecheck, lint, Vitest, Playwright, build, circular check) pass.
- Uncommitted working tree contains only the UI-L3 MatchEntry changes and continuity documents, ready for review.

---

## Objective
Deliver high-fidelity visual alignment with the authoritative Stitch design reference (`Documentation/ui-reference/desktop/match-entry.png` and `Documentation/ui-reference/mobile/match-entry.png`), while strictly protecting OpenLoby's competitive integrity and optimizing the central operations workflow metric: **TTPT (Time To Points Table)**.

---

## Scope
- **Route:** `/tournaments/[id]/matches/[matchId]`
- **Screen File:** `src/screens/tournament-workspace/MatchEntryRoute.tsx`
- **Feature Components (`src/features/matches/components/`):**
  - `MatchEntry.tsx`
  - `MatchEntryForm.tsx`
  - `MatchEntryHeader.tsx` (new)
  - `MatchEntryToolbar.tsx` (new)
  - `MatchEntryActions.tsx` (new)
  - `MatchResultGrid.tsx`
  - `MatchResultRow.tsx`

---

## Required Behavior Preserved
- **Native Controlled Numeric Inputs:** Zero Formik, zero FieldArray, zero heavy form libraries. Native inputs preserved for maximum typing latency responsiveness.
- **Keyboard Progression:** `Enter` key automatically advances focus: Placement → Finishes → Next Team Placement, selecting text on focus transition for rapid correction.
- **DNP Semantics:** `DNP` marks `participationStatus = "DNP"`, sets placement and finishes to `null`, disables numeric inputs with a placeholder dash (`—`), displays a `DNP` pill, and excludes the team from scoring.
- **Played 0 Finishes:** `kills = 0` remains strictly distinct from `null` (DNP) or empty/blank.
- **Autofill:** `Auto-fill placements` assigns sequential placements to all participating non-DNP teams in slot order without modifying persistence semantics.
- **Write Coordination & Autosave:** 500ms debounced autosave via `MatchWriteCoordinatorRegistry`, flush on unmount/blur/pagehide, and serialized `runExplicit` calls for `save` and `finalize`.
- **Finalized Match Protection:** Read-only direct URL access, disabled inputs, disabled action buttons, and protection against accidental draft reverts.
- **Workspace Parity:** Outer desktop shell matches Teams, Scoring, and Matches (`max-w-5xl`, `x = 328px` at 1440px, `x = 568px` at 1920px).
- **Responsive Layout:** Responsive CSS Grid where action buttons sit top-right on desktop (matching desktop Stitch) and flow to the bottom on mobile (matching mobile Stitch) with strictly one set of buttons in the DOM.
- **Mobile Overflow:** 0px document overflow verified at 360px, 390px, and 430px viewports.

---

## Verification Completed
- `npm run typecheck`: 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npm run test -- --run`: 47 test files passed, 310 tests passed
- `npm run test:e2e`: 7 Playwright tests passed (including mobile viewports)
- `npm run build`: Production Next.js build completed successfully
- `npx madge --circular --extensions ts,tsx src/`: 0 circular dependencies
- `git diff --check`: 0 whitespace issues
- Playwright visual QA and geometry validation executed across 1440px, 1920px, 430px, 390px, and 360px.

---

## Unresolved Issues / Blockers
- None.

---

## Next Planned Task
Upon external review and approval of UI-L3 MatchEntry:
- **UI-L3 — Overall Standings** (`/tournaments/[id]/standings`)
