OpenLoby UI Specification — Light Theme v1

Status: Design locked for implementation planning
Scope: Current Points Table product + approved Export/Templates design reference
Primary device priority: Mobile first (390px), then desktop derivation (1440px)

1. Authority Order

When implementation details conflict, use this order:

Existing tested product behavior and domain invariants.

This UI specification.

Approved Stitch screenshots in Documentation/ui-reference/.

Agent/design interpretation.

The screenshots are visual references, not behavioral authority. They MUST NOT cause removal of existing tested functionality. Do not implement invented copy, states, features, or metadata visible in screenshots when this spec rejects them.

2. Product UX Thesis

OpenLoby is a mobile-first BGMI tournament points-table operations tool. The UI must optimize TTPT = Time To Points Table.

For an already configured tournament, the preferred publishing path is:

Overview → MatchEntry → Overall Standings → Export Points Table → Download PNG

Meaningful-action target, excluding actual result-entry taps/keystrokes:

Enter Match Results

Finalize Match

Export Points Table

Download PNG

A different template selection is optional and may add one action. Branding customization is optional and must never block the fast path.

3. Core Design Principles

Mobile-first; most expected usage is on phones.

Pure light theme for v1.

Minimalism means fewer decisions, fewer clicks, fewer competing controls, and less repeated information.

The organizer should always understand the primary next action.

Dense operational data is acceptable; microscopic typography and tiny touch targets are not.

Desktop uses additional space for clearer arrangement, not more features or more analytics.

Application UI stays restrained; exported graphics may be more expressive.

Correctness and data integrity always outrank visual fidelity.

4. Light Design System

Reference palette targets:

Canvas: #F8FAFC / equivalent very light neutral.

Surface: #FFFFFF.

Primary text: #0F172A / equivalent graphite.

Secondary text: #64748B / equivalent muted slate.

Border: #E2E8F0 / equivalent subtle cool gray.

Brand/action orange: #EA580C / current OpenLoby orange family.

Success: restrained emerald/green.

Danger: restrained red.

These should map into the existing semantic token system instead of scattering literal hex values across components.

Strictly avoid in light v1:

dark/navy app headers,

dark sidebars,

dark application cards,

hybrid light/dark shell,

neon,

glow,

glassmorphism,

cyberpunk styling,

heavy gradients,

decorative gaming backgrounds.

Typography

Use the existing clean sans-serif stack; prefer Geist if already configured.

Do not add a font dependency solely to imitate Stitch.

Strong page titles, compact metadata, readable secondary text.

Use tabular numerals for standings/scoring/result entry where practical.

Avoid gamer/display fonts for operational UI.

Spacing / Density

Compact, readable, operational.

Vertical scrolling is expected for 16–24 teams.

Do not compress controls just to fit every row in one viewport.

Numeric-entry controls should remain comfortably tappable.

Small visual checkboxes may use a larger effective hit target.

5. Responsive Model

Mobile / tablet

Primary design width: 390px.
Must remain functional at 360px and 430px.
Tablet should retain the same mobile hierarchy until the desktop layout becomes appropriate.

Workspace mobile navigation order:

Overview

Teams

Scoring

Matches

Standings

Overview, Teams, Scoring, and Matches use the compact bottom tournament navigation.

Focused golden-path screens may suppress the bottom navigation where the locked design requires more focused controls:

MatchEntry: no bottom nav; back affordance + focused task UI.

Overall Standings: publishing actions take bottom priority; no competing bottom nav in the approved mobile treatment.

Export/Templates: no bottom nav; back to Standings.

Desktop

At desktop widths (target design: 1440px):

Use the approved compact light sidebar.

Approximate sidebar target: ~240px.

Sidebar order remains Overview / Teams / Scoring / Matches / Standings.

Use a constrained main content region rather than stretching sparse content edge-to-edge.

Intentional whitespace is acceptable.

Do not add analytics or extra cards to fill space.

6. Shared Workspace Shell

Mobile tournament header

Keep compact:

back affordance when appropriate,

tournament name,

subtle Active status when applicable,

quiet overflow only if existing behavior needs it.

Do not repeat tournament information inside every card.

Desktop shell

OpenLoby brand at top of light sidebar.

Small TOURNAMENT section label is acceptable.

