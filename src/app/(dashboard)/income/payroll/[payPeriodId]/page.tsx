"use client";

import { use } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useGetPayrollEntriesByPeriod } from "@/features/income/hooks/useIncomeQueries";
import { PayrollPeriodDetail } from "@/features/income/components/PayrollPeriodDetail";
import { Loader2 } from "lucide-react";

interface PayrollPeriodDetailPageProps {
  params: Promise<{ payPeriodId: string }>;
}

export default function PayrollPeriodDetailPage({ params }: PayrollPeriodDetailPageProps) {
  const { payPeriodId } = use(params);
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? 0;

  const { data: entries = [], isLoading } = useGetPayrollEntriesByPeriod(
    +payPeriodId,
    employeeId
  );
  const period = entries[0]?.payPeriod;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <h2 className="text-2xl font-bold text-foreground">Chi tiết kỳ lương</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PayrollPeriodDetail period={period} entries={entries} />
      )}
    </div>
  );
}
