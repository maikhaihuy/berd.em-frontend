import { Card } from "@/components/ui/card";
import { SubShiftRow } from "./sub-shift-row";
import { MasterShift } from "@/features/masterShift/types";
import { Availability } from "@/features/availability/types";
import { SubShiftLite } from "@/features/subShift/types";
import { getTime } from "@/lib/utils/dateTimeHelpers";
import { Clock } from "lucide-react";

// MAIN slots first ordered by startTime, then SUPPORT slots ordered by
// startTime - same ordering as the roster-calendar capability.
function orderSubShifts(subShifts: SubShiftLite[]) {
  const rank = (type: string) => (type === "MAIN" ? 0 : 1);
  return [...subShifts].sort((a, b) => {
    const rankDiff = rank(a.type) - rank(b.type);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

interface MasterShiftCardProps {
  masterShift: MasterShift;
  availability: Availability[];
}

export function MasterShiftCard({ masterShift, availability }: MasterShiftCardProps) {
  const subShifts = masterShift.subShifts ?? [];

  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <div className="border-l-4 border-l-blue-500 px-4 py-3">
        <div className="font-semibold text-sm text-foreground">{masterShift.title}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" />
          {getTime(new Date(masterShift.startTime))} - {getTime(new Date(masterShift.endTime))}
        </div>
      </div>

      {subShifts.length === 0 ? (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          No sub-shifts configured for this template
        </div>
      ) : (
        <div className="divide-y divide-border">
          {orderSubShifts(subShifts).map((subShift) => (
            <SubShiftRow
              key={subShift.id}
              subShift={subShift}
              availability={availability.filter((a) => a.subShiftId === subShift.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