Overview / Teams / Scoring / Matches / Standings.

Active item uses restrained orange treatment.

No account/admin widget is required for current guest-first product.

7. Screen Specifications

7.1 Tournament Overview

Purpose: answer Where am I? What should I do next? What is complete?

Mobile

Required hierarchy:

tournament header,

compact summary: team count / match count / scoring preset / setup complete,

dominant NEXT UP card,

Match 5 or current match,

Enter Match Results → as primary CTA,

compact tournament progress,

quiet Current Leader shortcut,

bottom workspace nav with Overview active.

The current match must be reachable in one deliberate tap from Overview.

Desktop

Same information, arranged using the light sidebar + contained main content.

Do not add match winners, maps, analytics, or extra CTAs inside the progress list.

7.2 Teams

Purpose: fast tournament roster management.

Mobile

Teams

team count

+ Add Team primary

Bulk Add secondary

compact 16–24 team list

row: slot / team name / player count / subtle chevron

entire row conceptually opens Team Edit Sheet

bottom nav with Teams active

No hard-coded maximum team count in copy.

Desktop

Use compact table/list with roughly:

SLOT | TEAM | PLAYERS | ACTION

The entire row remains an easy open/edit target. Do not add team analytics.

7.3 Scoring Configuration

Purpose: precise, trustworthy scoring configuration.

Required standard preset:

1st = 10

2nd = 6

3rd = 5

4th = 4

5th = 3

6th = 2

7th = 1

8th = 1

9th+ = 0

1 point per finish

Mobile

Standard / Custom segmented choice

BGMI 2026 Standard selected by default in reference state

compact placement-points list

separate Finish Points section

Save Scoring Configuration primary

bottom nav with Scoring active

Tiebreaker Configuration:
- existing TiebreakerEditor behavior is retained
- existing configured tiebreak ordering remains authoritative
- UI redesign may restyle/reposition it
- it should be visually secondary/compact compared with core placement and finish scoring
- it may use an "Advanced ranking rules" / compact secondary presentation if that can be done WITHOUT changing its current behavior
- do not invent additional tiebreak rules
- do not delete existing options
- current component/tests define exact behavior

Desktop

Use the same rules with a wider two-column arrangement where useful. Keep helper panels minimal.

Do not invent rule versioning, locking semantics, tie-break editors, penalties, multipliers, or DNP policy configuration.

7.4 Matches

Purpose: continue current Draft quickly and inspect/manage finalized matches.

Mobile

Matches

match count

+ Add Match

dominant current Draft card

Match 5
Draft
Continue Entry →

(Optional supporting state may use information already available on TournamentMatch without additional result loading. Detailed progress like "12 / 16 teams entered" belongs to MatchEntry, where result data is already loaded.)

finalized matches in compact list

quiet overflow for existing Reopen/Delete behavior

bottom nav with Matches active

Desktop

Same hierarchy with compact current-match card and finalized table/list.

Do not add scheduling, maps, lobbies, rooms, live states, or analytics.

7.5 MatchEntry — Critical TTPT Screen

This screen has the strongest preservation requirements.

Authoritative entry model:

# | TEAM | PLACE | FIN | DNP

The organizer enters only:

Placement

Finishes

DNP

The scoring engine calculates everything else.

Required invariants

Preserve native numeric input path.

Preserve numeric keyboard behavior on mobile.

Preserve keyboard/Enter workflow.

Preserve React.memo/hot-path behavior where currently used.

Preserve 500ms autosave.

Preserve write coordinator and latest-snapshot semantics.

Preserve DNP behavior.

0 finishes is a valid entered value.

Empty/unentered is visually distinct from 0.

No Formik.

No extra calculated columns.

No steppers / +/- controls.

No per-row modals.

No horizontal page scrolling at 360/390/430.

Mobile

compact Match title + Draft + Autosaved

Match Name (Optional) input MUST be preserved. Keep it visually secondary, not competing with the result-entry grid. Recommended placement is compactly within/below MatchEntry header. No separate page/modal. Existing draft/persistence behavior remains unchanged.

progress 12 / 16 teams entered + pending count

dense rows, but real touch comfort over fitting all teams at once

Save Draft secondary

Finalize Match dominant, sticky if useful

