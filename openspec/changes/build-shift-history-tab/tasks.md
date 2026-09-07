## 1. Rendering component

- [x] 1.1 Create `src/app/(dashboard)/my-shift-history/weekly-shift-history.tsx`, mirroring
      `src/app/(dashboard)/my-calendars/weekly-self-schedule.tsx`'s structure: same props shape
      (`weekDays`, `assignments`, `branchNameById`), same per-day grouping via `toDateOnlyString`,
      same `WeeklyPeriodGrid` + `getPeriodsForRange` + `ShiftBlock` usage (design.md Decision 3).
- [x] 1.2 Filter to completed assignments only: `assignment.actualEndTime` is set (design.md
      Decision 2) — filter before grouping by day, not per-day, so the empty-state check (1.3)
      reflects the whole week's completed shifts.
- [x] 1.3 Empty state: reuse the `CalendarX2`-equivalent pattern from `weekly-self-schedule.tsx`
      (used `History` icon instead, since it's already imported for the nav entry in task 3.1 and
      reads better for a history-specific empty state) with shift-history-appropriate copy ("Không
      có lịch sử ca làm việc" / "Bạn chưa hoàn thành ca nào trong tuần này").
- [x] 1.4 `ShiftBlock` children show the actual checkout time (`actualEndTime`, "Kết ca lúc HH:mm")
      alongside the branch name, distinguishing it from `/my-calendars`'s scheduled-time-range
      children.

## 2. Page + route

- [x] 2.1 Create `src/app/(dashboard)/my-shift-history/page.tsx`, mirroring `my-calendars/page.tsx`
      structurally: `useAuth()` for `employeeId`, `useGetEmployee`, `useGetAssignmentsByEmployee`,
      `weekAnchor` state + `generateWeekdays`, `branchNameById` map, `WeekNavigator` (reused from
      `../rosters/week-navigator`), loading spinner, and the same "no linked employee record"
      empty state as `/my-calendars`.
- [x] 2.2 Render `<WeeklyShiftHistory weekDays assignments branchNameById />` (component from
      task 1) in place of `my-calendars`'s `WeeklySelfSchedule`.
- [x] 2.3 No `middleware.ts` changes needed — confirmed during design research (matcher covers all
      non-public paths by prefix, no route-group-specific logic); `/my-shift-history` is gated the
      same way as every other `(dashboard)` route automatically. No edit made.

## 3. Navigation

- [x] 3.1 Added a new entry to `GENERAL_ROUTES` in `src/constants/routes.ts`: path
      `/my-shift-history`, name/breadcrumb "Lịch sử ca", reusing the already-imported `History`
      icon from `lucide-react` (previously only used by the admin "Nhật ký thay đổi" route).
      Positioned directly after the `/my-calendars` entry, keeping the 3 schedule-related items
      adjacent in the sidebar even though they aren't a grouped tab set (design.md Decision 1).

## 4. Verification

- [x] 4.1 `pnpm lint` (0 warnings/errors) and `tsc --noEmit` (no errors) both pass on all
      touched/new files.
- [x] 4.2 No backend was running in this environment (same as the prior grid change), so verified
      with a temporary local harness (`WeeklyShiftHistory` mounted with fixture data at a
      temporary `/dev-preview-shift-history` route, briefly whitelisted in `middleware.ts`),
      screenshotted via Playwright. Confirmed: today highlighted, a completed shift showing its
      actual checkout time ("Kết ca lúc HH:mm"), a scheduled-but-not-completed shift correctly
      absent (verified both visually and via a text-content assertion), two overlapping completed
      shifts on the same day rendering side by side (lane placement, same fix as the prior grid
      change), a multi-period-spanning completed shift, and the empty-week state. The harness,
      screenshot, and the temporary middleware whitelist entry were all deleted afterward — `git
      status`/`git diff src/middleware.ts` confirmed no scratch artifacts remain. The real
      `/my-shift-history` route through actual login was NOT exercised (no backend available) —
      flagged for the user to confirm against a running backend.
- [x] 4.3 Not exercised in-browser (no backend/login available, same limitation as 4.2) — verified
      by code review instead: the new `GENERAL_ROUTES` entry (`src/constants/routes.ts`) follows
      the exact same shape as every other entry `nav-main.tsx` already renders as a plain link, so
      it will render/link correctly by construction. Flagged alongside 4.2 for the user to confirm
      visually once a backend is available.
- [x] 4.4 Verified `specs/staff-shift-history/spec.md` matches what was built — no divergence
      found.
