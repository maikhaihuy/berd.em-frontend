## ADDED Requirements

### Requirement: Thu nhập navigation entry
The system SHALL provide a "Thu nhập" entry in the Staff sidebar navigation that routes to an
income section with a Tổng quan tab and a Tiền ca tab.

#### Scenario: Staff opens Thu nhập from the sidebar
- **WHEN** a logged-in Staff member clicks "Thu nhập" in the sidebar
- **THEN** the system navigates to the income route and shows the Tổng quan tab selected by default

### Requirement: Month-to-date earnings estimate
The system SHALL display, on the Tổng quan tab, an estimated total earning for the current
calendar month, sourced from the backend's `GET /payroll-entries/summary?employeeId=&from=&to=`
`total` field for the current month's date range.

#### Scenario: Staff has payroll entries this month
- **WHEN** the summary endpoint returns a non-zero `total` for the employee's current-month range
- **THEN** the Tổng quan tab shows that `total` as the month-to-date estimate, labeled to indicate
  it reflects processed attendance data rather than a live total

#### Scenario: Staff has no payroll entries this month
- **WHEN** the summary endpoint returns `total: 0` for the employee's current-month range
- **THEN** the Tổng quan tab shows the month-to-date estimate as 0 ₫, not an error or blank state

### Requirement: Earnings breakdown by category
The system SHALL break the month-to-date estimate down into "Lương ca" (the summary endpoint's
`shiftPay`), "OT được duyệt" (`approvedOt`), and "Thưởng" (`bonus`), reading each value directly
from the summary response with no client-side recomputation. The system SHALL NOT render a
delivery-income row, since no backend data source exists for it.

#### Scenario: Employee has shift pay, overtime, and bonus this month
- **WHEN** the summary response for the current month has non-zero `shiftPay`, `approvedOt`, and
  `bonus`
- **THEN** the breakdown shows all three as separate non-zero amounts matching the response

#### Scenario: Employee has no overtime or bonus this month
- **WHEN** the summary response has `approvedOt: 0` and `bonus: 0`
- **THEN** the breakdown shows both as 0 ₫ rather than hiding either row

### Requirement: Latest paid amount
The system SHALL display, on the Tổng quan tab, the summary endpoint's `previousPeriod.totalPaid`
as the latest paid amount, when `previousPeriod` is present.

#### Scenario: Employee has a previous finalized pay period
- **WHEN** the summary response's `previousPeriod` is non-null
- **THEN** the Tổng quan tab shows `previousPeriod.totalPaid` as the latest paid amount

#### Scenario: No pay period has been finalized yet
- **WHEN** the summary response's `previousPeriod` is `null`
- **THEN** the Tổng quan tab shows an empty/placeholder state for latest paid amount instead of an
  error, and does not show a payroll amount of 0 as if a period had been paid

### Requirement: Pending overtime approval summary
The system SHALL display, on the Tổng quan tab, a count of the employee's `TimeLog` entries with
`status` of `PENDING` or `SUBMITTED` and `overtimeMinutes > 0`, as a "pending approval" summary.
The system SHALL NOT display a pending-receipts line, since delivery receipts have no backend
model yet.

#### Scenario: Employee has overtime awaiting verification
- **WHEN** the employee has one or more `TimeLog` rows with `status` `PENDING` or `SUBMITTED` and
  `overtimeMinutes > 0`
- **THEN** the Tổng quan tab shows the count of those rows as pending OT awaiting approval

#### Scenario: Employee has no overtime awaiting verification
- **WHEN** no `TimeLog` row for the employee meets that condition
- **THEN** the Tổng quan tab shows the pending-approval summary as empty/zero, not hidden

### Requirement: Entry points to payroll detail screens
The system SHALL provide, from the Tổng quan tab, a navigable entry point to a Previous payroll
list screen, and from that list, a navigable entry point to a Payroll detail screen for a single
pay period.

#### Scenario: Staff opens previous payroll from Tổng quan
- **WHEN** the employee taps/clicks the previous-payroll entry point on Tổng quan
- **THEN** the system navigates to a list of the employee's non-`OPEN` pay periods, each showing
  its date range and summed `totalPay`

#### Scenario: Staff opens a specific pay period's detail
- **WHEN** the employee selects one pay period from the previous-payroll list
- **THEN** the system navigates to a detail screen listing that period's individual
  `PayrollEntry` rows for the employee
