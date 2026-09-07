## 1. `availability` feature slice — types & schemas

- [x] 1.1 Create `src/features/availability/types/index.ts`: `Availability`,
      `CreateAvailabilityDTO`, `UpdateAvailabilityDTO` types matching the backend's
      `AvailabilityStatus` enum (`REGISTERED | ASSIGNED | CANCELLED`) and the embedded
      `employee`/`subShift`/`masterShift` summary shape (mirror `src/features/assignment/types/index.ts`).
- [x] 1.2 Create `src/features/availability/schemas.ts` with the matching Zod schemas (mirror
      `src/features/assignment/schemas.ts`).

## 2. `availability` feature slice — API wiring

- [x] 2.1 Add `AVAILABILITY: { BASE: '/availability' }` to `src/lib/api/endpoints.ts`.
- [x] 2.2 Create `src/features/availability/services/availability.service.ts` using
      `createCrudService<Availability, CreateAvailabilityDTO, UpdateAvailabilityDTO>` against
      `API_ENDPOINTS.AVAILABILITY.BASE`, plus `listBySubShift(subShiftId)` and
      `listByEmployee(employeeId)` methods (mirror `assignment.service.ts`'s pattern; `listByEmployee`
      added after 5.5's live-backend check showed the `employeeId` filter works correctly).
- [x] 2.3 Add an `availability` block to `src/lib/queryKeys.ts` (`all`, `bySubShift`, `byEmployee`,
      `mine`).

## 3. `availability` feature slice — query & mutation hooks

- [x] 3.1 Create `src/features/availability/hooks/useAvailabilityQueries.ts` with
      `useGetAvailabilityBySubShift(subShiftId)`, `useGetMyAvailability()`, and (added per 5.5's
      finding) `useGetAvailabilityByEmployee(employeeId)`, built on `useAppQuery` (mirror
      `useAssignmentQueries.ts`).
- [x] 3.2 Create `src/features/availability/hooks/useAvailabilityMutations.ts` with
      `useCreateAvailability` and `useDeleteAvailability`, built on `useAppMutation` with
      `invalidateKey` set to the `availability` query key (mirror `useAssignmentMutations.ts`).
- [x] 3.3 Create `src/features/availability/hooks/index.ts` re-exporting the query and mutation
      hooks (mirror `src/features/assignment/hooks/index.ts`).

## 4. Rewire the "Đăng ban" screen to `availability`

- [x] 4.1 Rename
      `src/app/(dashboard)/my-availabilities/[id]/employeeScheduleView/assignment-item.tsx` to
      `availability-item.tsx`; update its one import site in `scheduleTable.tsx`.
- [x] 4.2 In the renamed component, replace `useCreateAssignment`/`useDeleteAssignment` with
      `useCreateAvailability`/`useDeleteAvailability`, and replace the `Assignment`-shaped prop
      with an `Availability`-shaped one.
- [x] 4.3 Implement the exhaustive `AvailabilityStatus` badge switch: `REGISTERED` → "Đã đăng ký,
      chờ xếp ca" with an active Unregister action; `ASSIGNED` → "Đã được xếp ca", no Unregister
      action; `CANCELLED` → plain badge, no action.
- [x] 4.4 In `scheduleTable.tsx`, swap the `myAssignments: Assignment[]` prop for
      `myAvailability: Availability[]`, matching on `subShiftId` the same way
      (`myAvailability.find((a) => a.subShiftId === subShift.id)`). Leave
      `WeeklyPeriodGrid`/`ShiftBlock`/period-lane layout untouched.
- [x] 4.5 In `src/app/(dashboard)/my-availabilities/[id]/page.tsx`, swap
      `useGetAssignmentsByEmployee(employeeId)` for `useGetAvailabilityByEmployee(employeeId)` —
      initially implemented as the unfiltered `useGetMyAvailability()` per the proposal's
      self-view-only assumption, then corrected after 5.5's live-backend check showed the
      `employeeId` filter is safe and correctly scoped for both self- and Admin-viewing-another-
      employee cases (see design.md Decision 4).
- [x] 4.6 Grep the `my-availabilities` directory for any remaining `assignmentService`,
      `useCreateAssignment`, `useDeleteAssignment`, or `Assignment`-type references and remove
      them.

## 5. Verification

- [x] 5.1 Run `pnpm lint` and `pnpm build` to confirm no stale imports or type errors from the
      rename/rewire. (`pnpm lint`: clean. `pnpm build`: blocked in this environment by an EPERM
      on `.next/trace` from an already-running `pnpm dev` server on port 3016, unrelated to this
      change — substituted `pnpm exec tsc --noEmit`, which passed with zero errors.)
- [x] 5.2 Manually test with a real Employee-role account: Register on an open sub-shift on
      `/my-availabilities/[id]` succeeds (no 403), and Unregister removes it. (Verified directly
      against the live backend with a real seeded Employee-role account, `0900000003`/empId 66:
      `POST /assignments` 403'd as expected — confirming the original bug still reproduces without
      this fix — while `POST /availability {employeeId:66, subShiftId}` returned 201 and
      `DELETE /availability/:id` returned 200, removing it. QA fixtures — a temporary master-shift
      template, sub-shift template, master shift, and the availability rows created — were deleted
      afterward.)
- [x] 5.3 Verify via `GET /availability` (as that employee) or the database that the created row
      is an `Availability`, not an `Assignment`. (Verified in the same session: `GET /availability`
      as the Employee account returned the created row with `status: "REGISTERED"` and the
      `Availability` shape — `employeeId`, `subShiftId`, embedded `employee` — not an `Assignment`.)
- [x] 5.4 Confirm the "Done when" criteria from `proposal.md`: no code path in this screen calls
      `assignmentService`/`useCreateAssignment`/`useDeleteAssignment` anymore. (Confirmed via grep
      — zero matches under `my-availabilities/`. The 403-free-registration clause is confirmed by
      5.2's live test.)
- [x] 5.5 Note (no fix expected here, per design.md's Open Questions): check whether any
      Admin/Manager workflow relies on opening another employee's `/my-availabilities/[id]` to see
      *that employee's* registrations, and document the result for Spec 2 follow-up if so.
      (Checked against the live backend using the Admin test account: `GET
      /availability?employeeId=<id>` correctly returns that specific employee's rows for an Admin
      caller, and separately, an Employee caller passing a *different* employeeId is silently kept
      $self-scoped rather than leaking another employee's data. This is better than the proposal
      assumed — no Spec 2 dependency needed for this gap. Code was updated (see 2.2/3.1/4.5) to use
      the filtered `listByEmployee`/`useGetAvailabilityByEmployee` instead of the originally
      planned unfiltered self-view query, so the Admin/Manager-viewing-another-employee case keeps
      working. Manager-role branch-scoped access was not tested — no Manager test account was
      available — and remains Spec 2/3 territory per design.md's Open Questions.)
