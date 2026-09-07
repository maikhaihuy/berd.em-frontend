## Why

`attendanceTracking/page.tsx` (the Nhiệm vụ screen) only ever fetches **task templates**
(`taskTemplateService.listByBranch`) — the definitions of what mandatory/todo tasks exist per
branch — it never fetches or mutates actual per-shift **task completion state**. Concretely,
today's screen is missing everything the spec requires beyond just listing task names:

- No live clock (spec's Fixed Layout Slot #2).
- No way to mark an individual task complete — the backend already exposes
  `POST /tasks/:id/complete` (`task.controller.ts`) accepting a `CompleteTaskDto` with optional
  `evidence` (photo URLs) and `note`, but the frontend never calls it.
- No **Evidence Zone** — attaching a photo/note per task, per spec, has no UI at all.
- No client-side checkout blocking when mandatory tasks are incomplete, and no todo-pending
  warning at checkout. The backend *does* already enforce the mandatory-task rule server-side
  (`assignments.service.ts`'s `checkOut()`: `'Mandatory tasks must be completed before checkout'`)
  — so this isn't a business-rule violation today, just a bad UX: an employee only discovers
  they're blocked after attempting checkout and getting a raw error, instead of seeing which
  tasks are still incomplete before they try.

## What Changes

- Add a live clock to the Nhiệm vụ screen (Fixed Layout Slot #2 — straightforward, no backend
  dependency).
- Fetch actual task completion state per assignment/shift (not just templates) — confirm the
  right read endpoint/shape with the backend (likely `GET /tasks` scoped by shift/assignment, or
  embedded in the assignment/shift response already — check before assuming a new endpoint is
  needed).
- Add a per-task "mark complete" action calling `POST /tasks/:id/complete`, with a simple
  **Evidence Zone** UI: a note field (maps to `CompleteTaskDto.note`) and a photo-attach control
  (maps to `CompleteTaskDto.evidence` — confirm the expected shape/format with the backend, e.g.
  an array of already-uploaded URLs vs. a multipart upload the frontend needs to handle first;
  this is a real open question, not an implementation detail).
- Distinguish mandatory vs. todo tasks visually per spec (mandatory blocks, todo warns).
- Client-side pre-check before the checkout action: if mandatory tasks are incomplete, disable/
  warn on the checkout button with which tasks are still pending, instead of only surfacing the
  backend's rejection after the fact. If todo tasks are still pending, show a non-blocking
  warning at checkout time per spec ("must trigger a warning", not block).

## Capabilities

### New Capabilities
- `task-completion-with-evidence`: a Staff member can mark a task complete with an optional
  photo/note as evidence, and see accurate completion state reflected live, not just a static
  list of task templates.

### Modified Capabilities
- `staff-attendance-tracking` (existing spec under `openspec/specs/`): extend to cover the
  client-side mandatory-task checkout gate and todo-pending warning, currently entirely
  server-side-only enforcement with no frontend awareness.

## Impact

`src/app/(dashboard)/attendanceTracking/page.tsx`, `today-shift-card.tsx`, a new
`src/features/task/` (or extend an existing `taskTemplate` feature module — check whether
splitting "template" vs. "instance/completion" concerns cleanly maps onto how the backend models
`Task` vs. `TaskTemplate`), photo-upload mechanism (new — check whether the codebase already has
an upload pattern elsewhere, e.g. for delivery receipts once that lands, to stay consistent).

**Recommend a `design.md`** — the evidence/photo upload mechanism (client-side compression?
direct-to-storage upload? multipart to the backend?) is a real product/technical decision.
