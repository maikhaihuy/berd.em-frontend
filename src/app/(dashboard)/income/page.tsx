"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  useGetIncomeSummary,
  useGetPayrollEntriesByEmployee,
  useGetTimeLogsByEmployee,
} from "@/features/income/hooks/useIncomeQueries";
import { OverviewSummary } from "@/features/income/components/OverviewSummary";
import { ShiftEarningsList } from "@/features/income/components/ShiftEarningsList";
import { countPendingOvertime } from "@/features/income/utils/payroll";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function IncomePage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? 0;

  const { data: entries = [], isLoading: isFetchingEntries } =
    useGetPayrollEntriesByEmployee(employeeId);
  const { data: summary, isLoading: isFetchingSummary } = useGetIncomeSummary(employeeId);
  const { data: timeLogs = [], isLoading: isFetchingTimeLogs } =
    useGetTimeLogsByEmployee(employeeId);

  const isFetchingOverview = isFetchingSummary || isFetchingTimeLogs;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-foreground">Thu nhập</h2>
        <Button variant="outline" asChild>
          <Link href="/income/payroll">Xem kỳ lương trước</Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="shifts">Tiền ca</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isFetchingOverview || !summary ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <OverviewSummary
              summary={summary}
              pendingOvertimeCount={countPendingOvertime(timeLogs)}
            />
          )}
        </TabsContent>

        <TabsContent value="shifts">
          {isFetchingEntries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ShiftEarningsList entries={entries} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
