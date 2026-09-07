## Context

`/attendanceTracking` (`src/app/(dashboard)/attendanceTracking/`) is the Nhiệm vụ ("Task") screen
from the product spec. Today it fetches only **task templates**
(`taskTemplateService.listByBranch`, `GET /task-templates`) — the per-branch definitions of what
tasks exist — and renders them read-only in `today-shift-card.tsx`. It never touches per-shift
**task instances** or their completion state.

The backend already has a separate `Task` resource (confirmed in `openapi/openapi.json` /
`openapi/schema.d.ts`, tag `tasks`):

- `GET /tasks?masterShiftId=&subShiftId=` — list task instances for one shift slot (both query
  params required).
- `POST /tasks/:id/complete` with `CompleteTaskDto { completedByEmployeeId?, evidence?: object,
  note?: string }` — "Complete task and store audit evidence".
- `POST/GET/PATCH/DELETE /tasks` / `/tasks/:id` — standard CRUD, `CreateTaskDto`/`UpdateTaskDto`
  carry `taskTemplateId`, `masterShiftId`, `subShiftId`, `title`, `description`, `type`
  (`SHARED_MANDATORY | SHARED_OPTIONAL | DEDICATED`), `status` (`PENDING | COMPLETED`).

**Update — verified directly against `berd.em-backend` source** (a sibling checkout at
`C:\_hub\berd\berd.em-backend`, found during implementation): the OpenAPI doc publishes no
response schema for any `/tasks*` endpoint, but the backend source resolves everything the
original version of this section had to guess at. This section now reflects the verified backend
code (`src/modules/tasks/{task.controller,task.service,task.mapper,task.types}.ts`,
`dto/task-response.dto.ts`, `dto/complete-task.dto.ts`, `prisma/schema.prisma`), not inference —
see Decisions 2–4 below for what changed from the original draft.

