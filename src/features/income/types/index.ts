export type PayPeriodStatus = "OPEN" | "CLOSED" | "FINALIZED";

// Only the fields the backend nests on PayrollEntry.payPeriod (payrollEntryInclude) -
// not a full PayPeriod resource, which Employee callers can't fetch directly
// (GET /pay-periods 403s for the Employee role).
export interface PayPeriodSummary {
  id: number;
  status: PayPeriodStatus;
  startDate: string;
  endDate: string;
}

export interface PayrollEntry {
  id: number;
  timeLogId: number;
  employeeId: number;
  payPeriodId: number;
  payDate: string;
  workDate: string;
  totalPay: number;
  timeLog?: {
    multiplier: number;
  };
  payPeriod?: PayPeriodSummary;
}

export interface IncomeSummary {
  employeeId: number;
  from: string;
  to: string;
  shiftPay: number;
  approvedOt: number;
  bonus: number;
  total: number;
  previousPeriod: {
    payPeriodId: number;
    startDate: string;
    endDate: string;
    status: PayPeriodStatus;
    totalPaid: number;
  } | null;
}

export type TimeLogStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";

export interface TimeLog {
  id: number;
  employeeId: number;
  status: TimeLogStatus;
  overtimeMinutes: number | null;
}
