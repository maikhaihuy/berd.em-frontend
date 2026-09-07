export type Period = "morning" | "afternoon" | "evening";

interface PeriodDef {
  id: Period;
  label: string;
  startHour: number;
  endHour: number;
}

// UTC wall-clock hours, matching `getTime()` in dateTimeHelpers.ts - these
// boundaries are a frontend-only placeholder (no per-branch schedule config
// exists on the backend yet), see design.md Decision 2.
export const PERIODS: PeriodDef[] = [
  { id: "morning", label: "Sáng", startHour: 0, endHour: 12 },
  { id: "afternoon", label: "Trưa", startHour: 12, endHour: 18 },
  { id: "evening", label: "Tối", startHour: 18, endHour: 24 },
];

// Returns the ordered periods a shift's [startTime, endTime) overlaps, by
// UTC hour. A zero-length or point-in-time range still yields the single
// period its start hour falls into.
export const getPeriodsForRange = (startTime: Date, endTime: Date): Period[] => {
  const startHour = startTime.getUTCHours();
  const endHour = endTime.getUTCHours();
  const effectiveEndHour = endHour <= startHour ? 24 : endHour;

  return PERIODS.filter(
    (period) => period.startHour < effectiveEndHour && period.endHour > startHour
  ).map((period) => period.id);
};
