import { MasterShiftCard } from "./master-shift-card";
import { MasterShift } from "@/features/masterShift/types";
import { Availability } from "@/features/availability/types";
import { toDateOnlyString, Weekday } from "@/lib/utils/dateTimeHelpers";

interface DayScheduleProps {
  day: Weekday;
  masterShifts: MasterShift[];
  availability: Availability[];
}

export function DaySchedule({ day, masterShifts, availability }: DayScheduleProps) {
  const dayShifts = masterShifts
    .filter((ms) => toDateOnlyString(new Date(ms.workDate)) === toDateOnlyString(day.date))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-lg font-semibold text-foreground">{day.dayName}</h3>
        <span className="text-sm text-muted-foreground">
          {day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>

      {dayShifts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Không có ca nào trong ngày này
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dayShifts.map((masterShift) => (
            <MasterShiftCard
              key={masterShift.id}
              masterShift={masterShift}
              availability={availability}
            />
          ))}
        </div>
      )}
    </section>
  );
}
