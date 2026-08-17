"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";
import { parseRegistrationFormData } from "@/lib/validation/registration";
import type { AuthActionState } from "@/lib/server/auth";

/** Splits a "First Last" full name into first/last for the patients row. */
function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? fullName;
  const last = parts.slice(1).join(" ") || "-";
  return { first, last };
}

export async function registerPatientAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseRegistrationFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors" };
  }
  const input = parsed.data;

  const user = await getUser();
  if (!user) return { error: "You must be signed in to register." };

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.organization_id) {
    return { error: "Could not load your account. Please try again." };
  }

  const { first, last } = splitName(profile.full_name);

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      organization_id: profile.organization_id,
      profile_id: user.id,
      first_name: first,
      last_name: last,
      dob: input.dob,
      gender: input.gender || null,
      phone: input.phone,
      email: user.email,
      address: input.address || null,
      emergency_contact_name: input.emergencyContactName,
      emergency_contact_phone: input.emergencyContactPhone,
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    return {
      error:
        patientError?.code === "23505"
          ? "You've already completed registration."
          : "Could not save your details. Please try again.",
    };
  }

  const { error: historyError } = await supabase.from("medical_history").insert({
    patient_id: patient.id,
    version: 1,
    source: "digital_intake",
    allergies: input.allergies,
    current_medications: input.currentMedications,
    chronic_conditions: input.chronicConditions,
    past_surgeries: input.pastSurgeries || null,
    notes: input.notes || null,
    is_current: true,
  });
  if (historyError) return { error: "Could not save your medical history. Please try again." };

  const { error: submissionError } = await supabase.from("registration_submissions").insert({
    patient_id: patient.id,
    form_version: 1,
    raw_payload: input,
    status: "pending_review",
  });
  if (submissionError) return { error: "Could not submit your registration. Please try again." };

  redirect("/portal/dashboard");
}
