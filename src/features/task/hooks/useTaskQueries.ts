import { queryKeys } from "@/lib/queryKeys";
import { useAppQuery } from "@/lib/hooks/common/useAppQuery";
import { taskService } from "../services/task.service";
import { Task } from "../types";

export const useGetTasksByShift = (masterShiftId: number, subShiftId: number) =>
  useAppQuery<Task[]>(
    queryKeys.tasks.byShift(masterShiftId, subShiftId),
    () => taskService.listForShift(masterShiftId, subShiftId),
    { enabled: !!masterShiftId && !!subShiftId }
  );