no bottom workspace nav

Finalize should take the user directly to Overall Standings.

Desktop

same exact columns and interaction model

compact top-right Save Draft / Finalize Match action cluster

one authoritative action location only

no duplicated bottom actions

Matches remains active in sidebar

7.6 Overall Standings

Purpose: verify current table and immediately proceed to publishing.

Mobile

compact title/context

compact top 3

full dense leaderboard

prioritize Rank / Team / Total; mobile reference uses MP + FIN as secondary columns

By Match quiet secondary

Export Points Table → dominant publishing CTA

no horizontal page scroll

Desktop

Full useful table columns:

RANK | TEAM | MP | WWCD | PLACEMENT PTS | FINISHES | TOTAL

top 3 compact, not giant podium cards

Total is strongest numeric column

Export Points Table visible near page header

no charts or analytics widgets

Do not invent verification, official status, or unconfirmed tie-break copy.

7.7 Export / Template Gallery

This screen is an approved product design direction, but the actual renderer/template/download functionality is not part of the existing manual frontend core. Implement functional graphics/export only in a dedicated approved feature stage; do not smuggle it into a visual-only refactor.

Fast path:

Standings → Export Points Table → default Clean Pro selected → Download PNG

Templates

Initial curated set:

Clean Pro — light professional

Competitive Dark

Broadcast

Bold Esports

Keep the initial library small (3–5 excellent templates).

Mobile

Back to Standings

Export Points Table

large selected graphic preview

Clean Pro selected by default

visual template strip/gallery

Customize Branding (Optional) collapsed

Download PNG primary

optional tap-to-inspect preview

Desktop

same light desktop shell, Standings active

large preview left

template gallery + optional customization + Download PNG right

application shell remains light; graphic previews may be dark/expressive

Integrity

Export UI never edits or recalculates competition data. Rankings, placement points, finishes, totals, and raw results are read-only inputs from deterministic standings.

Do not lock the product to 4K copy or a permanent pixel resolution in v1 UI copy. Portrait 4:5 · Social-ready is acceptable display context.

8. Exported Graphic vs Application UI

OpenLoby application UI:

light,

quiet,

operational,

minimal,

low decision count.

Exported graphic:

may be more expressive,

may be dark,

may use stronger competition/broadcast identity,

remains fully deterministic/read-only.

Do not apply exported-graphic styling to the application shell.

9. Existing Behavior That UI Work Must Not Break

Scoring is deterministic and authoritative in domain logic, never in presentation.

SCORE_SCALE/fixed-point scoring behavior remains intact.

DNP behavior remains intact.

Competition ranking remains intact.

IDs never become competitive tie-breakers.

Raw MatchResults persist; derived standings do not.

IndexedDB remains schema v4 unless a separately approved migration requires change.

Match lifecycle atomicity remains intact.

Team history deletion protection remains intact.

Persistence runtime validation remains intact.

Formik remains limited to Tournament Creation, Team Edit, and Scoring Configuration.

Team Edit continues using accessible Sheet.

Team and Match delete continue using AlertDialog.

Exactly one app-level Toaster.

Actionable errors remain persistent/local; success feedback may be transient.

Production architecture boundaries remain frozen unless a concrete UI need proves a change necessary.

10. Explicit DO NOT IMPLEMENT List

Reject these details even if they appeared in an earlier Stitch concept or intermediate screenshot:

hybrid light/dark application theme,

dark/navy application sidebar/header in light v1,

Admin Console,

Tournament Ops,

Full Roster destination,

Max 16 slots limitation,

Verified, Official, Audited, Approved product states,

v2.4 Ruleset,

Standard Locked,

Day/session/stage/group/finals metadata not present in actual model,

invented map names in Overview/Matches,

match-winner summaries in Overview,

duplicate WWCD trophy decorations,

OpenLoby Tournament Engine,

Download 4K PNG hard-code,

Instagram Story claim for a 4:5 export,

team analytics/rankings inside Teams,

match scheduling/lobby/room/password features,

live/broadcast control systems,

roster verification engines,

tie-break configuration UI,

scoring multipliers/penalties/DNP policy editors,

MatchEntry calculated points/rank/status columns,

MatchEntry +/- steppers,

duplicate MatchEntry Save/Finalize controls,

