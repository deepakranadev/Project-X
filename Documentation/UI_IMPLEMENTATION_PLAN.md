OpenLoby Light UI — Implementation Stage Plan

This plan assumes the R2 frontend architecture is frozen and the light-theme UI references/spec are approved.

Stage UI-L0 — Documentation / Reference Checkpoint

Add Documentation/UI_SPEC.md.

Add the 14 approved reference screenshots under Documentation/ui-reference/.

Record that screenshots are visual references and UI_SPEC is authoritative when they conflict.

No production code changes.

External review, then commit.

Stage UI-L1 — Design Tokens + Responsive Shell

Scope:

map locked light palette into existing semantic CSS tokens,

preserve current shadcn foundation,

responsive tournament workspace shell,

mobile bottom navigation for Overview/Teams/Scoring/Matches,

desktop light sidebar for workspace screens,

focused layouts for MatchEntry/Standings/Export where specified,

switch the application Toaster to the light-compatible treatment without adding next-themes or dark-theme infrastructure,

typography/spacing alignment.

Navigation Implementation Rule:
UI-L1 MUST NOT replace current workspace architecture with a new routed or stateful tab architecture merely to mimic screenshots.
- preserve current workspace composition and existing section behavior unless an independently reviewed navigation change is necessary
- sidebar/bottom navigation should map onto existing workspace sections using the safest existing hash/anchor model where practical
- do not introduce new route architecture
- do not unmount/remount feature state merely for visual tab behavior
- no global state solution
- no architecture reopening
If exact screenshot-style mutually-exclusive section presentation cannot be achieved safely without behavioral changes, preserve existing behavior and document the visual difference.

Non-goals:

no feature behavior changes,

no graphics/export implementation,

no dark theme,

no backend/auth/cloud.

Stage UI-L2 — Overview / Teams / Matches / Scoring

Implement approved visual designs using existing feature controllers and behaviors.

Preserve:

Team Edit Sheet behavior,

Team delete AlertDialog/history guard,

Formik boundaries,

scoring string-backed edit behavior,

existing TiebreakerEditor behavior,

existing persistence semantics.

Stage UI-L3 — MatchEntry / Overall Standings

Highest-risk visual stage.

Preserve:

native numeric inputs,

keyboard/Enter flow,

React.memo hot path,

500ms autosave,

latest-snapshot/write-coordinator behavior,

DNP semantics,

valid zero finishes vs empty distinction,

Match Name (Optional) input,

decimal widths (tables must handle up to 2 decimal places smoothly e.g., 87.50, 999.99),

Finalize → Standings direct flow,

no horizontal overflow at 360/390/430.

Stage UI-L4 — Responsive / Accessibility / Regression Hardening

mobile 360/390/430,

tablet,

desktop 1440,

focus states,

touch targets,

keyboard navigation,

Sheet/AlertDialog behavior,

exact one Toaster,

architecture boundaries,

CI.

Separate Stage UI-G1 — Export / Graphic Templates

This is a product-feature stage, not merely styling.

Implement only after separate approval:

deterministic read-only standings input,

renderer/template architecture,

3–5 curated templates,

default Clean Pro,

template preview/selection,

optional controlled branding,

Download PNG,

output/performance/security tests.

The light app UI can reserve/prepare the visual route or affordance only if explicitly approved, but must not fake functional export.