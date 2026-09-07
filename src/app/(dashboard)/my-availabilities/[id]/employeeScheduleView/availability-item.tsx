"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Availability } from "@/features/availability/types";
import { SubShiftLite } from "@/features/subShift/types";
import {
  useCreateAvailability,
  useDeleteAvailability,
} from "@/features/availability/hooks/useAvailabilityMutations";
import { getTime } from "@/lib/utils/dateTimeHelpers";
import { ClockCheck, ClockPlus } from "lucide-react";

const getStatusColor = (status?: string) => {
  switch (status) {
    case "REGISTERED":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "ASSIGNED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case "ASSIGNED":
      return <ClockCheck className="h-3 w-3" />;
    default:
      return <ClockPlus className="h-3 w-3" />;
  }
};

const getStatusLabel = (status?: Availability["status"]) => {
  switch (status) {
    case "REGISTERED":
      return "Đã đăng ký, chờ xếp ca";
    case "ASSIGNED":
      return "Đã được xếp ca";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return "Đã đăng ký, chờ xếp ca";
  }
};

export default function AvailabilityItem({
  employeeId,
  subShift,
  availability,
}: {
  employeeId: number;
  subShift: SubShiftLite;
  availability?: Availability;
}) {
  const { mutate: createAvailability, isPending: isRegistering } =
    useCreateAvailability();
  const { mutate: deleteAvailability, isPending: isUnregistering } =
    useDeleteAvailability();

  // ASSIGNED means a Manager has already built a real shift around this
  // registration - unregistering past that point is a change-request
  // workflow, out of scope here, so only a REGISTERED row can be undone.
  const canUnregister = availability?.status === "REGISTERED";

  const handleRegister = () => {
    createAvailability({ employeeId, subShiftId: subShift.id });
  };

  const handleUnregister = () => {
    if (!availability) return;
    deleteAvailability(availability.id);
  };

  return (
    <div className="space-y-2 flex flex-col justify-center">
      <Badge
        className={`w-full flex-row justify-center gap-1 p-2 ${getStatusColor(
          availability?.status
        )}`}
      >
        {getStatusIcon(availability?.status)}
        <span>
          {getTime(new Date(subShift.startTime))} -{" "}
          {getTime(new Date(subShift.endTime))}
        </span>
      </Badge>
      <div className="w-full flex flex-row justify-center gap-2">
        {!availability ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegister}
            disabled={isRegistering}
            className="w-full"
          >
            Register
          </Button>
        ) : canUnregister ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnregister}
            disabled={isUnregistering}
            className="w-full"
          >
            Unregister
          </Button>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-1 px-2">
            {getStatusLabel(availability.status)}
          </div>
        )}
      </div>
    </div>
  );
}
