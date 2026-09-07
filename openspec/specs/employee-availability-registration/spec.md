# employee-availability-registration Specification

## Purpose

Lets a Staff member register interest in an open sub-shift via the "Đăng ban" screen
(`/my-availabilities/[id]`) by creating a backend `Availability` record — the entity the
Employee role actually has permission to write — rather than an `Assignment`, which the Employee
role cannot create.

## Requirements

### Requirement: Registering interest creates an Availability record, not an Assignment
The "Đăng ban" screen (`/my-availabilities/[id]`) SHALL register an employee's interest in an
open sub-shift by creating an `Availability` record via `POST /availability`, and SHALL remove
that interest via `DELETE /availability/:id`. The screen SHALL NOT call `POST`/`DELETE
/assignments` for this purpose.

#### Scenario: Employee-role account registers for an open sub-shift
- **WHEN** a logged-in user with the Employee role clicks "Register" on an open sub-shift on
  `/my-availabilities/[id]`
- **THEN** the system creates an `Availability` record (`employeeId`, `subShiftId`) via
  `POST /availability` and the request succeeds (no 403), because the Employee role holds
  `create:availability` scoped to `$self`

#### Scenario: Employee-role account unregisters a pending registration
- **WHEN** a logged-in Employee-role user clicks "Unregister" on a sub-shift they previously
  registered for, while its `Availability.status` is `REGISTERED`
- **THEN** the system deletes the `Availability` record via `DELETE /availability/:id`

### Requirement: Availability status drives the registration UI on this screen
The screen SHALL render each of the `Availability.status` values (`REGISTERED`, `ASSIGNED`,
`CANCELLED`) with distinct, deliberate UI, matching them exhaustively (no fallback/unknown state
for a value in the enum).

#### Scenario: Registration pending assignment
- **WHEN** an `Availability` record's `status` is `REGISTERED`
- **THEN** the sub-shift's block shows a "Đã đăng ký, chờ xếp ca" badge and an active Unregister
  action

#### Scenario: Registration already built into a shift
- **WHEN** an `Availability` record's `status` is `ASSIGNED`
- **THEN** the sub-shift's block shows an "Đã được xếp ca" badge and does NOT show an Unregister
  action

#### Scenario: Cancelled registration
- **WHEN** an `Availability` record's `status` is `CANCELLED`
- **THEN** the sub-shift's block shows a plain status badge with no Register/Unregister action

### Requirement: No `Assignment`-specific status values leak into this screen
Because this screen operates on `Availability` records, not `Assignment` records, none of the
`Assignment.status` values (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `ABSENT`) SHALL be read,
displayed, or relied upon anywhere in the "Đăng ban" screen's components.

#### Scenario: Screen renders without referencing Assignment status
- **WHEN** the "Đăng ban" screen renders a sub-shift's registration state
- **THEN** the rendering logic switches only on `AvailabilityStatus` values, and no code path in
  the screen's components imports or checks `assignment.status`
