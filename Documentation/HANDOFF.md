# Agent Handoff

Active task: NONE
Base commit: 0ca6d25 (R2G Completion)
Current branch: main
Working tree status: Clean

## Work completed in current task
R2G is complete and committed.

## Work currently in progress
There is no unfinished implementation.

## Work not started
R2H has not started.

## Files changed
None in current task.

## Important implementation decisions
None in current task.

## Tests currently passing
All tests passing.

## Tests currently failing
None.

## Known blockers
None.

## Do not redo/revert
Do not redo or revert R2G implementation.

## Exact recommended next action
Wait for explicit R2H instruction.

## Scope warning
Do not begin R2H until the specification is provided and authorized.

---

# TAKEOVER PROTOCOL

When an agent takes over unfinished work:

1. Read AGENTS.md completely.
2. Read Documentation/MASTER_SPEC.md.
3. Read Documentation/PROJECT_CONTEXT.md.
4. Read Documentation/CURRENT_STATE.md.
5. Read Documentation/ACTIVE_TASK.md.
6. Read Documentation/HANDOFF.md.
7. Run `git status`.
8. Run `git diff --stat`.
9. Inspect `git diff`.
10. Inspect recent `git log --oneline`.
11. Identify the approved base commit.
12. Determine DONE / PARTIAL / NOT STARTED work before editing.
13. Never reset/revert/stash/clean another agent's unfinished work unless explicitly instructed.
14. Continue only the unfinished portion of ACTIVE_TASK.
15. Do not begin the next stage automatically.

If interrupted during a task, the current agent should update HANDOFF.md before stopping whenever possible.
