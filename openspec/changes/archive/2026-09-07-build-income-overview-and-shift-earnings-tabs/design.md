## Context

`staffhub-backend` exposes the payroll primitives this feature reads:

- `payroll-entries` (`GET /payroll-entries?payPeriodId=&employeeId=`, `GET
  /payroll-entries/summary?employeeId=&from=&to=`) — `PayrollEntry { id, timeLogId, employeeId,
  payPeriodId, payDate, workDate, totalPay, bonus, timeLog?, employee?, payPeriod? }`. One row per
  **VERIFIED** `TimeLog`, created only when a manager runs `POST /payroll-entries/generate` for a
  period. `payPeriod` is nested on every entry via `payrollEntryInclude`: `{ id, status,
  startDate, endDate }` — no separate call needed for that data (see D3 below, and why it matters).
- `time-tracking` (`GET /time-tracking/employee/:employeeId`) — returns `TimeLog { id,
  employeeId, overtimeMinutes?, multiplier: number, status: PENDING|SUBMITTED|VERIFIED|REJECTED,
  ... }` for an employee, unfiltered by date/status (client filters). Employee has a `read`
  grant on `time-logs` scoped to `{ employeeId: '$self' }`.
- CASL subjects `payroll-entries` and `time-logs` are both live and enforced
  (`@RequirePermissions`), scoped per-employee via `accessibleWhere`/condition — a Staff caller
  only ever sees their own data by construction.
- **`pay-periods` is NOT accessible to the Employee role.** `GET /pay-periods` 403s — confirmed
  live and in `prisma/seed.ts` (`employeeGrants` has no entry for the `pay-periods` subject at
  all). This surfaced as a real bug during implementation (see D3) — an earlier version of this
  design called `GET /pay-periods` directly for the Previous payroll list, which is broken for
  every Staff user. Fixed by never calling that endpoint from this feature.

