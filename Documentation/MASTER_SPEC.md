# MASTER PRODUCT & ENGINEERING SPECIFICATION

## 0. Instruction to Codex

You are building a production-quality, mobile-first web application for creating esports points tables.

Read this entire specification before writing implementation code.

Do **not** add features merely because they seem useful.

Do **not** turn this into a general tournament-management platform.

The product has one primary promise:

> **Turn BGMI match results into an accurate, professional, share-ready points table as quickly as possible.**

The eventual AI promise is:

> **Upload result screenshots → review extracted data → generate points table.**

The MVP must prioritize:

1. Speed
2. Correctness
3. Mobile usability
4. Reliable scoring
5. Professional graphics
6. Simple AI-assisted extraction

If a proposed implementation conflicts with these priorities, choose the simpler and more reliable implementation.

---

# 1. Product Scope

## Product Type

Web application.

Not:

* Android app
* iOS app
* Discord replacement
* tournament social network
* tournament registration platform
* esports discovery platform

The website should work exceptionally well from a mobile browser.

The initial supported game is:

**BGMI**

Architecture should permit PUBG Mobile and Free Fire support later without rewriting the scoring engine.

Do not implement those games unless explicitly requested in a later task.

---

# 2. Target User

Primary user:

**BGMI scrim and tournament organizers who currently calculate standings using PointCalc, Excel, spreadsheets, calculators, Canva, Photoshop, or similar workflows.**

The user usually receives match-result screenshots and needs to publish a points table quickly.

The product must reduce the time between:

> receiving the match result

and:

> publishing the correct points table.

Our internal primary performance metric is:

## TTPT — Time To Points Table

Every product decision should attempt to reduce TTPT without compromising correctness.

---

# 3. Core MVP Workflow

The complete MVP user journey is:

```text
Open Website
     ↓
Create Tournament
     ↓
Add Teams
     ↓
Configure Scoring
     ↓
Create Match
     ↓
Choose:
 ┌───────────────┐
 │ Manual Entry  │
 │       OR      │
 │ AI Screenshot │
 └───────────────┘
     ↓
Validate Results
     ↓
Save Match
     ↓
Calculate Standings
     ↓
Choose PT Design
     ↓
Customize Branding
     ↓
Export PNG
```

No unrelated workflow should be introduced.

---

# 4. MVP Feature Set

## 4.1 Tournament Creation

Required fields:

* tournament name
* tournament logo — optional
* organizer name — optional
* organizer logo — optional
* game
* scoring configuration

For MVP:

```text
Game:
BGMI
```

Tournament creation should take less than a minute.

Do not require authentication merely to create a manual tournament.

---

# 5. Team Management

Organizer must be able to:

* add one team
* bulk-paste team names
* edit team name
* add short name
* upload team logo
* remove team
* reorder teams
* assign slot number

Bulk paste example:

```text
Team Soul
GodLike
Team XSpark
Orangutan
8Bit
Revenant
```

System should automatically create one team per line.

Required team fields:

```text
id
tournamentId
name
shortName?
slotNumber?
logoUrl?
createdAt
updatedAt
```

Player-level management is **not part of the initial MVP**.

Do not add:

* player profiles
* player statistics
* fraggers
* team recruitment

Those can come later.

---

# 6. Scoring Configuration

The scoring system must be configurable.

Do not hardcode tournament rules throughout the application.

Use a structured scoring configuration.

Example conceptual structure:

```ts
type ScoringConfig = {
  placementPoints: Record<number, number>;
  pointsPerKill: number;
  tiebreakers: TiebreakerType[];
};
```

Example:

```text
Placement 1 → configured points
Placement 2 → configured points
Placement 3 → configured points
...
Kill → configured points per kill
```

Do not assume a specific BGMI scoring table unless that configuration has explicitly been approved.

Official/default presets should be stored as configuration data, not embedded into scoring functions.

---

# 7. Tiebreak System

The tiebreak system must be deterministic and configurable.

Potential supported tiebreak criteria:

```text
Total points
WWCD count
Placement points
Total kills
Best placement
Latest-match placement
```

