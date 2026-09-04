import axios from "@/lib/api/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { TimeLog } from "../types";

export const timeLogService = {
  listByEmployee: async (employeeId: number): Promise<TimeLog[]> => {
    const res = await axios.get<TimeLog[]>(API_ENDPOINTS.TIME_TRACKING.BY_EMPLOYEE(employeeId));
    return res.data;
  },
};
