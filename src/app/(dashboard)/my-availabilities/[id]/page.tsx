"use client";

import ScheduleTable from "./employeeScheduleView/scheduleTable";
import { useGetEmployee } from "@/features/employee/hooks/useEmployeeQueries";
import { useGetMasterShiftTemplatesByBranch } from "@/features/masterShiftTemplate/hooks/useMasterShiftTemplateQueries";
import { useGetMasterShiftsByBranch } from "@/features/masterShift/hooks/useMasterShiftQueries";
import { useGetAvailabilityByEmployee } from "@/features/availability/hooks/useAvailabilityQueries";
import { generateWeekdays, toDateOnlyString } from "@/lib/utils/dateTimeHelpers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { use, useEffect, useMemo, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";

interface MyAvailabilityPageProps {
  params: Promise<{ id: string }>;
}

export default function MyAvailabilityPage({
  params,
}: MyAvailabilityPageProps) {
  const { id } = use(params);
  const employeeId = +id;
  const weekDays = generateWeekdays(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState(0);

  const { data: employee, isLoading: isFetchingEmployee } =
    useGetEmployee(employeeId);
  const branches = useMemo(() => employee?.branches ?? [], [employee?.branches]);

  useEffect(() => {
    if (branches.length === 0) return;
    // only set default if no branch selected yet
    setSelectedBranchId((prev) => (prev ? prev : branches[0].id));
  }, [branches]);

  const { data: templates = [], isLoading: isFetchingTemplates } =
    useGetMasterShiftTemplatesByBranch(selectedBranchId);

  const from = toDateOnlyString(weekDays[0].date);
  const to = toDateOnlyString(weekDays[weekDays.length - 1].date);
  const { data: masterShifts = [], isLoading: isFetchingShifts } =
    useGetMasterShiftsByBranch(selectedBranchId, from, to);

  // Filtering by the route's employeeId works correctly for both self-view
  // (backend keeps an Employee caller $self-scoped regardless of the id
  // passed) and an Admin/Manager viewing a specific employee's page (backend
  // filters to that employee) - confirmed against the live backend.
  const { data: myAvailability = [], isLoading: isFetchingAvailability } =
    useGetAvailabilityByEmployee(employeeId);

  const isLoading =
    isFetchingEmployee ||
    isFetchingTemplates ||
    isFetchingShifts ||
    isFetchingAvailability;

  if (!isFetchingEmployee && branches.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Branches Available
        </h3>
        <p className="text-muted-foreground">
          This employee isn&apos;t assigned to any branch yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">My Availability</h2>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Register for available shifts below. You can unregister anytime
          before the shift takes place.
        </p>
      </div>

      {branches.length > 1 && (
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
              <TabsTrigger key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-1/2">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <ScheduleTable
              employeeId={employeeId}
              templates={templates}
              masterShifts={masterShifts}
              myAvailability={myAvailability}
              weekDays={weekDays}
            />
          </div>
        </div>
      )}
    </div>
  );
}
