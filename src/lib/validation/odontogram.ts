import { z } from "zod";

export const odontogramStatuses = [
  "healthy",
  "existing_treatment",
  "planned_treatment",
  "completed_treatment",
  "missing",
  "other",
] as const;

export type OdontogramStatus = (typeof odontogramStatuses)[number];

export const adultToothNumbers = [
  "11", "12", "13", "14", "15", "16", "17", "18",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "31", "32", "33", "34", "35", "36", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48",
] as const;

export type AdultToothNumber = (typeof adultToothNumbers)[number];

export const upsertOdontogramEntrySchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
  toothNumber: z.enum(adultToothNumbers, {
    message: "Invalid tooth number format",
  }),
  status: z.enum(odontogramStatuses, {
    message: "Invalid tooth status",
  }),
  conditionCode: z.string().trim().max(80).optional(),
  conditionNote: z.string().trim().optional(),
  recommendedTreatment: z.string().trim().max(160).optional(),
  treatmentPriority: z.enum(["routine", "priority", "urgent"], {
    message: "Invalid treatment priority",
  }).optional(),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Planned date must be YYYY-MM-DD").optional().or(z.literal("")),
  estimatedFee: z.number().min(0, "Estimated fee must not be negative").optional(),
});

export type UpsertOdontogramEntryInput = z.infer<typeof upsertOdontogramEntrySchema>;

export const saveEncounterOdontogramSchema = z.object({
  encounterId: z.string().uuid("Invalid encounter ID"),
  toothNumber: z.enum(adultToothNumbers, {
    message: "Invalid tooth number format",
  }),
  status: z.enum(odontogramStatuses, {
    message: "Invalid tooth status",
  }),
  conditionCode: z.string().trim().max(80).optional(),
  conditionNote: z.string().trim().optional(),
  recommendedTreatment: z.string().trim().max(160).optional(),
  treatmentPriority: z.enum(["routine", "priority", "urgent"], {
    message: "Invalid treatment priority",
  }).optional(),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Planned date must be YYYY-MM-DD").optional().or(z.literal("")),
  estimatedFee: z.number().min(0, "Estimated fee must not be negative").optional(),
});

export type SaveEncounterOdontogramInput = z.infer<typeof saveEncounterOdontogramSchema>;

export const char9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8 = z.object({
  success: z.literal(true),
  entry_id: z.string().uuid("Invalid entry ID returned by database"),
  patient_id: z.string().uuid("Invalid patient ID returned by database"),
  tooth_number: z.enum(adultToothNumbers, {
    message: "Invalid tooth number returned by database",
  }),
  status: z.enum(odontogramStatuses, {
    message: "Invalid status returned by database",
  }),
  encounter_id: z.string().uuid().nullable(),
  appointment_id: z.string().uuid().nullable(),
  is_current: z.literal(true),
  recorded_at: z.string().datetime({ offset: true, message: "Invalid recorded_at timestamp returned by database" }),
});

export type ChartPatientToothRpcResponse = z.infer<typeof char9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8>;



