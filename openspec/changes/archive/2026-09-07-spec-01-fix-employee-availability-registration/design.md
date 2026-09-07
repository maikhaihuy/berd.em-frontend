## Context

The "Đăng ban" screen (`/my-availabilities/[id]`) lets a Staff member register interest in an
open sub-shift. Today it does this by calling `POST`/`DELETE /assignments` through the existing
`assignment` feature slice — treating registration as if it directly created a scheduled
`Assignment`. The backend's seeded permissions never grant the Employee role `create` on
`assignments` (only `read` and `check-in`/`check-out`, `$self`-scoped), so every real
Employee-role click on "Register" gets a 403. The screen only ever worked in manual testing
because it was tested with an Admin/Manager account, which happens to also hold
`create:assignments`.

The backend already has the right entity for this: `Availability` (register interest, status
`REGISTERED | ASSIGNED | CANCELLED`), and the Employee role already holds full
`create/read/update/delete` on it, `$self`-scoped. This change is a frontend-only rewire: add an
`availability` feature slice mirroring the existing `assignment` slice's structure, and point the
"Đăng ban" screen at it instead of `assignment`. No backend change is required or in scope.

## Goals / Non-Goals

**Goals:**
- Employee-role accounts can Register/Unregister on `/my-availabilities/[id]` without a 403.
- The screen creates/deletes real `Availability` records, not `Assignment` records.
- `Availability`'s three statuses (`REGISTERED`, `ASSIGNED`, `CANCELLED`) are each given
  deliberate, distinct UI treatment on this screen, matching what a Manager may have already done
  with the registration (see Decisions).

**Non-Goals:**
- No manager-side visibility into registrations (Spec 3).
- No backend changes — this is a pure frontend rewire against an API that already supports it.
- No handling of an Admin/Manager viewing *another* employee's `[id]` page correctly — that
  depends on a backend change not yet built (Spec 2). See Open Questions.
- No shift-change / swap / substitute-coverage UI.

## Decisions

### 1. Mirror the `assignment` slice's structure exactly for `availability`

`src/features/assignment/` already has the shape this needs (types+schemas, service via
`createCrudService`, query hooks, mutation hooks with toast+invalidate). Rather than designing a
new pattern, `src/features/availability/` copies that structure file-for-file. This keeps the
change reviewable as "the same pattern, new entity" instead of introducing a second way of
building a feature slice.

Alternative considered: extend `assignment.service.ts` with availability-specific methods on the
same slice. Rejected — `Availability` and `Assignment` are distinct backend entities with
different lifecycles and permission grants; conflating them in one slice would hide exactly the
architecture mismatch that caused this bug.

### 2. `ASSIGNED` status is view-only on this screen (no Unregister)

Once a registration's status is `ASSIGNED`, a Manager has already built a real shift around it
(Spec 3's flow, not yet built, but the status transition is already possible via direct API/DB
today). Letting an employee unregister after that point is effectively a change-request workflow
against a shift a manager has committed to — explicitly out of scope for v1. The badge for
`ASSIGNED` is shown but the Unregister action is hidden for that state.

Alternative considered: keep Unregister available for `ASSIGNED` too, relying on the backend to
reject/handle the conflict. Rejected — silently allowing an action that has no defined backend
workflow yet risks a confusing dangling state; better to not offer it until Spec 3 defines what
"unregister after assignment" should do.

### 3. `CANCELLED` gets a plain badge, no dedicated UI

No cancel action exists on this screen today, so `CANCELLED` availability rows aren't reachable
through normal use of this screen yet. It's included only so the three-way status switch is
exhaustive (TypeScript union coverage), not because the screen actively produces this state.

### 4. Use `GET /availability?employeeId=` (verified working for both self- and non-self-view)

`page.tsx`'s route param `employeeId` is arbitrary (an Admin/Manager can open another employee's
page). The proposal assumed, based on how `assignment`'s equivalent query behaved, that pre–Spec 2
the backend's `GET /availability` would return only the *calling* user's own rows regardless of
any `employeeId` passed. **Verified against the live backend during implementation, this
assumption was wrong for `availability` specifically**: an Employee caller stays `$self`-scoped no
matter what `employeeId` is passed (a non-self id is silently ignored, not leaked — checked by
having an Employee-role account query a different employee's id and confirming only its own row
came back), while an Admin caller's query is correctly filtered to the requested employee. So
`availabilityService.listByEmployee(employeeId)` (added mirroring `assignment`'s
`listByEmployee`) is used directly, and it already handles both the self-view and the
Admin/Manager-viewing-another-employee cases correctly — no Spec 2 dependency needed for this
specific gap. See Open Questions for what's still unverified (Manager role, branch-scoped access).

## Risks / Trade-offs

- ~~**[Risk]** An Admin/Manager relying on opening another employee's `/my-availabilities/[id]` to
  see *that employee's* registrations would see their own/empty data instead.~~ **Resolved**:
  verified against the live backend that `GET /availability?employeeId=` correctly filters to the
  requested employee for an Admin caller (see Decision 4), so `page.tsx` uses that filtered query
  directly and this case works as before.
- **[Risk]** Renaming `assignment-item.tsx` → `availability-item.tsx` touches an import site
  (`scheduleTable.tsx`); a missed reference would break the build, not fail silently.
  → **Mitigation**: TypeScript build (`pnpm build`) and `pnpm lint` will catch a stale import
  immediately; run both before considering the change done.

## Migration Plan

Frontend-only, no data migration. Deploy is a standard frontend release:
1. Ship the new `availability` slice and rewired screen behind normal code review (no feature
   flag — the current behavior is a live bug, not a working feature to preserve).
2. Verify with a real Employee-role test account against the existing backend (no backend
   deploy coordination needed, since `/availability` endpoints and Employee-role grants already
   exist).
3. Rollback is a plain revert of the frontend commit/deploy if needed — no backend state is
   affected either way, since no `Assignment` rows were ever successfully created by
   Employee-role accounts (they 403'd).

## Open Questions

- Resolved during implementation: the Admin-viewing-another-employee case (see Decision 4) works
  correctly via `GET /availability?employeeId=`, verified against the live backend — no longer an
  open question, no Spec 2 dependency for this specific gap.
- Still open: the `employeeId` filter was verified for an Admin caller only (via the `settings`
  test account). A **Manager** caller's branch-scoped access to another employee's `/availability`
  rows was not tested here (no Manager test account was available) and remains Spec 2/3 territory
  (`branchId`-scoped listing) per the proposal's Non-Goals.
