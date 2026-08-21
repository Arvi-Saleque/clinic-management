"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireClinician } from "@/lib/auth/guards";
import {
  completeEncounterRpcResponseSchema,
  completeEncounterSchema,
  saveEncounterDraftRpcResponseSchema,
  saveEncounterDraftSchema,
  startOrResumeEncounterSchema,
  startOrResumeRpcResponseSchema,
  type CompleteEncounterInput,
  type SaveEncounterDraftInput,
} from "@/lib/validation/encounter";
import type {
  ClinicalEncounter,
  CompleteEncounterActionResult,
  ConsultationMode,
  EncounterFollowUpSchedulingContext,
  EncounterFollowUpService,
  EncounterMedicalHistory,
  EncounterOdontogramContext,
  EncounterOdontogramEntry,
  EncounterPrescription,
  EncounterPrescriptionItem,
  EncounterStatus,
  EncounterWorkspaceAppointment,
  EncounterWorkspaceLoaderResult,
  EncounterWorkspacePatient,
  PreviousEncounterSummary,
  SaveEncounterDraftActionResult,
  StartOrResumeEncounterActionResult,
  StartOrResumeEncounterResult,
} from "@/types/clinical";

function sanitizeEncounterError(rawMessage?: string | null): string {
  if (!rawMessage) {
    return "Failed to start or resume consultation.";
  }

  const msg = rawMessage.toLowerCase();

  if (msg.includes("permission denied") || msg.includes("unauthorized")) {
    if (msg.includes("own appointments") || msg.includes("own clinical encounters")) {
      return "Permission denied: You can only start consultations for your own appointments.";
    }
    return "Permission denied: You are not authorized to start or resume this clinical consultation.";
  }

  if (msg.includes("appointment not found")) {
    return "The requested appointment could not be found.";
  }

  if (msg.includes("practitioner does not belong")) {
    return "The assigned practitioner does not belong to the current clinic organization.";
  }

  if (msg.includes("cancelled")) {
    return "Cannot resume or restart a cancelled clinical encounter.";
  }

  if (msg.includes("must be confirmed or checked_in") || msg.includes("must be checked in")) {
    return "Appointment must be confirmed or checked in before starting consultation.";
  }

  if (msg.includes("inconsistent appointment status") || msg.includes("appointment status mismatch")) {
    return "Cannot open consultation due to an inconsistent appointment lifecycle state.";
  }

  if (msg.includes("already completed") || msg.includes("status is already")) {
    return "This consultation has already been completed.";
  }

  return "Failed to start or resume consultation.";
}

function sanitizeSaveDraftError(rawMessage?: string | null): string {
  if (!rawMessage) {
    return "Failed to save consultation draft.";
  }

  const msg = rawMessage.toLowerCase();

  if (msg.includes("permission denied") || msg.includes("unauthorized")) {
    if (msg.includes("own clinical encounters") || msg.includes("own appointments")) {
      return "Permission denied: You can only save drafts for your own consultations.";
    }
    return "Permission denied: You are not authorized to save this clinical draft.";
  }

  if (msg.includes("not found")) {
    return "The requested clinical encounter could not be found or is inaccessible.";
  }

  if (msg.includes("practitioner does not belong")) {
    return "The assigned practitioner does not belong to the current clinic organization.";
  }

  if (msg.includes("cannot save draft") || msg.includes("expected in_progress")) {
    return "Cannot save draft: This consultation is no longer in progress.";
  }

  if (msg.includes("follow-up date is required")) {
    return "Follow-up date is required when follow-up is recommended.";
  }

  return rawMessage;
}

