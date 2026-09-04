import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { PayrollEntry } from "../types";
import { formatCurrencyVnd, formatDateVi } from "../utils/format";

interface ShiftEarningsListProps {
  entries: PayrollEntry[];
}

export function ShiftEarningsList({ entries }: ShiftEarningsListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Chưa có dữ liệu</h3>
        <p className="text-muted-foreground">
          Tiền ca sẽ hiển thị ở đây sau khi ca làm việc được xác nhận chấm công và tính lương.
        </p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => (a.workDate < b.workDate ? 1 : -1));

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày làm việc</TableHead>
            <TableHead className="text-right">Tiền ca</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {formatDateVi(entry.workDate)}
                  {(entry.timeLog?.multiplier ?? 1) > 1 && (
                    <Badge variant="secondary">OT</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrencyVnd(entry.totalPay)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
