import { z } from "zod";

function csvToArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const registrationSchema = z.object({
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().trim().optional(),
  address: z.string().trim().optional(),
  emergencyContactName: z.string().trim().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z.string().trim().min(6, "Emergency contact phone is required"),
  allergies: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  pastSurgeries: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export function parseRegistrationFormData(formData: FormData) {
  return registrationSchema.safeParse({
    phone: formData.get("phone"),
    dob: formData.get("dob"),
    gender: formData.get("gender") ?? undefined,
    address: formData.get("address") ?? undefined,
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    allergies: csvToArray(formData.get("allergies")),
    currentMedications: csvToArray(formData.get("currentMedications")),
    chronicConditions: csvToArray(formData.get("chronicConditions")),
    pastSurgeries: formData.get("pastSurgeries") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
}
