<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PT Forge project engineering rules

These rules come from `Documentation/MASTER_SPEC.md` and must be preserved alongside any framework-generated guidance.

- Implement only the explicitly approved task. Do not begin later tasks or add merely useful-looking features.
- Optimize for speed, correctness, mobile usability, reliable scoring, and a short time-to-points-table. Prefer the simpler reliable design when priorities conflict.
- BGMI is the only currently supported game. Do not expose future games without explicit approval.
- Use TypeScript strict mode, avoid undocumented `any`, keep business logic outside UI components, and prefer small focused modules.
- Keep IndexedDB and other data access behind typed repository/service boundaries. Do not scatter direct database calls through React components.
- Never change scoring behavior without updating and running the scoring tests. Keep scoring deterministic, pure, configurable, and separate from UI, persistence, AI, and rendering.
- Never hardcode scoring values into UI components or duplicate scoring algorithms across screens.
- Never allow AI output to finalize results or standings, expose provider secrets to the client, or replace deterministic logic with AI.
- Never hide or silently discard data inconsistencies. Surface actionable errors to the organizer.
- Never delete working tests merely to make checks pass.
- Prefer mobile simplicity over desktop complexity and correct results over visual spectacle.
- Treat raw results plus scoring rules as the source of truth; do not retain stale aggregate standings.
- For each significant task: inspect first, state the intended change, implement only the approved scope, add tests, run tests/typecheck/lint/build as requested, report exact changes and limitations, then stop.
