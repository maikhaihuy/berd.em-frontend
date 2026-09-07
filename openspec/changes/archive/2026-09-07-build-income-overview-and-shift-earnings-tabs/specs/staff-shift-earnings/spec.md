## ADDED Requirements

### Requirement: Tiền ca tab lists completed shifts with earning info
The system SHALL provide a "Tiền ca" tab within the income section that lists the logged-in
employee's `PayrollEntry` rows, each representing one completed and processed shift, showing the
shift's work date, hours-derived pay amount (`totalPay`), and pay-rate multiplier context (e.g. an
"OT" indicator when `multiplier > 1`).

#### Scenario: Staff opens Tiền ca with processed shifts on record
- **WHEN** a logged-in Staff member selects the Tiền ca tab and has one or more `PayrollEntry`
  rows
- **THEN** the system shows a list of those entries ordered by `workDate` descending, each row
  showing the date and `totalPay`, with an OT indicator on rows where `multiplier > 1`

#### Scenario: Staff opens Tiền ca with no processed shifts yet
- **WHEN** a logged-in Staff member selects the Tiền ca tab and has zero `PayrollEntry` rows
- **THEN** the system shows an empty state explaining that shift earnings appear once a shift's
  attendance has been verified and payroll processed for it, rather than an error or a blank list

### Requirement: Tiền ca scoped to the logged-in employee only
The system SHALL only ever request and display `PayrollEntry` rows for the logged-in employee's
own `employeeId`.

#### Scenario: Staff views Tiền ca
- **WHEN** the Tiền ca tab loads data
- **THEN** the request is scoped to the logged-in employee's `employeeId` and the response
  contains only that employee's entries
