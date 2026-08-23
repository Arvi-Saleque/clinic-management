"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/session";

export interface OwnBookingInput {
  practitionerId: string;
  serviceId: string;
  branchId: string;
  startsAt: string;
}

export interface OwnBookingResult {
  error: string | null;
  appointmentId?: string;
  code?: "unauthenticated" | "registration_required" | "slot_unavailable" | "booking_failed";
}

async function createOwnAppointment(input: OwnBookingInput): Promise<OwnBookingResult> {
  const user = await getUser();
  if (!user) return { error: "You must be signed in to book.", code: "unauthenticated" };

  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!patient) {
    return {
      error: "Please complete your registration before booking.",
      code: "registration_required",
    };
  }

  const { data: appointmentId, error } = await supabase.rpc("book_appointment", {
    p_practitioner_id: input.practitionerId,
    p_service_id: input.serviceId,
    p_branch_id: input.branchId,
    p_patient_id: patient.id,
    p_starts_at: input.startsAt,
    p_booking_source: "online",
    p_originating_encounter_id: undefined,
  });

  if (error) {
    const slotUnavailable = /no longer available|pick another slot|overlap/i.test(error.message);
    return {
      error: slotUnavailable
        ? "That time is no longer available. Please choose another appointment time."
        : error.message,
      code: slotUnavailable ? "slot_unavailable" : "booking_failed",
    };
  }

  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/appointments");
  return { error: null, appointmentId: appointmentId ?? undefined };
}

export async function bookOwnAppointmentInlineAction(
  input: OwnBookingInput,
): Promise<OwnBookingResult> {
  return createOwnAppointment(input);
}

export async function bookOwnAppointmentAction(
  input: OwnBookingInput,
): Promise<OwnBookingResult> {
  const result = await createOwnAppointment(input);
  if (result.error) return result;
  redirect("/portal/dashboard?success=booked");
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
  redirect("/portal/appointments?success=cancelled");
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
  redirect("/portal/dashboard?success=rescheduled");
}
