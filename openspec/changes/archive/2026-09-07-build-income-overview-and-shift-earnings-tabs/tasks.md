## 0. Cross-repo dependency

- [x] 0.1 ~~Notify/hand off `berd.em-backend`'s
      `openspec/changes/expose-employee-facing-earnings-summary/` proposal to its owner~~ —
      superseded: discovered during §9 verification that this work is already fully implemented
      in `berd.em-backend`'s working tree (uncommitted). Nothing to hand off; instead, someone
      needs to **commit/merge that backend work** for this frontend change to be safe to ship (see
      design.md Risks) — flagging that as the actual remaining follow-up, distinct from the
      original task.

## 1. Endpoints and types (ship now)

- [x] 1.1 Add `PAY_PERIODS` and `PAYROLL_ENTRIES` blocks to `src/lib/api/endpoints.ts`
      (`API_ENDPOINTS`).
- [x] 1.2 Add `src/features/income/types/index.ts` with `PayPeriod` and `PayrollEntry` (including
      its nested `timeLog: { multiplier: number }` relation), scoped to only the fields Tiền ca
      and the payroll detail/previous-payroll screens actually read.

## 2. Services (ship now)

- [x] 2.1 Add `src/features/income/services/` with services for `pay-periods` and
      `payroll-entries` built on `createCrudService`.
- [x] 2.2 Add a `listByEmployee(employeeId)` helper on the payroll-entries service wrapping
      `GET /payroll-entries?employeeId=`, and a `listByPeriodAndEmployee(payPeriodId, employeeId)`
      helper wrapping `GET /payroll-entries?payPeriodId=&employeeId=`.

## 3. Query hooks (ship now)

- [x] 3.1 Add `src/features/income/hooks/useIncomeQueries.ts` (+ `index.ts` re-export) with:
      `useGetPayrollEntriesByEmployee(employeeId)`, `useGetPayPeriods()`,
      `useGetPayrollEntriesByPeriod(payPeriodId, employeeId)` — all built on `useAppQuery`,
      `enabled: !!employeeId` where applicable, per the `assignment` feature's hook pattern.
      Also added `useGetPayrollEntriesForPeriods` (via `useQueries`, matching the
      `weekly-schedule-view.tsx` precedent) since the Previous payroll list needs a per-period
      total for N periods, not covered by the tasks.md wording but required by design.md D4.

## 4. Derived-data helpers (ship now, per design.md D4)

- [x] 4.1 Add a helper that, given `PayPeriod[]`, returns all non-`OPEN` periods ordered by
      `startDate desc` — feeds the Previous payroll list.
- [x] 4.2 Add a helper that sums a `PayrollEntry[]`'s `totalPay` — reused by both the Previous
      payroll list (per period) and the Payroll detail screen.

## 5. Routing, navigation, and tab shell (ship now)

- [x] 5.1 Add `GENERAL_ROUTES` entry "Thu nhập" → `/income` in `src/constants/routes.ts` (icon:
      pick an unused lucide icon, e.g. `Wallet`).
- [x] 5.2 Create `src/app/(dashboard)/income/page.tsx` — shadcn `Tabs` with Tổng quan and Tiền ca
      triggers, client-state selection per design.md D1, `TabsContent` panels conditionally
      rendered.
- [x] 5.3 Build an `OverviewBlockedPanel` component (design.md D2) for the Tổng quan `TabsContent`
      — static explanatory copy, no data fetching. Replace with the real panel once §6 unblocks.
- [x] 5.4 Create `src/app/(dashboard)/income/payroll/page.tsx` (Previous payroll list).
- [x] 5.5 Create `src/app/(dashboard)/income/payroll/[payPeriodId]/page.tsx` (Payroll detail).

## 6. Tiền ca (Shift Earnings) tab — staff-shift-earnings (ship now)

- [x] 6.1 Build `ShiftEarningsList` component: renders `PayrollEntry` rows for the logged-in
      employee ordered by `workDate` descending, each showing date, `totalPay`, and an OT
      indicator when `timeLog.multiplier > 1` (design.md D3); renders an empty state explaining
      earnings appear once attendance is verified and payroll processed, when the list is empty.
- [x] 6.2 Wire `ShiftEarningsList` into the Tiền ca `TabsContent` in `income/page.tsx`, sourcing
      `employeeId` from `useAuth().user?.employeeId`.

## 7. Payroll detail and Previous payroll screens (ship now)

- [x] 7.1 Build `PayrollPeriodList` component for `/income/payroll`: lists non-`OPEN` pay periods
      (via 4.1) with date range and summed `totalPay` per period (via 4.2), each linking to its
      detail route.
- [x] 7.2 Build `PayrollPeriodDetail` component for `/income/payroll/[payPeriodId]`: lists that
      period's `PayrollEntry` rows for the employee (reuse `ShiftEarningsList`'s row rendering if
      it fits without contorting the component).

## 8. Tổng quan (Overview) tab — staff-income-overview

