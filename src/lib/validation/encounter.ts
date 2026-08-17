import { z } from "zod";

export const encounterStatusEnum = z.enum(["in_progress", "completed", "cancelled"]);

export const createEncounterSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  chiefComplaint: z.string().trim().max(500).optional(),
});

export const updateEncounterSchema = z
  .object({
    encounterId: z.string().uuid(),
    chiefComplaint: z.string().trim().max(1000).optional(),
    diagnosis: z.string().trim().max(1000).optional(),
    performedTreatment: z.string().trim().max(1000).optional(),
    patientNotes: z.string().trim().optional(),
    followUpRecommended: z.boolean().default(false),
    followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
    followUpReason: z.string().trim().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.followUpRecommended) {
        return !!data.followUpDate && /^\d{4}-\d{2}-\d{2}$/.test(data.followUpDate);
      }
      return true;
    },
    {
      message: "Follow-up date is required when follow-up is recommended",
      path: ["followUpDate"],
    }
  );

export const upsertPrivateNotesSchema = z.object({
  encounterId: z.string().uuid(),
  clinicalNotes: z.string().trim().min(1, "Clinical notes cannot be empty"),
});

export const completeEncounterSchema = z
  .object({
    encounterId: z.string().uuid("Invalid encounter ID format"),
    chiefComplaint: z.string().trim().max(1000, "Chief complaint is too long").nullable(),
    diagnosis: z
      .string()
      .trim()
      .min(1, "Diagnosis is required to complete consultation")
      .max(1000, "Diagnosis is too long"),
    performedTreatment: z
      .string()
      .trim()
      .min(1, "Performed treatment is required to complete consultation")
      .max(1000, "Performed treatment is too long"),
    patientNotes: z.string().trim().nullable(),
    privateNotes: z.string().trim().nullable(),
    followUpRecommended: z.boolean(),
    followUpDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be in YYYY-MM-DD format")
      .nullable(),
    followUpReason: z.string().trim().max(500, "Follow-up reason is too long").nullable(),
  })
  .refine(
    (data) => {
      if (data.followUpRecommended) {
        return !!data.followUpDate && /^\d{4}-\d{2}-\d{2}$/.test(data.followUpDate);
      }
      return true;
    },
    {
      message: "Follow-up date is required when follow-up is recommended",
      path: ["followUpDate"],
    },
  );

export const startOrResumeEncounterSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID format"),
});

export const startOrResumeRpcResponseSchema = z
  .object({
    success: z.literal(true),
    encounter_id: z.string().uuid("Invalid encounter ID returned by database"),
    encounter_status: z.enum(["in_progress", "completed"]),
    appointment_id: z.string().uuid("Invalid appointment ID returned by database"),
    appointment_status: z.enum(["checked_in", "completed"]),
    mode: z.enum(["started", "resumed", "readonly"]),
  })
  .refine(
    (data) => {
      if (data.mode === "started" || data.mode === "resumed") {
        return data.encounter_status === "in_progress" && data.appointment_status === "checked_in";
      }
      if (data.mode === "readonly") {
        return data.encounter_status === "completed" && data.appointment_status === "completed";
      }
      return false;
    },
    {
      message: "Incoherent encounter status and mode returned by database",
    },
  );

export const saveEncounterDraftSchema = z
  .object({
    encounterId: z.string().uuid("Invalid encounter ID format"),
    chiefComplaint: z.string().trim().max(1000, "Chief complaint is too long").nullable(),
    diagnosis: z.string().trim().max(1000, "Diagnosis is too long").nullable(),
    performedTreatment: z.string().trim().max(1000, "Performed treatment is too long").nullable(),
    patientNotes: z.string().trim().nullable(),
    privateNotes: z.string().trim().nullable(),
    followUpRecommended: z.boolean(),
    followUpDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be in YYYY-MM-DD format")
      .nullable(),
    followUpReason: z.string().trim().max(500, "Follow-up reason is too long").nullable(),
  })
  .refine(
    (data) => {
      if (data.followUpRecommended) {
        return !!data.followUpDate && /^\d{4}-\d{2}-\d{2}$/.test(data.followUpDate);
      }
      return true;
    },
    {
      message: "Follow-up date is required when follow-up is recommended",
      path: ["followUpDate"],
    },
  );

export const saveEncounterDraftRpcResponseSchema = z.object({
  success: z.literal(true),
  encounter_id: z.string().uuid("Invalid encounter ID returned by database"),
  status: z.literal("in_progress"),
  updated_at: z
    .string()
    .datetime({ offset: true, message: "Invalid updated_at timestamp returned by database" }),
});

export const completeEncounterRpcResponseSchema = z.object({
  success: z.literal(true),
  encounter_id: z.string().uuid("Invalid encounter ID returned by database"),
  appointment_id: z.string().uuid("Invalid appointment ID returned by database").nullable(),
  status: z.literal("completed"),
  completed_at: z
    .string()
    .datetime({ offset: true, message: "Invalid completed_at timestamp returned by database" }),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type UpdateEncounterInput = z.infer<typeof updateEncounterSchema>;
export type UpsertPrivateNotesInput = z.infer<typeof upsertPrivateNotesSchema>;
export type CompleteEncounterInput = z.infer<typeof completeEncounterSchema>;
export type CompleteEncounterRpcResponse = z.infer<typeof completeEncounterRpcResponseSchema>;
export type StartOrResumeEncounterInput = z.infer<typeof startOrResumeEncounterSchema>;
export type StartOrResumeRpcResponse = z.infer<typeof startOrResumeRpcResponseSchema>;
export type SaveEncounterDraftInput = z.infer<typeof saveEncounterDraftSchema>;
export type SaveEncounterDraftRpcResponse = z.infer<typeof saveEncounterDraftRpcResponseSchema>;



