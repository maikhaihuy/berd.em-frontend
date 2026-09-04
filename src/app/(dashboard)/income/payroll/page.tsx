"use client";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useGetPayrollEntriesByEmployee } from "@/features/income/hooks/useIncomeQueries";
import { PayrollPeriodList } from "@/features/income/components/PayrollPeriodList";
import { groupNonOpenPeriods } from "@/features/income/utils/payroll";
import { Loader2 } from "lucide-react";

export default function PreviousPayrollPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? 0;

  const { data: entries = [], isLoading } = useGetPayrollEntriesByEmployee(employeeId);
  const groups = groupNonOpenPeriods(entries);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h2 className="text-2xl font-bold text-foreground">Kỳ lương trước</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PayrollPeriodList groups={groups} />
      )}
    </div>
  );
}
