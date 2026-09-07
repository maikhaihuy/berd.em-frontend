import { z } from "zod";

export const AVAILABILITY_STATUS = ["REGISTERED", "ASSIGNED", "CANCELLED"] as const;

/**
 * Matches the real backend's CreateAvailabilityDto/UpdateAvailabilityDto.
 */
export const availabilityFormSchema = z.object({
  employeeId: z.number(),
  subShiftId: z.number(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(AVAILABILITY_STATUS).optional(),
  note: z.string().optional(),
});

export const createAvailabilitySchema = availabilityFormSchema;

export const updateAvailabilitySchema = availabilityFormSchema.partial();

/**
 * Full entity as returned by the backend - embeds enough of employee/subShift
 * to render an availability record without extra fetches (see
 * assignment/schemas.ts's assignmentSchema for the same pattern).
 */
export const availabilitySchema = availabilityFormSchema.extend({
  id: z.number(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  createdAt: z.string(),
  createdBy: z.number(),
  updatedAt: z.string(),
  updatedBy: z.number(),
  employee: z
    .object({ id: z.number(), fullName: z.string(), phoneNumber: z.string() })
    .optional(),
  subShift: z
    .object({
      id: z.number(),
      title: z.string(),
      type: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      masterShift: z
        .object({
          id: z.number(),
          branchId: z.number(),
          title: z.string(),
          workDate: z.string(),
        })
        .optional(),
    })
    .optional(),
});
