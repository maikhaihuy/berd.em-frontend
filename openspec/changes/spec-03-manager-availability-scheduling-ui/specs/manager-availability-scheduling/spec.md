## ADDED Requirements

### Requirement: Manager availability scheduling screen at `/availabilities`
The system SHALL provide a page at `/availabilities` (nav label "Ca đăng ký") that lets a Manager
select a branch they manage and a week, and see every employee's registered (`REGISTERED`)
`Availability` for that branch/week grouped by `MasterShift` → `SubShift`, mirroring the
branch-tab and week-navigation shell already used by `/rosters`.

#### Scenario: Manager opens the screen for a branch they manage
- **WHEN** a Manager opens `/availabilities` and selects a branch they manage
- **THEN** the page shows the selected week's `MasterShift`s as cards, each listing its
  `SubShift`s, with every employee who has a `REGISTERED` `Availability` row for that sub-shift
  listed underneath it

#### Scenario: Manager switches to a branch they do not manage
- **WHEN** a Manager (with access to more than one branch tab, or via a test account) switches to
  a branch they do not manage
- **THEN** the availability list for that branch is empty, reflecting the backend's branch-scoped
  grant rather than the frontend filtering anything itself

#### Scenario: Sub-shift with no registrations
- **WHEN** a `SubShift` has zero `REGISTERED` `Availability` rows for the displayed week
- **THEN** its section shows a plain "Chưa có ai đăng ký" line instead of an empty list, and the
  Manager can still use the sub-shift's normal assignment control to pick someone manually

### Requirement: Turning a registration into an Assignment ("Xếp ca")
Each listed registrant SHALL have a "Xếp ca" action that creates a real `Assignment` for that
employee/sub-shift, passing the specific `Availability` row's id as `availabilityId`, using the
existing assignment-creation path unchanged.

#### Scenario: Manager assigns a registered employee
- **WHEN** a Manager clicks "Xếp ca" next to a registrant under a sub-shift
- **THEN** the system creates an `Assignment` with that `employeeId`, `subShiftId`, and
  `availabilityId`, and the underlying `Availability` row's `status` becomes `ASSIGNED`

#### Scenario: List reflects the assignment without a manual refresh
- **WHEN** a "Xếp ca" action succeeds
- **THEN** the availability list and the assignment data both refresh so the just-assigned
  registrant is no longer shown as pending, without the Manager reloading the page