Architecture:

```ts
type TiebreakerType =
  | "TOTAL_POINTS"
  | "WWCD"
  | "PLACEMENT_POINTS"
  | "TOTAL_KILLS"
  | "BEST_PLACEMENT"
  | "LATEST_MATCH_PLACEMENT";
```

Organizer should eventually be able to arrange applicable tiebreak rules in priority order.

Example:

```text
1. Total Points
2. WWCD
3. Placement Points
4. Total Kills
5. Latest Match Placement
```

When two teams tie, the scoring engine must be capable of explaining why one ranks above the other.

Example:

```text
Team A and Team B both have 72 points.

Team A ranks higher because:
WWCD: 2

Team B:
WWCD: 1
```

The explanation functionality can be basic in V1 but scoring logic must make this possible.

---

# 8. Scoring Engine

The scoring engine is the most critical part of the application.

It MUST be implemented as pure deterministic logic separate from:

* UI
* database
* AI
* image rendering

Suggested location:

```text
/src/domain/scoring/
```

Suggested modules:

```text
calculateMatchScore.ts
calculateTournamentStandings.ts
applyAdjustments.ts
resolveTies.ts
validateMatchResults.ts
types.ts
```

Core formula conceptually:

```text
Match Score =
Placement Points
+
(Kills × Points Per Kill)
+
Bonuses
-
Penalties
```

Do not allow AI to calculate points.

AI only extracts raw result data.

The scoring engine calculates standings.

---

# 9. Match Model

Each tournament can contain multiple matches.

Match fields:

```text
id
tournamentId
matchNumber
name?
status
createdAt
updatedAt
```

Possible statuses:

```text
DRAFT
FINALIZED
```

Each match contains one result per participating team.

---

# 10. Match Result Model

Conceptual fields:

```text
id
matchId
teamId

placement
kills

placementPoints
killPoints

bonusPoints
penaltyPoints

totalPoints

source
createdAt
updatedAt
```

Source:

```text
MANUAL
AI
AI_CORRECTED
```

Calculated fields should be derived from deterministic scoring logic.

Do not trust client-calculated totals when data is persisted to the server.

---

# 11. Match Result Validation

Before a match can be finalized:

Validate:

* placement is a positive integer
* placement does not exceed valid participant count
* kills are non-negative integers
* the same team does not appear twice
* duplicate placements are detected
* unknown teams are rejected or flagged
* required teams are present
* missing teams are clearly shown
* malformed values are rejected

DNP should be supported.

Conceptually:

```text
DNP = Did Not Participate
```

Do not silently invent placement or kills for DNP teams.

---

# 12. Manual Result Entry

Manual entry must be exceptionally fast.

Preferred UI:

```text
MATCH 1

TEAM               PLACE     KILLS

Team Soul            1        13
GodLike              2         9
Team XSpark          3         8
Orangutan            4         6
8Bit                 5         7
```

Requirements:

* all teams visible in one efficient workspace
* mobile-friendly
* numeric keyboard where appropriate
* minimal taps
* next-field focus
* autosave draft
* DNP option
* fast editing
* placement auto-fill option
* screenshot can remain visible while entering data

Do not create a workflow where the user repeatedly opens individual team modals unless absolutely necessary.

The goal is spreadsheet-like speed without looking like a spreadsheet application.

---

# 13. Screenshot-Assisted Manual Mode

Before AI extraction, uploaded screenshots should already provide value.

Organizer should be able to:

1. upload screenshot
2. view screenshot
3. zoom if necessary
4. enter results beside/below it

Desktop concept:

```text
┌─────────────────────┬────────────────────────┐
│                     │ MATCH 1                │
│                     │                        │
│ RESULT SCREENSHOT   │ Team    Place   Kills │
│                     │ Soul      1       12   │
│                     │ GL        2        8   │
│                     │ ...                    │
└─────────────────────┴────────────────────────┘
```

Mobile:

```text
Screenshot
────────────

Result Grid
────────────
```

The screenshot should remain easy to reference while entering data.

---

