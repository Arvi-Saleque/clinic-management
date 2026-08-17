import { z } from "zod";

export const updateDoctorServiceSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID"),
  isOffered: z.boolean(),
  overrideDurationMinutes: z
    .number()
    .int("Duration must be an integer")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration cannot exceed 480 minutes (8 hours)")
    .nullable()
    .optional(),
  overridePrice: z
    .number()
    .min(0, "Price cannot be negative")
    .max(1000000, "Price exceeds maximum allowable limit")
    .nullable()
    .optional(),
});

export const bulkUpdateDoctorServicesSchema = z.object({
  practitionerId: z.string().uuid().optional(),
  services: z.array(updateDoctorServiceSchema),
});

export type UpdateDoctorServiceInput = z.infer<typeof updateDoctorServiceSchema>;
export type BulkUpdateDoctorServicesInput = z.infer<typeof bulkUpdateDoctorServicesSchema>;
