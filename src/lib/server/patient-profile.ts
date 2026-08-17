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
});

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
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please review your details." };
  }

  const user = await getUser();
  if (!user) return { error: "You must be signed in." };
  const input = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
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
    .eq("profile_id", user.id);

  if (error) return { error: "Could not update your profile. Please try again." };

  await supabase
    .from("profiles")
    .update({ full_name: `${input.firstName} ${input.lastName}`.trim(), phone: input.phone })
    .eq("id", user.id);

  revalidatePath("/portal/profile");
  revalidatePath("/portal/dashboard");
  return { error: null, message: "Your profile has been updated." };
}
