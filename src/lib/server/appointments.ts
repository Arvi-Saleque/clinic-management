"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { requireClinician, requireStaff } from "@/lib/auth/guards";
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
  saveDateOverrideSchema,
  resetDateOverrideSchema,
  type SaveMultiIntervalAvailabilityInput,
  type CreateAvailabilityExceptionInput,
  type DeleteAvailabilityExceptionInput,
  type SaveDateOverrideInput,
  type ResetDateOverrideInput,
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
    await requireClinician();
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
    await requireClinician();
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
    await requireClinician();
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

export async function saveDayAvailabilityOverrideAction(
  input: SaveDateOverrideInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireClinician();
    const parsed = saveDateOverrideSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid date override details" };
    }

    const practitioner = await resolveSchedulerPractitioner(input.practitionerId);
    if (!practitioner) {
      return { success: false, error: "Unauthorized practitioner schedule access" };
    }

    const { date, isUnavailable, reason, intervals } = parsed.data;
    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc("save_date_availability_override", {
      p_practitioner_id: practitioner.id,
      p_date: date,
      p_is_unavailable: isUnavailable,
      p_reason: reason ?? undefined,
      p_intervals: intervals.map((inv) => ({
        startTime: inv.startTime,
        endTime: inv.endTime,
      })),
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    revalidatePath("/scheduler");
    revalidatePath("/clinical/services");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to save day availability override:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error saving day override" };
  }
}

export async function resetDayAvailabilityOverrideAction(
  input: ResetDateOverrideInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireClinician();
    const parsed = resetDateOverrideSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reset input" };
    }

    const practitioner = await resolveSchedulerPractitioner(input.practitionerId);
    if (!practitioner) {
      return { success: false, error: "Unauthorized practitioner access" };
    }

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("reset_date_availability_override", {
      p_practitioner_id: practitioner.id,
      p_date: parsed.data.date,
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    revalidatePath("/scheduler");
    revalidatePath("/clinical/services");
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error("Failed to reset day availability override:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error resetting day override" };
  }
}

export async function getPractitionerAppointmentCountsForRange(
  practitionerId: string,
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  try {
    const supabase = await createClient();
    const profile = await getProfile();
    let allowedPractitionerId = practitionerId;

    if (profile?.role === "dentist") {
      const { data: ownPractitioner } = await supabase
        .from("practitioners")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (!ownPractitioner) return {};
      allowedPractitionerId = ownPractitioner.id;
    }

    // Retrieve branch timezone for accurate local calendar day grouping
    const { data: practData } = await supabase
      .from("practitioners")
      .select("id, branches:branch_id(timezone)")
      .eq("id", allowedPractitionerId)
      .maybeSingle();

    const branchTz =
      (practData?.branches as { timezone?: string } | null)?.timezone ?? "Asia/Dhaka";

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: branchTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Query with boundary buffer to ensure edge timestamps are caught
    const rangeStart = `${startDate}T00:00:00Z`;
    const rangeEnd = `${endDate}T23:59:59Z`;

    const { data } = await supabase
      .from("appointments")
      .select("starts_at")
      .eq("practitioner_id", allowedPractitionerId)
      .gte("starts_at", rangeStart)
      .lte("starts_at", rangeEnd)
      .not("status", "in", "(cancelled,no_show)");

    const counts: Record<string, number> = {};
    if (data) {
      for (const appt of data) {
        const localDate = dateFormatter.format(new Date(appt.starts_at));
        if (localDate >= startDate && localDate <= endDate) {
          counts[localDate] = (counts[localDate] ?? 0) + 1;
        }
      }
    }

    return counts;
  } catch (err) {
    console.error("Failed to fetch appointment counts for range:", err);
    return {};
  }
}

