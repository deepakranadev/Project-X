# Active Task

## Active Stage
**UI-F2 — Teams Stitch Transplant**

## Status
**Ready to begin / Not started**
- Git working tree is clean on `feat/workspace-routing`.
- UI-F1 (Overview) is approved and committed.
- No code changes for UI-F2 have been started.

## Primary Rule
- **Stitch source = visual implementation authority.**
- **OpenLoby existing code = behavioral / domain / data authority.**

## Next Action
The next agent must receive the authoritative **Teams Stitch source code** before implementing.

## Scope
- **Route:** `/tournaments/[id]/teams`
- **Target Files:** `src/screens/tournament-workspace/TeamsRoute.tsx` and child feature components under `src/features/teams/`.

## Viewport Targets
- **Primary:** 1440px (Desktop), 390px (Mobile)
- **Sanity:** 360px, 430px

## Functions to Preserve
- Add Team primary action
- Bulk Add secondary action
- Edit Team (`TeamEditSheet` via Radix Sheet)
- Delete unreferenced team (`AlertDialog`)
- Historical-match team deletion guard
- Logo persistence and fallback avatar
- Full page refresh persistence
- Real App Router navigation (`next/link`)

## Out of Scope
- Scoring visual work
- Matches visual work
- MatchEntry visual work
- Standings visual work
- Export (UI-G1)
- AI / OCR extraction
- Authentication / Backend / Cloud database
- Dark mode

## Stop Condition
After UI-F2 implementation, capture screenshots at **1440px** (Desktop) and **390px** (Mobile) viewports and wait for external visual review/approval before proceeding.
