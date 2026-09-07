# task-completion-with-evidence Specification

## Purpose

Lets a logged-in Staff member see the real, live completion state of their shift's mandatory and todo tasks on the `/attendanceTracking` page, and mark a task complete with an optional note — answering "What tasks must I complete?" with actual per-shift data instead of a static list of task templates.

## Requirements

### Requirement: Staff can see real per-shift task completion state
The `/attendanceTracking` page SHALL fetch actual task instances from the backend `tasks` resource for each of today's shift slots (`masterShiftId` + `subShiftId`) and render each task's real completion state (`PENDING` or `COMPLETED`), instead of only listing static task template titles with no completion state.

#### Scenario: Shift has task instances
- **WHEN** today's shift slot has one or more `Task` records returned by `GET /tasks`
- **THEN** the page lists each task with its title, type, and current status, reflecting
  `COMPLETED` tasks as done and `PENDING` tasks as not done

#### Scenario: Shift has templates but no task instances yet
- **WHEN** `GET /tasks` returns an empty list for a shift slot, but the shift's branch has
  task templates configured
- **THEN** the page falls back to listing the branch's task templates read-only (the prior
  behavior), without offering a completion action, so the employee still sees what's expected
  even though no per-shift task instance exists yet

#### Scenario: Shift has neither task instances nor templates
- **WHEN** `GET /tasks` returns an empty list and the shift's branch has no task templates
- **THEN** the task section is omitted or shows an empty state

### Requirement: Staff can mark a task complete with an optional note
For each `PENDING` task instance, the page SHALL offer a "mark complete" action that calls
`POST /tasks/:id/complete` with the current employee as `completedByEmployeeId` and an optional
free-text `note`. On success, the task's displayed status SHALL update to `COMPLETED` without a
manual page refresh. Photo/image evidence is out of scope for this action (see project decision
log); only the text note is supported.

#### Scenario: Employee completes a task with a note
- **WHEN** the employee opens the "mark complete" action for a `PENDING` task, enters a note, and
  confirms
- **THEN** the system calls `POST /tasks/:id/complete` with that note, and on success the task is
  shown as `COMPLETED` and the note is no longer editable through this action

#### Scenario: Employee completes a task without a note
- **WHEN** the employee opens the "mark complete" action for a `PENDING` task and confirms without
  entering a note
- **THEN** the system calls `POST /tasks/:id/complete` with no `note` field, and on success the
  task is shown as `COMPLETED`

#### Scenario: Completion request fails
- **WHEN** the complete-task request errors (network/server error)
- **THEN** the page shows an error message and the task's status remains `PENDING`, so the
  employee can retry

#### Scenario: Already-completed task has no action
- **WHEN** a task's status is already `COMPLETED`
- **THEN** the page shows its completed state (and note, if any) without offering the "mark
  complete" action again

### Requirement: Mandatory and todo tasks are visually distinguished
The page SHALL visually distinguish mandatory tasks (`SHARED_MANDATORY`, `DEDICATED`) from todo
tasks (`SHARED_OPTIONAL`), so the employee can tell at a glance which tasks block checkout and
which do not.

#### Scenario: Shift has both mandatory and todo tasks
- **WHEN** today's shift has at least one `SHARED_MANDATORY`/`DEDICATED` task and at least one
  `SHARED_OPTIONAL` task
- **THEN** the two groups are rendered under separate, clearly labeled sections
