import { z } from "zod";

export const prescriptionItemSchema = z.object({
  medicineName: z.string().trim().min(1, "Medicine name is required"),
  dosage: z.string().trim().optional(),
  frequency: z.string().trim().optional(),
  duration: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
});
export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid("Select a patient"),
  notes: z.string().trim().optional(),
  items: z.array(prescriptionItemSchema).min(1, "Add at least one medicine"),
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const saveEncounterPrescriptionSchema = z.object({
  encounterId: z.string().uuid("Invalid encounter ID"),
  notes: z.string().trim().optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1, "Add at least one medicine"),
});
export type SaveEncounterPrescriptionInput = z.infer<typeof saveEncounterPrescriptionSchema>;

export const createClinicalPr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8 = z.object({
  success: z.literal(true),
  prescription_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().nullable(),
  appointment_id: z.string().uuid().nullable(),
  items_count: z.number().int().min(1),
  issued_at: z.string().datetime({
    offset: true,
    message: "Invalid issued_at timestamp returned by database",
  }),
});
export type CreateClinicalPrescriptionRpcResponse = z.infer<
  typeof createClinicalPr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8
>;
