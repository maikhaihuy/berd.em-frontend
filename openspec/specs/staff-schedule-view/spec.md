# staff-schedule-view Specification

## Purpose

Lets a logged-in Staff member see their own upcoming and current shifts for the week at a glance, without needing manager access to the `/rosters` admin view.

## Requirements

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

### Requirement: Week navigation
The page SHALL let the employee move to the previous week, the next week, or jump back to the current week, matching the week-navigation pattern used on `/rosters`.

#### Scenario: Employee checks next week's schedule
- **WHEN** the employee clicks "next week"
- **THEN** the displayed week advances by 7 days and the shift list refetches/filters for that week

### Requirement: Today is visually highlighted
Within the displayed week, the current calendar day SHALL be visually distinguished from other days.

#### Scenario: Viewing the current week
- **WHEN** the displayed week includes today's date
- **THEN** today's column/day is styled distinctly from the other six days

### Requirement: Multi-branch employees see all their branches
If the employee is linked to more than one branch, the schedule SHALL include assignments across all of the employee's branches rather than only one.

#### Scenario: Employee works at two branches
- **WHEN** an employee has assignments at two different branches within the displayed week
- **THEN** both branches' shifts appear on the page, labeled with their branch name

### Requirement: Empty week state
If the employee has no assignments in the displayed week, the page SHALL show an explicit "no shifts this week" state rather than a blank area.

#### Scenario: Week with no assigned shifts
- **WHEN** the employee has zero assignments in the displayed week
- **THEN** the page shows a message indicating there are no shifts scheduled that week, instead of an empty grid
