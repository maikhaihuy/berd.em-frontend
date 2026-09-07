'use client';

import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useGetEmployee } from "@/features/employee/hooks/useEmployeeQueries";
import { useGetAssignmentsByEmployee } from "@/features/assignment/hooks/useAssignmentQueries";
import { generateWeekdays } from "@/lib/utils/dateTimeHelpers";
import { WeekNavigator } from "../rosters/week-navigator";
import { WeeklyShiftHistory } from "./weekly-shift-history";
import { CalendarCheck, Loader2 } from "lucide-react";

export default function MyShiftHistoryPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const weekDays = generateWeekdays(weekAnchor);

  const { data: employee, isLoading: isFetchingEmployee } = useGetEmployee(employeeId ?? 0);
  const { data: assignments = [], isLoading: isFetchingAssignments } = useGetAssignmentsByEmployee(
    employeeId ?? 0
  );

  const branchNameById = Object.fromEntries(
    (employee?.branches ?? []).map((branch) => [branch.id, branch.name])
  );

  const goToPreviousWeek = () =>
    setWeekAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });

  const goToNextWeek = () =>
    setWeekAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });

  const goToThisWeek = () => setWeekAnchor(new Date());

  if (!employeeId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Chưa liên kết hồ sơ nhân viên</h3>
          <p className="text-muted-foreground">
            Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên nên chưa thể xem lịch sử ca.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = isFetchingEmployee || isFetchingAssignments;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-foreground">Lịch sử ca làm việc</h2>
        <WeekNavigator
          weekDays={weekDays}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onThisWeek={goToThisWeek}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <WeeklyShiftHistory weekDays={weekDays} assignments={assignments} branchNameById={branchNameById} />
      )}
    </div>
  );
}