**Cross-repo dependency, now resolved**: `berd.em-backend` has its own change,
`openspec/changes/expose-employee-facing-earnings-summary/`, filed specifically against this
frontend proposal. It adds `GET /payroll-entries/summary` (server-computed
`shiftPay`/`approvedOt`/`bonus`/`total`/`previousPeriod`, splitting regular/OT pay from
`TimeLog.overtimeMinutes` + duration math — *not* from `TimeLog.multiplier`, which their design.md
flags as unreliable for this purpose: "multiplier is a generic pay-rate multiplier... not an
OT-exclusivity flag") and a `bonus` field + Manager/Admin `PATCH /payroll-entries/:id/bonus`.
This change was originally blocked on that work; partway through implementing this change's
"ship now" scope, `expose-employee-facing-earnings-summary` turned out to be fully implemented in
`berd.em-backend`'s working tree (uncommitted, all its own tasks checked, tests passing) —
confirmed live by calling both new endpoints as the seeded dev employee and getting correct
responses. The user chose to implement Tổng quan now. **Rejected alternative** (what the original
design would have shipped instead): a client-side approximation bucketing OT by
`TimeLog.multiplier > 1` and omitting bonus entirely. Not built — would have shown numbers the
backend's own design.md flags as wrong, and been pure rework once the real endpoint landed.

Frontend precedent mirrored:
- Feature module shape: `src/features/assignment/` (`hooks/`, `services/`, `types/`) built on
  `createCrudService` (`src/lib/api/createCrudService.ts`) + `useAppQuery` (`src/lib/hooks/
  common/`).
- Client-state top tabs: `src/app/(dashboard)/rosters/page.tsx` uses shadcn `Tabs` driven by
  `useState`, `TabsContent` bodies conditionally rendered.
- `employeeId` from `useAuth().user?.employeeId` (see `my-calendars/page.tsx`).

## Goals / Non-Goals

**Goals:**
- `staff-shift-earnings` (Tiền ca): list the employee's completed, processed shifts with earning
  info.
- `staff-income-overview` (Tổng quan): month-to-date breakdown (shift pay / approved OT / bonus)
  and total, latest paid amount, pending-OT summary — all sourced from real backend data, no
  client-side business-logic replication.
- Payroll detail / Previous payroll screens: list historical closed/finalized pay periods and
  drill into one, using only data the Employee role can actually fetch.

**Non-Goals:**
- Tiền ship (delivery earnings) — no 3rd tab, no placeholder, per proposal.
- Any client-side approximation of the regular/OT split or bonus — the real backend endpoint
  covers this; replicating that logic client-side would duplicate business rules the backend
  already owns correctly (see Context).
- Calling `GET /pay-periods` from this feature at all — it 403s for Employee and there is no
  reason to need it once period metadata is available via the `payPeriod` relation nested on
  `PayrollEntry`.

## Decisions

**D1 — Tab structure: shadcn `Tabs` with client-side state, not per-tab sub-routes.**
Mirrors `rosters/page.tsx`: `/income` renders `Tabs` with `TabsTrigger`s for Tổng quan / Tiền ca,
each `TabsContent` rendering its own panel.

**D2 — Tiền ca lists `PayrollEntry` rows directly.**
`GET /payroll-entries?employeeId=<id>`, ordered by `workDate` descending, each row showing
`workDate` and `totalPay`, with an OT indicator when `timeLog.multiplier > 1`. This is a coarse
per-row "was there a rate premium on this entry" hint, not a totals breakdown — it doesn't have
the aggregation-correctness problem the backend's design.md raises about `multiplier` for summed
categories, since it's flagging one row, not combining buckets across entries.

**D3 — "Previous payroll" list and "Payroll detail" derive pay-period metadata from
`PayrollEntry.payPeriod`, never from `GET /pay-periods`.**
Fetch the employee's own entries once (`GET /payroll-entries?employeeId=<id>`), group them by
`payPeriodId` using each entry's nested `payPeriod` (`{ id, status, startDate, endDate }`), drop
groups where `status === 'OPEN'`, sum `totalPay` per group for the list, and — for the detail
page — reuse `GET /payroll-entries?payPeriodId=&employeeId=` for that period's entries with
`entries[0]?.payPeriod` for the header. **This replaced an earlier version of this decision** that
called `GET /pay-periods` directly and filtered client-side; that 403s for Employee (see Context)
and was caught via browser testing, not code review — confirms the value of actually running the
app rather than trusting the backend's controller/DTO shape alone. The corrected approach is also
simpler: one query instead of one-plus-N.

**D4 — Tổng quan calls `GET /payroll-entries/summary?employeeId=` directly; no client-side
aggregation.**
Render `shiftPay`, `approvedOt`, `bonus`, `total` from the response as-is; `from`/`to` are omitted
since the backend defaults to the current calendar month, matching "month-to-date" with no
client-side date math.

**D5 — "Latest paid amount" comes from `summary.previousPeriod`, not a separate fetch.**
`previousPeriod.totalPaid` already includes bonus (`totalPay + bonus` per the backend). No
`GET /pay-periods` needed here either.

**D6 — Pending-OT summary sources from `GET /time-tracking/employee/:id`.**
Filter client-side to `status IN (PENDING, SUBMITTED)` AND `overtimeMinutes > 0`, count
(`countPendingOvertime` in `utils/payroll.ts`).

**D7 — New feature module `src/features/income/`, following the `assignment` module shape.**
```
src/features/income/
  components/   # ShiftEarningsList, OverviewSummary, PayrollPeriodList, PayrollPeriodDetail
  hooks/        # useIncomeQueries.ts (index.ts re-export)
  services/     # payrollEntry.service.ts, timeLog.service.ts (built on createCrudService where
                # it fits payroll-entries' CRUD shape; time-tracking gets one plain function)
  types/        # PayrollEntry, PayPeriodSummary (nested-only, not a full PayPeriod resource),
                # IncomeSummary, TimeLog
  utils/        # format.ts (currency/date), payroll.ts (groupNonOpenPeriods, sumTotalPay,
                # countPendingOvertime)
```
`API_ENDPOINTS.PAYROLL_ENTRIES` (`BASE`, `BY_ID`, `SUMMARY`) and `API_ENDPOINTS.TIME_TRACKING`
(`BY_EMPLOYEE`). No `PAY_PERIODS` block — deliberately, per D3.

## Risks / Trade-offs

- **[Risk]** `GET /payroll-entries?employeeId=` (D3, D2) is unbounded per employee — fine at
  current shop scale but doesn't scale indefinitely → **Mitigation**: none needed now; revisit if
  an employee's entry history grows large.
- **[Risk]** The backend's `expose-employee-facing-earnings-summary` work was uncommitted when
  relied upon here → **Mitigation**: none beyond noting it — if that work is later reverted or
  changed before being committed, `staff-income-overview` breaks against a moving target. Confirm
  it has landed (committed/merged in `berd.em-backend`) before treating this frontend change as
  fully done from a deployment standpoint.
- **[Trade-off]** D2's per-row OT indicator still uses `multiplier > 1` even though the backend
  considers that signal unreliable for aggregate totals → acceptable here specifically because
  it's a single-entry glance indicator, not a summed category total — the failure mode the backend
  guards against (miscounting a non-OT premium as OT in a breakdown) doesn't apply to a per-row
  badge.
- **[Trade-off]** Tổng quan's month-to-date estimate reflects only `VERIFIED`-and-generated
  entries (backend-side, not a frontend choice) — it can under-count very recent shifts whose time
  logs haven't been verified/generated yet. Documented in the UI copy itself ("số liệu tạm tính...
  có thể chưa gồm các ca gần đây").

## Migration Plan

No data migration on the frontend side. Purely additive frontend routes/module + one new
`GENERAL_ROUTES` sidebar entry. No feature flag needed. Rollback is reverting the PR.

Depends on `berd.em-backend`'s `expose-employee-facing-earnings-summary` actually landing
(committed/merged) — see Risks. If that work is reverted before being committed, this change's
Tổng quan tab would need to revert to a blocked/placeholder state until it's redone.

## Open Questions

- None outstanding for the frontend side. The one open item is external: confirming
  `expose-employee-facing-earnings-summary` gets committed in `berd.em-backend` (it was
  uncommitted working-tree state at the time this frontend change was implemented against it).