# 14. AI Is Part of the MVP

AI screenshot extraction is a required MVP feature.

However:

AI MUST NOT be tightly coupled to the rest of the application.

Create a provider interface.

Conceptual interface:

```ts
interface ResultExtractionProvider {
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}
```

The application must be able to swap AI providers later.

Do not scatter model-specific API calls throughout application code.

---

# 15. AI Responsibilities

The AI system's job is only to extract:

```text
team identity
placement
kills
```

Potential later extraction:

```text
slot
player kills
```

Not MVP.

AI must return structured data.

Conceptual output:

```json
{
  "rows": [
    {
      "detectedTeamName": "Team Soul",
      "placement": 1,
      "kills": 12
    },
    {
      "detectedTeamName": "GodLike",
      "placement": 2,
      "kills": 8
    }
  ]
}
```

Use schema validation on every AI response.

Invalid structured output must never be committed to match results.

---

# 16. AI Validation Pipeline

Required architecture:

```text
slot list
+
lobby observations
+
result observations
    ↓
deterministic resolution
    ↓
deterministic scoring
```

AI extracts observations only.

AI output must NEVER directly finalize a match.

---

# 17. Team Matching

AI may extract imperfect names.

Examples:

```text
AI: SOUL
Roster: Team Soul

AI: GODL1KE
Roster: GodLike

AI: X SPARK
Roster: Team XSpark
```

Implement a team-matching layer.

Use:

1. exact normalized match
2. short-name match
3. fuzzy match
4. unresolved result

Normalization can include:

* lowercase
* whitespace normalization
* punctuation removal

Do not automatically accept weak fuzzy matches.

Ambiguous matches must require organizer review.

---

# 18. AI Review Experience

After extraction:

```text
MATCH 3 — AI RESULT

14 rows ready
2 rows need review

Team XSpark
Placement: 4
Kills: 8

Possible team:
Team XSpark

[Confirm]


Unknown Team
Detected:
"GDLK"

Suggested:
GodLike

[Confirm] [Choose Another Team]
```

The user must be able to edit:

* team
* placement
* kills

before confirmation.

---

# 19. Do Not Fake AI Confidence

Do not invent arbitrary values such as:

```text
AI confidence: 97%
```

unless there is a defensible method for producing that value.

Instead use review statuses such as:

```text
READY
NEEDS_REVIEW
UNRESOLVED
INVALID
```

Include reasons:

```text
Ambiguous team match
Duplicate placement
Missing team
Invalid kill value
Possible OCR mismatch
```

Correctness matters more than pretending the AI is certain.

---

# 20. Failed AI Scans

AI failures must be graceful.

Examples:

```text
Image unsupported
Unable to detect result table
Extraction incomplete
Too many ambiguous teams
```

User should always have:

```text
Switch to Manual Entry
```

The tournament workflow must never depend entirely on AI.

---

# 21. AI Usage Accounting

Prepare architecture for AI credits.

Do not implement full payment processing during the first engineering milestone.

Track:

```text
AI scan started
AI scan succeeded
AI scan failed
AI scan confirmed
```

Proposed billing principle:

> Failed extraction should not consume a paid AI credit.

Credits should be consumed only according to a clearly defined successful-processing rule.

This rule must remain centralized.

---

# 22. Standings

Generate:

## Match Standings

For one match.

Fields can include:

```text
Rank
Team
Placement
Kills
Placement Points
Kill Points
Total Points
```

## Overall Standings

Across all finalized matches.

Fields:

```text
Rank
Team
Matches Played
WWCD
Placement Points
Kills
Total Points
```

Standings must update automatically when:

* match result changes
* match deleted
* adjustment added
* scoring configuration changes

---

# 23. Adjustments

Support:

```text
Bonus
Penalty
```

Adjustment fields:

```text
id
tournamentId
teamId
matchId?
type
points
reason
createdAt
```

Reason is required.

Example:

```text
Penalty: -2
Reason: Rule violation
```

Never silently modify historical scores.

---

# 24. Editing Historical Matches

Organizer can open any previous match.

Change:

