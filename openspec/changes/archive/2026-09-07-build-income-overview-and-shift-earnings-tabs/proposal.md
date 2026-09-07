## Why

`CLAUDE.md`'s **Thu nhập (Income)** section — one of 4 primary nav tabs — doesn't exist at all:
no route, no sidebar entry (`src/constants/routes.ts`), no feature module. There is zero
reference to "payroll"/"income"/"tiền ca" anywhere in `src`.

`staffhub-backend` already has working `pay-periods` (`src/modules/pay-periods/`) and
`payroll-entries` (`src/modules/payroll-entries/`) modules — full controllers, DTOs, services,
with permission subjects `pay-periods`/`payroll-entries` already wired into CASL — plus
`employee-hourly-rates` for rate lookups. The frontend simply never built a UI on top of any of
it.

**Cross-repo dependency, resolved during implementation**: this proposal originally scoped in both
Tổng quan and Tiền ca as "unblocked." That held for Tiền ca, but Tổng quan's earnings-breakdown
aggregation question surfaced that the backend team had filed their own proposal,
`expose-employee-facing-earnings-summary` (`berd.em-backend/openspec/changes/
expose-employee-facing-earnings-summary/`), written specifically in response to this proposal. It
resolves the breakdown question with a new `GET /payroll-entries/summary?employeeId=&from=&to=`
endpoint (server-computed `shiftPay`/`approvedOt`/`bonus`/`total`/`previousPeriod`) and adds a real
`bonus` field + Manager/Admin `PATCH /payroll-entries/:id/bonus` endpoint. Tổng quan's
implementation was initially deferred behind that change (see design.md's history for the
rejected client-side-approximation alternative). Partway through implementing this change's
"ship now" scope, that backend change turned out to already be fully implemented in
`berd.em-backend`'s working tree (uncommitted, but all its own tasks checked and tests passing) —
confirmed live by calling the new endpoints as the seeded dev employee. The user chose to
implement Tổng quan now rather than keep waiting, so **this change now ships both capabilities**.

Tiền ship (delivery earnings) remains separately backend-blocked (no delivery-receipt module
exists yet — see backend's `add-delivery-receipt-ocr-approval`) and is not part of this change.

## What Changes

- Add a `/income` route + `GENERAL_ROUTES` sidebar entry ("Thu nhập"), with a Tổng quan/Tiền ca
  tab shell (shadcn `Tabs`, client-side state).
- **Tổng quan (Overview)** sub-tab: month-to-date breakdown (shift pay / approved OT / bonus) and
  total, sourced from `GET /payroll-entries/summary`; latest paid amount from
  `summary.previousPeriod`; pending-OT count from `GET /time-tracking/employee/:id` filtered
  client-side. Delivery income and pending-receipt approval are not shown — no backend data
  source exists for either (Tiền ship is out of scope).
- **Tiền ca (Shift Earnings)** sub-tab: list of completed shifts with per-shift earning info,
  from `GET /payroll-entries?employeeId=...`.
- `Payroll detail` and `Previous payroll` screens, entry points from Tổng quan: list/detail views
  over the employee's own `PayrollEntry` data, grouped by pay period client-side (using the
  `payPeriod` relation nested on each entry, not a direct `GET /pay-periods` call — see design.md
  for why that call 403s for the Employee role).

## Capabilities

### New Capabilities
- `staff-income-overview`: a Staff member can see month-to-date estimated earnings broken down
  by category, their last paid amount, and pending-approval items, from a proper Tổng quan
  screen.
- `staff-shift-earnings`: a Staff member can see a list of their completed shifts with per-shift
  earning info.

## Impact

`src/app/(dashboard)/income/page.tsx`, `src/app/(dashboard)/income/payroll/page.tsx`,
`src/app/(dashboard)/income/payroll/[payPeriodId]/page.tsx` (new, mirroring the existing pattern
used for other 3-tab sections like Lịch ca), a new `src/features/income/` module (services calling
`payroll-entries`/`time-tracking` endpoints, hooks, types), `src/constants/routes.ts`.

**Out of scope here, tracked separately**:

- Tiền ship (delivery earnings) — blocked on the backend's delivery-receipt model. Don't build a
  3rd sub-tab placeholder for it as part of this change; add it once that backend proposal lands.
