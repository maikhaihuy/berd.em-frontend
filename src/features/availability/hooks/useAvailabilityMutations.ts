import { useAppMutation } from "@/lib/hooks/common/useAppMutation";
import { queryKeys } from "@/lib/queryKeys";
import { Availability, CreateAvailabilityDTO } from "../types";
import { availabilityService } from "../services/availability.service";

export const useCreateAvailability = () =>
  useAppMutation<Availability, CreateAvailabilityDTO>(
    (data) => availabilityService.create(data),
    {
      invalidateKey: queryKeys.availability.all(),
      successMessage: "Availability registered",
    }
  );

export const useDeleteAvailability = () =>
  useAppMutation<void, number>((id) => availabilityService.remove(id), {
    invalidateKey: queryKeys.availability.all(),
    successMessage: "Availability removed",
  });
