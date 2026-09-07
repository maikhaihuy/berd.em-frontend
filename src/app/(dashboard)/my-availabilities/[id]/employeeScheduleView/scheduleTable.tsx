import { MasterShiftTemplate } from "@/features/masterShiftTemplate/types";
import { MasterShift } from "@/features/masterShift/types";
import { Availability } from "@/features/availability/types";
import { Weekday, toDateOnlyString } from "@/lib/utils/dateTimeHelpers";
import { getPeriodsForRange } from "@/components/schedule/periods";
import { ShiftBlock } from "@/components/schedule/shift-block";
import { WeeklyPeriodGrid } from "@/components/schedule/weekly-period-grid";
import AvailabilityItem from "./availability-item";

interface ScheduleTableProps {
  employeeId: number;
  templates: MasterShiftTemplate[];
  masterShifts: MasterShift[];
  myAvailability: Availability[];
  weekDays: Weekday[];
}

export default function ScheduleTable({
  employeeId,
  templates,
  masterShifts,
  myAvailability,
  weekDays,
}: ScheduleTableProps) {
  return (
    <WeeklyPeriodGrid
      weekDays={weekDays}
      dayBlocks={(day) => {
        const dayKey = toDateOnlyString(day.date);

        return templates.flatMap((template) => {
          const masterShift = masterShifts.find(
            (ms) => ms.masterShiftTemplateId === template.id && toDateOnlyString(new Date(ms.workDate)) === dayKey
          );
          // Exactly one auto-created sub-shift per master shift today
          const subShift = masterShift?.subShifts?.[0];
          if (!masterShift || !subShift) return [];

          const existingAvailability = myAvailability.find((a) => a.subShiftId === subShift.id);

          return [
            {
              key: `${template.id}-${dayKey}`,
              periods: getPeriodsForRange(new Date(subShift.startTime), new Date(subShift.endTime)),
              element: (
                <ShiftBlock title={subShift.title}>
                  <AvailabilityItem employeeId={employeeId} subShift={subShift} availability={existingAvailability} />
                </ShiftBlock>
              ),
            },
          ];
        });
      }}
    />
  );
}
