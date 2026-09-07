## MODIFIED Requirements

### Requirement: Staff can view their own weekly shift schedule
The `/my-calendars` page SHALL show the current week's shifts assigned to the logged-in user's own
employee record (`AuthUser.employeeId`), using the same assignment data already available via
`listByEmployee`. Shifts SHALL be rendered through the shared weekly period-band grid (see the
`weekly-shift-period-layout` capability), grouped by day and placed within the period band(s) the
shift's start/end time overlap, rather than a page-specific layout. The page SHALL NOT require any
elevated permission beyond being an authenticated employee.

#### Scenario: Employee opens their schedule
- **WHEN** a logged-in Staff user with a linked employee record opens `/my-calendars`
- **THEN** the page shows the current week's days, and for each day the shift(s) the employee is
  assigned to — placed in the correct period band(s) — including branch, sub-shift title, and
  scheduled start/end time

#### Scenario: User has no linked employee record
- **WHEN** the logged-in user's `employeeId` is not set (auth-only account, not yet linked to an
  employee)
- **THEN** the page shows an empty/explanatory state instead of attempting to fetch assignments
