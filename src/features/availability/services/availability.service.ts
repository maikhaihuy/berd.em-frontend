import { createCrudService } from "@/lib/api/createCrudService";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Availability, CreateAvailabilityDTO, UpdateAvailabilityDTO } from "../types";

const base = createCrudService<Availability, CreateAvailabilityDTO, UpdateAvailabilityDTO>(
  API_ENDPOINTS.AVAILABILITY.BASE
);

export const availabilityService = {
  ...base,
  listBySubShift: (subShiftId: number) => base.list({ subShiftId }),
  // Confirmed against the live backend: an Employee caller's rows stay
  // $self-scoped regardless of the employeeId passed (a non-self employeeId
  // is silently ignored, not leaked), while an Admin/Manager caller gets the
  // filtered employee's rows - so this is safe to use for the "view another
  // employee's registrations" case too, not just self-view.
  listByEmployee: (employeeId: number) => base.list({ employeeId }),
  listByBranch: (branchId: number, date: string) => base.list({ branchId, date }),
};
