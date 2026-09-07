# Spec 3 of 3 — Manager availability-aware scheduling UI (frontend)

**Repo:** `staffhub-frontend`. **Depends on:** Spec 2 (`expose-manager-availability-view`) must be
deployed to the backend first — this spec calls `GET /availability?branchId=&date=`, which only
returns cross-employee data once Spec 2's branch-scoped Manager grant is live. Building this
against the current, unscoped backend would work functionally but would leak every branch's
availability to every Manager, not just branches they manage — don't ship early. Independent of
Spec 1 otherwise (different screens, no shared code path), though Spec 1's new
`src/features/availability/` slice is reused here rather than duplicated.

## Why

`staffhub-frontend`'s `routes.ts` already declares a Manager nav entry — path `/availabilities`,
label "Ca đăng ký", gated on `{ action: 'read', subject: 'availability' }` — but the page itself
was never built (no `src/app/(dashboard)/availabilities/` directory exists). Separately, the
already-solid Manager weekly-roster screen (`/rosters`) has no visibility at all into who
registered availability for a given sub-shift; its employee picker (`AssignmentControl`) only
filters by branch membership. This spec fills the declared-but-missing screen and connects it to
the existing roster tool.

## Non-Goals

- No hard filter — a Manager can still assign anyone eligible by branch, whether or not they
  registered. This is additive information, not an approval gate.
- No shift-change / swap / substitute-coverage UI.
- No fix for the unrelated `Roster` (capitalized) subject-name mismatch on `/rosters`' own nav
  gate (`routes.ts:99`) — flagged separately, not part of this change.
- No capacity enforcement UI beyond what `/rosters` already shows (`x/maxAssignments` badge,
  "Over capacity" warning) — that's a backend gap (`SubShift.maxAssignments` isn't enforced
  server-side either), out of scope here.

## What Changes

### 1. `src/features/availability/services/availability.service.ts` — add the branch-scoped list

Extends the slice Spec 1 created:
```ts
export const availabilityService = {
  ...base,
  listBySubShift: (subShiftId: number) => base.list({ subShiftId }), // from Spec 1
  listByBranch: (branchId: number, date: string) => base.list({ branchId, date }), // new
};
```
`hooks/useAvailabilityQueries.ts`: add
```ts
export const useGetAvailabilityByBranch = (branchId: number, date: string) =>
  useAppQuery(queryKeys.availability.byBranch(branchId, date),
    () => availabilityService.listByBranch(branchId, date),
    { enabled: !!branchId });
```
`src/lib/queryKeys.ts`: add `byBranch: (branchId: number, date: string) => ["availability", "byBranch", branchId, date]`.

### 2. New screen: `src/app/(dashboard)/availabilities/page.tsx`

Fills the route `routes.ts` already declares. Structure mirrors `/rosters/page.tsx` closely, so
Managers get a consistent branch/week-picking experience across both screens:

- Branch selector (`Tabs`) + week navigator, reusing `useGetBranches`, `generateWeekdays`, and the
  existing `WeekNavigator` component exactly as `/rosters/page.tsx` does.
- For the selected branch + week, call `useGetAvailabilityByBranch(branchId, dateForWeek)`.
- Also fetch the week's shifts the same way `/rosters` does (`useGetMasterShiftsByBranch` or
  equivalent), so the screen can group availability registrations under their `MasterShift` →
  `SubShift`, not just list them flat.
- Render one section per `MasterShift` (reuse or lightly adapt `master-shift-card.tsx` from
  `/rosters`), each listing its `SubShift`s (reuse/adapt `sub-shift-row.tsx`'s outer shell — title,
  time range, capacity badge). **Do not** use `WeeklyPeriodGrid` here — `/rosters` already proved a
  plain per-day list of cards naturally handles overlapping `SubShift`s without needing lane logic
  (that machinery is only needed for the single-employee weekly grid on `/my-availabilities`).
- Under each `SubShift`, list every employee with a `REGISTERED` availability row for it (from the
  branch-wide fetch, filtered client-side by `subShiftId`), each with an "Xếp ca" button.
- "Xếp ca" calls the existing `useCreateAssignment` (from `src/features/assignment`, unchanged)
  with `{ employeeId, subShiftId, availabilityId }` — `availabilityId` is the id of the specific
  `Availability` row just displayed. This is the first real caller of that field; the
  `CreateAssignmentDTO` zod schema already supports it, no type change needed.
- After a successful "Xếp ca", invalidate both the `availability` and `assignments` query keys
  (the backend flips that `Availability` row to `ASSIGNED` as part of creating the `Assignment`,
  in the same transaction — the list should reflect that without a manual refetch button).
- Empty state: a `SubShift` with zero registrations shows a plain "Chưa có ai đăng ký" line — no
  special treatment needed, the Manager can still use `/rosters`' manual picker for it as today.

### 3. Surface the same signal inside the existing `/rosters` picker

- `src/app/(dashboard)/rosters/sub-shift-row.tsx`: add
  `useGetAvailabilityBySubShift(subShift.id)` (from Spec 1's slice) alongside the existing
  `useGetAssignmentsBySubShift`/`useGetEmployees` calls. Build a `Set<employeeId>` of who
  registered.
- Pass that set down into `AssignmentControl`'s `items` (currently `{ id, fullName }[]`) as an
  extra per-item flag, e.g. `{ id, fullName, isAvailable }`.
- `src/app/(dashboard)/rosters/assignment-control.tsx`: in the `<SelectItem>` list, show a small
  indicator (dot/checkmark/badge — match existing badge styling used elsewhere in this file) next
  to employees who registered, and sort them to the top of the list. Purely visual — the
  `onValueChange`/confirm flow is unchanged, and picking a non-registered employee still works
  exactly as it does today (still calls plain `useCreateAssignment` without an `availabilityId`,
  since there's no `Availability` row backing that pick).

## Impact

New: `src/app/(dashboard)/availabilities/page.tsx` (+ any small child components it needs, adapted
from `/rosters`' `master-shift-card.tsx`/`sub-shift-row.tsx`). Changed:
`src/features/availability/{services,hooks}/*` (extends Spec 1's slice),
`src/lib/queryKeys.ts`, `src/app/(dashboard)/rosters/{sub-shift-row,assignment-control}.tsx`.

## Done when

- A Manager account can open "Ca đăng ký" (`/availabilities`) for a branch they manage, see every
  employee's registered availability for the selected week grouped by shift, and click "Xếp ca" to
  turn a registration into a real `Assignment` — verify the underlying `Availability` row's status
  flips to `ASSIGNED` afterward.
- The same Manager, switched to a branch they do **not** manage (if they have more than one, or
  via a test account), sees an empty availability list for it — confirms Spec 2's branch scoping
  is actually wired through, not just present on the backend.
- `/rosters`' employee picker visibly distinguishes registered vs. non-registered employees for at
  least one sub-shift with real registered data.