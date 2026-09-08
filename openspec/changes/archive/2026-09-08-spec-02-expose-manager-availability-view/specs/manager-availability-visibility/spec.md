## MODIFIED Requirements

### Requirement: Manager can read employee availability for branches they manage
`GET /availability` SHALL let a Manager see every employee's registered availability for the
branch(es) they manage, not only their own, via the same endpoint an Employee uses. Visibility
SHALL be enforced by the caller's resolved permission grant, not by role-specific branching in the
service or controller layer. A `branchId` query parameter SHALL further scope the result to one
branch, and a `subShiftId` query parameter SHALL further scope it to one sub-shift's registrations.

Previously this endpoint hard-coded every caller to their own `Employee` row
(`AvailabilityService.findAll()`/`findOne()`), so a Manager had no way to see anyone else's
availability at all — the manager-facing roster-building screen (Spec 3) has no data source
without this.

#### Scenario: Manager lists availability for a branch they manage
- **WHEN** a Manager calls `GET /availability?branchId=3` for a branch they manage
- **THEN** the response includes every employee's `Availability` records for that branch's
  sub-shifts within the requested week, not only the Manager's own

#### Scenario: Manager narrows to one sub-shift
- **WHEN** a Manager calls `GET /availability?subShiftId=118`
- **THEN** the response includes only `Availability` records for that specific sub-shift, across
  all employees who registered for it, within what the Manager's branch grant allows

#### Scenario: Manager queries a branch they do not manage
- **WHEN** a Manager calls `GET /availability?branchId=<a branch they do not manage>`
- **THEN** the response is an empty list (not a 403), consistent with how `master-shifts` and
  `assignments` already behave for out-of-scope branches

#### Scenario: Employee's own view is unaffected by query params
- **WHEN** an Employee calls `GET /availability` with or without a `branchId`/`subShiftId` query
  parameter
- **THEN** the response always contains only that Employee's own `Availability` records,
  regardless of what `branchId`/`subShiftId` value (if any) was passed

### Requirement: Manager cannot write Availability directly
A Manager SHALL NOT be able to `create`, `update`, or `delete` `Availability` records through the
`/availability` endpoints. Manager's grant on `Availability` SHALL be read-only. A Manager's actual
mechanism for turning a registration into a real shift is `POST /assignments` (with
`availabilityId`), which flips the underlying `Availability.status` to `ASSIGNED` internally — not
a direct `/availability` write.

#### Scenario: Manager attempts to create an Availability record directly
- **WHEN** a Manager sends `POST /availability`
- **THEN** the request is rejected (403), because Manager's grant does not include `create` on
  `Availability`

#### Scenario: Manager attempts to delete another employee's Availability record
- **WHEN** a Manager sends `DELETE /availability/:id` for an `Availability` record they did not
  register
- **THEN** the request is rejected (404, not 403 — matching the existing not-found-for-403
  convention used by sibling endpoints), because Manager's grant does not include `delete` on
  `Availability`

### Requirement: Availability deletion enforces ownership
`DELETE /availability/:id` SHALL only succeed for the owning Employee or an Admin. An Employee
attempting to delete another employee's `Availability` record SHALL be denied, matching the
ownership check `update()` already performs.

#### Scenario: Employee deletes their own pending registration
- **WHEN** the owning Employee calls `DELETE /availability/:id` for their own `REGISTERED`
  `Availability` record
- **THEN** the record is deleted and the response confirms success

#### Scenario: Employee attempts to delete another employee's registration
- **WHEN** an Employee calls `DELETE /availability/:id` for an `Availability` record belonging to
  a different employee
- **THEN** the request is rejected with a 404 (not-found-for-403 convention), and the record is
  not deleted

#### Scenario: Admin deletes any employee's registration
- **WHEN** an Admin calls `DELETE /availability/:id` for any employee's `Availability` record
- **THEN** the record is deleted, since Admin's grant is unconditioned
