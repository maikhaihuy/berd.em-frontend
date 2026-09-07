import { z } from "zod";
import {
  AVAILABILITY_STATUS,
  availabilitySchema,
  availabilityFormSchema,
  createAvailabilitySchema,
  updateAvailabilitySchema,
} from "../schemas";

export type Availability = z.infer<typeof availabilitySchema>;
export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
export type CreateAvailabilityDTO = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityDTO = z.infer<typeof updateAvailabilitySchema>;
export type UpdateAvailabilityInput = UpdateAvailabilityDTO & { id: number };
export type AvailabilityStatus = (typeof AVAILABILITY_STATUS)[number];