function sanitizeCompleteEncounterError(rawMessage?: string | null): string {
  if (!rawMessage) {
    return "Failed to complete consultation.";
  }

  const msg = rawMessage.toLowerCase();

  if (msg.includes("permission denied") || msg.includes("unauthorized")) {
    if (msg.includes("own clinical encounters") || msg.includes("own appointments")) {
      return "Permission denied: You can only complete your own clinical consultations.";
    }
    return "Permission denied: You are not authorized to complete this consultation.";
  }

  if (
    msg.includes("clinical encounter not found") ||
    msg.includes("not found in current organization") ||
    msg.includes("encounter not found")
  ) {
    return "The requested clinical encounter could not be found or is inaccessible.";
  }

  if (msg.includes("practitioner does not belong")) {
    return "The assigned practitioner does not belong to the current clinic organization.";
  }

  if (
    msg.includes("cannot complete encounter") ||
    msg.includes("already") ||
    msg.includes("status is already")
  ) {
    return "This consultation has already been completed or is no longer editable.";
  }

  if (msg.includes("must be checked in")) {
    return "The patient must be checked in before completing the consultation.";
  }

  if (msg.includes("follow-up date is required")) {
    return "Follow-up date is required when follow-up is recommended.";
  }

  if (
    msg.includes("mismatch with encounter") ||
    msg.includes("inconsistent") ||
    msg.includes("linked appointment not found")
  ) {
    return "Unable to complete consultation because the appointment record is inconsistent.";
  }

  return rawMessage;
}

export async function startOrResumeEncounterAction(
  appointmentId: string,
): Promise<StartOrResumeEncounterActionResult> {
  try {
    const parsedInput = startOrResumeEncounterSchema.safeParse({ appointmentId });
    if (!parsedInput.success) {
      return {
        data: null,
        error: parsedInput.error.issues[0]?.message ?? "Invalid appointment ID format",
      };
    }

    await requireClinician();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "start_or_resume_clinical_encounter",
      {
        p_appointment_id: parsedInput.data.appointmentId,
      },
    );

    if (error) {
      return {
        data: null,
        error: sanitizeEncounterError(error.message),
      };
    }

    const validatedResponse = startOrResumeRpcResponseSchema.safeParse(data);
    if (!validatedResponse.success) {
      return {
        data: null,
        error: "Failed to start or resume consultation due to an unexpected response.",
      };
    }

    const result: StartOrResumeEncounterResult = {
      success: true,
      encounter_id: validatedResponse.data.encounter_id,
      encounter_status: validatedResponse.data.encounter_status,
      appointment_id: validatedResponse.data.appointment_id,
      appointment_status: validatedResponse.data.appointment_status,
      mode: validatedResponse.data.mode,
    };

    // Revalidate staff schedules when an appointment is transitioned to checked_in
    revalidatePath("/scheduler");
    revalidatePath("/dashboard");

    return {
      data: result,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? sanitizeEncounterError(err.message) : "Failed to start or resume consultation.";
    return {
      data: null,
      error: message,
    };
  }
}

export async function saveEncounterDraftAction(
  input: SaveEncounterDraftInput,
): Promise<SaveEncounterDraftActionResult> {
  try {
    const parsed = saveEncounterDraftSchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Invalid encounter draft payload",
      };
    }

    await requireClinician();
    const supabase = await createClient();

    const followUpDate = parsed.data.followUpRecommended
      ? parsed.data.followUpDate
      : null;
    const followUpReason = parsed.data.followUpRecommended
      ? parsed.data.followUpReason
      : null;

    const { data, error } = await supabase.rpc("save_clinical_encounter_draft", {
      p_encounter_id: parsed.data.encounterId,
      p_chief_complaint: parsed.data.chiefComplaint ?? "",
      p_diagnosis: parsed.data.diagnosis ?? "",
      p_performed_treatment: parsed.data.performedTreatment ?? "",
      p_patient_notes: parsed.data.patientNotes ?? "",
      p_private_notes: parsed.data.privateNotes ?? "",
      p_follow_up_recommended: parsed.data.followUpRecommended,
      p_follow_up_date: followUpDate || null,
      p_follow_up_reason: followUpReason ?? "",
    });

    if (error) {
      console.error("save_clinical_encounter_draft RPC error:", error);
      return {
        data: null,
        error: sanitizeSaveDraftError(error.message),
      };
    }

    const validatedResponse = saveEncounterDraftRpcResponseSchema.safeParse(data);
    if (!validatedResponse.success) {
      return {
        data: null,
        error: "Failed to save consultation draft due to an unexpected response.",
      };
    }

    revalidatePath(`/clinical/encounters/${parsed.data.encounterId}`);

    return {
      data: {
        success: true,
        encounter_id: validatedResponse.data.encounter_id,
        status: validatedResponse.data.status,
        updated_at: validatedResponse.data.updated_at,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? sanitizeSaveDraftError(err.message)
        : "Failed to save consultation draft.";
    return {
      data: null,
      error: message,
    };
  }
}

