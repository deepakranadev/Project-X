# Project Context

## PRODUCT
Project X is a web-first, mobile-first BGMI esports points-table and statistics product.

Initial product focus:
Tournament → teams → scoring configuration → matches → results → standings → later graphics/export

Core product advantage:
"minimum trustworthy Time To Points Table"

Do not try to replace Discord/WhatsApp/community/tournament-registration platforms.
Stay focused on points-table/statistics/results workflows.

## PRIORITIES
Approved order:
1. correctness
2. data integrity
3. TTPT / processing latency
4. visual polish

## CURRENT TECHNOLOGY
- Next.js 16.3.4
- React 19.2.8
- strict TypeScript
- Tailwind v4
- App Router
- Vitest 5.0.0
- Playwright 1.63.0
- IndexedDB guest persistence

IndexedDB schema version: 4

PostgreSQL/Supabase/cloud persistence: future, not currently implemented.

## ARCHITECTURE
Current ownership:
- `src/app`: Next routing/framework concerns
- `src/screens`: route-level composition/dependency wiring
- `src/features`: tournament/team/scoring/match/standings workflows and UI
- `src/domain`: pure competitive/business logic
- `src/infrastructure`: IndexedDB/browser implementation
- `src/styles`: global styling
- `shared`: only when real cross-feature reuse exists

R2G composition model:
route → screen → feature component → feature hook/controller → feature use case/action → repository interface → infrastructure implementation

## SCORING
Approved scoring architecture:
- pure/deterministic calculations
- SCORE_SCALE = 100 internally
- maximum 2-decimal scoring precision
- unsupported precision rejected, never rounded silently
- DNP contributes exactly zero
- PLAYED zero finishes remains distinct from DNP
- raw MatchResults are persisted
- calculated totals/standings are not persisted
- fully equal teams share competition rank
- configured tiebreak order is respected
- team ID is never a competitive tiebreak

BGMI standard preset currently represents:
1 = 10, 2 = 6, 3 = 5, 4 = 4, 5 = 3, 6 = 2, 7 = 1, 8 = 1, 9+ = 0
1 point per finish

It remains configuration/preset data. Do not hardcode it into scoring functions.

## GUEST / AUTH FUTURE DECISION
Approved future product direction:
Guests may:
- create tournaments
- add teams
- configure scoring
- enter/import matches/results
- calculate/view standings
- preview graphics

Authentication should later be required for higher-intent actions such as:
- download/export
- cloud saving
- cross-device history
- permanent share links

Important: Guest tournament data must eventually survive the guest → authenticated transition.
Do NOT implement authentication until explicitly tasked.

## GRAPHICS FUTURE DECISION
Project X will later support multiple selectable points-table graphic templates.
Designs may originate in Canva/Figma.

Architecture rule:
deterministic standings → graphic renderer → template A / B / C

Graphics are presentation-only. They never calculate or alter competitive scoring.
Initial target later: a small number of excellent templates rather than many mediocre ones.
Do NOT implement graphics yet.

## FUTURE SCREENSHOT / AI WORKFLOW
Approved conceptual pipeline:
slot list
+
lobby observations
+
result observations
→ deterministic resolution
→ deterministic scoring

AI extracts observations only.
AI must never directly calculate/finalize points.

Important future constraints:
- player count is variable; never assume exactly four
- duplicate result screenshots may overlap and must be deduplicated
- Unicode/confusable player names require context-aware resolution
- preserve raw OCR/visual evidence
- uncertain identity must use review/unresolved state instead of guessing
- squad-level context matters more than perfect individual OCR
- player identity across matches is a separate problem from result-squad → lobby-slot matching
- Tesseract.js is currently only a future benchmark candidate
- no OCR provider has been permanently selected yet

## LATENCY / TTPT
Deterministic/local operations should feel instant.
Do not add unnecessary network/database/render steps to the core path.
AI/OCR later should be parallelized where possible.
Graphic rendering must not block standings.
MatchEntry remains latency-sensitive.

## MONETIZATION DIRECTION
Product direction currently favors:
Guest → experience core product
Free account → save/export/history
Paid organizer tier later → higher limits/professional branding/features

Do not encode pricing assumptions into architecture.
