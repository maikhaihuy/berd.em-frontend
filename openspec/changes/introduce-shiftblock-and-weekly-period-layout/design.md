## Context

Two Staff-facing schedule screens exist today, each with its own ad hoc weekly layout and neither
matching the period-band grid `CLAUDE.md`'s Lịch ca spec calls for:

- **`my-calendars` (Bản biểu)** → `page.tsx` fetches `assignments` via `useGetAssignmentsByEmployee`
  and hands them to `WeeklySelfSchedule`, which groups assignments by `toDateOnlyString(workDate)`
  and renders a **7-card CSS grid** (one card per day, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-7`),
  each card listing its assignments as small stacked boxes. No period concept.
- **`my-availabilities/[id]` (Đăng ban)** → `page.tsx` fetches `templates`
  (`useGetMasterShiftTemplatesByBranch`), `masterShifts` (`useGetMasterShiftsByBranch`), and
  `myAssignments`, and renders `ScheduleTable`: a literal HTML `<table>` with **one row per
  `MasterShiftTemplate`** and one column per weekday (`ScheduleRow` finds the matching
  `MasterShift`/`subShifts[0]` per cell, `AssignmentItem` renders a status badge + register/
  unregister button). This is a template-row × day-column grid — structurally the opposite of a
  day-first, period-band layout, and it has no week navigation at all (always the current week).

Neither page has any notion of "period" (morning/afternoon/evening). A repo-wide search confirms
**no `BranchScheduleConfig` or period-boundary field exists anywhere** — not on `Branch`,
`MasterShift`, or `MasterShiftTemplate` — and no such backend proposal is in flight. The period
boundary is being introduced as a frontend-only concept for now (see Decisions).

Prior art: the manager-facing `/rosters` view went through an analogous redesign
(`openspec/changes/archive/2026-08-24-weekly-schedule-day-view-redesign/`), moving from a
template-row/day-column grid to a day-first vertical stack (`WeeklyScheduleView → WeekNavigator,
DayJumpStrip, DaySchedule×7 → MasterShiftCard×N → SubShiftRow×N`). That design explicitly
**rejected an hour-ruler/time-axis calendar** in favor of simpler day sections. This change's
period-band grid is a lighter-weight relative of a time-axis calendar (3 fixed bands instead of
continuous hours) — worth reconciling deliberately rather than accidentally re-opening that
rejected direction (see Decisions).

A companion proposal, `build-shift-history-tab` (Bản ký), is written to consume whatever
`ShiftBlock`/grid this change produces — so the shapes decided here become a semi-public contract
for a 3rd, not-yet-built tab.

## Goals / Non-Goals

**Goals:**
- A reusable `ShiftBlock` component (`title` prop + `children` slot) with no knowledge of periods
  or grid placement — purely presentational, so Bản ký can reuse it unchanged.
- A reusable `WeeklyPeriodGrid` layout component: 7-day header (dates, today highlighted) × 3
  period bands (morning/afternoon/evening), placing `ShiftBlock`s in the correct period slot(s)
  and visually spanning blocks that cross period boundaries.
- A pure helper to compute which period(s) a given `[startTime, endTime)` touches, shared by all
  callers instead of each page re-deriving it.
- Retrofit `my-calendars` and `my-availabilities/[id]` onto the shared grid + `ShiftBlock`,
  preserving each page's existing data-fetching hooks and business behavior (register/unregister,
  branch grouping, empty states).

**Non-Goals:**
- No Bản ký implementation (separate `build-shift-history-tab` proposal).
- No backend changes — no `BranchScheduleConfig`, no new endpoints. Period boundaries are a
  frontend-only constant (see Decisions), explicitly flagged as provisional.
- No hour-ruler/continuous-time calendar — period bands stay fixed, coarse buckets, consistent
  with the earlier `/rosters` redesign's rejection of that pattern.
- No drag-and-drop, no shift editing from this grid.
- No new week-navigation on `my-availabilities/[id]` — it stays fixed to the current week, matching
  its current behavior. Adding navigation there is out of scope for a presentation-layer retrofit
  (tracked as an open question below, not silently done or silently dropped).

## Decisions

### 1. Component location: `src/components/schedule/`, not a new feature folder
`ShiftBlock` and `WeeklyPeriodGrid` hold no data-fetching logic and aren't scoped to one
`src/features/*` module (they're consumed by `my-calendars`, `my-availabilities`, and — later —
Bản ký, which span multiple features: `assignment`, `masterShift`, `subShift`,
`masterShiftTemplate`). Following the existing split between feature folders (data-bound) and
`src/components/` (shared UI), new files go under `src/components/schedule/`:
- `src/components/schedule/shift-block.tsx`
- `src/components/schedule/weekly-period-grid.tsx`
- `src/components/schedule/periods.ts` (period constants + `getPeriodsForRange` helper)

**Alternative considered:** `src/features/schedule/components/` (as proposal.md's impact section
suggested as one option). Rejected — creating a `schedule` feature folder implies a
`hooks/services/types` layer that doesn't exist and isn't needed here; these components take data
as props from whichever feature's hooks the page already calls.

### 2. Period boundaries: hardcoded frontend constant, not sourced from backend
Since no `BranchScheduleConfig` exists, periods are a fixed, global, frontend-only constant:

```ts
// src/components/schedule/periods.ts
export type Period = "morning" | "afternoon" | "evening";
export const PERIODS: { id: Period; label: string; startHour: number; endHour: number }[] = [
  { id: "morning",   label: "Sáng",  startHour: 0,  endHour: 12 },
  { id: "afternoon", label: "Trưa",  startHour: 12, endHour: 18 },
  { id: "evening",   label: "Tối",   startHour: 18, endHour: 24 },
];
```

Boundaries use the same **UTC wall-clock hour** convention as `getTime()` in
`dateTimeHelpers.ts` (the codebase's established pattern for `@db.Time` fields — using local time
here would hit the same historical-offset landmine documented in that file's comments).

`getPeriodsForRange(startTime: Date, endTime: Date): Period[]` returns the ordered list of periods
a shift's time range overlaps (by UTC hour), used both to decide which period band(s) a
`ShiftBlock` renders in and how many rows it spans.

**Alternative considered:** block on a backend `BranchScheduleConfig` proposal to make boundaries
per-branch. Rejected for this change — no such proposal exists yet, and blocking a presentation
retrofit on unstarted backend work contradicts the proposal's own instruction to keep this a
presentation-layer change. Documented as an explicit Open Question below instead of silently
guessing per-branch behavior.

### 3. Grid placement: CSS Grid with explicit row/column lines, not nested flex-per-day
`WeeklyPeriodGrid` uses a single CSS Grid: **8 columns** (1 period-label column + 7 day columns) ×
**4 rows** (1 header row + 3 period rows). Each `ShiftBlock` instance is wrapped in a positioning
`div` with inline `gridColumn`/`gridRow` set from the day index and the shift's computed period
span (`getPeriodsForRange`) — e.g. a shift spanning morning→afternoon gets `gridRow: "2 / 4"`
(rows are 1-indexed with row 1 = header). This is what gives "spans multiple shift periods" real
visual meaning (the block's box stretches through both bands) rather than a block merely appearing
twice.

Multiple blocks that overlap on the same day (multi-branch employees, or Đăng ban days with
several open shifts) are placed via a per-day **lane assignment**, not a flat flex-stack: each day
renders one nested grid spanning all 3 period rows, with blocks sorted by start row (longest span
first) and greedily assigned to the first lane (a grid column within that nested grid) whose
last-placed block ends before the new one starts — the same technique a calendar day view uses for
overlapping events. Blocks in different lanes render side by side; only blocks that end up in the
same lane are guaranteed non-overlapping, so they visually stack top-to-bottom within that lane's
row range.

*(Revised during implementation — the first version grouped blocks by their exact period-span and
gave each group its own grid item. That worked for blocks sharing an identical span, but two
blocks with **different, partially-overlapping** spans — e.g. a single-period shift and a shift
spanning into that same period — occupied overlapping-but-distinct grid areas, and the later one
in DOM order fully painted over the earlier one, hiding it. This was caught during manual
verification and violates the `weekly-shift-period-layout` spec's requirement that same-day/
same-period shifts must render "without hiding or overwriting one another." Lane assignment
handles both the identical-span and partial-overlap cases uniformly.)*

`WeeklyPeriodGrid`'s public contract keeps placement logic centralized and `ShiftBlock` itself
placement-agnostic:

```ts
interface WeeklyPeriodGridProps {
  weekDays: Weekday[]; // from generateWeekdays()
  isToday?: (date: Date) => boolean; // defaults to comparing toDateOnlyString
  dayBlocks: (day: Weekday) => Array<{
    key: string;
    periods: Period[]; // from getPeriodsForRange(start, end)
    element: ReactNode; // a <ShiftBlock> instance
  }>;
}
```

**Alternative considered:** render 3 stacked `<section>`s (one per period), each containing its own
7-day row, and use `rowSpan`-like visual tricks (borders/badges) to fake spanning without real grid
placement. Rejected — this can't actually stretch a block's box across bands, so "spanning" would
only be a label/icon, not a visual span, which under-delivers on the spec's explicit
"support spanning multiple shift periods" requirement.

**Alternative considered:** an hour-ruler time-axis calendar (continuous pixel-per-minute
placement) for maximally accurate spanning. Rejected per the Non-Goals — this was already
considered and rejected for `/rosters`, and period-band granularity is what `CLAUDE.md` asks for.

### 4. Responsive strategy: horizontal scroll on narrow viewports, not a day-first stack
`CLAUDE.md` requires Staff screens to be mobile-first, but a 7-day × 3-period grid doesn't collapse
cleanly into a single mobile column without losing the period-band structure the spec asks for.
Decision: keep the grid's column structure fixed at all widths and wrap it in a horizontally
scrollable container (`overflow-x-auto`), same pattern `my-availabilities` already uses for its
table. On mobile, the grid opens horizontally scrolled so today's column is in view (`scrollIntoView`
on mount), with the period-label column `sticky left-0` so band labels stay visible while scrolling
through days.

**Alternative considered:** reuse `WeeklySelfSchedule`'s existing `grid-cols-1 sm:grid-cols-2
lg:grid-cols-7` responsive column-count breakpoints. Rejected — that pattern reflows days into a
stacked list on mobile, which works for a day-card grid but breaks a period-band grid (bands need
to stay aligned across all 7 days to show relative period position at a glance; reflowing to 1-2
columns per row loses that).

### 5. Retrofit shape for each page (data untouched, only render layer swapped)

**`my-calendars` (Bản biểu):** `WeeklySelfSchedule` is replaced by a thin adapter that groups the
existing `assignments` array by day (same `toDateOnlyString` matching already used) and, per
assignment, computes `getPeriodsForRange(subShift.startTime, subShift.endTime)` and renders
`<ShiftBlock title={assignment.subShift.title}>` with the existing children content (time range +
branch name via the existing `branchNameById` map) unchanged. `useGetAssignmentsByEmployee`,
`useGetEmployee`, and the page-level loading/empty states are untouched.

**`my-availabilities/[id]` (Đăng ban):** `ScheduleTable`/`ScheduleRow` (the template-row × day
grid) are replaced by the same day-first adapter pattern: for each day, iterate `templates`, find
the matching `masterShift` (by `masterShiftTemplateId` + `workDate`, same lookup `ScheduleRow`
already does) and its `subShifts?.[0]`, compute its period span, and render
`<ShiftBlock title={subShift.title}>` wrapping the existing `AssignmentItem` (status badge +
register/unregister button) as `children`, unchanged. Templates with no `masterShift` for a given
day simply contribute no block that day (no more explicit "-" placeholder row cell, since the grid
is no longer template-row-shaped) — this is an intentional side effect of moving off a
row-per-template layout, called out as a UX delta, not a regression: with a template-row grid, an
employee could see a template exists but has no shift today; in the day-first grid, days with
fewer open shifts simply show fewer blocks, matching the day-first pattern already accepted for
`/rosters`.

## Risks / Trade-offs

- **[Risk]** Hardcoded global period boundaries (0–12/12–18/18–24 UTC-hour) won't match every
  branch's actual shift-start conventions once real branch hours vary → **Mitigation:** isolate the
  boundary table in one file (`periods.ts`) so swapping to a per-branch `BranchScheduleConfig`
  later is a data-source change, not a layout rewrite; flagged as an Open Question so it isn't
  silently treated as settled.
- **[Risk]** Overnight shifts crossing midnight (e.g. 22:00–02:00) don't fit a single day's period
  bands → **Mitigation:** clip the shift's rendered span to its `workDate`'s evening band for this
  change (matches `MasterShift.workDate` being the shift's anchor day in existing data); document
  as a known limitation rather than building cross-midnight rendering now, since no current shift
  data has been observed to cross midnight.
- **[Risk]** Losing the explicit per-template "no shift today" placeholder on Đăng ban (see Decision
  5) could read as "template deleted" rather than "no shift generated today" to an employee used to
  the old table → **Mitigation:** none planned for this change; flagged for the person reviewing
  the retrofit to confirm acceptable, since proposal.md scopes this as presentation-only and the
  `/rosters` precedent already made the same trade-off.
- **[Trade-off]** Centralizing grid placement in `WeeklyPeriodGrid` (Decision 3) means it takes on
  more layout responsibility than a typical "dumb" grid, in exchange for `ShiftBlock` staying fully
  presentational and trivially reusable by Bản ký later. Accepted deliberately — proposal.md's
  explicit goal is a component "reusable across all 3 tabs."

## Migration Plan

Purely additive + in-place retrofit, no data migration:
1. Add `src/components/schedule/{shift-block,weekly-period-grid,periods}.tsx|ts` with no
   consumers yet (safe to land independently, no behavior change).
2. Retrofit `my-calendars` (lower risk — currently a page-level user, week nav already generic).
3. Retrofit `my-availabilities/[id]` (higher risk — loses the per-template placeholder row and its
   own table markup entirely).
4. Delete the now-unused `weekly-self-schedule.tsx`, `scheduleTable.tsx`, `scheduleRow.tsx` once
   their replacements are verified working; keep `assignment-item.tsx` (reused as `ShiftBlock`
   children on Đăng ban).

Rollback is a plain revert per step since each page swap is isolated and data hooks are untouched.

## Open Questions

- Should period boundaries eventually come from a per-branch `BranchScheduleConfig` on the
  backend, or stay a global frontend constant long-term? Needs an answer from whoever owns
  shift-template config before Bản ký or any further schedule screens compound on the hardcoded
  version (flagged in proposal.md too).
- Should `my-availabilities/[id]` gain week navigation as a follow-up (it currently has none,
  fixed to the current week only), now that it shares `WeeklyPeriodGrid` with a page
  (`my-calendars`) that already has full week navigation? Left out of this change's scope
  deliberately (Non-Goals) but the inconsistency will be visible once both pages share the same
  grid component.
- Is losing the explicit per-template placeholder on Đăng ban (Risk above) acceptable, or does it
  need an explicit "no shifts open for you today" empty state per day instead of silently showing
  fewer blocks?
