## 1. Verify backend contract

- [x] 1.1 ~~Against a running dev/staging backend, call `GET /tasks?...`~~ — **Done via source
      inspection instead**: no dev backend was reachable, so the real response shape was verified
      by reading the sibling `berd.em-backend` checkout directly (`task-response.dto.ts`,
      `task.mapper.ts`). This also caught that `masterShiftId`/`subShiftId` must be queried
      separately, not together (`design.md` Decision 3) — recorded in `design.md`
      Decisions 2–3/Risks. Re-verify against a live instance in §7 once one is reachable.
- [x] 1.2 ~~Confirm whether `Task` rows already exist for shifts with templates configured~~ —
      Not resolvable from source alone (it's data-dependent, not code-dependent); the Decision 3
      fallback stays in place as the safety net regardless. Still worth eyeballing during §7's
      manual pass.
- [x] 1.3 Confirm whether `DEDICATED` tasks block checkout the same as `SHARED_MANDATORY` —
      **Confirmed yes**, verified in `AssignmentService.getCheckoutTaskGate`
      (`assignment.service.ts`): `blockingTasks` filters on
      `type === SHARED_MANDATORY || type === DEDICATED`, exactly matching `design.md` Decision 4.

## 2. `task` feature module

- [x] 2.1 Add a `TASKS` block to `src/lib/api/endpoints.ts`: `BASE: '/tasks'`,
      `BY_ID: (id) => `/tasks/${id}``, `COMPLETE: (id) => `/tasks/${id}/complete``.
- [x] 2.2 Create `src/features/task/schemas.ts` with `taskCompletionSchema` + `taskSchema` (per
      `design.md` Decision 2, verified against the backend's `TaskResponseDto`) and
      `completeTaskSchema` mirroring `CompleteTaskDto` minus `completedByEmployeeId` (per
      `design.md` Decision 5, the backend infers it from the JWT) and minus `evidence` (per the
      Non-Goals) — just `{ note?: string }`.
- [x] 2.3 Create `src/features/task/types/index.ts` exporting `Task`, `TaskCompletion`,
      `CompleteTaskDTO` inferred from the schemas (follow `taskTemplate/types/index.ts`'s pattern).
- [x] 2.4 Create `src/features/task/services/task.service.ts`: `createCrudService<Task>('/tasks')`
      plus `listForShift(masterShiftId, subShiftId)` (per `design.md` Decision 3 — **two** calls,
      `base.list({ masterShiftId })` and `base.list({ subShiftId })`, merged; do **not** pass both
      params in one call, that returns `[]`) and `complete(id, data: CompleteTaskDTO)`
      (`axios.post` to `API_ENDPOINTS.TASKS.COMPLETE(id)`, mirroring `assignment.service.ts`'s
      `checkIn`/`checkOut`).
- [x] 2.5 Add `tasks: { byShift: (masterShiftId, subShiftId) => [...] }` to
      `src/lib/queryKeys.ts`.
- [x] 2.6 Create `src/features/task/hooks/useTaskQueries.ts` with `useGetTasksByShift` (thin
      `useAppQuery` wrapper, mirrors `useTaskTemplateQueries.ts`).
- [x] 2.7 Create `src/features/task/hooks/useTaskMutations.ts` with `useCompleteTask`
      (`useAppMutation`, invalidates `queryKeys.tasks.byShift(masterShiftId, subShiftId)` for the
      completed task's shift).
- [x] 2.8 Create `src/features/task/hooks/index.ts` re-exporting both.

## 3. Real task data on the attendance screen

- [x] 3.1 In `src/app/(dashboard)/attendanceTracking/page.tsx`, add one `useGetTasksByShift`
      (`listForShift`, per Decision 3) call per distinct `(masterShiftId, subShiftId)` pair among
      `todaysAssignments` (mirror the existing branch-keyed `taskTemplateQueries` `useQueries`
      block), keeping the existing `taskTemplatesByBranch` fetch as-is (needed for the Decision 3
      fallback).
- [x] 3.2 Pass each assignment's task list (or the fallback template list, per Decision 3) into
      `TodayShiftCard` instead of/alongside `taskTemplates`.
- [x] 3.3 In `today-shift-card.tsx`, replace the static `mandatoryTasks`/`todoTasks` derivation
      (currently from `taskTemplates`) with one driven by real `Task` instances when present,
      falling back to the read-only template rendering when the shift has no task instances yet
      (per `staff-attendance-tracking`'s modified "Mandatory and todo tasks are shown read-only"
      requirement — mandatory = `SHARED_MANDATORY` + `DEDICATED`, todo = `SHARED_OPTIONAL`).
- [x] 3.4 Keep the read-only rendering path (no checkbox/action) for the template-fallback case
      exactly as it works today.

## 4. Mark-task-complete UI (note-only evidence)

- [x] 4.1 Add the shadcn `textarea` component. `pnpm dlx shadcn@latest add textarea` hung on a
      slow/stuck registry fetch during implementation, so it was hand-written instead, matching
      the standard shadcn output exactly (same content as this repo's `input.tsx`'s conventions:
      `cn` from `@/lib/utils/cn`, `data-slot="textarea"`) — functionally identical outcome.
- [x] 4.2 Build a small "mark complete" control per pending task in `today-shift-card.tsx` (e.g. a
      `Dialog` triggered from a checkbox/button) with an optional `note` `Textarea` (label it as
      the completion note, distinct from any `task.note` shown elsewhere — see `design.md`
      Decision 2) and a confirm button.
- [x] 4.3 Wire the confirm button to `useCompleteTask().mutate({ id: task.id, data: { note } })`
      (no `completedByEmployeeId` — see `design.md` Decision 5); omit `note` from the payload when
      left blank.
- [x] 4.4 Render `COMPLETED` tasks with a completed visual state (icon/strikethrough) and no
      action, showing the stored note if present.
- [x] 4.5 Confirm `useAppMutation`'s built-in error toast covers the completion-request-fails
      scenario (per `task-completion-with-evidence` spec) with no extra work; add an
      `errorMessage` override only if the default toast text is confusing for this action.

## 5. Client-side checkout gate

- [x] 5.1 In `today-shift-card.tsx`, compute `mandatoryPending`/`todoPending` from the same task
      list used in section 3 (per `design.md` Decision 4).
- [x] 5.2 Disable the "Kết ca" button when `mandatoryPending.length > 0` and render the pending
      mandatory task titles inline beneath it (not a hover-only tooltip, per Decision 4 — must
      work on mobile).
- [x] 5.3 Add a confirm `Dialog` ("Bạn còn N việc cần làm chưa hoàn thành. Vẫn kết ca?") that
      appears only when the "Kết ca" button is clicked with `todoPending.length > 0`; confirming
      proceeds to `checkOut.mutate(...)` as today, cancelling makes no request.
- [x] 5.4 Verify the existing backend-rejection toast (via `useAppMutation` on
      `useCheckOutAssignment`) still fires unchanged if the backend rejects a checkout the
      client-side gate allowed (covers the "Backend rejects checkout despite the client-side gate
      passing" scenario) — no new error-handling code should be needed here.

## 6. Live clock

- [x] 6.1 Add a small `LiveClock` client component (`useState` + `useEffect`/`setInterval`).
      **Correction from the original draft**: does NOT use `getTime` from
      `@/lib/utils/dateTimeHelpers` — that helper reads UTC getters (correct for shift-time
      strings, wrong for a live "now" clock, which would render 7h off from Vietnam local time).
      Formats with the `Date` object's local getters instead — see `design.md` Decision 6.
- [x] 6.2 Render it on `/attendanceTracking` (Fixed Layout Slot #2).

## 7. Verification

- [x] 7.1 **Completed via direct API calls against the real backend** (user started
      `berd.em-backend` on `localhost:3094` and provided admin credentials mid-session; no browser
      automation tool is available, so the flow was exercised with `curl` as the seeded Employee
      account `0900000001`/`DevLogin!123`, using temporary test fixtures created and torn down via
      the Admin account — not through the actual browser UI). Verified end-to-end against live
      data:
      - `GET /tasks?masterShiftId=X&subShiftId=Y` (both params together) empirically returns `[]`
        — confirms the AND-bug `design.md` Decision 3 fixed was real, not just a source-reading
        inference.
      - `GET /tasks?masterShiftId=X` and `GET /tasks?subShiftId=Y` (separately, merged) return
        exactly the real `SHARED_MANDATORY`/`SHARED_OPTIONAL`/`DEDICATED` tasks, in the exact
        shape `taskSchema` expects (including the nested `completion` object once completed).
      - `POST /tasks/:id/complete` with `{ note }` and no `completedByEmployeeId` correctly
        resolves the employee from the JWT (`completedByEmployeeId: 1`, the caller's own
        employee), confirming `design.md` Decision 5.
      - Checking out with mandatory/dedicated tasks still `PENDING` returns `400` with
        `{ errors: { _general: ["Mandatory tasks must be completed before checkout"] } }` — a
        shape `useAppMutation`'s existing error toast already handles unchanged.
      - Completing the mandatory + dedicated tasks and checking out again succeeds (`201`) even
        with a `SHARED_OPTIONAL` task still pending — confirms todo tasks are warn-only, never
        blocking.
      - A shift with zero `Task` rows and zero templates checks in/out with no gating at all
        (unaffected, pre-existing behavior).
      - **New finding, out of scope for this change**: the checkout response body is actually
        `{ assignment: Assignment, warnings: [...] }`, not a flat `Assignment` — but
        `assignment.service.ts`'s existing `checkOut()` (untouched by this change) types/returns
        `res.data` as `Assignment` directly. This is a **pre-existing** mismatch (not introduced
        here) that happens to be harmless today because nothing reads the mutation's resolved
        value (`TodayShiftCard` relies on query invalidation, not the mutation result) — but it
        means the backend's own post-checkout `warnings` list is currently unused/inaccessible to
        the frontend. Worth a follow-up change to fix `checkOut()`'s return type and surface those
        `warnings`, since they're a second, authoritative source of the same information this
        change computes client-side pre-checkout. Test fixtures (2 master shifts, 2 sub-shifts, 2
        assignments, 3 tasks) were created and fully deleted afterward — the dev DB was confirmed
        back to its prior empty state for branch 1.
- [x] 7.2 Run `pnpm lint` — clean, no warnings or errors. Also ran `pnpm exec tsc --noEmit`
      (clean) and a full `pnpm build` (clean, all 25 routes including `/attendanceTracking`
      compiled) as additional verification given 7.1 couldn't be completed live.
