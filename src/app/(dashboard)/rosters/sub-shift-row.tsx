"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssignmentChip } from "./assignment-chip";
import { AssignmentControl } from "./assignment-control";
import { SubShiftLite } from "@/features/subShift/types";
import { useGetAssignmentsBySubShift } from "@/features/assignment/hooks/useAssignmentQueries";
import { useGetAvailabilityBySubShift } from "@/features/availability/hooks/useAvailabilityQueries";
import { useGetEmployees } from "@/features/employee/hooks";
import { getTime } from "@/lib/utils/dateTimeHelpers";
import { cn } from "@/lib/utils/cn";
import { Clock, Plus } from "lucide-react";

interface SubShiftRowProps {
  branchId: number;
  subShift: SubShiftLite;
}

export function SubShiftRow({ branchId, subShift }: SubShiftRowProps) {
  const { data: assignments = [] } = useGetAssignmentsBySubShift(subShift.id);
  const { data: availability = [] } = useGetAvailabilityBySubShift(subShift.id);
  const { data: employees = [] } = useGetEmployees();
  const [adding, setAdding] = useState(false);

  // The real API response embeds `branches` (full objects), not the
  // `branchIds` the create/edit form uses - `branchIds` is consistently
  // absent on GET /employees, so filtering by it would exclude everyone.
  const eligibleEmployees = employees.filter(
    (e) => e.branches?.some((b) => b.id === branchId) ?? (e.branchIds ?? []).includes(branchId)
  );
  const eligibleIds = new Set(eligibleEmployees.map((e) => e.id));
  const assignedIds = new Set(assignments.map((a) => a.employeeId));
  const registeredIds = new Set(
    availability.filter((a) => a.status === "REGISTERED").map((a) => a.employeeId)
  );
  // Registered employees sorted ahead of unregistered ones - purely visual,
  // doesn't affect which employees are selectable.
  const availableForNewPick = eligibleEmployees
    .filter((e) => !assignedIds.has(e.id))
    .map((e) => ({ ...e, isAvailable: registeredIds.has(e.id) }))
    .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));

  const maxAssignments = subShift.maxAssignments;
  const isUnassigned = assignments.length === 0;
  const isMulti = (maxAssignments !== undefined && maxAssignments > 1) || assignments.length > 1;
  const isOverCapacity = maxAssignments !== undefined && assignments.length > maxAssignments;
  const atCapacity = maxAssignments !== undefined && assignments.length >= maxAssignments;

  const singleAssignment = !isMulti ? assignments[0] : undefined;
  const singleModeItems = singleAssignment
    ? [
        {
          id: singleAssignment.employeeId,
          fullName: singleAssignment.employee?.fullName ?? "Unknown",
          isAvailable: registeredIds.has(singleAssignment.employeeId),
        },
        ...availableForNewPick,
      ]
    : availableForNewPick;

  return (
    <div
      className={cn(
        "px-3 py-2 border-l-2 border-l-transparent",
        isUnassigned && "bg-amber-50 dark:bg-amber-950/30 border-l-amber-500"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="font-medium">{subShift.title}</span>
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTime(new Date(subShift.startTime))} - {getTime(new Date(subShift.endTime))}
          </span>
          {maxAssignments != null && (
            <Badge variant="outline" className="text-xs">
              {assignments.length}/{maxAssignments}
            </Badge>
          )}
          {isOverCapacity && (
            <Badge variant="destructive" className="text-xs">
              Over capacity
            </Badge>
          )}
        </div>

        {!isMulti && (
          <div className="flex items-center gap-2">
            <AssignmentControl
              subShiftId={subShift.id}
              currentId={singleAssignment?.employeeId}
              items={singleModeItems}
              warning={isUnassigned}
            />
            {singleAssignment && (
              <AssignmentChip
                assignment={singleAssignment}
                subShift={subShift}
                ineligible={!eligibleIds.has(singleAssignment.employeeId)}
                showName={false}
              />
            )}
          </div>
        )}
      </div>

      {isMulti && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {assignments.map((assignment) => (
            <AssignmentChip
              key={assignment.id}
              assignment={assignment}
              subShift={subShift}
              ineligible={!eligibleIds.has(assignment.employeeId)}
            />
          ))}
          {adding ? (
            <AssignmentControl
              subShiftId={subShift.id}
              items={availableForNewPick}
              placeholder="Select employee"
              onDone={() => setAdding(false)}
            />
          ) : (
            !atCapacity &&
            availableForNewPick.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAdding(true)}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
