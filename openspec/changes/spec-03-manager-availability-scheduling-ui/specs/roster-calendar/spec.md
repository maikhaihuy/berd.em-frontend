## MODIFIED Requirements

### Requirement: Sub-shift rows offer an inline click-select-confirm assignment control
Each sub-shift row SHALL offer an inline employee-select control directly on the row (no separate dialog) for the common case of assigning or reassigning a single slot: selecting an employee from the control SHALL stage the choice and require a separate confirm action before the assignment is created via the existing `assignment` capability's create endpoint. For a sub-shift whose `maxAssignments` is greater than 1, the row SHALL additionally show existing assignees as chips alongside an "Add" trigger that opens the same select-then-confirm control for adding another assignee while `assignments.length < maxAssignments`. Each employee in the control's item list SHALL be visually flagged when they have a `REGISTERED` `Availability` row for that sub-shift, and registered employees SHALL be sorted ahead of unregistered ones in the list; this is presentation-only and does not change which employees are selectable or how the assignment is created.

#### Scenario: Assigning an employee to an unassigned single-capacity sub-shift
- **WHEN** the manager selects an employee in an unassigned sub-shift row's control and confirms
- **THEN** the system creates an assignment for that `subShiftId`/`employeeId` and the row's control now shows that employee as the assigned value

#### Scenario: Selecting without confirming does not assign
- **WHEN** the manager picks an employee in the control but has not yet clicked confirm
- **THEN** no assignment is created and the manager can still cancel the selection

#### Scenario: Adding an additional assignee to a multi-capacity sub-shift
- **WHEN** a sub-shift has `maxAssignments` of 2 and one existing assignee, and the manager uses the "Add" trigger to select and confirm a second employee
- **THEN** the system creates a second assignment for that sub-shift and both assignees appear as chips

#### Scenario: Add trigger is unavailable at capacity
- **WHEN** a sub-shift's `assignments.length` equals its `maxAssignments`
- **THEN** the row does not offer an "Add" trigger

#### Scenario: Registered employees are visually distinguished in the picker
- **WHEN** the manager opens a sub-shift row's employee-select control and one or more eligible
  employees have a `REGISTERED` `Availability` row for that sub-shift
- **THEN** those employees show a visual indicator in the item list and are sorted ahead of
  employees without a registration

#### Scenario: Picking a non-registered employee still works unchanged
- **WHEN** the manager selects and confirms an employee who has no `Availability` row for that
  sub-shift
- **THEN** the assignment is created exactly as before, with no `availabilityId`, and the pick
  succeeds the same way it did before this indicator existed
