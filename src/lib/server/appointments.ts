"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/guards";
import { getProfile } from "@/lib/auth/session";
import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  DayAvailability,
} from "@/types/availability";
import {
  saveMultiIntervalAvailabilitySchema,
  createAvailabilityExceptionSchema,
  deleteAvailabilityExceptionSchema,
  type SaveMultiIntervalAvailabilityInput,
  type CreateAvailabilityExceptionInput,
  type DeleteAvailabilityExceptionInput,
} from "@/lib/validation/availability";

export type SlotResult = { slot_start: string; slot_end: string };

export async function resolveSchedulerPractitioner(requestedId?: string) {
  const profile = await getProfile();
  if (!profile) return null;
  const supabase = await createClient();
  if (profile.role === "dentist") {
    const { data } = await supabase
      .from("practitioners")
      .select("id, title, branch_id, profiles:profile_id(full_name)")
      .eq("profile_id", profile.id)
      .maybeSingle();
    return data ?? null;
  }

  let request = supabase
    .from("practitioners")
    .select("id, title, branch_id, profiles:profile_id(full_name)")
    .eq("is_bookable", true)
    .order("id");
  if (requestedId) request = request.eq("id", requestedId);
  const { data } = await request.limit(1).maybeSingle();
  return data ?? null;
}

export async function getSchedulerContext(requestedId?: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  if (profile.role === "dentist") {
    const practitioner = await resolveSchedulerPractitioner();
    return {
      practitioners: practitioner ? [practitioner] : [],
      activePractitioner: practitioner,
      canSelectPractitioner: false,
    };
  }
  const { data: practitioners } = await supabase
    .from("practitioners")
    .select("id, title, branch_id, profiles:profile_id(full_name)")
    .eq("is_bookable", true)
    .order("id");
  const available = practitioners ?? [];
  const activePractitioner =
    available.find((item) => item.id === requestedId) ?? available[0] ?? null;
  return { practitioners: available, activePractitioner, canSelectPractitioner: true };
}

export async function listAvailabilityRules(
  practitionerId: string,
): Promise<AvailabilityRuleRow[]> {
  const practitioner = await resolveSchedulerPractitioner(practitionerId);
  if (!practitioner) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_rules")
    .select("id, practitioner_id, branch_id, day_of_week, start_time, end_time, effective_from, effective_to")
    .eq("practitioner_id", practitioner.id)
    .order("day_of_week")
    .order("start_time");
  return (data as AvailabilityRuleRow[]) ?? [];
}

export async function listAvailabilityExceptions(
  practitionerId: string,
  startDate: string,
  daysCount: number = 10,
): Promise<AvailabilityExceptionRow[]> {
  const practitioner = await resolveSchedulerPractitioner(practitionerId);
  if (!practitioner) return [];
  const supabase = await createClient();

  const endDate = format(addDays(new Date(`${startDate}T00:00:00`), daysCount), "yyyy-MM-dd");

  const { data } = await supabase
    .from("availability_exceptions")
    .select("id, practitioner_id, date, start_time, end_time, is_unavailable, reason")
    .eq("practitioner_id", practitioner.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date")
    .order("start_time", { nullsFirst: true });

  return (data as AvailabilityExceptionRow[]) ?? [];
}

export async function saveMultiIntervalWeeklyAvailability(
  input: SaveMultiIntervalAvailabilityInput,
): Promise<{ error: string | null }> {
  try {
    await requireStaff();
    const parsed = saveMultiIntervalAvailabilitySchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid schedule configuration" };
    }

    const { days } = parsed.data;
    const practitioner = await resolveSchedulerPractitioner(input.practitionerId);
    if (!practitioner) {
      return { error: "You do not have access to this practitioner schedule." };
    }

    if (!practitioner.branch_id) {
      return { error: "Practitioner is not assigned to a valid clinic branch." };
    }

    const rulesPayload: {
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[] = [];

    for (const day of days) {
      if (!day.enabled) continue;
      for (const interval of day.intervals) {
        rulesPayload.push({
          day_of_week: day.dayOfWeek,
          start_time: interval.startTime,
          end_time: interval.endTime,
        });
      }
    }

    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc("save_weekly_availability", {
      p_practitioner_id: practitioner.id,
      p_branch_id: practitioner.branch_id,
      p_rules: rulesPayload,
    });

    if (rpcError) {
      return { error: rpcError.message };
    }

    revalidatePath("/scheduler");
    revalidatePath("/clinical/services");
    return { error: null };
  } catch (err: unknown) {
    console.error("Failed to save availability:", err);
    return { error: err instanceof Error ? err.message : "Internal error saving availability" };
  }
}

export type WeeklyAvailabilityInput = {
  practitionerId: string;
  branchId: string;
  rules: { dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[];
};

export async function saveWeeklyAvailability(
  input: WeeklyAvailabilityInput,
): Promise<{ error: string | null }> {
  // Translate single-interval input to multi-interval structure for backwards compatibility
  const days: DayAvailability[] = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const matched = input.rules.find((r) => r.dayOfWeek === dow);
    return {
      dayOfWeek: dow,
      enabled: matched?.enabled ?? false,
      intervals: matched?.enabled
        ? [{ startTime: matched.startTime, endTime: matched.endTime }]
        : [],
    };
  });

  return saveMultiIntervalWeeklyAvailability({
    practitionerId: input.practitionerId,
    days,
  });
}