Canva-style graphic editor,

social scheduler/publishing dashboard,

template marketplace,

AI/OCR UI during this light-theme implementation stage,

auth/cloud/billing/community/recruitment/player-profile features,

new backend/frontend repository restructure during UI implementation.

11. Approved Reference Files

Expected repository structure:

Documentation/ui-reference/
├── mobile/
│   ├── overview.png
│   ├── teams.png
│   ├── scoring.png
│   ├── matches.png
│   ├── match-entry.png
│   ├── standings.png
│   └── export.png
└── desktop/
    ├── overview.png
    ├── teams.png
    ├── scoring.png
    ├── matches.png
    ├── match-entry.png
    ├── standings.png
    └── export.png

12. Navigation Implementation Rule

UI-L1 MUST NOT replace current workspace architecture with a new routed or stateful tab architecture merely to mimic screenshots.
- Preserve current workspace composition and existing section behavior unless an independently reviewed navigation change is necessary.
- Sidebar/bottom navigation should map onto existing workspace sections using the safest existing hash/anchor model where practical.
- Do not introduce new route architecture.
- Do not unmount/remount feature state merely for visual tab behavior.
- No global state solution.
- No architecture reopening.

If exact screenshot-style mutually-exclusive section presentation cannot be achieved safely without behavioral changes, preserve existing behavior and document the visual difference.

13. Decimal-Scoring Responsiveness

Screenshots contain integer example scores, but the domain supports up to 2 decimal places. Tabular numeric layouts must remain stable. Do NOT change domain precision.

Acceptance criteria for Scoring, Standings, and Export graphic layouts:
Must correctly handle and align representative values such as:
- 0
- 0.25
- 1.50
- 6.25
- 87.50
- 999.99 (where allowed by existing validation bounds)

Do not hard-code column widths that only work for integers.

14. Screenshot Exceptions

Add a concise section documenting known approved-screenshot exceptions:

MATCHES:
- draft entered/pending counts are visual inspiration only and should be omitted unless available without new persistence behavior

MATCHENTRY:
- screenshot omits existing Match Name (Optional), which MUST remain

SCORING:
- screenshot omits existing TiebreakerEditor, which MUST remain

SCORING/STANDINGS/EXPORT:
- integer sample values do not imply integer-only layouts

GENERAL:
- screenshots do not override accessibility, tested behavior, domain rules, architecture boundaries, or persistence semantics

15. Implementation Guidance

Do not implement all screens in one uncontrolled agent pass.

Recommended staged implementation:

UI-L1 — Foundation + Responsive Shell

semantic light-theme tokens,

switch the application Toaster to the light-compatible treatment without adding next-themes or dark-theme infrastructure,

typography/spacing normalization,

mobile workspace bottom navigation,

desktop light sidebar,

responsive shell,

no behavior changes.

UI-L2 — Core Management Screens

Overview,

Teams,

Matches,

Scoring,

preserve existing controllers/forms/repositories.

UI-L3 — TTPT Golden Path

MatchEntry visual implementation,

Overall Standings visual implementation,

strict regression protection for hot-path behavior.

UI-L4 — Responsive / Accessibility Hardening

360/390/430 mobile checks,

tablet checks,

desktop checks,

focus/keyboard/touch behavior,

no horizontal overflow,

no architecture regressions.

UI-G1 — Graphics / Export Feature (separate feature stage)

Only after explicitly approved:

deterministic standings-to-graphic model,

curated template renderer,

Clean Pro / Competitive Dark / Broadcast / Bold Esports,

preview,

optional controlled branding,

PNG generation/download,

performance and security validation.

Do not pretend UI-G1 already exists just because its visual design is approved.

16. Definition of Done for Light UI

The light UI implementation is acceptable only when:

visual hierarchy matches the approved references,

mobile remains the primary quality bar,

360/390/430 widths function without horizontal page overflow,

desktop uses the approved light sidebar and same information hierarchy,

TTPT path remains direct,

MatchEntry hot-path behavior is unchanged,

existing unit/integration/E2E tests remain green,

new visual/responsive behavior has focused permanent coverage where practical,

typecheck/lint/build/CI remain green,

no invented Stitch features are introduced.

Dark theme is deferred until the light implementation is approved and stable.