import { PayPeriodSummary, PayrollEntry } from "../types";
import { ShiftEarningsList } from "./ShiftEarningsList";
import { formatCurrencyVnd, formatDateVi } from "../utils/format";
import { sumTotalPay } from "../utils/payroll";

interface PayrollPeriodDetailProps {
  period: PayPeriodSummary | undefined;
  entries: PayrollEntry[];
}

export function PayrollPeriodDetail({ period, entries }: PayrollPeriodDetailProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/50 p-4 flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">
          {period ? `${formatDateVi(period.startDate)} - ${formatDateVi(period.endDate)}` : "—"}
        </span>
        <span className="font-semibold">{formatCurrencyVnd(sumTotalPay(entries))}</span>
      </div>
      <ShiftEarningsList entries={entries} />
    </div>
  );
}