* placement
* kills
* team mapping
* DNP state

After saving:

Tournament standings must recalculate automatically.

Do not store stale aggregate standings as the source of truth.

Raw results + scoring rules are the source of truth.

---

# 25. Points Table Graphic Generator

The product must generate professional esports graphics.

Do not output a basic HTML table screenshot.

Initial output:

```text
1080 × 1350 PNG
```

Primary use:

Instagram/Discord/WhatsApp sharing.

Architecture should later support:

```text
1080 × 1920
1920 × 1080
custom sizes
```

Do not implement all sizes initially.

---

# 26. Rendering Architecture

Prefer deterministic SVG-based rendering.

Recommended pipeline conceptually:

```text
Tournament Data
      ↓
Template Configuration
      ↓
React/SVG Rendering
      ↓
SVG
      ↓
Image Processing
      ↓
PNG
```

Potential server rendering tool:

```text
Sharp
```

Avoid a fragile headless-browser screenshot pipeline unless there is a strong technical reason.

Rendering code should be isolated:

```text
/src/domain/rendering/
```

---

# 27. Initial Templates

First engineering implementation:

**3 templates**

Before public MVP launch:

**6–10 polished templates**

Do not try to compete with PointCalc's template count.

Focus on quality and flexibility.

Initial categories:

```text
1. Clean Professional
2. Dark Competitive
3. Gaming / Aggressive
```

Later:

```text
Minimal
Neon
Sponsor-heavy
Custom
```

---

# 28. Design Customization

User can customize:

* tournament logo
* organizer logo
* sponsor logos
* background
* primary styling
* typography options
* team logos
* event name
* subtitle

Do not build Canva.

Do not build:

* arbitrary layer editor
* vector drawing tools
* freehand placement
* full graphic-design application

Use controlled customization.

---

# 29. Live Preview

Design screen:

```text
┌─────────────────┬─────────────────────────┐
│ SETTINGS        │                         │
│                 │                         │
│ Background      │      LIVE PREVIEW       │
│ Font            │                         │
│ Logos           │                         │
│ Branding        │                         │
│                 │                         │
└─────────────────┴─────────────────────────┘
```

On mobile, stack controls and preview vertically.

---

# 30. Export

Required:

```text
Download PNG
```

Export must:

* preserve exact dimensions
* preserve correct table order
* preserve logos
* preserve text
* handle long team names
* handle 16+ teams where template permits
* avoid clipped content

Before public launch, create rendering regression tests.

---

# 31. Guest Experience

Manual PT creation should work without mandatory signup.

Suggested model:

Guest:

* create tournament
* manual scoring
* local saving
* generate basic PT

Account required for:

* cloud backup
* AI usage
* premium features
* paid credits

Do not put an authentication wall before the user understands the product.

---

# 32. Local Persistence

For guest mode use robust browser persistence.

Preferred:

```text
IndexedDB
```

Do not rely solely on temporary React state.

Autosave:

* tournament
* teams
* scoring config
* match drafts
* design configuration

Show clear state:

```text
Saved
```

or:

```text
Saving...
```

---

# 33. Cloud Architecture

Recommended stack:

```text
Frontend:
Next.js
TypeScript
Tailwind CSS

Database:
PostgreSQL

Backend services:
Supabase

Authentication:
Supabase Auth

Object storage:
Supabase Storage

Deployment:
Vercel
```

Prefer stable maintained versions available at implementation time.

Do not intentionally choose experimental framework versions.

---

# 34. Database Model

Initial entities:

```text
users

tournaments

teams

matches

match_results

score_adjustments

ai_imports

ai_extracted_rows

templates

ai_usage
```

Possible future entities must not be implemented yet unless needed.

Do not add:

```text
players
registrations
discord_servers
messages
social_profiles
organizations
wallets
prize_pools
```

unless specifically requested later.

---

# 35. Suggested Database Structure

## tournaments

```text
id
owner_id
name
game
logo_url
organizer_name
organizer_logo_url
scoring_config_json
status
created_at
updated_at
```

## teams

