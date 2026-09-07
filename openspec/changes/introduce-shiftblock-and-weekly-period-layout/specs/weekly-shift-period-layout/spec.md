## ADDED Requirements

### Requirement: Shared weekly period-band grid
The system SHALL provide a reusable weekly schedule grid component that renders the 7 days of a
given week (with dates) against 3 fixed period bands — morning (Sáng), afternoon (Trưa), and
evening (Tối) — and SHALL be used by every schedule-shaped Staff screen (Bản biểu, Đăng ban, and
any future tab such as Bản ký) instead of each screen implementing its own layout.

#### Scenario: Rendering a week
- **WHEN** a schedule screen renders the grid for a given week
- **THEN** the grid shows all 7 days of that week with their dates, and each day is divided into
  the 3 period bands in a fixed order (morning, afternoon, evening)

#### Scenario: Reused across schedule screens
- **WHEN** Bản biểu, Đăng ban, or any other schedule-shaped screen needs a weekly layout
- **THEN** the screen renders its shift content through the same shared grid component rather than
  a screen-specific layout

### Requirement: Today is visually highlighted in the grid
Within the rendered week, the column or section corresponding to the current calendar day SHALL be
visually distinguished from the other 6 days.

#### Scenario: Current week includes today
- **WHEN** the grid displays a week that includes today's date
- **THEN** today's day column is styled distinctly from the other days

### Requirement: ShiftBlock component
The system SHALL provide a reusable `ShiftBlock` component that accepts a `title` and a `children`
slot for per-screen custom content, with no built-in knowledge of grid placement or periods, so
that it renders identically wherever it is used.

#### Scenario: Rendering a shift block
- **WHEN** a schedule screen renders a shift inside the weekly grid
- **THEN** it renders a `ShiftBlock` with a `title` and screen-specific content passed as
  `children` (e.g. time range and branch name on Bản biểu, a register/unregister action on Đăng
  ban)

#### Scenario: Same component across tabs
- **WHEN** Bản biểu, Đăng ban, and Bản ký each need to show a shift inside the grid
- **THEN** all three use the same `ShiftBlock` component, differing only in what they pass as
  `children`

### Requirement: Shift blocks are placed in the period(s) they occur in
Each `ShiftBlock` rendered inside the weekly grid SHALL appear within the period band(s) that its
shift's start and end time overlap, on the day matching the shift's date.

#### Scenario: Shift entirely within one period
- **WHEN** a shift's start and end time both fall within a single period band (e.g. a shift from
  08:00 to 11:00, entirely within the morning band)
- **THEN** its `ShiftBlock` is rendered only within that one period band, on the correct day

#### Scenario: Multiple shifts on the same day and period
- **WHEN** more than one shift on the same day falls within the same period band (e.g. two
  employees' shifts, or two open shift slots on Đăng ban)
- **THEN** all of their `ShiftBlock`s are rendered within that day's period band without hiding or
  overwriting one another

### Requirement: Shift blocks visually span multiple periods when a shift crosses period boundaries
When a shift's time range overlaps more than one period band, its `ShiftBlock` SHALL be rendered as
a single block whose visual extent stretches across all the period bands it overlaps, rather than
being duplicated once per period or truncated to a single period.

#### Scenario: Shift crossing one period boundary
- **WHEN** a shift's start and end time span two adjacent period bands (e.g. a shift from 11:00 to
  14:00, crossing from morning into afternoon)
- **THEN** its `ShiftBlock` is rendered once, as a single block whose box visually stretches across
  both the morning and afternoon bands on that day

#### Scenario: Shift crossing two period boundaries
- **WHEN** a shift's start and end time span all 3 period bands in a single day
- **THEN** its `ShiftBlock` is rendered once, stretching across all 3 bands on that day
