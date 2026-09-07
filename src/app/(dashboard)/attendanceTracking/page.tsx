'use client';

import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useGetEmployee } from "@/features/employee/hooks/useEmployeeQueries";
import { useGetAssignmentsByEmployee } from "@/features/assignment/hooks/useAssignmentQueries";
import { taskTemplateService } from "@/features/taskTemplate/services/taskTemplate.service";
import { TaskTemplate } from "@/features/taskTemplate/types";
import { taskService } from "@/features/task/services/task.service";
import { Task } from "@/features/task/types";
import { queryKeys } from "@/lib/queryKeys";
import { toDateOnlyString } from "@/lib/utils/dateTimeHelpers";
import { TodayShiftCard } from "./today-shift-card";
import { LiveClock } from "./live-clock";
import { CalendarX2, Loader2, MapPinned } from "lucide-react";

export default function AttendanceTrackingPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;

  const { data: employee, isLoading: isFetchingEmployee } = useGetEmployee(employeeId ?? 0);
  const { data: assignments = [], isLoading: isFetchingAssignments } = useGetAssignmentsByEmployee(
    employeeId ?? 0
  );

  const today = toDateOnlyString(new Date());
  const todaysAssignments = assignments.filter((a) => {
    const workDate = a.subShift?.masterShift?.workDate;
    return workDate && toDateOnlyString(new Date(workDate)) === today;
  });

  // One task-templates query per branch with a shift today, so a split shift
  // across branches still gets each branch's own mandatory/todo list.
  const branchIds = Array.from(
    new Set(
      todaysAssignments
        .map((a) => a.subShift?.masterShift?.branchId)
        .filter((id): id is number => !!id)
    )
  );
  const taskTemplateQueries = useQueries({
    queries: branchIds.map((branchId) => ({
      queryKey: queryKeys.taskTemplates.byBranch(branchId),
      queryFn: () => taskTemplateService.listByBranch(branchId),
    })),
  });
  const taskTemplatesByBranch: Record<number, TaskTemplate[]> = {};
  branchIds.forEach((branchId, index) => {
    taskTemplatesByBranch[branchId] = taskTemplateQueries[index]?.data ?? [];
  });

  // One tasks query per assignment's (masterShiftId, subShiftId) slot - each
  // today's assignment already targets its own subShift, so no further
  // dedup is needed. taskService.listForShift issues two requests and merges
  // them (masterShiftId and subShiftId can't be queried together - see
  // task.service.ts).
  const taskQueries = useQueries({
    queries: todaysAssignments.map((assignment) => {
      const masterShiftId = assignment.subShift?.masterShift?.id;
      const subShiftId = assignment.subShift?.id;
      return {
        queryKey: queryKeys.tasks.byShift(masterShiftId ?? 0, subShiftId ?? 0),
        queryFn: () => taskService.listForShift(masterShiftId!, subShiftId!),
        enabled: !!masterShiftId && !!subShiftId,
      };
    }),
  });
  const tasksByAssignmentId: Record<number, Task[]> = {};
  todaysAssignments.forEach((assignment, index) => {
    tasksByAssignmentId[assignment.id] = taskQueries[index]?.data ?? [];
  });

  const branchNameById = Object.fromEntries(
    (employee?.branches ?? []).map((branch) => [branch.id, branch.name])
  );

  if (!employeeId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <MapPinned className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Chưa liên kết hồ sơ nhân viên</h3>
          <p className="text-muted-foreground">
            Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên nên chưa thể chấm công.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = isFetchingEmployee || isFetchingAssignments;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-foreground">Điểm danh</h2>
        <LiveClock />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : todaysAssignments.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <CalendarX2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Hôm nay bạn không có ca</h3>
          <p className="text-muted-foreground">Không có ca làm việc nào được xếp cho hôm nay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {todaysAssignments.map((assignment) => {
            const branchId = assignment.subShift?.masterShift?.branchId;
            return (
              <TodayShiftCard
                key={assignment.id}
                assignment={assignment}
                branchName={(branchId && branchNameById[branchId]) || "Chi nhánh"}
                tasks={tasksByAssignmentId[assignment.id] ?? []}
                taskTemplates={(branchId && taskTemplatesByBranch[branchId]) || []}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
