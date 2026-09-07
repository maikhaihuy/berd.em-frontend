## Why

Lịch ca's 3rd tab, **Bản ký (shift history)**, doesn't exist at all — no route, no component, no
reference anywhere in `src` (confirmed via repo-wide search). Only Bản biểu (view assigned
shifts) and Đăng ban (register availability) exist. An employee currently has no way to see their
completed shift history from this dashboard.

## What Changes

- Add a route for Bản ký (e.g. `/my-calendars` could gain a tab param, or a dedicated
  `/shift-history` route — match whatever tab-switching pattern the other 3-tab sections in this
  app already use, e.g. how Lịch ca's own top-level tabs are currently structured, if Bản biểu/
  Đăng ban are already siblings under one shared parent rather than fully separate routes; check
  before deciding).
- Render completed shifts using the shared `ShiftBlock` + weekly grid from
  `introduce-shiftblock-and-weekly-period-layout` (land that proposal first — this one is scoped
  to reuse it, not build a 3rd independent layout).
- Data source: likely `useGetAssignmentsByEmployee` filtered to past/completed shifts (the same
  hook already used by `attendanceTracking` and `my-calendars`) — confirm whether "completed"
  should mean the shift's date has passed, its checkout is finalized (per the backend's
  end-of-day reconciliation, once `add-end-of-day-checkout-reconciliation` lands — until then,
  "last checkout wins" per current backend behavior), or both.

## Capabilities

### New Capabilities
- `staff-shift-history`: a Staff member can view their own past/completed shifts in the same
  weekly layout used for upcoming shifts.

## Impact

New route/tab for Bản ký, reusing `ShiftBlock` + the weekly grid component from
`introduce-shiftblock-and-weekly-period-layout`, likely a thin `src/features/schedule/`
(or existing assignment feature) addition rather than a new data layer.

**Depends on** `introduce-shiftblock-and-weekly-period-layout` landing first.