`assignments.service.ts`'s `checkOut()` (verified: `src/modules/assignments/assignment.service.ts`
lines 249–255, 353–388) already rejects checkout with `{ message: 'Mandatory tasks must be
completed before checkout', blockingTasks: [...] }` when `SHARED_MANDATORY`/`DEDICATED` tasks for
the shift are still `PENDING`. It reads existing `Task` rows — it does not create them — so task
instances are created from `TaskTemplate`s somewhere upstream of checkout (out of scope here, see
Non-Goals). Permission check (verified: `prisma/seed.ts`'s `employeeGrants`): the `Employee` role
already has `read` on `tasks` (via `SCHEDULING_SUBJECTS`) and unconditioned `complete` on `tasks`
— no backend permission change is needed for this frontend change.

There is no existing file/photo upload mechanism anywhere in this codebase (`src/` has zero
`type="file"` inputs today), and no upload endpoint exists in the OpenAPI spec — `evidence` is
just `"Evidence JSON such as photo URLs"`, i.e. the backend expects URLs to already exist, not raw
file bytes.

## Goals / Non-Goals

**Goals:**
- Replace/augment the template-only fetch with real per-shift task instance data (two `GET /tasks`
  calls per shift slot, merged — see Decision 3), keyed the same way the existing
  `taskTemplateQueries` are (one pair of queries per distinct shift slot among today's assignments).
- Let a Staff member mark a task complete (`POST /tasks/:id/complete`) with an optional text note,
  and see the completion state reflected immediately (query invalidation, no manual refresh).
- Visually distinguish mandatory (`SHARED_MANDATORY`, `DEDICATED`) from todo (`SHARED_OPTIONAL`)
  tasks.
- Block the "Kết ca" (check out) action client-side when mandatory tasks are incomplete, listing
  which ones. Warn (non-blocking, dismissible) when todo tasks are pending at checkout.
- Add a live clock to the screen (Fixed Layout Slot #2), independent of task/checkout work.

**Non-Goals:**
- **Photo evidence upload.** No upload endpoint exists on the backend and no upload pattern exists
  in this codebase. This change ships the **note-only** half of the Evidence Zone
  (`CompleteTaskDto.note`). Photo attach is deferred to a follow-up change once the backend
  exposes a real upload endpoint (or a confirmed URL contract) — see Open Questions. We do not
  build a stopgap (e.g. embedding a data URL in `evidence`) because that's a throwaway shape the
  backend was never designed to store durably.
- Creating `Task` rows from `TaskTemplate`s. If a shift has templates but `GET /tasks` returns
  none for it, we fall back to the current read-only template list rather than calling
  `POST /tasks` ourselves (see Decisions).
- Changing backend behavior. The mandatory-task checkout rule already exists server-side; this
  change only makes the frontend aware of it *before* the user hits it.
- Todo-task evidence/completion UI beyond what mandatory tasks get — todo tasks use the same
  "mark complete" action; no separate flow.

## Decisions

### 1. New `src/features/task/` module, not an extension of `taskTemplate`
`Task` and `TaskTemplate` are already distinct backend resources with separate REST paths and
DTOs. Following this repo's established one-feature-per-resource pattern (`assignment` vs.
`subShift`, `masterShift` vs. `masterShiftTemplate`), add a sibling `task` feature:

```
src/features/task/
  schemas.ts                        # taskSchema, completeTaskSchema (mirrors CompleteTaskDto)
  types/index.ts                    # Task, CompleteTaskDTO
  services/task.service.ts          # createCrudService('/tasks') + listByShift() + complete()
  hooks/useTaskQueries.ts           # useGetTasksByShift(masterShiftId, subShiftId)
  hooks/useTaskMutations.ts         # useCompleteTask()
  hooks/index.ts
```
`taskTemplate` is left untouched — it keeps serving the fallback/read-only case (see Decision 3).

### 2. `Task` entity schema — verified against `TaskResponseDto` (`berd.em-backend`)
`taskSchema` mirrors the real `TaskResponseDto`/`TaskMapper.toDto` shape exactly (see
`src/modules/tasks/dto/task-response.dto.ts` and `task.mapper.ts` in the backend repo). Two
corrections from the original draft: (a) completion data lives in a nested `completion` object,
**not** flattened onto `Task` — `Task.note` is a separate admin-authored note from
`CreateTaskDto`/`UpdateTaskDto`, distinct from `completion.note` (the employee's completion note);
(b) `masterShiftId`/`subShiftId` are **mutually exclusive and nullable** (shared tasks set
`masterShiftId` only, dedicated tasks set `subShiftId` only — enforced server-side by
`TasksService.validateScope`), not both-required:

```ts
export const taskCompletionSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  completedByEmployeeId: z.number(),
  completedAt: z.string(),
  evidence: z.unknown().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const taskSchema = z.object({
  id: z.number(),
  taskTemplateId: z.number().nullable().optional(),
  masterShiftId: z.number().nullable().optional(),
  subShiftId: z.number().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.enum(["SHARED_MANDATORY", "SHARED_OPTIONAL", "DEDICATED"]),
  status: z.enum(["PENDING", "COMPLETED"]),
  sortOrder: z.number(),
  dueAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  completion: taskCompletionSchema.nullable().optional(),
  createdAt: z.string(),
  createdBy: z.number(),
  updatedAt: z.string(),
  updatedBy: z.number(),
});
```
`POST /tasks/:id/complete` does **not** return the updated `Task` — it returns a
`TaskCompletionResponseDto` (the completion row, with nested `task`/`completedByEmployee`). The
frontend should treat the complete-mutation response as opaque and rely on query invalidation
(Decision 1 in the module list below) to get the updated `Task.status`/`Task.completion`, not try
to patch the cache from the mutation response directly.

### 3. Fetch strategy corrected: `masterShiftId` and `subShiftId` are OR'd, not AND'd
**This corrects a bug in the original draft of this design.** `GET /tasks` filters are pure
`AND` (verified: `TasksService.findAll` — `where: { ...(masterShiftId && {masterShiftId}),
...(subShiftId && {subShiftId}) }`). Since a shared task never has `subShiftId` set and a
dedicated task never has `masterShiftId` set (Decision 2), calling `GET /tasks` with **both**
params at once would match neither and silently return `[]`. The backend's own checkout gate
(`getCheckoutTaskGate`) avoids this by querying with an `OR` at the Prisma level — the frontend
has no equivalent single-request option, so it issues **two** requests per shift slot and merges:

```ts
// task.service.ts
listForShift: async (masterShiftId: number, subShiftId: number) => {
  const [shared, dedicated] = await Promise.all([
    base.list({ masterShiftId }),   // SHARED_MANDATORY + SHARED_OPTIONAL for this master shift
    base.list({ subShiftId }),      // DEDICATED for this employee's sub-shift
  ]);
  return [...shared, ...dedicated];
},
```
Called once per today's distinct `(masterShiftId, subShiftId)` pair via `useQueries` (mirrors the
existing branch-keyed `useQueries` in `page.tsx`), keyed by
`queryKeys.tasks.byShift(masterShiftId, subShiftId)`.

If the merged result is `[]` **and** the shift's branch has task templates configured (today's
existing `taskTemplatesByBranch` fetch, kept as-is), render the current read-only template list
for that shift instead of an empty state — so a shift whose `Task` rows haven't been provisioned
yet doesn't silently look "no tasks" to the employee. This keeps the existing spec's read-only
fallback behavior alive as a safety net rather than replacing it outright.

### 4. Checkout gate is computed client-side from the same data already on screen
No new endpoint is needed to check gating — `TodayShiftCard` already has the task list for its
shift once Decision 1/3 land:
- `mandatoryPending = tasks.filter(t => t.type !== "SHARED_OPTIONAL" && t.status !== "COMPLETED")`
  (i.e. `SHARED_MANDATORY` and `DEDICATED` both block — see Open Questions on `DEDICATED`).
- `todoPending = tasks.filter(t => t.type === "SHARED_OPTIONAL" && t.status !== "COMPLETED")`.
- "Kết ca" button: `disabled` when `mandatoryPending.length > 0`, with the pending titles shown
  inline under the button (not just a tooltip, since mobile has no hover).
- When enabled and clicked with `todoPending.length > 0`: open a confirm `Dialog`
  ("Bạn còn N việc cần làm chưa hoàn thành. Vẫn kết ca?") before firing
  `checkOut.mutate(...)`; skip the dialog entirely when `todoPending.length === 0`.
- This is advisory only — the backend still enforces the mandatory-task rule and remains the
  source of truth; if client and server state ever disagree (e.g. stale cache), the existing
  `useAppMutation` error toast (already wired for `useCheckOutAssignment`) surfaces the backend's
  rejection message unchanged.

### 5. "Mark complete" UI: inline popover per task, not a full-page flow
Given Non-Goal #1 (no photo upload), the per-task completion UI is a small `Popover`/`Dialog`
with one optional `note` field and a confirm button, calling
`useCompleteTask().mutate({ id: task.id, data: { note } })` — **`completedByEmployeeId` is
omitted**, not sourced from the logged-in employee client-side: `TasksService.complete` (verified)
already defaults it from the caller's JWT (`getEmployeeIdForUser`) when the field isn't sent, so
there is nothing for the frontend to look up or get wrong here. This invalidates that shift's
`queryKeys.tasks.byShift(...)` key on success (not a cache patch — see Decision 2 on why the
mutation response isn't the updated `Task`). This repo has a `Dialog` component but no `Textarea`;
add the standard shadcn `textarea` component (`pnpm dlx shadcn add textarea`) rather than
hand-rolling one, consistent with how the rest of `components/ui` was sourced. Label this field
distinctly from any admin-authored `Task.note` shown elsewhere (e.g. "Ghi chú hoàn thành") since
they are different fields (Decision 2).

### 6. Live clock as a small standalone client component
No existing clock/interval hook in the codebase. Add `LiveClock` (in
`today-shift-card.tsx`'s directory or a small shared `components/live-clock.tsx`) using
`useState` + `useEffect(() => setInterval(...), [])` at 1s resolution. **Correction from the
original draft**: this does *not* reuse `getTime` from `@/lib/utils/dateTimeHelpers` — that helper
reads `getUTCHours()`/`getUTCMinutes()`, which is correct for the shift-time strings it's normally
given (they encode local wall-clock time under a UTC label) but would render a live "now" clock in
UTC, 7 hours off from local time in Vietnam. `LiveClock` formats with the `Date` object's local
getters (`getHours()`/`getMinutes()`) instead. Purely presentational, no dependency on the rest of
this change — safe to land first.

## Risks / Trade-offs

- **[Risk] `taskSchema` drifts from the backend if the two repos' checkouts diverge later**
  (Decision 2 is verified against `berd.em-backend`'s current source, not a live call to a running
  instance — no dev backend was reachable during implementation, see Open Questions) → Mitigation:
  Zod throws loudly on `.parse()` mismatches rather than silently misrendering, and
  `.passthrough()` is intentionally *not* used so shape drift surfaces fast; re-verify against a
  running instance during Verification (tasks.md §7) once one is available.
- **[Risk] Task instances might not exist for a shift yet (Decision 3 fallback) for reasons other
  than "not provisioned yet"** (e.g. backend intentionally has no tasks for that shift) → in that
  case the fallback only fires when the branch *does* have templates configured, so a
  legitimately-empty shift (no templates either) still shows the plain empty state, not a
  confusing read-only list.
- **[Risk] Splitting Evidence Zone into note-only now, photo later** could mean rework of the
  "mark complete" UI when photo support lands → Mitigation: keep the popover's data shape
  (`{ note }`) additive-friendly; adding an `evidence` field later is a form-field addition, not a
  redesign.
- **[Trade-off] Client-side checkout gate duplicates a rule the backend already enforces** →
  accepted deliberately per the proposal: this is a UX improvement (see pending tasks before
  attempting checkout) layered on top of unchanged backend enforcement, not a replacement for it.
- **[Trade-off] Two requests per shift slot instead of one** (Decision 3) → accepted: it's the
  only correct way to get the OR semantics the backend itself needs for the same reason
  (`getCheckoutTaskGate`); shift counts per employee per day are small (1–2 typically), so this
  doesn't meaningfully add load.

## Open Questions

Resolved during implementation by reading `berd.em-backend` source directly (no dev backend
instance was reachable to test against live — see the risk above):

1. ~~Confirm the real `GET /tasks` / `Task` response shape~~ — **Resolved**: verified against
   `TaskResponseDto`/`TaskMapper` (Decision 2); also surfaced the `masterShiftId`/`subShiftId`
   OR-not-AND issue fixed in Decision 3.
2. ~~Does `DEDICATED` block checkout like `SHARED_MANDATORY`?~~ — **Resolved: yes** — verified in
   `AssignmentService.getCheckoutTaskGate`, which filters `blockingTasks` as
   `type === SHARED_MANDATORY || type === DEDICATED`. Decision 4's filter matches this exactly.
3. **Photo evidence upload contract** — still deferred out of this change (Non-Goal #1); this
   remains genuinely unresolved (no upload endpoint exists in `berd.em-backend` either). When
   picked up: what does the backend expect in `CompleteTaskDto.evidence` — pre-uploaded URLs
   (needing a new upload endpoint) or something else? Needs its own design pass.
4. ~~Who/what creates `Task` rows from `TaskTemplate`s?~~ — Not resolved by reading the `tasks`
   module (it only reads/completes existing rows); still out of scope for this change per
   Non-Goal #2, with the Decision 3 fallback as the safety net either way.

**New finding from live verification** (a dev backend became reachable mid-implementation — see
tasks.md §7.1): `POST /assignments/:id/check-out`'s real response body is
`{ assignment: Assignment, warnings: TaskRef[] }`, not a flat `Assignment`. This repo's existing
`assignment.service.ts` `checkOut()` (unchanged by this change) types and returns `res.data` as
`Assignment` directly — a **pre-existing** mismatch, harmless today only because nothing reads the
mutation's resolved value. Left unfixed here (out of scope — this change doesn't touch
`assignment.service.ts`), but flagged as a good follow-up: the backend already computes an
authoritative post-checkout `warnings` list that's currently inaccessible to the frontend.
