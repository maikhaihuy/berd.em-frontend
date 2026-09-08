"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAbility } from "@/components/require-ability";
import { DaySchedule } from "./day-schedule";
import { WeekNavigator } from "../rosters/week-navigator";
import { useGetBranches } from "@/features/branch/hooks/useBranchQueries";
import { useGetMasterShiftsByBranch } from "@/features/masterShift/hooks/useMasterShiftQueries";
import { useGetAvailabilityByBranch } from "@/features/availability/hooks/useAvailabilityQueries";
import { generateWeekdays, toDateOnlyString } from "@/lib/utils/dateTimeHelpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Loader2 } from "lucide-react";

export default function AvailabilitiesPage() {
  const searchParams = useSearchParams();
  const [selectedBranchId, setSelectedBranchId] = useState(0);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const weekDays = generateWeekdays(weekAnchor);

  const { data: branches, isLoading: isFetchingBranches } = useGetBranches();

  useEffect(() => {
    const branchIdParam = Number(searchParams.get("branchId"));
    if (branchIdParam) setSelectedBranchId(branchIdParam);
  }, [searchParams]);

  useEffect(() => {
    if (!branches || branches.length === 0) return;
    setSelectedBranchId((prev) => (prev ? prev : branches[0].id));
  }, [branches]);

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

  if (!isFetchingBranches && (!branches || branches.length === 0)) {
    return (
      <RequireAbility action="read" subject="availability">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Branches Available
          </h3>
          <p className="text-muted-foreground">
            You don&apos;t have any branches assigned to you.
          </p>
        </div>
      </RequireAbility>
    );
  }

  return (
    <RequireAbility action="read" subject="availability">
      {isFetchingBranches || !branches ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-2xl font-bold text-foreground">Ca đăng ký</h2>
            <WeekNavigator
              weekDays={weekDays}
              onPrevious={goToPreviousWeek}
              onNext={goToNextWeek}
              onThisWeek={goToThisWeek}
            />
          </div>

          <Tabs
            value={selectedBranchId.toString()}
            onValueChange={(value) => setSelectedBranchId(+value)}
            className="w-full"
          >
            <TabsList
              className="grid w-full gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(branches.length, 3)}, 1fr)`,
              }}
            >
              {branches.map((branch) => (
                <TabsTrigger
                  key={branch.id}
                  value={branch.id.toString()}
                  className="text-sm"
                >
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {branches.map((branch) => (
              <TabsContent
                key={branch.id}
                value={branch.id.toString()}
                className="space-y-6"
              >
                {selectedBranchId === branch.id && (
                  <BranchAvailabilitySchedule branchId={branch.id} weekAnchor={weekAnchor} weekDays={weekDays} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </RequireAbility>
  );
}

function BranchAvailabilitySchedule({
  branchId,
  weekAnchor,
  weekDays,
}: {
  branchId: number;
  weekAnchor: Date;
  weekDays: ReturnType<typeof generateWeekdays>;
}) {
  const from = toDateOnlyString(weekDays[0].date);
  const to = toDateOnlyString(weekDays[weekDays.length - 1].date);
  const { data: masterShifts = [] } = useGetMasterShiftsByBranch(branchId, from, to);
  const { data: availability = [] } = useGetAvailabilityByBranch(
    branchId,
    toDateOnlyString(weekAnchor)
  );

  return (
    <div className="flex flex-col gap-6">
      {weekDays.map((day) => (
        <DaySchedule
          key={day.date.toDateString()}
          day={day}
          masterShifts={masterShifts}
          availability={availability}
        />
      ))}
    </div>
  );
}
