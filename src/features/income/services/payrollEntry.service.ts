import axios from "@/lib/api/axios";
import { createCrudService } from "@/lib/api/createCrudService";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { IncomeSummary, PayrollEntry } from "../types";

const base = createCrudService<PayrollEntry>(API_ENDPOINTS.PAYROLL_ENTRIES.BASE);

export const payrollEntryService = {
  ...base,
  listByEmployee: (employeeId: number) => base.list({ employeeId }),
  listByPeriodAndEmployee: (payPeriodId: number, employeeId: number) =>
    base.list({ payPeriodId, employeeId }),

  // from/to omitted - the backend defaults to the current calendar month.
  getSummary: async (employeeId: number): Promise<IncomeSummary> => {
    const res = await axios.get<IncomeSummary>(API_ENDPOINTS.PAYROLL_ENTRIES.SUMMARY, {
      params: { employeeId },
    });
    return res.data;
  },
};