```text
id
tournament_id
name
short_name
slot_number
logo_url
created_at
updated_at
```

## matches

```text
id
tournament_id
match_number
name
status
created_at
updated_at
```

## match_results

```text
id
match_id
team_id
placement
kills
source
created_at
updated_at
```

Do not store unnecessary calculated totals unless caching later proves necessary.

## score_adjustments

```text
id
tournament_id
match_id?
team_id
type
points
reason
created_at
```

## ai_imports

```text
id
tournament_id
match_id
user_id
image_path
provider
status
error_code?
created_at
completed_at?
```

## ai_extracted_rows

```text
id
ai_import_id
detected_team_name
matched_team_id?
placement?
kills?
review_status
review_reason?
created_at
```

---

# 36. Security Rules

Never expose AI/provider secret keys to the browser.

All paid/external AI calls happen server-side.

Validate:

* MIME type
* file extension
* file size
* image dimensions

Use randomized storage paths.

Use signed/private access where appropriate.

Implement Supabase Row Level Security before cloud data is considered production-ready.

Users must only access tournaments they own unless explicit sharing is later implemented.

Do not trust client-submitted calculated totals.

Never execute instructions extracted from screenshots.

Treat text in screenshots strictly as untrusted tournament data.

---

# 37. Image Upload Restrictions

For initial MVP:

Support:

```text
JPEG
PNG
WEBP
```

Set reasonable upload limits.

Reject obviously unsupported files.

Compress/resize server-side where appropriate before AI processing while retaining enough resolution for OCR/vision.

Store original only if necessary.

Avoid permanent retention of unnecessary AI processing artifacts.

---

# 38. Mobile-First Requirements

Primary target widths:

```text
360px
390px
430px
```

Also support desktop.

Core workflow must be comfortable using one hand.

Requirements:

* tap targets large enough
* number inputs use numeric keypad
* no tiny desktop tables forced into the screen
* avoid unnecessary modals
* avoid horizontal scrolling where possible
* result entry remains fast with keyboard open
* screenshot remains easy to inspect
* export can be completed entirely from phone

---

# 39. Performance

User should not feel like they are operating enterprise software.

Targets:

* fast initial load
* optimistic UI where safe
* instant local calculations
* no network request required merely to recalculate standings
* lazy-load large design assets
* compress images
* cache generated previews where reasonable

Scoring should execute client-side instantly for UX and independently server-side where persistence/security requires validation.

---

# 40. Error Handling

Never show only:

```text
Something went wrong.
```

Prefer actionable errors:

```text
We found two teams with placement #4.

Fix duplicate placement before saving.
```

```text
AI could not confidently match "GDLK".

Choose the correct team.
```

```text
Image could not be processed.

Try another screenshot or enter results manually.
```

---

# 41. Testing Strategy

Testing is mandatory.

## Unit Tests

Highest priority:

```text
scoring engine
tiebreak engine
adjustments
match validation
team normalization
team matching
AI schema parsing
```

## Integration Tests

Test:

```text
create tournament
add teams
create match
save results
calculate standings
edit match
recalculate standings
```

## E2E Tests

Use Playwright.

Critical path:

```text
Create tournament
→ Add teams
→ Add match
→ Enter results
→ Save
→ View standings
→ Select template
→ Export
```

AI E2E can initially use a mock extraction provider.

---

# 42. Scoring Regression Fixtures

Create dedicated fixtures.

Example:

```text
Tournament:
16 teams
6 matches
Known scoring configuration
Known results

Expected:
exact final rankings
exact totals
exact kills
exact WWCD
```

Scoring code cannot be merged if fixtures change unexpectedly.

Every bug found in production scoring should create a permanent regression test.

---

# 43. Non-Negotiable Coding Rules

Use:

```text
TypeScript strict mode
```

Avoid:

```text
any
```

unless absolutely necessary and documented.

Use schemas for API input validation.

Prefer small modules over giant components.

Keep business logic outside UI components.

No AI call inside React rendering logic.

No scoring algorithm duplicated across screens.

No magic-number scoring rules.

No hidden mutations.

