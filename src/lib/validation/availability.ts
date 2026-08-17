import { z } from "zod";

const timeStringRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeIntervalSchema = z
  .object({
    id: z.string().optional(),
    startTime: z.string().regex(timeStringRegex, "Start time must be in HH:mm format (00:00 - 23:59)"),
    endTime: z.string().regex(timeStringRegex, "End time must be in HH:mm format (00:00 - 23:59)"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Start time must be strictly before end time",
    path: ["endTime"],
  });

export const dayAvailabilitySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    intervals: z.array(timeIntervalSchema),
  })
  .refine(
    (day) => {
      if (!day.enabled || day.intervals.length <= 1) return true;
      // Sort intervals by start time
      const sorted = [...day.intervals].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].endTime > sorted[i + 1].startTime) {
          return false; // Overlap detected!
        }
      }
      return true;
    },
    {
      message: "Time intervals cannot overlap on the same day",
      path: ["intervals"],
    },
  );

export const saveMultiIntervalAvailabilitySchema = z.object({
  practitionerId: z.string().uuid("Invalid practitioner ID").optional(),
  days: z.array(dayAvailabilitySchema).length(7, "Must provide all 7 days of the week"),
});

export const createAvailabilityExceptionSchema = z
  .object({
    practitionerId: z.string().uuid("Invalid practitioner ID").optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    isUnavailable: z.boolean().default(true),
    startTime: z.string().regex(timeStringRegex, "Invalid start time").nullable().optional(),
    endTime: z.string().regex(timeStringRegex, "Invalid end time").nullable().optional(),
    reason: z.string().trim().max(255).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.startTime < data.endTime;
      }
      return true;
    },
    {
      message: "Start time must be before end time",
      path: ["endTime"],
    },
  );

export const deleteAvailabilityExceptionSchema = z.object({
  practitionerId: z.string().uuid("Invalid practitioner ID").optional(),
  exceptionId: z.string().uuid("Invalid exception ID"),
});

export type TimeIntervalInput = z.infer<typeof timeIntervalSchema>;
export type DayAvailabilityInput = z.infer<typeof dayAvailabilitySchema>;
export type SaveMultiIntervalAvailabilityInput = z.infer<typeof saveMultiIntervalAvailabilitySchema>;
export type CreateAvailabilityExceptionInput = z.infer<typeof createAvailabilityExceptionSchema>;
export type DeleteAvailabilityExceptionInput = z.infer<typeof deleteAvailabilityExceptionSchema>;
