import axios from "@/lib/api/axios";
import { createCrudService } from "@/lib/api/createCrudService";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Task, CompleteTaskDTO, TaskCompletion } from "../types";

const base = createCrudService<Task>(API_ENDPOINTS.TASKS.BASE);

export const taskService = {
  ...base,

  // GET /tasks filters are AND, and a shared task never has subShiftId set
  // while a dedicated task never has masterShiftId set - passing both params
  // in one call would match neither and return []. So a shift's full task
  // list needs two calls, merged (mirrors the backend's own OR-based
  // getCheckoutTaskGate query) - see wire-task-completion-and-checkout-gate's
  // design.md Decision 3.
  listForShift: async (masterShiftId: number, subShiftId: number): Promise<Task[]> => {
    const [shared, dedicated] = await Promise.all([
      base.list({ masterShiftId }),
      base.list({ subShiftId }),
    ]);
    return [...shared, ...dedicated];
  },

  complete: async (id: number, data: CompleteTaskDTO): Promise<TaskCompletion> => {
    const res = await axios.post<TaskCompletion>(API_ENDPOINTS.TASKS.COMPLETE(id), data);
    return res.data;
  },
};
