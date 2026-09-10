# Handoff

## CURRENT STATUS

- R2A–R2L complete and externally approved
- frontend architecture frozen as the current baseline
- no unfinished R2 implementation work
- no production changes made by R2L
- UI/design phase not started
- frontend/backend restructuring not started
- backend not started

## IMPORTANT CONSTRAINTS FOR UPCOMING UI PHASE

- correctness and data integrity remain non-negotiable
- TTPT means Time To Points Table
- MatchEntry hot-path behavior must not be degraded by redesign
- no Formik in MatchEntry
- native numeric inputs remain unless a proven equal/better solution exists
- 500ms autosave/write-coordinator/latest-snapshot semantics remain
- scoring remains deterministic
- graphics/visual design must never become authoritative for scoring
- current architecture boundaries remain frozen unless a concrete UI requirement proves a change necessary

## FINAL VERIFICATION

- 293 Vitest
- 7 Playwright
- typecheck clean
- lint 0/0
- build clean
- verify clean
- IndexedDB v4
