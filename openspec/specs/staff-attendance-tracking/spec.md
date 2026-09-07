# staff-attendance-tracking Specification

## Purpose

Lets a logged-in Staff member see today's shift status and check in/out for it directly from the web dashboard, answering the "Am I working today? Can I check in? Can I check out?" questions from a desktop/tablet browser.

## Requirements

### Requirement: Staff can see today's shift status
The `/attendanceTracking` page SHALL show, for the logged-in user's own employee record, whether they have a shift today and its status: no shift today, upcoming (not yet started), in progress, or ended. This SHALL be derived from `listByEmployee` assignments filtered to today's date plus each assignment's `actualStartTime`/`actualEndTime`.

#### Scenario: Employee has a shift today, not yet checked in
- **WHEN** the employee has an assignment scheduled for today and `actualStartTime` is not set
- **THEN** the page shows the shift's scheduled time range and an "upcoming/not checked in" status

#### Scenario: Employee has no shift today
- **WHEN** the employee has no assignment for today's date
- **THEN** the page shows an explicit "no shift today" state and no check-in/check-out action is offered

### Requirement: Check-in action
When the employee has today's assignment and has not yet checked in, the page SHALL offer a check-in action that calls `POST /assignments/:id/check-in`, setting `actualStartTime`.

#### Scenario: Employee checks in
- **WHEN** the employee taps/clicks the check-in action for today's shift
- **THEN** the system calls the check-in endpoint for that assignment, and on success the page updates to show "checked in" status with the recorded start time

#### Scenario: Check-in request fails
- **WHEN** the check-in request errors (network/server error)
- **THEN** the page shows an error message and the assignment's status remains "not checked in", so the employee can retry

### Requirement: Check-out action
Once checked in and not yet checked out, the page SHALL offer a check-out action that calls
`POST /assignments/:id/check-out`, setting `actualEndTime`. Before allowing this call, the page
SHALL check the shift's mandatory tasks (`SHARED_MANDATORY`, `DEDICATED`, per
`task-completion-with-evidence`): if any are not `COMPLETED`, the check-out action SHALL be
disabled and the page SHALL list which mandatory tasks are still pending. If mandatory tasks are
all complete but one or more todo tasks (`SHARED_OPTIONAL`) are still `PENDING`, the check-out
action SHALL remain enabled but SHALL show a non-blocking confirmation warning listing the pending
todo tasks before the check-out call is made. This client-side gate is advisory only — the backend
independently enforces the mandatory-task rule and remains the source of truth for whether
checkout succeeds.

#### Scenario: Employee checks out with all tasks complete
- **WHEN** a checked-in employee has no pending mandatory or todo tasks and taps/clicks the
  check-out action
- **THEN** the system calls the check-out endpoint for that assignment immediately, and on success
  the page updates to show "checked out" status with the recorded end time

#### Scenario: Checkout blocked by pending mandatory tasks
- **WHEN** a checked-in employee has one or more `SHARED_MANDATORY`/`DEDICATED` tasks that are not
  `COMPLETED`
- **THEN** the check-out action is disabled, and the page lists the titles of the pending
  mandatory tasks

#### Scenario: Checkout warns on pending todo tasks
- **WHEN** a checked-in employee has all mandatory tasks complete but one or more `SHARED_OPTIONAL`
  tasks are still `PENDING`, and the employee taps/clicks the check-out action
- **THEN** the page shows a confirmation warning listing the pending todo tasks before proceeding;
  confirming calls the check-out endpoint as normal, and cancelling makes no request

#### Scenario: Backend rejects checkout despite the client-side gate passing
- **WHEN** the client-side gate allows the check-out action (no pending mandatory tasks per the
  page's current data) but the check-out request is rejected by the backend (e.g. stale client
  state)
- **THEN** the page shows the backend's error message and the assignment remains checked in, so
  the employee can retry once their task data is current

#### Scenario: Already checked out
- **WHEN** today's assignment already has both `actualStartTime` and `actualEndTime` set
- **THEN** the page shows a "checked out" status and no further check-in/check-out action is offered for that assignment

### Requirement: Multiple shifts today
If the employee has more than one assignment for today (e.g. split shifts, multiple branches), each SHALL be listed with its own independent status and check-in/check-out action.

#### Scenario: Employee has two shifts today
- **WHEN** the employee has two separate assignments both scheduled for today
- **THEN** the page lists both, and checking in/out of one does not affect the other's displayed status

### Requirement: Mandatory and todo tasks are shown read-only
The page SHALL list the employee's current or upcoming shift's task templates (`SHARED_MANDATORY`, `SHARED_OPTIONAL`, or `DEDICATED`) for reference. Where real per-shift task instances exist for the shift, the page SHALL use `task-completion-with-evidence` to show live completion state and let the employee mark tasks complete, instead of a static read-only list. The read-only template list is retained only as a fallback for a shift that has templates configured but no task instances yet (see `task-completion-with-evidence`).

#### Scenario: Shift has task instances
- **WHEN** today's shift has one or more `Task` instances (regardless of type)
- **THEN** the page shows their live completion state and completion actions per
  `task-completion-with-evidence`, not a static read-only list

#### Scenario: Shift has task templates but no task instances
- **WHEN** today's shift has task templates configured for its branch/shift but no `Task`
  instances exist yet
- **THEN** the page lists the template titles read-only, without checkboxes, completion state, or
  a completion action

#### Scenario: Shift has no task templates or instances
- **WHEN** today's shift has no associated task templates and no task instances
- **THEN** the task list section is omitted or shows an empty state, and check-out remains
  available once checked in (subject to the Check-out action requirement above)

### Requirement: Live clock is shown on the attendance screen
The `/attendanceTracking` page SHALL display a live, continuously-updating clock showing the
current time, independent of shift/task/checkout state, so the employee always has a current-time
reference point on screen (Fixed Layout Slot #2 per the product spec).

#### Scenario: Clock updates while the page is open
- **WHEN** the employee has the page open
- **THEN** the displayed time advances at least once per minute without requiring a page reload