export async function completeEncounterAction(
  input: CompleteEncounterInput,
): Promise<CompleteEncounterActionResult> {
  try {
    const parsed = completeEncounterSchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Invalid consultation completion payload",
      };
    }

    await requireClinician();
    const supabase = await createClient();

    const followUpDate = parsed.data.followUpRecommended
      ? parsed.data.followUpDate
      : null;
    const followUpReason = parsed.data.followUpRecommended
      ? parsed.data.followUpReason
      : null;

    const { data, error } = await supabase.rpc("complete_clinical_encounter", {
      p_encounter_id: parsed.data.encounterId,
      p_chief_complaint: parsed.data.chiefComplaint ?? "",
      p_diagnosis: parsed.data.diagnosis ?? "",
      p_performed_treatment: parsed.data.performedTreatment ?? "",
      p_patient_notes: parsed.data.patientNotes ?? "",
      p_private_notes: parsed.data.privateNotes ?? "",
      p_follow_up_recommended: parsed.data.followUpRecommended,
      p_follow_up_date: followUpDate || null,
      p_follow_up_reason: followUpReason ?? "",
    });

    if (error) {
      console.error("complete_clinical_encounter RPC error:", error);
      return {
        data: null,
        error: sanitizeCompleteEncounterError(error.message),
      };
    }

    const validatedResponse = completeEncounterRpcResponseSchema.safeParse(data);
    if (!validatedResponse.success) {
      return {
        data: null,
        error: "Failed to complete consultation due to an unexpected response.",
      };
    }

    // Revalidate workspace, staff scheduler, and clinic dashboard
    revalidatePath(`/clinical/encounters/${parsed.data.encounterId}`);
    revalidatePath("/scheduler");
    revalidatePath("/dashboard");

    return {
      data: {
        success: true,
        encounter_id: validatedResponse.data.encounter_id,
        appointment_id: validatedResponse.data.appointment_id,
        status: validatedResponse.data.status,
        completed_at: validatedResponse.data.completed_at,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? sanitizeCompleteEncounterError(err.message)
        : "Failed to complete consultation.";
    return {
      data: null,
      error: message,
    };
  }
}

const encounterIdSchema = z.string().uuid("Invalid encounter ID format");