export async function getAppointmentsForDate(
  practitionerId: string,
  date: string,
): Promise<{ id: string; startsAt: string; endsAt: string; startTime: string; endTime: string; status: string; patientName: string }[]> {
  try {
    const supabase = await createClient();
    const profile = await getProfile();
    let allowedPractitionerId = practitionerId;

    if (profile?.role === "dentist") {
      const { data: ownPractitioner } = await supabase
        .from("practitioners")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (!ownPractitioner) return [];
      allowedPractitionerId = ownPractitioner.id;
    }

    const { data: practData } = await supabase
      .from("practitioners")
      .select("id, branches:branch_id(timezone)")
      .eq("id", allowedPractitionerId)
      .maybeSingle();

    const branchTz =
      (practData?.branches as { timezone?: string } | null)?.timezone ?? "Asia/Dhaka";

    const timeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: branchTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: branchTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const { data } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, patients:patient_id(first_name, last_name)")
      .eq("practitioner_id", allowedPractitionerId)
      .not("status", "in", "(cancelled,no_show)")
      .order("starts_at");

    if (!data) return [];

    const result: { id: string; startsAt: string; endsAt: string; startTime: string; endTime: string; status: string; patientName: string }[] = [];

    for (const appt of data) {
      const localDate = dateFormatter.format(new Date(appt.starts_at));
      if (localDate === date) {
        const p = appt.patients as { first_name?: string; last_name?: string } | null;
        const patientName = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Patient" : "Patient";
        const startT = timeFormatter.format(new Date(appt.starts_at));
        const endT = timeFormatter.format(new Date(appt.ends_at));
        result.push({
          id: appt.id,
          startsAt: appt.starts_at,
          endsAt: appt.ends_at,
          startTime: startT,
          endTime: endT,
          status: appt.status,
          patientName,
        });
      }
    }

    return result;
  } catch (err) {
    console.error("Failed to get appointments for date:", err);
    return [];
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
  durationMinutes?: number;
  bookingSource: "staff" | "phone";
  notes?: string | null;
  originatingEncounterId?: string | null;
}): Promise<CreateAppointmentResult> {
  const profile = await requireStaff();

  const trimmedOriginatingEncounterId = input.originatingEncounterId?.trim() || null;
  if (trimmedOriginatingEncounterId && !UUID_REGEX.test(trimmedOriginatingEncounterId)) {
    return { id: null, error: "Invalid originating encounter identifier." };
  }

  const supabase = await createClient();

  // 1. Resolve duration and organization
  let duration = input.durationMinutes;
  let organizationId = profile.organization_id;

  if (!duration) {
    const { data: svc } = await supabase
      .from("services")
      .select("duration_minutes, organization_id")
      .eq("id", input.serviceId)
      .maybeSingle();

    duration = svc?.duration_minutes || 30;
    if (svc?.organization_id) {
      organizationId = svc.organization_id;
    }
  }

  // 2. Compute exact starts_at & ends_at timestamps
  const startsDate = new Date(input.startsAt);
  if (isNaN(startsDate.getTime())) {
    return { id: null, error: "Invalid appointment start date/time format." };
  }
  const endsDate = new Date(startsDate.getTime() + (duration || 30) * 60000);
  const startsAtISO = startsDate.toISOString();
  const endsAtISO = endsDate.toISOString();

  // 3. Resolve practitioner and organization if needed
  if (!organizationId) {
    const { data: pract } = await supabase
      .from("practitioners")
      .select("branch_id, branches(organization_id)")
      .eq("id", input.practitionerId)
      .maybeSingle();
    const branchOrg = (pract?.branches as any)?.organization_id;
    if (branchOrg) organizationId = branchOrg;
  }

  if (!organizationId) {
    return { id: null, error: "Unable to resolve clinic organization." };
  }

  // 4. Check for overlapping non-cancelled appointments for this practitioner
  const { data: conflicts } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at")
    .eq("practitioner_id", input.practitionerId)
    .not("status", "in", '("cancelled","no_show")')
    .lt("starts_at", endsAtISO)
    .gt("ends_at", startsAtISO);

  if (conflicts && conflicts.length > 0) {
    return { id: null, error: "This time slot overlaps with another booked appointment for this doctor." };
  }

  // 5. Insert directly into appointments
  const { data: newApt, error: insertError } = await supabase
    .from("appointments")
    .insert({
      organization_id: organizationId,
      branch_id: input.branchId,
      patient_id: input.patientId,
      practitioner_id: input.practitionerId,
      service_id: input.serviceId,
      starts_at: startsAtISO,
      ends_at: endsAtISO,
      status: "confirmed",
      booking_source: input.bookingSource,
      created_by_profile_id: profile.id,
      notes: input.notes?.trim() || null,
      originating_encounter_id: trimmedOriginatingEncounterId,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.message.includes("appointments_no_overlap")) {
      return { id: null, error: "This time slot overlaps with another booked appointment for this doctor." };
    }
    return { id: null, error: sanitizeBookingError(insertError.message) };
  }

  revalidatePath("/scheduler");
  revalidatePath("/appointments");
  return { id: newApt.id, error: null };
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
  const profile = await requireStaff();
  const supabase = await createClient();

  // Receptionist authorization hardening:
  // Receptionists are only permitted front-desk status transitions:
  // - checked_in
  // - cancelled
  // - no_show
  // - confirmed
  // Setting "completed" is restricted to clinicians as part of the clinical encounter workflow!
  if (profile.role === "receptionist" && status === "completed") {
    return { error: "Only clinicians can mark an appointment completed as part of clinical care." };
  }

  let updateQuery = supabase
    .from("appointments")
    .update({
      status,
      cancellation_reason: status === "cancelled" ? (cancellationReason ?? null) : null,
    })
    .eq("id", appointmentId);

  if (profile.organization_id) {
    updateQuery = updateQuery.eq("organization_id", profile.organization_id);
  }

  const { error } = await updateQuery;

  if (error) return { error: error.message };
  revalidatePath("/appointments");
  revalidatePath("/scheduler");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function rescheduleStaffAppointment(input: {
  appointmentId: string;
  newStartsAt: string;
}): Promise<{ error: string | null }> {
  await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: input.appointmentId,
    p_new_starts_at: input.newStartsAt,
  });

  if (error) return { error: sanitizeBookingError(error.message) };
  revalidatePath("/appointments");
  revalidatePath("/scheduler");
  return { error: null };
}

