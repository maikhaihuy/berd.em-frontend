import { Assignment } from "@/features/assignment/types";
import { getTime, toDateOnlyString, Weekday } from "@/lib/utils/dateTimeHelpers";
import { getPeriodsForRange } from "@/components/schedule/periods";
import { ShiftBlock } from "@/components/schedule/shift-block";
import { WeeklyPeriodGrid } from "@/components/schedule/weekly-period-grid";
import { CalendarX2 } from "lucide-react";

interface WeeklySelfScheduleProps {
  weekDays: Weekday[];
  assignments: Assignment[];
  branchNameById: Record<number, string>;
}

export function WeeklySelfSchedule({ weekDays, assignments, branchNameById }: WeeklySelfScheduleProps) {
  const hasAnyAssignment = assignments.length > 0;

  if (!hasAnyAssignment) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <CalendarX2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Không có ca làm việc</h3>
        <p className="text-muted-foreground">Bạn chưa được xếp ca nào trong tuần này.</p>
      </div>
    );
  }

  return (
    <WeeklyPeriodGrid
      weekDays={weekDays}
      dayBlocks={(day) => {
        const dayKey = toDateOnlyString(day.date);
        const dayAssignments = assignments.filter((a) => {
          const workDate = a.subShift?.masterShift?.workDate;
          return workDate && toDateOnlyString(new Date(workDate)) === dayKey;
        });

        return dayAssignments
          .filter((assignment) => assignment.subShift)
          .map((assignment) => {
            const subShift = assignment.subShift!;
            return {
              key: String(assignment.id),
              periods: getPeriodsForRange(new Date(subShift.startTime), new Date(subShift.endTime)),
              element: (
                <ShiftBlock title={subShift.title}>
                  <p className="text-muted-foreground">
                    {getTime(new Date(subShift.startTime))} - {getTime(new Date(subShift.endTime))}
                  </p>
                  {subShift.masterShift && (
                    <p className="text-muted-foreground">
                      {branchNameById[subShift.masterShift.branchId] ?? "Chi nhánh"}
                    </p>
                  )}
                </ShiftBlock>
              ),
            };
          });
      }}
    />
  );
}