export async function getEncounterWorkspaceContext(
  encounterId: string,
): Promise<EncounterWorkspaceLoaderResult> {
  try {
    const parsed = encounterIdSchema.safeParse(encounterId);
    if (!parsed.success) {
      return {
        data: null,
        error: "not_found",
        message: "The requested clinical encounter was not found or is inaccessible.",
      };
    }

    await requireClinician();
    const supabase = await createClient();

    // 1. Load clinical encounter
    const { data: encounterRow, error: encError } = await supabase
      .from("clinical_encounters")
      .select("*")
      .eq("id", parsed.data)
      .maybeSingle();

    if (encError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load clinical encounter details.",
      };
    }

    if (!encounterRow) {
      return {
        data: null,
        error: "not_found",
        message: "The requested clinical encounter was not found or is inaccessible.",
      };
    }

    const encounter: ClinicalEncounter = {
      id: encounterRow.id,
      organization_id: encounterRow.organization_id,
      patient_id: encounterRow.patient_id,
      practitioner_id: encounterRow.practitioner_id,
      appointment_id: encounterRow.appointment_id,
      status: encounterRow.status as EncounterStatus,
      chief_complaint: encounterRow.chief_complaint,
      diagnosis: encounterRow.diagnosis,
      performed_treatment: encounterRow.performed_treatment,
      patient_notes: encounterRow.patient_notes,
      follow_up_recommended: encounterRow.follow_up_recommended,
      follow_up_date: encounterRow.follow_up_date,
      follow_up_reason: encounterRow.follow_up_reason,
      started_at: encounterRow.started_at,
      completed_at: encounterRow.completed_at,
      created_at: encounterRow.created_at,
      updated_at: encounterRow.updated_at,
    };

    // 2. Load private clinician note
    const { data: privateNoteRow, error: privateNoteError } = await supabase
      .from("clinical_encounter_private_notes")
      .select("clinical_notes")
      .eq("encounter_id", encounterRow.id)
      .maybeSingle();

    if (privateNoteError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load encounter private notes.",
      };
    }

    // 3. Load appointment context (if linked)
    let appointmentContext: EncounterWorkspaceAppointment | null = null;
    if (encounterRow.appointment_id) {
      const { data: apptRow, error: apptError } = await supabase
        .from("appointments")
        .select(`
          id,
          starts_at,
          ends_at,
          status,
          booking_source,
          notes,
          services:service_id(name, duration_minutes, price),
          practitioners:practitioner_id(profiles:profile_id(full_name)),
          branches:branch_id(name)
        `)
        .eq("id", encounterRow.appointment_id)
        .maybeSingle();

      if (apptError) {
        return {
          data: null,
          error: "load_failed",
          message: "Failed to load linked appointment context.",
        };
      }

      if (apptRow) {
        const service = apptRow.services as unknown as {
          name: string;
          duration_minutes: number;
          price: number;
        } | null;
        const practitioner = apptRow.practitioners as unknown as {
          profiles: { full_name: string } | null;
        } | null;
        const branch = apptRow.branches as unknown as { name: string } | null;

        let apptCustomPrice: number | null = null;
        let apptCustomDuration: number | null = null;
        if (apptRow.notes) {
          const feeMatch = apptRow.notes.match(/(?:\[FEE:([\d.]+)\]|Fee:\s*€\s*([\d.]+))/i);
          if (feeMatch) {
            apptCustomPrice = parseFloat(feeMatch[1] || feeMatch[2]);
          }
          const durMatch = apptRow.notes.match(/(?:\[DUR:(\d+)\]|Duration:\s*(\d+)m)/i);
          if (durMatch) {
            apptCustomDuration = parseInt(durMatch[1] || durMatch[2], 10);
          }
        }

        appointmentContext = {
          id: apptRow.id,
          starts_at: apptRow.starts_at,
          ends_at: apptRow.ends_at,
          status: apptRow.status,
          booking_source: apptRow.booking_source,
          notes: apptRow.notes,
          service_name: service?.name ?? null,
          service_duration: apptCustomDuration !== null ? apptCustomDuration : (service?.duration_minutes ?? null),
          service_price: apptCustomPrice !== null ? apptCustomPrice : (service?.price !== null && service?.price !== undefined ? Number(service.price) : null),
          practitioner_name: practitioner?.profiles?.full_name ?? null,
          branch_name: branch?.name ?? null,
        };
      }
    }

    // 4. Load patient details
    const { data: patientRow, error: patientError } = await supabase
      .from("patients")
      .select(
        "id, first_name, last_name, dob, gender, phone, email, address, emergency_contact_name, emergency_contact_phone",
      )
      .eq("id", encounterRow.patient_id)
      .maybeSingle();

    if (patientError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load patient record.",
      };
    }

    const patientContext: EncounterWorkspacePatient = {
      id: patientRow?.id ?? encounterRow.patient_id,
      patient_reference: `PT-${(patientRow?.id ?? encounterRow.patient_id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      first_name: patientRow?.first_name ?? "",
      last_name: patientRow?.last_name ?? "",
      full_name:
        `${patientRow?.first_name ?? ""} ${patientRow?.last_name ?? ""}`.trim() ||
        "Patient",
      dob: patientRow?.dob ?? null,
      gender: patientRow?.gender ?? null,
      phone: patientRow?.phone ?? null,
      email: patientRow?.email ?? null,
      address: patientRow?.address ?? null,
      emergency_contact_name: patientRow?.emergency_contact_name ?? null,
      emergency_contact_phone: patientRow?.emergency_contact_phone ?? null,
    };

    // 5. Load current medical history
    const { data: medRow, error: medError } = await supabase
      .from("medical_history")
      .select("allergies, current_medications, chronic_conditions, past_surgeries, notes")
      .eq("patient_id", encounterRow.patient_id)
      .eq("is_current", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (medError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load patient medical history.",
      };
    }

    const medicalHistory: EncounterMedicalHistory | null = medRow
      ? {
          allergies: medRow.allergies ?? null,
          current_medications: medRow.current_medications ?? null,
          chronic_conditions: medRow.chronic_conditions ?? null,
          past_surgeries: medRow.past_surgeries ?? null,
          notes: medRow.notes ?? null,
        }
      : null;

    // 6. Load previous completed encounters for the same patient
    const { data: prevRows, error: prevError } = await supabase
      .from("clinical_encounters")
      .select(`
        id,
        appointment_id,
        started_at,
        completed_at,
        chief_complaint,
        diagnosis,
        performed_treatment,
        patient_notes,
        follow_up_recommended,
        follow_up_date,
        follow_up_reason,
        practitioners:practitioner_id(profiles:profile_id(full_name)),
        appointments:appointments!clinical_encounters_appointment_fk(services:service_id(name))
      `)
      .eq("patient_id", encounterRow.patient_id)
      .eq("organization_id", encounterRow.organization_id)
      .neq("id", encounterRow.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (prevError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load patient clinical history.",
      };
    }

    const previous_encounters: PreviousEncounterSummary[] = (prevRows ?? []).map(
      (row) => {
        const practitioner = row.practitioners as unknown as {
          profiles: { full_name: string } | null;
        } | null;
        const appt = row.appointments as unknown as {
          services: { name: string } | null;
        } | null;

        return {
          id: row.id,
          appointment_id: row.appointment_id,
          started_at: row.started_at,
          completed_at: row.completed_at,
          practitioner_name: practitioner?.profiles?.full_name ?? null,
          service_booked: appt?.services?.name ?? null,
          chief_complaint: row.chief_complaint,
          diagnosis: row.diagnosis,
          performed_treatment: row.performed_treatment,
          patient_notes: row.patient_notes,
          follow_up_recommended: row.follow_up_recommended,
          follow_up_date: row.follow_up_date,
          follow_up_reason: row.follow_up_reason,
        };
      },
    );

    // 7. Load patient current odontogram state & encounter-specific entries
    const [currentOdontogramRes, encounterOdontogramRes] = await Promise.all([
      supabase
        .from("odontogram_entries")
        .select(
          "id, tooth_number, status, condition_code, condition_note, recommended_treatment, treatment_priority, planned_date, estimated_fee, recorded_at",
        )
        .eq("patient_id", encounterRow.patient_id)
        .eq("is_current", true)
        .order("tooth_number", { ascending: true }),
      supabase
        .from("odontogram_entries")
        .select(
          "id, tooth_number, status, condition_code, condition_note, recommended_treatment, treatment_priority, planned_date, estimated_fee, recorded_at",
        )
        .eq("encounter_id", encounterRow.id)
        .order("recorded_at", { ascending: true }),
    ]);

    if (currentOdontogramRes.error || encounterOdontogramRes.error) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load patient dental chart history.",
      };
    }

    const current_entries: EncounterOdontogramEntry[] = (
      currentOdontogramRes.data ?? []
    ).map((row) => ({
      id: row.id,
      tooth_number: row.tooth_number,
      status: row.status,
      condition_code: row.condition_code,
      condition_note: row.condition_note,
      recommended_treatment: row.recommended_treatment,
      treatment_priority: row.treatment_priority,
      planned_date: row.planned_date,
      estimated_fee: row.estimated_fee ? Number(row.estimated_fee) : null,
      recorded_at: row.recorded_at,
    }));

    const encounter_entries: EncounterOdontogramEntry[] = (
      encounterOdontogramRes.data ?? []
    ).map((row) => ({
      id: row.id,
      tooth_number: row.tooth_number,
      status: row.status,
      condition_code: row.condition_code,
      condition_note: row.condition_note,
      recommended_treatment: row.recommended_treatment,
      treatment_priority: row.treatment_priority,
      planned_date: row.planned_date,
      estimated_fee: row.estimated_fee ? Number(row.estimated_fee) : null,
      recorded_at: row.recorded_at,
    }));

    const odontogramContext: EncounterOdontogramContext = {
      current_entries,
      encounter_entries,
    };

    // 8. Load prescriptions issued during this encounter
    const { data: rxRows, error: rxError } = await supabase
      .from("prescriptions")
      .select(`
        id,
        issued_at,
        status,
        notes,
        encounter_id,
        appointment_id,
        practitioners:practitioner_id(profiles:profile_id(full_name)),
        prescription_items(id, medicine_name, dosage, frequency, duration, instructions, created_at)
      `)
      .eq("encounter_id", encounterRow.id)
      .order("issued_at", { ascending: true });

    if (rxError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load consultation prescriptions.",
      };
    }

    const prescriptions: EncounterPrescription[] = (rxRows ?? []).map((rx) => {
      const practitioner = rx.practitioners as unknown as {
        profiles: { full_name: string } | null;
      } | null;

      const rawItems = (rx.prescription_items ?? []) as Array<{
        id: string;
        medicine_name: string;
        dosage: string | null;
        frequency: string | null;
        duration: string | null;
        instructions: string | null;
        created_at: string;
      }>;

      // Sort items deterministically by created_at ASC, id ASC
      const items: EncounterPrescriptionItem[] = [...rawItems]
        .sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          if (timeA !== timeB) return timeA - timeB;
          return a.id.localeCompare(b.id);
        })
        .map((item) => ({
          id: item.id,
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          created_at: item.created_at,
        }));

      return {
        id: rx.id,
        issued_at: rx.issued_at,
        notes: rx.notes,
        status: rx.status,
        practitioner_name: practitioner?.profiles?.full_name ?? null,
        encounter_id: rx.encounter_id,
        appointment_id: rx.appointment_id,
        items,
      };
    });

    // 9. Load linked follow-up appointments originating from this encounter
    const { data: followUpRows, error: followUpError } = await supabase
      .from("appointments")
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        booking_source,
        notes,
        services:service_id(name, duration_minutes, price),
        practitioners:practitioner_id(profiles:profile_id(full_name)),
        branches:branch_id(name)
      `)
      .eq("originating_encounter_id", encounterRow.id)
      .order("starts_at", { ascending: true });

    if (followUpError) {
      return {
        data: null,
        error: "load_failed",
        message: "Failed to load linked follow-up appointments.",
      };
    }

    const follow_up_appointments: EncounterWorkspaceAppointment[] = (
      followUpRows ?? []
    ).map((row) => {
      const service = row.services as unknown as {
        name: string;
        duration_minutes: number;
        price: number;
      } | null;
      const practitioner = row.practitioners as unknown as {
        profiles: { full_name: string } | null;
      } | null;
      const branch = row.branches as unknown as { name: string } | null;

      let customPrice: number | null = null;
      let customDuration: number | null = null;
      if (row.notes) {
        const feeMatch = row.notes.match(/(?:\[FEE:([\d.]+)\]|Fee:\s*€\s*([\d.]+))/i);
        if (feeMatch) {
          customPrice = parseFloat(feeMatch[1] || feeMatch[2]);
        }
        const durMatch = row.notes.match(/(?:\[DUR:(\d+)\]|Duration:\s*(\d+)m)/i);
        if (durMatch) {
          customDuration = parseInt(durMatch[1] || durMatch[2], 10);
        }
      }

      return {
        id: row.id,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        booking_source: row.booking_source,
        notes: row.notes,
        service_name: service?.name ? `${service.name} - Follow-up` : "Follow-up Visit",
        service_duration: customDuration !== null ? customDuration : (service?.duration_minutes ?? null),
        service_price: customPrice !== null ? customPrice : (service?.price !== null && service?.price !== undefined ? Number(service.price) : null),
        practitioner_name: practitioner?.profiles?.full_name ?? null,
        branch_name: branch?.name ?? null,
      };
    });

    // 10. Load practitioner, branch & active practitioner-services for follow-up scheduling
    const [practitionerRes, practitionerServicesRes] = await Promise.all([
      supabase
        .from("practitioners")
        .select(`
          id,
          branch_id,
          branches:branch_id(name),
          profiles:profile_id(full_name)
        `)
        .eq("id", encounterRow.practitioner_id)
        .maybeSingle(),
      supabase
        .from("practitioner_services")
        .select(`
          service_id,
          override_duration_minutes,
          override_price,
          services:service_id(
            id,
            name,
            duration_minutes,
            price,
            is_active
          )
        `)
        .eq("practitioner_id", encounterRow.practitioner_id),
    ]);

    let follow_up_scheduling: EncounterFollowUpSchedulingContext | null = null;
    const practitionerRow = practitionerRes.data;

    if (practitionerRow && practitionerRow.branch_id) {
      const practitionerProfiles = practitionerRow.profiles as unknown as {
        full_name: string;
      } | null;
      const practitionerBranches = practitionerRow.branches as unknown as {
        name: string;
      } | null;

      const followUpServices: EncounterFollowUpService[] = (
        practitionerServicesRes.data ?? []
      )
        .map((row) => {
          const svc = row.services as unknown as {
            id: string;
            name: string;
            duration_minutes: number;
            price: number;
            is_active: boolean;
          } | null;

          if (!svc || !svc.is_active) return null;

          const overrideDuration = row.override_duration_minutes ?? null;
          const overridePrice =
            row.override_price != null ? Number(row.override_price) : null;

          return {
            id: svc.id,
            name: svc.name,
            duration_minutes: overrideDuration ?? svc.duration_minutes,
            price: overridePrice ?? (svc.price != null ? Number(svc.price) : null),
          };
        })
        .filter((svc): svc is EncounterFollowUpService => svc !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      follow_up_scheduling = {
        practitioner_id: practitionerRow.id,
        practitioner_name: practitionerProfiles?.full_name ?? null,
        branch_id: practitionerRow.branch_id,
        branch_name: practitionerBranches?.name ?? null,
        services: followUpServices,
      };
    }

    // 11. Determine workspace mode & editability
    const is_editable = encounterRow.status === "in_progress";
    const mode: ConsultationMode =
      encounterRow.status === "in_progress" ? "resumed" : "readonly";

    return {
      data: {
        encounter,
        private_notes: privateNoteRow?.clinical_notes ?? null,
        patient: patientContext,
        appointment: appointmentContext,
        medical_history: medicalHistory,
        previous_encounters,
        odontogram: odontogramContext,
        prescriptions,
        follow_up_appointments,
        follow_up_scheduling,
        is_editable,
        mode,
      },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: "load_failed",
      message: "An unexpected error occurred while loading the workspace.",
    };
  }
}