**Unblocked mid-implementation**: while verifying §1-7 in a browser (task 9.2), found that
`berd.em-backend`'s `expose-employee-facing-earnings-summary` is now fully implemented in that
repo's working tree (uncommitted, all its own tasks checked, tests passing) — confirmed live by
calling `GET /payroll-entries/summary` as the seeded dev employee and getting a real 200 response
matching the designed shape. Asked the user how to proceed; they chose to implement this section
now rather than keep it blocked. See design.md Decisions D6-D8 and
`specs/staff-income-overview/spec.md`.

- [x] 8.1 Add `PAYROLL_ENTRIES.SUMMARY` to `API_ENDPOINTS` and a `getSummary(employeeId)` service
      function (from/to omitted - backend defaults to the current calendar month, matching the
      "month-to-date" requirement without client-side date math).
- [x] 8.2 Add `useGetIncomeSummary(employeeId)` query hook.
- [x] 8.3 Add a `TIME_TRACKING.BY_EMPLOYEE` endpoint + `timeLog.service.ts` +
      `useGetTimeLogsByEmployee` query hook (for the pending-OT summary), filtering client-side
      via `countPendingOvertime` (`utils/payroll.ts`) to `status IN (PENDING, SUBMITTED)` AND
      `overtimeMinutes > 0` per design.md D8.
- [x] 8.4 Build the real `OverviewSummary` component (replaces the now-deleted
      `OverviewBlockedPanel`): renders `shiftPay`/`approvedOt`/`bonus`/`total` from the summary
      response, `previousPeriod.totalPaid` as latest paid amount (with an empty state when
      `previousPeriod` is null), and the pending-OT count.
- [x] 8.5 Wire `OverviewSummary` into the Tổng quan `TabsContent`, replacing
      `OverviewBlockedPanel`.
- [x] 8.6 Entry-point link from Tổng quan to `/income/payroll` — the "Xem kỳ lương trước" button
      in the page header (added in §5.2) is visible from the Tổng quan tab, satisfying the spec's
      entry-point requirement; no separate in-panel link needed.

## 9. Verification (ship-now scope only)

- [x] 9.1 Run `pnpm lint` and fix any violations introduced by this change. Also ran
      `npx tsc --noEmit` (clean).
- [x] 9.2 Manually walked the golden path in a browser (Playwright against the real dev
      backend/DB, logged in as the seeded dev employee, phone `0900000001`): Thu nhập nav entry →
      Tổng quan → Tiền ca → Previous payroll — all render with zero console/network errors.
      **Bug found and fixed during this walk**: `/income/payroll` originally called
      `GET /pay-periods` (via `useGetPayPeriods`), which 403s for the Employee role
      (`prisma/seed.ts` never grants `read:pay-periods` to Employee — confirmed live and by
      reading the seed). Fixed by deriving pay-period metadata from the `payPeriod` relation the
      backend already nests on every `PayrollEntry` (`payrollEntryInclude` in
      `payroll-entry.types.ts`) instead — removed `payPeriod.service.ts`, the `PAY_PERIODS`
      endpoint block, and `useGetPayPeriods`/`useGetPayrollEntriesForPeriods`, added
      `groupNonOpenPeriods` in `utils/payroll.ts`. Simpler too (1 query instead of 1+N). Not
      tested: the seeded dev employee currently has zero `PayrollEntry` rows, so the *non-empty*
      golden path (a period/shift/summary actually showing non-zero data) is unverified — creating
      that data requires a full Manager-side flow (branch/shift/assignment → check-in/out → verify
      time log → close pay period → generate payroll entries) not attempted here. The summary
      endpoint's response shape was independently confirmed correct via a direct `curl` call
      (200, all fields present) before wiring `OverviewSummary` to it.
- [x] 9.3 Manually verified the empty-state paths: the dev employee currently has zero payroll
      entries, zero time logs, and zero closed pay periods, so this was exercised directly — Tiền
      ca, Tổng quan, and Previous payroll all show clean zero/empty states (see 9.2 and §10).
- [x] 9.4 Re-walked 9.2/9.3 against the real `OverviewSummary` panel (§8) after it replaced the
      blocked placeholder — renders correctly with all-zero data, zero console/network errors.
      Not covered: a test employee with actual pending OT / a finalized prior period (same data
      gap noted in 9.2 — no such data exists in the current dev DB).

## 10. Discovery during verification: backend dependency resolved mid-implementation

While testing 9.2, `berd.em-backend`'s `expose-employee-facing-earnings-summary` was found to be
**fully implemented in that repo's working tree** (uncommitted — `git status` shows modified/new
files, all its own `tasks.md` boxes checked, its own tests passing). Live-tested
`GET /payroll-entries/summary` and `GET /time-tracking/employee/:id` against the dev backend as
the seeded Employee and got real 200 responses matching the designed shapes. This was NOT true
when §8 was originally scoped as blocked in this change's design. Raised back to the user, who
chose to implement §8 now rather than keep waiting — done, see §8 above. `proposal.md` and
`design.md` have been updated to reflect that both capabilities ship in this change.
