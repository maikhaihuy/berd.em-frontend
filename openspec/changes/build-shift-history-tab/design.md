## Context

Lịch ca's 3rd conceptual tab, Bản ký (shift history), doesn't exist anywhere in `src` — no route,
no component. The other 2 tabs exist today as **separate top-level routes**, not siblings under a
shared tabbed parent: `/my-calendars` (Bản biểu, `src/app/(dashboard)/my-calendars/page.tsx`) and
`/my-availabilities/[id]` (Đăng ban). The sidebar (`src/constants/routes.ts`'s `GENERAL_ROUTES`)
links them as flat, independently-labeled items ("Xem lịch ca", "Đăng ký ca") with no "Lịch ca"
grouping.

The one real precedent for a 3-tab UI in this codebase is `/income` (`src/app/(dashboard)/income/
page.tsx`): a single route using shadcn `Tabs`/`TabsList`/`TabsContent` with uncontrolled local
`defaultValue` state — no router/query-string involvement, no per-tab route. That pattern has
never actually been applied to Lịch ca; Bản biểu and Đăng ban predate it and remain separate pages.

The user was asked whether to (a) add Bản ký as its own new standalone route, matching the current
flat-nav reality, or (b) restructure all 3 into one tabbed "Lịch ca" parent (migrating the 2
already-shipped pages), matching `CLAUDE.md`'s product-spec framing exactly. **Decision: (a),
standalone route** — chosen to keep this change scoped to adding the missing tab rather than also
refactoring two already-shipped, already-linked screens and their nav entries. Restructuring into
one tabbed section is left as an explicit, separate future decision (see Open Questions).

The prior `introduce-shiftblock-and-weekly-period-layout` change (archived
`openspec/changes/archive/2026-09-07-introduce-shiftblock-and-weekly-period-layout/`) landed the
shared layout this change is scoped to reuse:
- `src/components/schedule/shift-block.tsx` — `ShiftBlock({ title, children, className })`,
  purely presentational.
- `src/components/schedule/weekly-period-grid.tsx` — `WeeklyPeriodGrid({ weekDays, isToday?,
  dayBlocks })`, where `dayBlocks(day) => Array<{ key, periods, element }>`.
- `src/components/schedule/periods.ts` — `getPeriodsForRange(startTime, endTime): Period[]`.

Its `weekly-shift-period-layout` spec already names Bản ký explicitly in two scenarios ("Reused
across schedule screens", "Same component across tabs") — it was written expecting this change to
reuse the grid unchanged, so no delta is needed against that capability.

`add-end-of-day-checkout-reconciliation`, which the proposal flagged as a possible dependency for
defining "completed," **does not exist** as an OpenSpec change (confirmed: not in `openspec/
changes/` or its archive). Current backend behavior has no separate end-of-day reconciliation pass
— `checkOut()` simply sets `actualEndTime`. `attendanceTracking` (`src/app/(dashboard)/
attendanceTracking/page.tsx`) already derives check-in/check-out state from `actualStartTime`/
`actualEndTime` presence (per `openspec/specs/staff-attendance-tracking/spec.md`), not from the
`status` enum string — this change follows that same convention for consistency.

## Goals / Non-Goals

**Goals:**
- A new route (`/my-shift-history`) showing the logged-in Staff member's past/completed shifts,
  reusing `WeeklyPeriodGrid` + `ShiftBlock` unchanged.
- A clear, explicit definition of "completed" shift for this screen, consistent with how
  `attendanceTracking` already reads checkout state.
- A new sidebar entry so the screen is reachable, following the existing `GENERAL_ROUTES` pattern.
- Week navigation (prev/next/this-week), today highlighting, multi-branch support, and an empty
  state — mirroring `staff-schedule-view`'s existing requirements for `/my-calendars`, reframed
  around history.

**Non-Goals:**
- No restructuring of `/my-calendars` or `/my-availabilities/[id]` into a shared tabbed "Lịch ca"
  parent — deferred (see Context and Open Questions).
- No dependency on `add-end-of-day-checkout-reconciliation` — it doesn't exist; "completed" is
  defined against current backend behavior (`actualEndTime` presence), not a future reconciliation
  pass.
- No new backend endpoints — reuses `useGetAssignmentsByEmployee`, filtered client-side, exactly
  like `attendanceTracking` and `/my-calendars` already do.
- No evidence/photo attachments, no manager-facing shift-history view — Staff-only, read-only.

## Decisions

### 1. Standalone route `/my-shift-history`, not a tab under a shared parent
Per the user's explicit choice (Context above). Follows the existing `my-` prefix convention used
by the other 2 self-service schedule routes (`my-calendars`, `my-availabilities`) rather than a
bare `/shift-history`, for naming consistency in `GENERAL_ROUTES`.

**Alternative considered:** restructure into a tabbed `/lich-ca` parent per `CLAUDE.md`'s literal
3-tab framing. Rejected for this change — see Context; it's a larger, separate scope decision that
would also touch 2 already-shipped routes and their nav entries.

### 2. "Completed" = has `actualEndTime` (checked out), not `status === "COMPLETED"` or "date has passed"
An assignment counts as shift history once `actualEndTime` is set — i.e., the employee actually
checked out — mirroring exactly how `attendanceTracking`'s `TodayShiftCard` already derives
checkout state from `actualStartTime`/`actualEndTime` presence rather than the `status` enum.

**Alternative considered:** filter by `workDate` being in the past. Rejected — a past shift the
employee never checked into/out of (a no-show) is meaningfully different from one they actually
worked, and "date has passed" alone can't distinguish `ABSENT` from a genuinely completed shift.
Since `actualEndTime` is only set by a real checkout, using it as the filter is simpler and more
accurate than combining a date comparison with the `status` enum, and doesn't require trusting
`status` to always be kept in sync (this repo's other schedule screens already avoid relying on
`status` for attendance state — see Context).

**Alternative considered:** `status === "COMPLETED"`. Rejected — `status` is a broader field with
values (`SCHEDULED`, `IN_PROGRESS`, `ABSENT`) that aren't guaranteed to be updated by the same code
path as `actualEndTime` on every backend flow; `actualEndTime` presence is the more direct signal
already trusted elsewhere in this codebase.

### 3. Reuse `WeeklyPeriodGrid` + `ShiftBlock` exactly as `/my-calendars` does, only the filter differs
The new page (`src/app/(dashboard)/my-shift-history/page.tsx`) and its rendering component mirror
`my-calendars/page.tsx` + `weekly-self-schedule.tsx` structurally: same `useAuth`/`useGetEmployee`/
`useGetAssignmentsByEmployee` hooks, same `weekAnchor` state + `generateWeekdays` + `WeekNavigator`,
same `branchNameById` map, same `dayBlocks` shape (`getPeriodsForRange` + `ShiftBlock` with time
range + branch name as children) — the only behavioral difference is the assignment filter
(completed-only, see Decision 2) and the `ShiftBlock` children showing a status-appropriate
detail (e.g. actual checkout time) instead of only the scheduled time range.

**Alternative considered:** a shared component parameterized by a `filter` prop, used by both
`/my-calendars` and `/my-shift-history`, to avoid duplicating the day-grouping logic. Rejected for
this change — `/my-calendars`'s `weekly-self-schedule.tsx` was just retrofitted in the prior
change and is working; introducing a shared abstraction now would mean re-touching it again for a
2nd time in as many changes. Revisit if a 3rd near-identical consumer appears (this file's
day-grouping logic — filter assignments by `toDateOnlyString(workDate)` per day — is currently
duplicated 2x, in `my-calendars` and now here; a 3rd copy would be the signal to extract it).

### 4. Week navigation defaults to the current week, same as `/my-calendars`
`weekAnchor` starts at `new Date()` like `/my-calendars`, even though most-viewed history is
likely *past* weeks. Employees can navigate back with the existing `WeekNavigator` "previous week"
button.

**Alternative considered:** default to last week, or to the most recent week containing a
completed shift. Rejected — adds a data-dependent default (an extra query before the page can
decide what to show) for marginal benefit; matching `/my-calendars`'s existing convention keeps
behavior predictable and consistent across both self-service schedule screens.

## Risks / Trade-offs

- **[Risk]** Filtering entirely client-side (fetch all assignments via `listByEmployee`, then
  filter for `actualEndTime` + the displayed week) means the payload includes every assignment
  regardless of week — identical to how `/my-calendars` and `attendanceTracking` already work, so
  not a new problem introduced by this change, but noted since shift history will tend to
  accumulate more rows over an employee's tenure than "current week" screens do. **Mitigation:**
  none needed now — defer to a backend query-param filter (`listByEmployee(employeeId, { from,
  to })`) if this becomes a real performance issue; not a concern at current expected data volumes
  for a single milk tea shop.
- **[Risk]** Duplicating the day-grouping/`dayBlocks`-building logic between `/my-calendars` and
  `/my-shift-history` (Decision 3) means a future change to that logic (e.g. a bug fix) must be
  applied twice. **Mitigation:** accepted for now per Decision 3's rationale; flagged as the
  trigger condition for extracting a shared hook/component once a 3rd consumer appears.
- **[Trade-off]** Choosing a standalone route (Decision 1) means the sidebar gains a 3rd
  schedule-related entry instead of Lịch ca reading as one cohesive section — a real UX gap versus
  `CLAUDE.md`'s intended IA. Accepted deliberately per the user's explicit choice; tracked as an
  Open Question below rather than silently resolved.

## Migration Plan

Purely additive, no data migration:
1. Add the new route + page + rendering component (reusing existing shared grid/hooks).
2. Add the sidebar entry to `GENERAL_ROUTES`.
3. No changes to `/my-calendars`, `/my-availabilities/[id]`, or any existing route.

Rollback is a plain revert (delete the new route + nav entry) with no effect on any other screen.

## Open Questions

- Should `/my-calendars`, `/my-availabilities/[id]`, and `/my-shift-history` eventually be
  restructured into one tabbed "Lịch ca" section per `CLAUDE.md`'s literal spec? Deferred by this
  change's scope decision (Decision 1) — worth revisiting as a dedicated follow-up change once
  Bản ký itself is validated, rather than bundling a nav/IA restructuring with adding the missing
  tab.
- Should the day-grouping logic shared between `/my-calendars` and `/my-shift-history` be
  extracted once this change lands (2 copies now)? Left as-is per Decision 3; revisit if a 3rd
  near-identical consumer appears.
- Should completed-shift blocks show anything beyond actual checkout time (e.g. a link into more
  detail, hours worked)? Out of scope for this change (Non-Goals) but worth confirming with
  whoever owns the `Tiền ca` (Shift Earnings, M3) screen since it may want to link from there.
