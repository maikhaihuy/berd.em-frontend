# Spec 1 of 3 — Fix employee availability registration (frontend)

**Repo:** `staffhub-frontend`. **Depends on:** nothing — ships independently, first, right now.
**Unblocks:** nothing downstream requires this to land first, but it fixes a live bug for real
users, so it goes first regardless.

## Why

`staffhub-frontend`'s "Đăng ban" screen (`/my-availabilities/[id]`) currently does not use the
backend's `Availability` entity at all. Its Register/Unregister buttons call
`POST`/`DELETE /assignments` directly — self-service, first-come-first-served — instead of
creating an `Availability` record (register interest) for a Manager to build a roster from later.

This is not just an architecture mismatch: checked against the backend's actual seeded
permissions (`staffhub-backend`, `prisma/seed.ts`), **the Employee role is never granted `create`
on `assignments`** — only `read` and `check-in`/`check-out`, both `$self`-scoped. Employee's
`availability` grant, by contrast, already has full `create/read/update/delete` scoped to `$self`.
So a real Employee-role account clicking "Register" today gets a 403 from the backend. The screen
only appears to work when tested with an Admin/Manager account, which happens to also hold
`create:assignments`. This is a live, shipped bug for the actual target users, fixable entirely
on the frontend with zero backend changes.

## What Changes

### 1. New `src/features/availability/` slice — mirror the existing `assignment` slice exactly

- `types/index.ts`: `Availability`, `CreateAvailabilityDTO`, `UpdateAvailabilityDTO` types +
  zod schemas, matching the backend's `AvailabilityStatus` enum (`REGISTERED | ASSIGNED |
  CANCELLED`) and its `AvailabilityResponseDto` shape (embeds `employee` and `subShift` with a
  nested `masterShift` summary — same embedded-relation pattern `src/features/assignment/schemas.ts`
  already uses for `Assignment`). Base shape:
  ```ts
  {
    id: number;
    employeeId: number;
    subShiftId: number;
    startTime?: string | null;
    endTime?: string | null;
    status: "REGISTERED" | "ASSIGNED" | "CANCELLED";
    note?: string | null;
    createdAt: string; createdBy: number; updatedAt: string; updatedBy: number;
    employee?: { id: number; fullName: string; phoneNumber: string };
    subShift?: { id: number; title: string; type: string; startTime: string; endTime: string;
      masterShift?: { id: number; branchId: number; title: string; workDate: string } };
  }
  ```
  `CreateAvailabilityDTO`: `{ employeeId: number; subShiftId: number; startTime?: string;
  endTime?: string; status?: AvailabilityStatus; note?: string }`.

- `src/lib/api/endpoints.ts`: add
  ```ts
  AVAILABILITY: { BASE: '/availability' },
  ```

- `services/availability.service.ts`:
  ```ts
  const base = createCrudService<Availability, CreateAvailabilityDTO, UpdateAvailabilityDTO>(
    API_ENDPOINTS.AVAILABILITY.BASE
  );
  export const availabilityService = {
    ...base,
    listBySubShift: (subShiftId: number) => base.list({ subShiftId }),
    // listByBranch added in Spec 3, once the backend supports the branchId filter — not needed here.
  };
  ```

- `hooks/useAvailabilityQueries.ts`:
  ```ts
  export const useGetAvailabilityBySubShift = (subShiftId: number) => /* useAppQuery, same pattern as useGetAssignmentsBySubShift */;
  export const useGetMyAvailability = () => /* GET /availability with no params — backend already
    defaults to the caller's own records for a plain self-view */;
  ```

- `hooks/useAvailabilityMutations.ts`: `useCreateAvailability`, `useDeleteAvailability` — same
  `useAppMutation` wrapper shape as `useCreateAssignment`/`useDeleteAssignment`, invalidating an
  `availability`-prefixed query key.

- `src/lib/queryKeys.ts`: add
  ```ts
  availability: {
    all: () => ["availability"],
    bySubShift: (subShiftId: number) => ["availability", "bySubShift", subShiftId],
    mine: () => ["availability", "mine"],
  },
  ```

### 2. Rewire "Đăng ban" to call the new slice instead of `assignment`

- `src/app/(dashboard)/my-availabilities/[id]/employeeScheduleView/assignment-item.tsx`
  (consider renaming to `availability-item.tsx` for clarity, updating its one import site in
  `scheduleTable.tsx`):
  - Replace `useCreateAssignment`/`useDeleteAssignment` with `useCreateAvailability` (payload
    `{ employeeId, subShiftId }`) / `useDeleteAvailability`.
  - Replace the `Assignment`-shaped prop with an `Availability`-shaped one.
  - Status badge switches from `WorkSlotStatus` values to `AvailabilityStatus` values:
    - `REGISTERED` → "Đã đăng ký, chờ xếp ca" (same visual slot the old "SCHEDULED" badge used).
    - `ASSIGNED` → "Đã được xếp ca" — **view-only, no Unregister button.** A Manager has already
      built an actual shift around this registration (via Spec 3's flow); letting the employee
      unregister after that point is a change-request workflow, explicitly out of scope for v1.
    - `CANCELLED` → not normally reachable from this screen yet (no cancel action exists here);
      keep a plain badge for it so the type is exhaustively handled, no special UI needed now.
  - No `assignment.status` (`SCHEDULED`/`IN_PROGRESS`/`COMPLETED`/`ABSENT`) values apply to this
    screen anymore — that enum belongs to the separate `Assignment` entity, not `Availability`.

- `src/app/(dashboard)/my-availabilities/[id]/employeeScheduleView/scheduleTable.tsx`: swap the
  `myAssignments: Assignment[]` prop for `myAvailability: Availability[]`, matching on
  `subShiftId` exactly as it does today (`myAssignments.find((a) => a.subShiftId === subShift.id)`
  → `myAvailability.find((a) => a.subShiftId === subShift.id)`). No other logic changes —
  `WeeklyPeriodGrid`/`ShiftBlock`/period-lane layout are untouched.

- `src/app/(dashboard)/my-availabilities/[id]/page.tsx`: swap
  `useGetAssignmentsByEmployee(employeeId)` for a query against `/availability` scoped to that
  employee. Note the route param here is an arbitrary employee id (an Admin/Manager can open
  another employee's page), not necessarily "me" — check what the backend's `GET /availability`
  returns for a caller viewing someone *other* than themselves before wiring this: today (pre–
  Spec 2) the backend only ever returns the *calling* user's own rows regardless of any id in the
  URL, so this page only works correctly when the logged-in user is viewing their own `[id]`. If
  that's already how it's used in practice, no further change is needed here; if Admins currently
  rely on opening another employee's `[id]` to see *that employee's* registrations, that use case
  requires Spec 2's backend fix (`branchId`/broader read) and should be re-tested once it lands.

## Non-Goals

- No shift-change / swap / substitute-coverage UI.
- No manager-side visibility into registrations yet — that's Spec 3.
- No hard validation, deadlines, or reminders — matches the original feature's simplified scope.

## Impact

New: `src/features/availability/**`. Changed: `src/lib/api/endpoints.ts`, `src/lib/queryKeys.ts`,
`src/app/(dashboard)/my-availabilities/[id]/page.tsx`,
`.../employeeScheduleView/{scheduleTable,assignment-item}.tsx`.

## Done when

- An Employee-role test account can Register/Unregister for a sub-shift on `/my-availabilities`
  without a 403, and the created row is a real `Availability` (verify via `GET /availability` as
  that employee, or by checking the database), not an `Assignment`.
- No code path in this screen calls `assignmentService`/`useCreateAssignment`/
  `useDeleteAssignment` anymore.