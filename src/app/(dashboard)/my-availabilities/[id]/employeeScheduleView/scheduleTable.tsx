import { MasterShiftTemplate } from "@/features/masterShiftTemplate/types";
import { MasterShift } from "@/features/masterShift/types";
import { Assignment } from "@/features/assignment/types";
import { Weekday, toDateOnlyString } from "@/lib/utils/dateTimeHelpers";
import { getPeriodsForRange } from "@/components/schedule/periods";
import { ShiftBlock } from "@/components/schedule/shift-block";
import { WeeklyPeriodGrid } from "@/components/schedule/weekly-period-grid";
import AssignmentItem from "./assignment-item";

interface ScheduleTableProps {
  employeeId: number;
  templates: MasterShiftTemplate[];
  masterShifts: MasterShift[];
  myAssignments: Assignment[];
  weekDays: Weekday[];
}

export default function ScheduleTable({
  employeeId,
  templates,
  masterShifts,
  myAssignments,
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

          const existingAssignment = myAssignments.find((a) => a.subShiftId === subShift.id);

          return [
            {
              key: `${template.id}-${dayKey}`,
              periods: getPeriodsForRange(new Date(subShift.startTime), new Date(subShift.endTime)),
              element: (
                <ShiftBlock title={subShift.title}>
                  <AssignmentItem employeeId={employeeId} subShift={subShift} assignment={existingAssignment} />
                </ShiftBlock>
              ),
            },
          ];
        });
      }}
    />
  );
}
