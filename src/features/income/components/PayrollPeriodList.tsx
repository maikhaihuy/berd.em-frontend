import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarRange } from "lucide-react";
import { PayrollPeriodGroup, sumTotalPay } from "../utils/payroll";
import { formatCurrencyVnd, formatDateVi } from "../utils/format";

interface PayrollPeriodListProps {
  groups: PayrollPeriodGroup[];
}

export function PayrollPeriodList({ groups }: PayrollPeriodListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <CalendarRange className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Chưa có kỳ lương nào</h3>
        <p className="text-muted-foreground">
          Lịch sử các kỳ lương đã đóng sẽ hiển thị ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kỳ lương</TableHead>
            <TableHead className="text-right">Tổng tiền</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map(({ period, entries }) => (
            <TableRow key={period.id}>
              <TableCell>
                <Link href={`/income/payroll/${period.id}`} className="hover:underline">
                  {formatDateVi(period.startDate)} - {formatDateVi(period.endDate)}
                </Link>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrencyVnd(sumTotalPay(entries))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
