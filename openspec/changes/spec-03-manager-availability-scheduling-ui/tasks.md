## 0. Pre-flight (blocking dependency)

- [x] 0.1 Confirm Spec 2 (`expose-manager-availability-view`) is merged and deployed to the backend
      environment this frontend actually points at — `GET /availability?branchId=` must be
      correctly branch-scoped before this screen is safe to ship. Do not proceed past task 1 until
      confirmed. (Confirmed for local development: `berd.em-backend`'s checked-out branch
      `feature/openspec-proposal-expose-manager-availability-view` has this code, and this repo's
      `.env.local` points at that local backend. Branch-scoping behavior was already verified live
      against it during spec-01/spec-02 work this session. **Not** yet merged to `develop` or
      deployed to a shared/production environment — that remains the manual follow-up tracked in
      spec-02's archived tasks.md; production deploy of this screen must still wait for that.)

## 1. Extend the `availability` feature slice with a branch-scoped list

- [x] 1.1 In `src/features/availability/services/availability.service.ts`, add
      `listByBranch: (branchId: number, date: string) => base.list({ branchId, date })` alongside
      the existing `listBySubShift`/`listByEmployee`.
- [x] 1.2 In `src/lib/queryKeys.ts`'s `availability` block, add
      `byBranch: (branchId: number, date: string) => ["availability", "byBranch", branchId, date]`.
- [x] 1.3 In `src/features/availability/hooks/useAvailabilityQueries.ts`, add
      `useGetAvailabilityByBranch(branchId, date)` built on `useAppQuery`, `enabled: !!branchId`
      (mirror the existing hooks in that file).

## 2. New page: `/availabilities`

- [x] 2.1 Create `src/app/(dashboard)/availabilities/page.tsx`: branch selector (`Tabs`) + week
      navigator, reusing `useGetBranches`, `generateWeekdays`, and `WeekNavigator` exactly as
      `src/app/(dashboard)/rosters/page.tsx` does. Gate the page with
      `<RequireAbility action="read" subject="availability">` (matching the nav entry's
      `requiredPermission` in `routes.ts`).
- [x] 2.2 For the selected branch + week, fetch `useGetMasterShiftsByBranch(branchId, from, to)`
      (same as `/rosters`) and `useGetAvailabilityByBranch(branchId, date)` (new, from task 1.3).
- [x] 2.3 Create a day-grouping component (adapt `/rosters`' `day-schedule.tsx` pattern): one
      section per day of the displayed week, listing that day's `MasterShift`s.
- [x] 2.4 Create a master-shift card component (adapt `/rosters`' `master-shift-card.tsx`): renders
      the `MasterShift`'s title/time range, then one row per `SubShift` (MAIN slots first by
      `startTime`, then SUPPORT by `startTime` — same ordering as `roster-calendar`).
- [x] 2.5 Create a sub-shift row component: shows the `SubShift`'s title/time/capacity badge (reuse
      the outer shell from `/rosters`' `sub-shift-row.tsx`), then lists every employee with a
      `REGISTERED` `Availability` row for that `subShiftId` (filtered client-side from the
      branch-wide fetch), each with an "Xếp ca" button. A sub-shift with zero registrants shows
      "Chưa có ai đăng ký" instead of an empty list.
- [x] 2.6 Wire "Xếp ca" to `useCreateAssignment` (from `src/features/assignment`, unchanged),
      calling `mutate({ employeeId, subShiftId, availabilityId })` where `availabilityId` is the
      specific `Availability` row's id.
- [x] 2.7 After a successful "Xếp ca", additionally invalidate `queryKeys.availability.all()` (on
      top of `useCreateAssignment`'s existing `assignments` invalidation) so the assigned
      registrant drops off the pending list without a manual refresh.

## 3. Surface availability inside `/rosters`' existing picker

- [x] 3.1 In `src/app/(dashboard)/rosters/sub-shift-row.tsx`, add
      `useGetAvailabilityBySubShift(subShift.id)` (from Spec 1's slice) alongside the existing
      `useGetAssignmentsBySubShift`/`useGetEmployees` calls; build a `Set<employeeId>` of
      `REGISTERED` registrants for that sub-shift.
- [x] 3.2 Pass that set down into `AssignmentControl`'s `items` prop as an extra per-item flag,
      e.g. `{ id, fullName, isAvailable }` (extending the existing `{ id, fullName }[]` shape),
      for both the single-slot and multi-slot "Add" call sites in this file.
- [x] 3.3 In `src/app/(dashboard)/rosters/assignment-control.tsx`: update the `items` prop type to
      accept the optional `isAvailable` flag; in the `<SelectItem>` list, show a small visual
      indicator next to registered employees and sort them ahead of non-registered ones. The
      `onValueChange`/confirm flow, and picking a non-registered employee, stay unchanged (no
      `availabilityId` threaded through this control).

## 4. Verification

- [x] 4.1 Run `pnpm lint` and type-check (`pnpm exec tsc --noEmit`, or `pnpm build` if the
      environment allows it) to confirm no stale imports or type errors from the new page and the
      `AssignmentControl` prop change. (`pnpm exec tsc --noEmit`: clean. `pnpm lint`: clean. Did not
      run `pnpm build` — a `pnpm dev` server may be running concurrently in this environment, as
      seen with the same EPERM-on-`.next/trace` issue during spec-01; `tsc --noEmit` covers the
      same type-safety concern without touching `.next`.)
- [x] 4.2 Manually test with a real Manager account (once Spec 2 is deployed, per task 0.1):
      `/availabilities` for a branch they manage shows every employee's registered availability for
      the week, grouped by shift; a branch they don't manage shows an empty list. (Verified via API
      against the live local backend — not through the browser, see note on 4.4. Created a test
      Manager account (`0900000099`, managing branch 1 only), a test master-shift-template/
      sub-shift-template/master-shift for today, and had Employee `0900000003` register
      `REGISTERED` availability for it. As the test Manager: `GET /master-shifts?branchId=1&from=&to=`
      returned the shift with embedded `subShifts` — exactly the shape `page.tsx`/`master-shift-card.tsx`
      consume; `GET /availability?branchId=1&date=<today>` returned the `REGISTERED` row with
      `employee.fullName` — exactly the shape `sub-shift-row.tsx` (new page) renders. `GET
      /availability?branchId=60&date=<today>` (a branch this Manager does not manage) returned `[]`
      — consistent with branch scoping, though branch 60 has no data of its own so this specific
      check is weaker than spec-02's own e2e coverage of that exact scoping mechanism.)
- [x] 4.3 Click "Xếp ca" for a registrant and confirm: an `Assignment` is created, the underlying
      `Availability` row's `status` becomes `ASSIGNED` (verify via `GET /availability`), and the
      registrant drops off the pending list in the UI without a manual refresh. (Verified via API:
      as the test Manager, `POST /assignments {employeeId:66, subShiftId:52, availabilityId:21}` →
      201, created `Assignment` id 28 with `availabilityId` recorded. Re-fetching `GET
      /availability?branchId=1&date=<today>` immediately after showed the same row's `status` had
      flipped from `REGISTERED` to `ASSIGNED` — confirming that re-running the query after
      `sub-shift-row.tsx`'s post-mutation `invalidateQueries` call would correctly filter this
      registrant out of the pending list, since it filters on `status === "REGISTERED"`. All test
      fixtures — the assignment, master shift (cascading its sub-shift/availability), sub-shift
      template, master-shift template, and the test Manager user — were deleted afterward.)
- [ ] 4.4 On `/rosters`, open a sub-shift row's employee picker for a sub-shift with at least one
      registered employee: confirm the registered employee is visually indicated and sorted first,
      and that picking a non-registered employee still creates a plain assignment as before.
      **Not verified** — this is a visual/rendering check (icon + sort order in a `<Select>`
      dropdown) that requires an actual browser; this session has no browser-driving tool. The
      underlying data this component depends on was verified in 4.2 (`GET
      /availability?subShiftId=52` returned the same `REGISTERED` row shape
      `useGetAvailabilityBySubShift` consumes), and the component logic was verified statically via
      `pnpm exec tsc --noEmit`/`pnpm lint` (task 4.1). Left for you to confirm visually.
