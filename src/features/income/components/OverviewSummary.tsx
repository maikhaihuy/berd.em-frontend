import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeSummary } from "../types";
import { formatCurrencyVnd, formatDateVi } from "../utils/format";

interface OverviewSummaryProps {
  summary: IncomeSummary;
  pendingOvertimeCount: number;
}

export function OverviewSummary({ summary, pendingOvertimeCount }: OverviewSummaryProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ước tính thu nhập tháng này
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-bold text-foreground">{formatCurrencyVnd(summary.total)}</p>
          <p className="text-xs text-muted-foreground">
            Số liệu tạm tính dựa trên các ca đã được xác nhận chấm công và tính lương, có thể chưa
            gồm các ca gần đây chưa xử lý xong.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lương ca</p>
              <p className="font-medium">{formatCurrencyVnd(summary.shiftPay)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">OT được duyệt</p>
              <p className="font-medium">{formatCurrencyVnd(summary.approvedOt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Thưởng</p>
              <p className="font-medium">{formatCurrencyVnd(summary.bonus)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kỳ lương gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.previousPeriod ? (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrencyVnd(summary.previousPeriod.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateVi(summary.previousPeriod.startDate)} -{" "}
                  {formatDateVi(summary.previousPeriod.endDate)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có kỳ lương nào hoàn tất.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{pendingOvertimeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">giờ OT đang chờ quản lý xác nhận</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