No direct database calls scattered everywhere.

Create clear data-access/service boundaries.

---

# 44. Folder Architecture

Suggested:

```text
src/

  app/
    ...

  components/
    ui/
    tournament/
    matches/
    standings/
    designs/
    ai/

  domain/

    scoring/
      calculateMatchScore.ts
      calculateTournamentStandings.ts
      resolveTies.ts
      validateResults.ts
      types.ts

    ai/
      provider.ts
      schema.ts
      teamMatcher.ts
      validation.ts

    rendering/
      renderTemplate.ts
      templates/
      types.ts

  lib/
    supabase/
    storage/
    validation/

  server/
    services/
    repositories/

  types/

tests/

  scoring/
  integration/
  e2e/

docs/
```

Modify if there is a strong engineering reason, but preserve separation of concerns.

---

# 45. Analytics Events

Prepare lightweight product analytics.

Track:

```text
tournament_created

teams_added

match_created

match_saved

ai_import_started

ai_import_failed

ai_import_completed

ai_import_reviewed

standings_viewed

template_selected

pt_exported
```

Do not track unnecessary sensitive information.

These events will later allow measurement of TTPT and conversion.

---

# 46. TTPT Measurement

Eventually calculate:

```text
result workflow started
↓
PT successfully exported
```

Track:

```text
manual TTPT
AI TTPT
```

This is one of the product's most important metrics.

---

# 47. Monetization Architecture

Do not implement full monetization during the first coding task.

However, design so we can later support:

## Free

* manual PT
* core scoring
* limited templates
* PNG export
* subtle product branding

## Pro

Potential:

* premium designs
* custom branding
* no watermark
* cloud history

## AI Credits

Potential:

```text
N successful AI scans
```

## AI Pro

Potential subscription with included usage.

Payments and exact pricing are separate product decisions.

Do not hardcode pricing into domain logic.

---

# 48. DO NOT BUILD

This section is critical.

Do NOT build any of the following during MVP unless explicitly instructed later:

* Discord replacement
* Discord bot
* WhatsApp integration
* tournament registrations
* tournament discovery
* tournament marketplace
* chat
* social feed
* player profiles
* player recruitment
* team recruitment
* organizer profiles
* certificates
* full player fraggers
* warhead graphics
* OBS overlays
* prize pool management
* wallets
* payment distribution
* fantasy esports
* brackets
* streaming
* native Android app
* native iOS app
* desktop app
* template marketplace
* Canva-style editor
* multiple organizations/staff permissions
* public tournament network
* leaderboards across tournaments

If any of these appear necessary because of an implementation choice, reconsider the implementation.

---

# 49. MVP Definition of Done

The MVP is considered usable when a BGMI organizer can:

1. open the website on mobile
2. create a tournament
3. bulk-add teams
4. configure scoring
5. create a match
6. enter results manually
7. alternatively upload a supported screenshot
8. review/correct AI extraction
9. save the match
10. see correct standings
11. edit an earlier result
12. see standings recalculate
13. choose a professional template
14. add tournament/team branding
15. download a high-quality PNG

All without installing an app.

---

# 50. Product Quality Gate

Do not call the MVP ready merely because all screens exist.

Before public beta:

### Correctness

Run multiple verified tournaments through the scoring engine.

Zero unexplained ranking differences.

### AI

Test using a substantial real screenshot set.

Track:

```text
team detection errors
placement errors
kill errors
unmatched teams
manual corrections per match
```

### Mobile

Test real phones or accurate device emulation.

### Graphics

No clipping or broken layouts.

### Recovery

Browser refresh must not destroy guest tournament work.

---

# 51. Development Order

Build in this exact broad order.

## Phase 1 — Foundation

* repository
* framework
* TypeScript
* styling
* linting
* testing
* basic architecture

## Phase 2 — Scoring Domain

* types
* scoring config
* match scoring
* tournament standings
* tiebreakers
* adjustments
* validation
* extensive tests

## Phase 3 — Manual Product

* tournament creation
* teams
* scoring UI
* matches
* manual results
* standings
* autosave

