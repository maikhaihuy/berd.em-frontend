## Context

`routes.ts` already declares a Manager nav entry for `/availabilities` ("Ca đăng ký"), gated on
`{ action: 'read', subject: 'availability' }`, but no page exists at
`src/app/(dashboard)/availabilities/`. Separately, the existing Manager weekly-roster screen
(`/rosters`, capability `roster-calendar`) has no visibility into who registered availability for
a sub-shift — its `AssignmentControl` picker only filters by branch membership, blind to
registrations.

This change fills the missing screen and connects it to `/rosters`. It depends on Spec 2
(`expose-manager-availability-view`, already implemented and archived in this repo's own tracking,
merge/deploy still pending per that change's own follow-up) landing on the backend first — before
that, `GET /availability?branchId=` doesn't scope correctly and this screen would leak every
branch's availability to every Manager. **Do not deploy this screen ahead of Spec 2's backend
deploy.**

`src/features/availability/` (from Spec 1) already has `listBySubShift`/`listByEmployee`; this
change extends it with `listByBranch`, the branch-scoped read this screen actually needs.

## Goals / Non-Goals

**Goals:**
- Fill the declared-but-missing `/availabilities` route with a screen that lets a Manager see
  every employee's registered availability for a branch/week, grouped by shift.
- Let a Manager turn a registration directly into a real `Assignment` ("Xếp ca"), passing
  `availabilityId` so the backend's existing status-flip (`REGISTERED` → `ASSIGNED`) fires.
- Surface the same "who's registered" signal inside `/rosters`' existing picker
  (`AssignmentControl`), so a Manager scheduling from either screen has the same information.
- Reuse `/rosters`' established visual/structural pattern (branch tabs, week nav, day-grouped
  `MasterShift` cards, `SubShift` rows) rather than inventing a new layout — Managers get a
  consistent experience across both scheduling screens.

**Non-Goals:**
- No hard filter/approval gate — a Manager can still assign anyone branch-eligible whether or not
  they registered. Availability is additive information, not a restriction.
- No shift-change / swap / substitute-coverage UI.
- No fix for the pre-existing `Roster`-vs-`roster` subject-name mismatch on `/rosters`' own nav
  gate (`routes.ts:99`) — unrelated, flagged separately.
- No new capacity-enforcement UI beyond what `/rosters` already shows — that's a backend gap
  (`SubShift.maxAssignments` unenforced server-side), out of scope here.
- No change to how `/rosters` itself lays out days/weeks/branches — only the picker's item list
  gains an availability indicator.

## Decisions

### 1. New page mirrors `/rosters`' structure instead of introducing a new layout pattern