/**
 * Resolves an active, recent, or newly initialized consultation encounter ID for a patient.
 * Enables direct routing from /patients/[patientId] to the clinical consultation workspace.
 */
export async function resolveOrCreatePatientEncounterId(
  patientId: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const profile = await requireClinician();

    // 1. Verify patient exists
    const { data: patient, error: patientErr } = await supabase
      .from("patients")
      .select("id, organization_id")
      .eq("id", patientId)
      .maybeSingle();

    if (patientErr || !patient) return null;

    // 2. Check for active in_progress encounter
    const { data: activeEnc } = await supabase
      .from("clinical_encounters")
      .select("id")
      .eq("patient_id", patientId)
      .eq("organization_id", patient.organization_id)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeEnc?.id) {
      return activeEnc.id;
    }

    // 3. Check for any confirmed/checked_in appointment to start or resume
    const { data: apptRow } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("patient_id", patientId)
      .eq("organization_id", patient.organization_id)
      .in("status", ["confirmed", "checked_in"])
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (apptRow?.id) {
      const startRes = await startOrResumeEncounterAction(apptRow.id);
      if (startRes.data?.encounter_id) {
        return startRes.data.encounter_id;
      }
    }

    // 4. Check for any previous encounter
    const { data: latestEnc } = await supabase
      .from("clinical_encounters")
      .select("id")
      .eq("patient_id", patientId)
      .eq("organization_id", patient.organization_id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestEnc?.id) {
      return latestEnc.id;
    }

    // 5. If no encounter exists, resolve practitioner identity
    let practitionerId: string | null = null;
    const { data: practRow } = await supabase
      .from("practitioners")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (practRow?.id) {
      practitionerId = practRow.id;
    } else {
      const { data: fallbackPract } = await supabase
        .from("practitioners")
        .select("id")
        .limit(1)
        .maybeSingle();
      practitionerId = fallbackPract?.id ?? null;
    }

    if (!practitionerId) return null;

    // 6. Create a new in-progress clinical encounter for this patient
    const { data: newEnc, error: createErr } = await supabase
      .from("clinical_encounters")
      .insert({
        organization_id: patient.organization_id,
        patient_id: patientId,
        practitioner_id: practitionerId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createErr || !newEnc) return null;

    return newEnc.id;
  } catch {
    return null;
  }
}

