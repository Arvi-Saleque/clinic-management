"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PatientProfileActionState = { error: string | null; message?: string };

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(40),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  emergencyContactName: z.string().trim().min(1, "Emergency contact name is required").max(120),
  emergencyContactPhone: z.string().trim().min(6, "Enter a valid emergency phone").max(40),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  currentMedications: z.string().optional(),
  pastSurgeries: z.string().trim().max(1000).optional(),
  medicalNotes: z.string().trim().max(2000).optional(),
});

function parseTags(value: unknown): string[] {
  if (!value || typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Not a JSON array, fallback to comma splitting
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateOwnPatientProfileAction(
  _previous: PatientProfileActionState,
  formData: FormData,
): Promise<PatientProfileActionState> {
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    dob: formData.get("dob"),
    gender: formData.get("gender") ?? undefined,
    address: formData.get("address") ?? undefined,
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    allergies: formData.get("allergies")?.toString() ?? "",
    chronicConditions: formData.get("chronicConditions")?.toString() ?? "",
    currentMedications: formData.get("currentMedications")?.toString() ?? "",
    pastSurgeries: formData.get("pastSurgeries")?.toString() ?? undefined,
    medicalNotes: formData.get("medicalNotes")?.toString() ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please review your details." };
  }

  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const input = parsed.data;
  const supabase = await createClient();

  // 1. Fetch patient record
  const { data: patient, error: patientFetchError } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (patientFetchError || !patient) {
    return { error: "Could not find your patient record." };
  }

  // 2. Update patient personal & emergency details
  const { error: patientUpdateError } = await supabase
    .from("patients")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      dob: input.dob,
      gender: input.gender || null,
      address: input.address || null,
      emergency_contact_name: input.emergencyContactName,
      emergency_contact_phone: input.emergencyContactPhone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patient.id);

  if (patientUpdateError) {
    return { error: "Could not update your personal details. Please try again." };
  }

  // 3. Update auth profile name and phone
  await supabase
    .from("profiles")
    .update({ full_name: `${input.firstName} ${input.lastName}`.trim(), phone: input.phone })
    .eq("id", user.id);

  // 4. Update / Version medical history
  const parsedAllergies = parseTags(input.allergies);
  const parsedConditions = parseTags(input.chronicConditions);
  const parsedMedications = parseTags(input.currentMedications);

  const { data: existingHistories } = await supabase
    .from("medical_history")
    .select("id, version")
    .eq("patient_id", patient.id)
    .order("version", { ascending: false });

  const nextVersion = (existingHistories?.[0]?.version ?? 0) + 1;

  // Deactivate prior current versions
  if (existingHistories && existingHistories.length > 0) {
    await supabase
      .from("medical_history")
      .update({ is_current: false })
      .eq("patient_id", patient.id)
      .eq("is_current", true);
  }

  // Insert the fresh authoritative version
  const { error: historyError } = await supabase.from("medical_history").insert({
    patient_id: patient.id,
    version: nextVersion,
    source: "digital_intake",
    allergies: parsedAllergies,
    current_medications: parsedMedications,
    chronic_conditions: parsedConditions,
    past_surgeries: input.pastSurgeries || null,
    notes: input.medicalNotes || null,
    is_current: true,
  });

  if (historyError) {
    console.error("Failed to insert updated medical history:", historyError);
    return { error: "Personal details updated, but could not update health record. Please try again." };
  }

  revalidatePath("/portal/profile");
  revalidatePath("/portal/dashboard");
  return { error: null, message: "Your health profile and personal details have been saved." };
}
