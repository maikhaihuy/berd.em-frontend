"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Availability } from "@/features/availability/types";
import { SubShiftLite } from "@/features/subShift/types";
import { useCreateAssignment } from "@/features/assignment/hooks/useAssignmentMutations";
import { queryKeys } from "@/lib/queryKeys";
import { getTime } from "@/lib/utils/dateTimeHelpers";
import { Clock } from "lucide-react";

interface SubShiftRowProps {
  subShift: SubShiftLite;
  availability: Availability[];
}

export function SubShiftRow({ subShift, availability }: SubShiftRowProps) {
  const queryClient = useQueryClient();
  const { mutate: createAssignment, isPending } = useCreateAssignment();

  const registrations = availability.filter((a) => a.status === "REGISTERED");
  const maxAssignments = subShift.maxAssignments;

  const handleAssign = (registration: Availability) => {
    createAssignment(
      {
        employeeId: registration.employeeId,
        subShiftId: subShift.id,
        availabilityId: registration.id,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.availability.all() });
        },
      }
    );
  };

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="font-medium">{subShift.title}</span>
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {getTime(new Date(subShift.startTime))} - {getTime(new Date(subShift.endTime))}
        </span>
        {maxAssignments != null && (
          <Badge variant="outline" className="text-xs">
            {maxAssignments} chỗ
          </Badge>
        )}
      </div>

      {registrations.length === 0 ? (
        <div className="text-xs text-muted-foreground mt-2">Chưa có ai đăng ký</div>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          {registrations.map((registration) => (
            <div
              key={registration.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>{registration.employee?.fullName ?? "Unknown"}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleAssign(registration)}
              >
                Xếp ca
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
