# Current State

R1 ✅ Master audit
Established the foundational architecture guidelines, identifying missing domain boundaries and setting up the R2 refactor plan.

R2A ✅ Match lifecycle atomicity and autosave/finalize race safety
Extracted race-safe write coordination from UI, ensuring MatchEntry handles autosave/finalize correctly with latest-snapshot semantics and single readwrite transactions for persistence.

R2B ✅ Team referential integrity
Protected team deletion/reordering. Ensured teams cannot be removed if they possess match history.

R2C ✅ Exact scoring precision + DNP invariant
Ensured deterministic scoring scaling (SCORE_SCALE = 100), DNP scoring as exactly zero, and rejected precision loss instead of silently rounding.

R2D ✅ IndexedDB runtime trust boundary and parsing
Decoupled domain types from IndexedDB schema. Enforced strict Zod validation/parsing at the storage edge so malformed/missing stored data cannot corrupt competitive domain logic.

R2E ✅ Mechanical architecture restructure
Moved files into structured `app`, `screens`, `features`, `domain`, and `infrastructure` folders to separate routing from orchestration and logic.

R2F ✅ Type/mapper/validation ownership and domain purity
Ensured pure domain layer with zero outwards dependencies. Repositories export interfaces, while concrete implementations exist solely in infrastructure.

R2G ✅ Feature orchestration, hooks, decomposition and infrastructure decoupling
Feature React components now have zero concrete infrastructure imports. UI orchestration logic decoupled into feature-owned hooks. All production files are now under 250 lines and canonical workspace state drives updates deterministically.

R2H ✅ Formik Migration for Standard Forms
Formik adopted only for Tournament Creation, Team Edit, and Scoring Configuration.
- MatchEntry remains non-Formik
- Team Bulk Entry remains non-Formik
- explicit single-flight guards protect async form mutations
- R2I is NEXT and NOT STARTED

R2I ✅ shadcn Foundation + Shared UI Primitive Layer
- shadcn new-york configuration
- Tailwind v4 compatible
- src/shared/ui established
- src/shared/utils/cn.ts established
- current used primitives: Button, Input, Textarea, Label
- Migrated standard inputs/buttons in Tournament Creation, Team Editor, Team Bulk Entry, Scoring Configuration, and Team Roster.
- MatchEntry remains specialized/non-shadcn hot path
- Formik boundaries from R2H remain intact
- Did not touch Dialog/Sheet overlays.
- Kept UI hierarchy shallow and semantic.
- R2I is COMPLETE AND APPROVED.
- R2J is NEXT and NOT STARTED.

R2J = NEXT, NOT STARTED

## Product Expansion Principle
**BUILD NARROW. ARCHITECT BROAD. EXPAND ONE FEATURE AT A TIME.**
*See `PROJECT_CONTEXT.md` for durable architectural rules regarding future multi-persona capabilities, domain isolation, and modular dashboards. Current product focus strictly remains ESPORTS POINTS TABLES.*

## Current Important Implementation Facts
- IndexedDB schema version 4
- Feature React components have no concrete infrastructure imports
- Feature hooks operate on contracts
- Canonical workspace state exists
- Roster mutations propagate to match features
- MatchEntry decomposed into draft-state/persistence/presentation helpers
- Existing race-safe write coordinator retained
- No production `.ts/.tsx` file is currently over 250 lines
- Current largest production files: `TournamentWorkspaceScreen.tsx` (227 lines), `TeamEditSheet.tsx` (221 lines), `indexedDbMatchRepository.ts` (218 lines), `indexedDbTeamRepository.ts` (216 lines), `guestDatabase.ts` (206 lines)
- No architecture cycles
- Domain has no outward/browser dependencies
- Formik handles standard forms only (no Formik in MatchEntry or TeamBulkForm)
- Shadcn UI foundation installed (Button, Input, Textarea, Label in `src/shared/ui`)
- Overlay layer (Sheet, Dialog) remains unmigrated.
- MatchEntry untouched by shadcn (specialized hot path).
- No authentication
- No cloud persistence
- No graphics engine
- No OCR/AI implementation

- **Vitest:** 274 tests pass across 39 test files.
- **Architecture tests:** 13 tests pass (part of the 274 count above).
- **Playwright E2E:** 7 tests pass.
- **Production Build:** Successfully completed, generating 4 routes.
