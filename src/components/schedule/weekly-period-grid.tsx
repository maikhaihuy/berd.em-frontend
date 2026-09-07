"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Weekday, toDateOnlyString } from "@/lib/utils/dateTimeHelpers";
import { cn } from "@/lib/utils/cn";
import { PERIODS, Period } from "./periods";

export interface WeeklyPeriodGridBlock {
  key: string;
  periods: Period[];
  element: ReactNode;
}

interface WeeklyPeriodGridProps {
  weekDays: Weekday[];
  isToday?: (date: Date) => boolean;
  dayBlocks: (day: Weekday) => WeeklyPeriodGridBlock[];
}

const DAY_NAME_VI: Record<string, string> = {
  Monday: "Thứ Hai",
  Tuesday: "Thứ Ba",
  Wednesday: "Thứ Tư",
  Thursday: "Thứ Năm",
  Friday: "Thứ Sáu",
  Saturday: "Thứ Bảy",
  Sunday: "Chủ Nhật",
};

const defaultIsToday = (date: Date) => toDateOnlyString(date) === toDateOnlyString(new Date());

// 0-indexed [start, end] period-row range a block occupies (inclusive).
const periodRowRange = (periods: Period[]) => {
  const indexes = periods
    .map((p) => PERIODS.findIndex((def) => def.id === p))
    .filter((i) => i >= 0);
  return { start: Math.min(...indexes), end: Math.max(...indexes) };
};

// Assigns each block to a "lane" (like an event calendar day view) so that
// any two blocks whose period ranges overlap - whether identical spans or
// only partially overlapping ones - land in different lanes and are laid
// out side by side instead of hiding one another. Blocks are sorted by
// start row, then longest span first, then greedily placed in the first
// lane whose last-placed block ends before this one starts.
const assignLanes = (blocks: WeeklyPeriodGridBlock[]) => {
  const withRange = blocks.map((block) => ({ block, ...periodRowRange(block.periods) }));
  withRange.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const laneLastEnd: number[] = [];
  return withRange.map(({ block, start, end }) => {
    let lane = laneLastEnd.findIndex((lastEnd) => start > lastEnd);
    if (lane === -1) {
      lane = laneLastEnd.length;
      laneLastEnd.push(end);
    } else {
      laneLastEnd[lane] = end;
    }
    return { block, start, end, lane };
  });
};

export function WeeklyPeriodGrid({ weekDays, isToday = defaultIsToday, dayBlocks }: WeeklyPeriodGridProps) {
  const todayHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    todayHeaderRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div
        className="grid min-w-[880px]"
        style={{
          gridTemplateColumns: `88px repeat(${weekDays.length}, minmax(112px, 1fr))`,
          gridTemplateRows: `56px repeat(${PERIODS.length}, minmax(96px, auto))`,
        }}
      >
        {/* corner cell */}
        <div
          className="sticky left-0 z-20 border-b border-r border-border bg-card"
          style={{ gridColumn: 1, gridRow: 1 }}
        />

        {/* day headers */}
        {weekDays.map((day, dayIndex) => {
          const today = isToday(day.date);
          return (
            <div
              key={`header-${toDateOnlyString(day.date)}`}
              ref={today ? todayHeaderRef : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 border-b border-border p-2",
                today && "bg-primary/10"
              )}
              style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
            >
              <p className={cn("text-sm font-medium", today ? "text-primary" : "text-foreground")}>
                {DAY_NAME_VI[day.dayName] ?? day.dayName}
                {today && " · Hôm nay"}
              </p>
              <p className="text-xs text-muted-foreground">{day.date.toLocaleDateString()}</p>
            </div>
          );
        })}

        {/* period labels */}
        {PERIODS.map((period, periodIndex) => (
          <div
            key={`label-${period.id}`}
            className="sticky left-0 z-10 flex items-center justify-center border-b border-r border-border bg-card p-2 text-xs font-medium text-muted-foreground last:border-b-0"
            style={{ gridColumn: 1, gridRow: periodIndex + 2 }}
          >
            {period.label}
          </div>
        ))}

        {/* background cells (grid lines) per day x period */}
        {weekDays.map((day, dayIndex) =>
          PERIODS.map((period, periodIndex) => (
            <div
              key={`bg-${toDateOnlyString(day.date)}-${period.id}`}
              className={cn(
                "border-b border-r border-border last:border-r-0",
                isToday(day.date) && "bg-primary/5"
              )}
              style={{ gridColumn: dayIndex + 2, gridRow: periodIndex + 2 }}
            />
          ))
        )}

        {/* shift blocks - one nested per-day grid spanning all period rows,
            with lanes as columns so overlapping blocks sit side by side */}
        {weekDays.map((day, dayIndex) => {
          const placed = assignLanes(dayBlocks(day));
          const laneCount = Math.max(1, ...placed.map((p) => p.lane + 1));

          return (
            <div
              key={`blocks-${toDateOnlyString(day.date)}`}
              className="grid gap-1 p-1"
              style={{
                gridColumn: dayIndex + 2,
                gridRow: `2 / span ${PERIODS.length}`,
                gridTemplateRows: `repeat(${PERIODS.length}, 1fr)`,
                gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))`,
              }}
            >
              {placed.map(({ block, start, end, lane }) => (
                <div
                  key={block.key}
                  style={{
                    gridColumn: lane + 1,
                    gridRowStart: start + 1,
                    gridRowEnd: end + 2,
                  }}
                >
                  {block.element}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
