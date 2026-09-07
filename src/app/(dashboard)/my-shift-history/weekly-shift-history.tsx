import { Assignment } from "@/features/assignment/types";
import { getTime, toDateOnlyString, Weekday } from "@/lib/utils/dateTimeHelpers";
import { getPeriodsForRange } from "@/components/schedule/periods";
import { ShiftBlock } from "@/components/schedule/shift-block";
import { WeeklyPeriodGrid } from "@/components/schedule/weekly-period-grid";
import { History } from "lucide-react";

interface WeeklyShiftHistoryProps {
  weekDays: Weekday[];
  assignments: Assignment[];
  branchNameById: Record<number, string>;
}

// A shift counts as history once the employee actually checked out
// (actualEndTime set) - not by `status`, matching how attendanceTracking
// already reads checkout state. See design.md Decision 2.
const isCompleted = (assignment: Assignment) => !!assignment.actualEndTime;

export function WeeklyShiftHistory({ weekDays, assignments, branchNameById }: WeeklyShiftHistoryProps) {
  const completedAssignments = assignments.filter(isCompleted);

  if (completedAssignments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Không có lịch sử ca làm việc</h3>
        <p className="text-muted-foreground">Bạn chưa hoàn thành ca nào trong tuần này.</p>
      </div>
    );
  }

  return (
    <WeeklyPeriodGrid
      weekDays={weekDays}
      dayBlocks={(day) => {
        const dayKey = toDateOnlyString(day.date);
        const dayAssignments = completedAssignments.filter((a) => {
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
                    Kết ca lúc {getTime(new Date(assignment.actualEndTime!))}
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