## Phase 4 — Graphic Generator

* template architecture
* three templates
* customization
* PNG export

## Phase 5 — AI

* screenshot upload
* AI provider adapter
* structured extraction
* schema validation
* team matching
* review UI
* result confirmation

## Phase 6 — Accounts/Cloud

* Supabase auth
* storage
* persistence
* RLS

## Phase 7 — Public Beta Polish

* additional templates
* analytics
* rate limits
* monitoring
* AI usage accounting
* landing page
* onboarding polish

## Phase 8 — Monetization

Only after basic usage has been validated.

---

# 52. Codex Working Protocol

Do not attempt to build the entire specification in one task.

For every significant implementation task:

1. inspect relevant existing files
2. describe intended change briefly
3. implement only requested scope
4. add/update tests
5. run tests
6. run typecheck
7. run lint
8. report changed files
9. report remaining issues
10. stop

Do not begin unrelated next phases automatically.

---

# 53. AGENT RULES

These rules override convenience.

### Rule 1

Never change scoring behavior without updating/running scoring tests.

### Rule 2

Never allow AI output to directly finalize standings.

### Rule 3

Never add a feature outside the approved MVP scope.

### Rule 4

Never hardcode scoring values into UI components.

### Rule 5

Never expose secret API keys to the client.

### Rule 6

Never replace a deterministic solution with AI if deterministic logic is appropriate.

### Rule 7

Never delete working tests merely to make a build pass.

### Rule 8

Never hide data inconsistencies.

Surface them to the organizer.

### Rule 9

Prefer mobile simplicity over desktop complexity.

### Rule 10

Correct results are more important than visually impressive results.

---

# 54. FIRST CODEX TASK

Do **not** implement the entire application yet.

Start with the repository foundation and scoring domain only.

## Task 001 — Foundation + Scoring Engine

### Objective

Create a clean Next.js + TypeScript project foundation and implement the first version of the deterministic scoring engine with tests.

### Required Work

Set up:

```text
Next.js
TypeScript strict mode
Tailwind CSS
ESLint
testing framework
Playwright configuration
```

Create:

```text
src/domain/scoring/
```

Implement:

```text
types.ts

calculateMatchScore.ts

calculateTournamentStandings.ts

resolveTies.ts

validateMatchResults.ts
```

Support:

```text
custom placement point map

points per kill

multiple matches

WWCD count

placement points

kill totals

overall totals

bonus points

penalty points

configurable tiebreak ordering
```

Do not build UI beyond the minimal generated application shell.

Do not add Supabase yet.

Do not integrate AI yet.

Do not implement authentication yet.

Do not implement graphics yet.

---

# 55. Task 001 Required Tests

Write unit tests covering at minimum:

### Normal scoring

Known placement + kills gives expected total.

### Multiple matches

Totals aggregate correctly.

### WWCD

Placement #1 increments WWCD exactly once.

### Tie

Two teams with equal points resolve using configured tiebreak.

### Multiple tiebreak criteria

If first criterion ties, second criterion is applied.

### Penalty

Penalty lowers expected score.

### Bonus

Bonus increases expected score.

### Edited result

Recalculation produces correct updated standings.

### Duplicate placement

Validation rejects or flags duplicate valid placements.

### Invalid kills

Negative kills rejected.

### Invalid placement

Out-of-range placement rejected.

### DNP

DNP behavior remains explicit and does not invent scoring data.

---

# 56. Task 001 Completion Requirements

Before finishing Task 001:

Run:

```text
typecheck
lint
unit tests
```

Report:

```text
Files created
Architecture decisions
Tests written
Test results
Known limitations
Recommended next task
```

Do not automatically begin Task 002.

---

# 57. FINAL PRODUCT PRINCIPLE

Whenever uncertain whether to add something, ask:

> Does this help an organizer create a correct professional points table faster?

If **yes**, it may belong.

If **no**, it probably does not belong in this product yet.

The MVP should feel less like tournament-management software and more like a highly specialized tool:

> **Result → Calculate → Design → Share.**

That is the product.
