"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";

export async function bookOwnAppointmentAction(input: {
  practitionerId: string;
  serviceId: string;
  branchId: string;
  startsAt: string;
}): Promise<{ error: string | null }> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in to book." };

  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!patient) return { error: "Please complete your registration before booking." };

  const { error } = await supabase.rpc("book_appointment", {
    p_practitioner_id: input.practitionerId,
    p_service_id: input.serviceId,
    p_branch_id: input.branchId,
    p_patient_id: patient.id,
    p_starts_at: input.startsAt,
    p_booking_source: "online",
    p_originating_encounter_id: undefined,
  });

  if (error) return { error: error.message };

  redirect("/portal/appointments?success=booked");
}

export async function cancelOwnAppointmentAction(
  appointmentId: string,
  reason?: string,
): Promise<{ error: string | null }> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });

  if (error) return { error: error.message };
  revalidatePath("/portal/appointments");
  revalidatePath("/portal/dashboard");
  return { error: null };
}

export async function rescheduleOwnAppointmentAction(
  appointmentId: string,
  startsAt: string,
): Promise<{ error: string | null }> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: appointmentId,
    p_new_starts_at: startsAt,
  });

  if (error) return { error: error.message };
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/appointments");
  redirect("/portal/appointments?success=rescheduled");
}
