## 1. Period helper

- [x] 1.1 Create `src/components/schedule/periods.ts`: `Period` type, `PERIODS` constant
      (Sáng/Trưa/Tối with UTC-hour boundaries 0-12/12-18/18-24, per design.md Decision 2), and
      `getPeriodsForRange(startTime: Date, endTime: Date): Period[]` returning the ordered periods
      a shift's time range overlaps.

## 2. ShiftBlock component

- [x] 2.1 Create `src/components/schedule/shift-block.tsx`: presentational component with `title`
      prop and `children` slot, no knowledge of grid placement or periods (design.md Decision 1 &
      3). Style as a card (reuse `Card`/existing box styling patterns from `weekly-self-schedule.tsx`
      / `assignment-item.tsx`).

## 3. WeeklyPeriodGrid component

- [x] 3.1 Create `src/components/schedule/weekly-period-grid.tsx` implementing the
      `WeeklyPeriodGridProps` contract from design.md Decision 3: `weekDays`, optional `isToday`,
      and `dayBlocks(day) => Array<{ key, periods, element }>`.
- [x] 3.2 Implement the 8-column (label + 7 days) × 4-row (header + 3 periods) CSS grid, with a
      header row rendering day name + date per day, today's column visually highlighted.
- [x] 3.3 Implement per-block placement: given a block's `periods`, compute `gridColumn`/`gridRow`
      (row span across all overlapped period bands) per design.md Decision 3, and stack multiple
      blocks in the same day+period cell via a flex column inside that grid area.
- [x] 3.4 Add the period-label column (Sáng/Trưa/Tối) as `sticky left-0`, wrap the grid in an
      `overflow-x-auto` container, and scroll today's column into view on mount (design.md
      Decision 4).

## 4. Retrofit my-calendars (Bản biểu)

- [x] 4.1 Replace `WeeklySelfSchedule`'s rendering with a `WeeklyPeriodGrid` usage: group the
      existing `assignments` prop by day (keep existing `toDateOnlyString` matching), compute each
      assignment's periods via `getPeriodsForRange(subShift.startTime, subShift.endTime)`, and
      render a `<ShiftBlock title={subShift.title}>` per assignment with the existing children
      content (time range + `branchNameById` branch name).
- [x] 4.2 Preserve the existing empty-week state (`CalendarX2` message) when no assignments exist
      in the displayed week.
- [x] 4.3 Verify `my-calendars/page.tsx` is unchanged apart from whatever prop shape the new
      grid-based component needs — data hooks (`useGetEmployee`, `useGetAssignmentsByEmployee`),
      `WeekNavigator`, and loading/no-employee states stay as-is.
- [x] 4.4 `weekly-self-schedule.tsx` was rewritten in place (same file, same exported component
      signature) rather than replaced-then-deleted, so there's no separate old file left over —
      the old ad hoc day-card rendering no longer exists.

## 5. Retrofit my-availabilities/[id] (Đăng ban)

- [x] 5.1 Replace `ScheduleTable`/`ScheduleRow`'s template-row × day-column table with a
      `WeeklyPeriodGrid` usage: for each day, iterate `templates`, find the matching `masterShift`
      (by `masterShiftTemplateId` + `workDate`, same lookup `ScheduleRow` already does) and its
      `subShifts?.[0]`, compute its periods via `getPeriodsForRange`, and render a
      `<ShiftBlock title={subShift.title}>` wrapping the existing `AssignmentItem` (status badge +
      register/unregister button) as `children`.
- [x] 5.2 Confirm templates with no `masterShift` on a given day simply contribute no block that
      day (no placeholder cell) — intentional per design.md Decision 5, not a bug.
- [x] 5.3 Verify `my-availabilities/[id]/page.tsx` is unchanged apart from the grid swap — branch
      tabs, `useGetEmployee`/`useGetMasterShiftTemplatesByBranch`/`useGetMasterShiftsByBranch`/
      `useGetAssignmentsByEmployee`, and loading/no-branches states stay as-is. Week navigation is
      explicitly NOT added (design.md Non-Goals / Open Questions).
- [x] 5.4 `scheduleTable.tsx` was rewritten in place (same file, same exported default component
      signature); the now-unused `scheduleRow.tsx` was deleted (confirmed no remaining references
      via repo-wide search). Kept `assignment-item.tsx` — reused as `ShiftBlock` children.

## 6. Verification

- [x] 6.1 Run `pnpm lint` and fix any issues in touched/new files. (`pnpm lint` and `tsc --noEmit`
      both pass with no errors.)
- [x] 6.2 Manually verified via a temporary local harness (real `WeeklySelfSchedule` +
      `ScheduleTable` components mounted with fixture data, screenshotted through Playwright,
      then deleted — no backend was running so the actual `/my-calendars` route couldn't be hit
      through login). Confirmed: today highlighted, a single-period shift placed correctly, a
      multi-period shift visually spanning Sáng+Trưa, and two same-period multi-branch assignments
      both showing (see 6.2 finding below).
- [x] 6.3 Same harness covered `ScheduleTable`: shift blocks placed in the correct period per day,
      a spanning open shift, and the register/unregister button rendering + click still wired
      (clicking triggered the mutation's pending state, no console errors). Branch-tab switching
      and the real `/my-availabilities/[id]` route itself were NOT exercised (no backend/login
      available in this environment) — flagged for the user to confirm against a running backend.
- [x] 6.4 Verified `openspec/specs/weekly-shift-period-layout/spec.md` and the `staff-schedule-view`
      delta match what was built — no divergence found.

**Finding during 6.2/6.3 verification (fixed):** the initial `WeeklyPeriodGrid` implementation
(task 3.3) grouped same-day blocks by their *exact* period-span and placed each group as an
independent grid item; two blocks with different but overlapping spans (e.g. a single-period
shift and a spanning shift sharing one period) occupied overlapping grid areas and the later one
fully hid the earlier one, violating the `weekly-shift-period-layout` spec's "Multiple shifts on
the same day and period" requirement. Replaced with a lane-assignment algorithm (`assignLanes` in
`weekly-period-grid.tsx`) so any overlapping blocks render side by side instead - confirmed fixed
via the same harness (screenshot showed both blocks visible, side by side).
