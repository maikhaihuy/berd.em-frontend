import { queryKeys } from "@/lib/queryKeys";
import { useAppQuery } from "@/lib/hooks/common/useAppQuery";
import { availabilityService } from "../services/availability.service";
import { Availability } from "../types";

export const useGetAvailabilityBySubShift = (subShiftId: number) =>
  useAppQuery<Availability[]>(
    queryKeys.availability.bySubShift(subShiftId),
    () => availabilityService.listBySubShift(subShiftId),
    { enabled: !!subShiftId }
  );

// GET /availability with no params - backend already defaults to the
// caller's own records for a plain self-view.
export const useGetMyAvailability = () =>
  useAppQuery<Availability[]>(queryKeys.availability.mine(), () =>
    availabilityService.list()
  );

// GET /availability?employeeId=... - confirmed against the live backend
// that this stays $self-scoped for an Employee caller (a non-self id is
// ignored, not leaked) and correctly filters to that employee for an
// Admin/Manager caller, so this hook covers both "view my own" and "an
// Admin/Manager viewing a specific employee's page" without a separate query.
export const useGetAvailabilityByEmployee = (employeeId: number) =>
  useAppQuery<Availability[]>(
    queryKeys.availability.byEmployee(employeeId),
    () => availabilityService.listByEmployee(employeeId),
    { enabled: !!employeeId }
  );

export const useGetAvailabilityByBranch = (branchId: number, date: string) =>
  useAppQuery<Availability[]>(
    queryKeys.availability.byBranch(branchId, date),
    () => availabilityService.listByBranch(branchId, date),
    { enabled: !!branchId }
  );
