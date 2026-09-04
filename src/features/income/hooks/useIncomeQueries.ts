import { queryKeys } from "@/lib/queryKeys";
import { useAppQuery } from "@/lib/hooks/common/useAppQuery";
import { payrollEntryService } from "../services/payrollEntry.service";
import { timeLogService } from "../services/timeLog.service";
import { IncomeSummary, PayrollEntry, TimeLog } from "../types";

export const useGetPayrollEntriesByEmployee = (employeeId: number) =>
  useAppQuery<PayrollEntry[]>(
    queryKeys.payrollEntries.byEmployee(employeeId),
    () => payrollEntryService.listByEmployee(employeeId),
    { enabled: !!employeeId }
  );

export const useGetPayrollEntriesByPeriod = (payPeriodId: number, employeeId: number) =>
  useAppQuery<PayrollEntry[]>(
    queryKeys.payrollEntries.byPeriodAndEmployee(payPeriodId, employeeId),
    () => payrollEntryService.listByPeriodAndEmployee(payPeriodId, employeeId),
    { enabled: !!payPeriodId && !!employeeId }
  );

export const useGetIncomeSummary = (employeeId: number) =>
  useAppQuery<IncomeSummary>(
    queryKeys.payrollEntries.summary(employeeId),
    () => payrollEntryService.getSummary(employeeId),
    { enabled: !!employeeId }
  );

export const useGetTimeLogsByEmployee = (employeeId: number) =>
  useAppQuery<TimeLog[]>(
    queryKeys.timeLogs.byEmployee(employeeId),
    () => timeLogService.listByEmployee(employeeId),
    { enabled: !!employeeId }
  );