export async function setAvailabilityExceptionAction(
  input: CreateAvailabilityExceptionInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireStaff();
    const parsed = createAvailabilityExceptionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid exception details" };
    }

    const practitioner = await resolveSchedulerPractitioner(input.practitionerId);
    if (!practitioner) {
      return { success: false, error: "Unauthorized practitioner schedule access" };
    }

    const { date, isUnavailable, startTime, endTime, reason } = parsed.data;
    const supabase = await createClient();

    // Check if exception exists for this date and time range
    let query = supabase
      .from("availability_exceptions")
      .delete()
      .eq("practitioner_id", practitioner.id)
      .eq("date", date);

    if (startTime) {
      query = query.eq("start_time", startTime);
    } else {
      query = query.is("start_time", null);
    }

    await query;

    // Insert new exception
    const { error: insertError } = await supabase.from("availability_exceptions").insert({
      practitioner_id: practitioner.id,
      date,
      start_time: startTime ?? null,
      end_time: endTime ?? null,
      is_unavailable: isUnavailable,
      reason: reason ?? null,
    });

    if (insertError) return { success: false, error: insertError.message };

    revalidatePath("/scheduler");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to set availability exception:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error setting exception" };
  }
}

export async function deleteAvailabilityExceptionAction(
  input: DeleteAvailabilityExceptionInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireStaff();
    const parsed = deleteAvailabilityExceptionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const practitioner = await resolveSchedulerPractitioner(input.practitionerId);
    if (!practitioner) {
      return { success: false, error: "Unauthorized practitioner access" };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("availability_exceptions")
      .delete()
      .eq("id", parsed.data.exceptionId)
      .eq("practitioner_id", practitioner.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/scheduler");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to delete availability exception:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error deleting exception" };
  }
}

/** Shared availability engine — both the staff scheduler and patient online booking call this same RPC, never a parallel query. */
export async function getAvailableSlots(
  practitionerId: string,
  serviceId: string,
  date: string,
): Promise<{ slots: SlotResult[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_practitioner_id: practitionerId,
    p_service_id: serviceId,
    p_date: date,
  });

  if (error) return { slots: [], error: error.message };
  return { slots: data ?? [], error: null };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeBookingError(rawMessage?: string | null): string {
  if (!rawMessage) {
    return "Failed to book appointment.";
  }

  const msg = rawMessage.toLowerCase();

  if (
    msg.includes("dentists may only schedule follow-ups from their own") ||
    msg.includes("own clinical encounters")
  ) {
    return "Permission denied: Dentists may only schedule follow-ups from their own clinical encounters.";
  }

  if (
    msg.includes("only clinicians can schedule a follow-up") ||
    msg.includes("only clinicians can schedule follow-up")
  ) {
    return "Permission denied: Only clinicians can schedule a follow-up from a clinical encounter.";
  }

  if (msg.includes("originating clinical encounter not found")) {
    return "The originating clinical encounter could not be found.";
  }

  if (msg.includes("originating clinical encounter is not completed")) {
    return "Follow-up appointments can only be scheduled for completed clinical encounters.";
  }

  if (msg.includes("patient mismatch with originating encounter")) {
    return "The selected patient does not match the originating clinical encounter.";
  }

  if (
    msg.includes("originating encounter practitioner") ||
    msg.includes("must be booked with the originating encounter practitioner")
  ) {
    return "Follow-up appointments must be booked with the treating practitioner from the originating encounter.";
  }

  if (msg.includes("that time is no longer available")) {
    return "That time is no longer available — please pick another slot.";
  }

  if (msg.includes("does not offer this service") || msg.includes("service is inactive")) {
    return "The selected practitioner does not offer this service or the service is inactive.";
  }

  if (msg.includes("practitioner is not available for booking")) {
    return "The selected practitioner is not available for booking.";
  }

  if (msg.includes("staff member does not belong")) {
    return "Staff member does not belong to the target clinic organization.";
  }

  if (
    msg.includes("patient and practitioner belong to different organizations") ||
    msg.includes("different organizations")
  ) {
    return "Selected patient or service does not belong to the clinic organization.";
  }

  if (msg.includes("provided branch does not match")) {
    return "Provided branch does not match the practitioner assigned branch.";
  }

  if (msg.includes("only clinic staff")) {
    return "Only clinic staff may create staff bookings.";
  }

  if (msg.includes("patient not found")) {
    return "Patient not found.";
  }

  return rawMessage;
}

export type CreateAppointmentResult = { id: string | null; error: string | null };

/** Staff-side booking (phone/walk-in/follow-up) — routes through the same book_appointment RPC as patient online booking. */
export async function createStaffAppointment(input: {
  practitionerId: string;
  serviceId: string;
  branchId: string;
  patientId: string;
  startsAt: string;
  bookingSource: "staff" | "phone";
  notes?: string | null;
  originatingEncounterId?: string | null;
}): Promise<CreateAppointmentResult> {
  await requireStaff();

  const trimmedOriginatingEncounterId = input.originatingEncounterId?.trim() || null;
  if (trimmedOriginatingEncounterId && !UUID_REGEX.test(trimmedOriginatingEncounterId)) {
    return { id: null, error: "Invalid originating encounter identifier." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("book_appointment", {
    p_practitioner_id: input.practitionerId,
    p_service_id: input.serviceId,
    p_branch_id: input.branchId,
    p_patient_id: input.patientId,
    p_starts_at: input.startsAt,
    p_booking_source: input.bookingSource,
    p_notes: input.notes ?? null,
    p_originating_encounter_id: trimmedOriginatingEncounterId,
  });

  if (error) return { id: null, error: sanitizeBookingError(error.message) };
  revalidatePath("/scheduler");
  return { id: data as string, error: null };
}

export type AppointmentStatus =
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancellationReason?: string,
): Promise<{ error: string | null }> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      cancellation_reason: status === "cancelled" ? (cancellationReason ?? null) : null,
    })
    .eq("id", appointmentId);

  if (error) return { error: error.message };
  revalidatePath("/scheduler");
  return { error: null };
}
