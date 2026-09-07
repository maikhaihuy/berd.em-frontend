import { z } from "zod";
import { taskSchema, taskCompletionSchema, completeTaskSchema } from "../schemas";

export type Task = z.infer<typeof taskSchema>;
export type TaskCompletion = z.infer<typeof taskCompletionSchema>;
export type CompleteTaskDTO = z.infer<typeof completeTaskSchema>;
