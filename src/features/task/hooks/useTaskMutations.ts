import { useAppMutation } from "@/lib/hooks/common/useAppMutation";
import { TaskCompletion, CompleteTaskDTO } from "../types";
import { taskService } from "../services/task.service";

// A completed task's masterShiftId/subShiftId (whichever the task type sets)
// isn't enough to reconstruct the shift-scoped query key it needs to
// invalidate (a shared task's own record has no subShiftId, and vice versa
// for dedicated), so this invalidates the whole ["tasks"] prefix instead -
// same pattern as useAssignmentMutations.ts.
export const useCompleteTask = () =>
  useAppMutation<TaskCompletion, { id: number; data: CompleteTaskDTO }>(
    ({ id, data }) => taskService.complete(id, data),
    { invalidateKey: ["tasks"] }
  );