`/availabilities/page.tsx` reuses `useGetBranches`, `generateWeekdays`, and `WeekNavigator`
exactly as `/rosters/page.tsx` does — same branch-tab/week-nav shell. The day/shift grouping reuses
`/rosters`' proven approach (one section per day → `MasterShift` cards → `SubShift` rows) rather
than `WeeklyPeriodGrid` (the single-employee weekly grid used on `/my-availabilities`), because
`/rosters` already demonstrated that a plain per-day card list naturally handles overlapping
`SubShift`s without needing period-lane logic — that machinery solves a different problem (laying
out one employee's shifts against fixed period bands), not "list every registration under its
shift," which is a flat per-`SubShift` group.

Alternative considered: adapt `WeeklyPeriodGrid` for this screen too, for visual consistency with
`/my-availabilities`. Rejected — this screen groups by shift+registrant, not by period band; `/rosters` is the closer structural match, not `/my-availabilities`.

### 2. Availability fetched branch+date-scoped, not per-sub-shift

The page calls one `useGetAvailabilityByBranch(branchId, date)` for the whole displayed week
(mirroring how `/rosters` fetches master shifts by branch+range, and how `useGetAvailabilityBySubShift` fetches per-row on `/my-availabilities`'s employee-facing screen), then filters
client-side by `subShiftId` per row — rather than issuing one `listBySubShift` query per row as
`/rosters`' `SubShiftRow` does for assignments. This matches the proposal's design directly and
avoids N+1 queries across every sub-shift in the displayed week; the backend's own
`GET /availability?branchId=&date=` already returns the whole week's rows in one call (per Spec 2's
service, which computes `startOfWeek`/`endOfWeek` server-side from a single `date` param, same as
the existing `assignment`/`master-shift` list endpoints already return week-scoped data from one
call).

### 3. "Xếp ca" reuses `useCreateAssignment` unchanged, passing `availabilityId`

`CreateAssignmentDTO`'s zod schema already has an optional `availabilityId: z.number()` field
(`src/features/assignment/schemas.ts`), unused by any caller today. This screen becomes its first
real caller, passing the specific `Availability` row's id. No new mutation, no schema change — the
existing `assignmentService.create()`/`useCreateAssignment()` path already supports this shape.

### 4. Invalidate both `availability` and `assignments` keys after "Xếp ca"

The backend flips the underlying `Availability.status` to `ASSIGNED` as part of creating the
`Assignment`, in the same transaction (per Spec 2's proposal). `useCreateAssignment`'s existing
`invalidateKey: queryKeys.assignments.all()` only covers the `assignments` cache; this screen's
own "Xếp ca" call site additionally invalidates `queryKeys.availability.all()` (via `onSuccess`),
so the just-assigned row disappears from the "who's registered" list without a manual refresh.

### 5. Availability indicator in `/rosters`' `AssignmentControl` is presentation-only

`sub-shift-row.tsx` adds `useGetAvailabilityBySubShift(subShift.id)` (from Spec 1's slice)
alongside its existing `useGetAssignmentsBySubShift`/`useGetEmployees` calls, builds a
`Set<employeeId>` of registrants, and passes an `isAvailable` flag per item into
`AssignmentControl`'s `items` prop. `AssignmentControl` shows a small indicator and sorts
registered employees to the top — purely visual. The confirm flow, mutation, and "pick a
non-registered employee still works" behavior are all unchanged; no `availabilityId` is threaded
through this path (unlike the new page's "Xếp ca" button) since this control was never scoped to a
specific `Availability` row — it's a general employee picker.

## Risks / Trade-offs

- **[Risk]** Shipping this screen before Spec 2's backend change is deployed would let a Manager
  see every branch's availability data, not just branches they manage, since the current backend
  doesn't scope `branchId` yet for this endpoint.
  → **Mitigation**: explicit dependency ordering in the proposal and this design; the "Done when"
  criteria include verifying branch scoping actually works, which requires Spec 2 live first.
- **[Risk]** `AssignmentControl` is used in two call sites (`/rosters`' single-slot and multi-slot
  "Add" flows) — adding an `isAvailable` field to its `items` prop touches both.
  → **Mitigation**: the field is additive/optional-shaped (existing items still render correctly
  without it), and both call sites go through the same `sub-shift-row.tsx`, so the change is
  localized to one file plus `assignment-control.tsx` itself.
- **[Risk]** A `SubShift` with many registrants and/or a branch with many shifts in a week could
  make the branch-wide `useGetAvailabilityByBranch` payload large.
  → **Mitigation**: same shape of concern already exists for `useGetMasterShiftsByBranch`/
  assignments on `/rosters` today and hasn't required pagination; not a new class of problem this
  change introduces.

## Migration Plan

Frontend-only, no backend changes (this change is entirely `staffhub-frontend`/this repo).
1. Confirm Spec 2 is deployed to the backend Managers actually hit, first — this is a hard
   prerequisite, not a nice-to-have (see Risks).
2. Ship the new `/availabilities` page and the `/rosters` picker enhancement together (they share
   the branch-scoped availability data model, reviewed as one feature).
3. No feature flag — `/availabilities` is currently an unreachable route (nav entry with no page,
   likely 404s today), so there's no existing behavior to preserve; shipping the page is additive.
4. Rollback: revert the frontend deploy. No data migration, no backend coordination needed for
   rollback specifically (Spec 2 stays deployed independently either way).

## Open Questions

- None blocking. The one real dependency (Spec 2 must be live) is a deploy-ordering constraint,
  not a design decision — tracked as a task/rollout item, not resolved here.
