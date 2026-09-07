import { z } from "zod";

export const TASK_TYPE = ["SHARED_MANDATORY", "SHARED_OPTIONAL", "DEDICATED"] as const;
export const TASK_STATUS = ["PENDING", "COMPLETED"] as const;

/**
 * Matches the real backend's TaskCompletionResponseDto as embedded on Task.completion
 * (see berd.em-backend's task.mapper.ts / task-response.dto.ts).
 */
export const taskCompletionSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  completedByEmployeeId: z.number(),
  completedAt: z.string(),
  evidence: z.unknown().nullable().optional(),
  note: z.string().nullable().optional(),
});

/**
 * Matches the real backend's TaskResponseDto. `masterShiftId`/`subShiftId` are
 * mutually exclusive (shared tasks set the former, dedicated tasks set the
 * latter) - see task.service.ts.
 */
export const taskSchema = z.object({
  id: z.number(),
  taskTemplateId: z.number().nullable().optional(),
  masterShiftId: z.number().nullable().optional(),
  subShiftId: z.number().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  type: z.enum(TASK_TYPE),
  status: z.enum(TASK_STATUS),
  sortOrder: z.number(),
  dueAt: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  completion: taskCompletionSchema.nullable().optional(),
  createdAt: z.string(),
  createdBy: z.number(),
  updatedAt: z.string(),
  updatedBy: z.number(),
});

/**
 * Matches CompleteTaskDto minus completedByEmployeeId (the backend infers it
 * from the caller's JWT when omitted) and minus evidence (no photo-upload
 * mechanism exists yet - see design.md Non-Goals).
 */
export const completeTaskSchema = z.object({
  note: z.string().optional(),
});
