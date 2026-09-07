## ADDED Requirements

### Requirement: Staff can view their own completed shift history
The `/my-shift-history` page SHALL show, for the displayed week, the shifts the logged-in user's
own employee record (`AuthUser.employeeId`) has actually completed — defined as an assignment
whose `actualEndTime` is set (i.e. the employee checked out) — using the same assignment data
already available via `listByEmployee`. Shifts SHALL be rendered through the shared weekly
period-band grid (the `weekly-shift-period-layout` capability), placed within the period band(s)
the shift's scheduled start/end time overlap. The page SHALL NOT require any elevated permission
beyond being an authenticated employee.

#### Scenario: Employee opens their shift history
- **WHEN** a logged-in Staff user with a linked employee record opens `/my-shift-history`
- **THEN** the page shows the displayed week's days, and for each day the shift(s) the employee
  actually completed that week, including branch, sub-shift title, and actual checkout time

#### Scenario: A scheduled shift was never checked into or out of
- **WHEN** an assignment's `workDate` has passed but its `actualEndTime` is not set (e.g. the
  employee was absent or never checked out)
- **THEN** that assignment does NOT appear on `/my-shift-history`

#### Scenario: User has no linked employee record
- **WHEN** the logged-in user's `employeeId` is not set (auth-only account, not yet linked to an
  employee)
- **THEN** the page shows an empty/explanatory state instead of attempting to fetch assignments

### Requirement: Week navigation
The page SHALL let the employee move to the previous week, the next week, or jump back to the
current week, matching the week-navigation pattern used on `/my-calendars` and `/rosters`.

#### Scenario: Employee checks a previous week's history
- **WHEN** the employee clicks "previous week"
- **THEN** the displayed week moves back by 7 days and the completed-shift list refetches/filters
  for that week

### Requirement: Today is visually highlighted
Within the displayed week, the current calendar day SHALL be visually distinguished from the other
days.

#### Scenario: Viewing a week that includes today
- **WHEN** the displayed week includes today's date
- **THEN** today's column/day is styled distinctly from the other six days

### Requirement: Multi-branch employees see completed shifts from all their branches
If the employee is linked to more than one branch, the shift history SHALL include completed
shifts across all of the employee's branches rather than only one.

#### Scenario: Employee completed shifts at two branches in the same week
- **WHEN** an employee has completed assignments at two different branches within the displayed
  week
- **THEN** both branches' completed shifts appear on the page, labeled with their branch name

### Requirement: Empty week state
If the employee has no completed shifts in the displayed week, the page SHALL show an explicit
"no shift history this week" state rather than a blank area.

#### Scenario: Week with no completed shifts
- **WHEN** the employee has zero completed assignments in the displayed week
- **THEN** the page shows a message indicating there is no shift history for that week, instead of
  an empty grid
