<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CROSS-AGENT STARTUP INSTRUCTION

Before implementation work, read in this order:

1. AGENTS.md
2. Documentation/MASTER_SPEC.md
3. Documentation/PROJECT_CONTEXT.md
4. Documentation/CURRENT_STATE.md
5. Documentation/ACTIVE_TASK.md
6. Documentation/HANDOFF.md
7. Git status/diff/log

## DURABLE ENGINEERING RULES

### PRIORITY ORDER
1. correctness
2. data integrity
3. TTPT / processing latency
4. visual polish

### SOURCE OF TRUTH
- repository state and code are authoritative
- inspect Git before editing
- never assume another model's chat history is available
- documentation assists understanding but does not override code/tests

### SCOPE
- work on only the explicitly authorized stage/task
- never start the next stage automatically
- no speculative feature implementation
- do not mix unrelated cleanup with the active task

### GIT
- run `git status` before editing
- never reset, restore, stash, clean, commit, merge, or push unless the active task explicitly authorizes it
- when taking over unfinished work, inspect the existing diff before modifying anything
- never discard another agent's uncommitted work without explicit user approval

### TESTING
- never weaken/delete tests merely to make them pass
- correctness regressions must be fixed rather than hidden
- report commands actually executed
- never claim a test passed if it was not run

### ARCHITECTURE
- domain must remain pure and browser-neutral
- screens are composition boundaries
- features own workflows/UI
- infrastructure owns browser/persistence implementation
- repository contracts must not expose IndexedDB internals
- shared code should exist only for genuine reuse
- production file decomposition must be responsibility-based
- do not game file-size targets

### PERSISTENCE
- IndexedDB/runtime storage is untrusted input
- malformed stored competitive data must not silently enter domain logic
- never silently rewrite/repair competitive data
- no IndexedDB schema/version changes unless explicitly authorized
- raw results remain source of truth
- calculated standings/totals are derived, not persisted

### SCORING
- deterministic code owns scoring
- SCORE_SCALE = 100 fixed-point scoring
- custom scoring supports maximum 2 decimal places
- DNP contributes exactly zero
- configured tiebreaks remain deterministic
- fully equal teams share rank
- team ID is stable presentation fallback only, never competitive
- AI/graphics must never calculate competitive points

### MATCH ENTRY / PERFORMANCE
- MatchEntry is a TTPT-sensitive hot path
- preserve responsive input behavior
- do not add unnecessary persistence operations
- preserve autosave/write-coordinator race safety
- avoid heavyweight form/state libraries in MatchEntry

### FUTURE AI
- AI/OCR extracts observations only
- deterministic code owns normalization, matching, validation and scoring
- ambiguity goes to review instead of being guessed
- duplicate screenshots must never double-count
- Tesseract.js is only a future benchmark candidate until explicitly selected

### FUTURE GRAPHICS
- graphic templates consume already-calculated standings
- graphics never calculate points
- rendering must not block standings availability

### DEPENDENCIES
- do not add packages without a concrete reason
- prefer existing/simple local solutions where sufficient
