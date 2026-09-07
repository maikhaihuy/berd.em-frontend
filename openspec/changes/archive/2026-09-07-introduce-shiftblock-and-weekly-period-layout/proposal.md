## Why

`CLAUDE.md`'s Lịch ca spec calls for a shared weekly layout (days+dates, today highlighted,
morning/afternoon/evening period bands, shift blocks that can span multiple periods) built around
a reusable `ShiftBlock` component (`title` prop + `children` slot), used identically across all
3 tabs (Bản biểu, Đăng ban, Bản ký).

Today `my-calendars/page.tsx` (Bản biểu) and `my-availabilities/[id]/page.tsx` (Đăng ban) each
have their own ad hoc layout — a simple per-day card list and a registration table respectively —
neither matches the period-band weekly grid, and no `ShiftBlock` component exists anywhere in
`src`. This isn't just a visual nitpick: without a shared component, every future schedule-shaped
screen (including the not-yet-built Bản ký, see the companion `build-shift-history-tab`
proposal) reimplements the same layout logic independently and drifts.

## What Changes

- Build a `ShiftBlock` component: `title` prop, `children` slot for custom per-tab content
  (e.g. Bản biểu shows shift details, Đăng ban shows a register/unregister action, Bản ký shows
  historical status), positioned within a shared weekly period-band grid layout.
- Build the shared weekly grid: days-of-week header with dates, today highlighted, 3 period bands
  (morning/afternoon/evening — confirm exact time boundaries with whoever owns shift-template
  config, since `BranchScheduleConfig` on the backend may already define this per branch rather
  than it being a fixed global boundary), with `ShiftBlock`s rendered in the correct period
  slot(s) and able to visually span more than one period for shifts that cross boundaries.
- Retrofit `my-calendars` (Bản biểu) and `my-availabilities/[id]` (Đăng ban) onto the shared grid
  + `ShiftBlock`, replacing their current ad hoc layouts. Keep each tab's existing data-fetching
  (`useGetAssignmentsByEmployee`, the availabilities table's existing hooks) — this is a
  presentation-layer change, not a data-layer rewrite.

## Capabilities

### New Capabilities
- `weekly-shift-period-layout`: a shared, reusable weekly schedule grid (period bands +
  spanning shift blocks) used consistently across every schedule-shaped screen.

### Modified Capabilities
- `staff-schedule-view` (existing spec under `openspec/specs/`): the Bản biểu/Đăng ban layout
  moves onto the shared component instead of each tab's own ad hoc markup.

## Impact

New `src/components/shift-block.tsx` (or under a more specific shared location, e.g.
`src/features/schedule/components/` if one gets created), new weekly-grid layout component,
`src/app/(dashboard)/my-calendars/page.tsx`, `src/app/(dashboard)/my-availabilities/[id]/page.tsx`
(retrofit, not full rewrite of data logic).

**Do this before `build-shift-history-tab`** — that proposal is written to reuse whatever this
one produces rather than inventing a 3rd ad hoc layout.
