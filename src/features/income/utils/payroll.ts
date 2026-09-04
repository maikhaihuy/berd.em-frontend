import { PayPeriodSummary, PayrollEntry, TimeLog } from "../types";

export interface PayrollPeriodGroup {
  period: PayPeriodSummary;
  entries: PayrollEntry[];
}

// Groups an employee's own payroll entries by pay period, using the
// payPeriod relation nested on each entry rather than a separate
// GET /pay-periods call (that endpoint 403s for the Employee role).
export const groupNonOpenPeriods = (entries: PayrollEntry[]): PayrollPeriodGroup[] => {
  const groups = new Map<number, PayrollPeriodGroup>();

  for (const entry of entries) {
    if (!entry.payPeriod || entry.payPeriod.status === "OPEN") continue;
    const existing = groups.get(entry.payPeriodId);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(entry.payPeriodId, { period: entry.payPeriod, entries: [entry] });
    }
  }

  return [...groups.values()].sort((a, b) =>
    a.period.startDate < b.period.startDate ? 1 : -1
  );
};

export const sumTotalPay = (entries: PayrollEntry[]): number =>
  entries.reduce((sum, entry) => sum + entry.totalPay, 0);

export const countPendingOvertime = (timeLogs: TimeLog[]): number =>
  timeLogs.filter(
    (log) =>
      (log.status === "PENDING" || log.status === "SUBMITTED") &&
      (log.overtimeMinutes ?? 0) > 0
  ).length;
