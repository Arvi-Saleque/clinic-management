import { z } from "zod";

export const updateDoctorServiceSchema = z
  .object({
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
  })
  .refine(
    (data) => {
      if (data.isOffered) {
        return (
          data.overrideDurationMinutes != null &&
          data.overrideDurationMinutes > 0 &&
          data.overridePrice != null &&
          data.overridePrice >= 0
        );
      }
      return true;
    },
    {
      message: "Please provide both duration (minutes) and fee when offering this service",
      path: ["overrideDurationMinutes"],
    },
  );

export const bulkUpdateDoctorServicesSchema = z.object({
  practitionerId: z.string().uuid().optional(),
  services: z.array(updateDoctorServiceSchema),
});

export const createDoctorServiceSchema = z.object({
  practitionerId: z.string().uuid().optional(),
  name: z.string().min(2, "Service name must be at least 2 characters").max(100, "Service name is too long"),
  iconKey: z.string().max(50).optional().nullable().default("tooth"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  durationMinutes: z
    .number()
    .int("Duration must be an integer")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration cannot exceed 480 minutes"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(1000000, "Price exceeds maximum allowable limit"),
});

export const serviceFormSchema = z.object({
  serviceId: z.string().uuid().optional(),
  name: z.string().min(2, "Service name must be at least 2 characters").max(100, "Service name is too long"),
  iconKey: z.string().max(50).optional().nullable().default("tooth"),
  description: z.string().max(500, "Short description is too long").optional().nullable(),
  durationMinutes: z
    .number()
    .int("Duration must be an integer")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration cannot exceed 480 minutes"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(1000000, "Price exceeds maximum allowable limit"),
  showOnWebsite: z.boolean().default(true),
  practitionerId: z.string().uuid().optional(),
});

export type UpdateDoctorServiceInput = z.infer<typeof updateDoctorServiceSchema>;
export type BulkUpdateDoctorServicesInput = z.infer<typeof bulkUpdateDoctorServicesSchema>;
export type CreateDoctorServiceInput = z.infer<typeof createDoctorServiceSchema>;
export type ServiceFormInput = z.infer<typeof serviceFormSchema>;

