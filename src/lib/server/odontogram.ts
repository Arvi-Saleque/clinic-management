"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireClinician } from "@/lib/auth/guards";
import { getUser } from "@/lib/auth/session";
import {
  char9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8,
  saveEncounterOdontogramSchema,
  upsertOdontogramEntrySchema,
  type ChartPatientToothRpcResponse,
} from "@/lib/validation/odontogram";

export type OdontogramActionState = {
  data?: ChartPatientToothRpcResponse | null;
  error: string | null;
};

export type SaveEncounterOdontogramActionResult = {
  data: ChartPatientToothRpcResponse | null;
  error: string | null;
};

export type UpsertOdontogramEntryActionInput = {
  patientId: string;
  toothNumber: string;
  status: string;
  conditionCode?: string;
  conditionNote?: string;
  recommendedTreatment?: string;
  treatmentPriority?: "routine" | "priority" | "urgent";
  plannedDate?: string;
  estimatedFee?: number;
};

export type SaveEncounterOdontogramActionInput = {
  encounterId: string;
  toothNumber: string;
  status: string;
  conditionCode?: string;
  conditionNote?: string;
  recommendedTreatment?: string;
  treatmentPriority?: "routine" | "priority" | "urgent";
  plannedDate?: string;
  estimatedFee?: number;
};

function sanitizeOdontogramError(rawMessage?: string | null): string {
  if (!rawMessage) {
    return "Failed to save dental chart entry.";
  }

  const msg = rawMessage.toLowerCase();

  if (
    msg.includes("permission denied") ||
    msg.includes("unauthorized")
  ) {
    if (msg.includes("own clinical encounters") || msg.includes("only chart teeth for their own")) {
      return "Permission denied: You can only record dental charting for your own clinical encounters.";
    }
    return "Permission denied: You are not authorized to record dental charts.";
  }

  if (msg.includes("not found in current organization") || msg.includes("encounter not found")) {
    return "The requested consultation or patient record could not be found.";
  }

  if (msg.includes("is not in progress") || msg.includes("encounter is not in progress")) {
    return "Dental chart can only be modified while the consultation is in progress.";
  }

  if (msg.includes("active practitioner profile") || msg.includes("practitioner profile")) {
    return "Only clinicians with an active practitioner profile in this clinic can record dental charts.";
  }

  if (msg.includes("practitioner does not belong")) {
    return "The practitioner is not authorized in this clinic organization.";
  }

  if (msg.includes("mismatch with encounter")) {
    return "Patient identity mismatch with the consultation record.";
  }

  if (msg.includes("without a linked appointment")) {
    return "Cannot record encounter dental charting without a linked appointment.";
  }

  if (msg.includes("invalid tooth number format") || msg.includes("invalid tooth")) {
    return "Invalid tooth number format.";
  }

  if (msg.includes("invalid tooth status") || msg.includes("invalid status")) {
    return "Invalid tooth status.";
  }

  if (msg.includes("invalid treatment priority")) {
    return "Invalid treatment priority.";
  }

  if (msg.includes("estimated fee must not be negative")) {
    return "Estimated fee must not be negative.";
  }

  return "Failed to save dental chart entry.";
}

/**
 * Standalone dental charting action:
 * Routes through the atomic PostgreSQL RPC `chart_patient_tooth` in standalone mode (p_encounter_id = null).
 */
export async function upsertOdontogramEntryAction(
  input: UpsertOdontogramEntryActionInput,
): Promise<OdontogramActionState> {
  try {
    const parsed = upsertOdontogramEntrySchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }
    const data = parsed.data;

    await requireClinician();
    const supabase = await createClient();

    const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)(
      "chart_patient_tooth",
      {
        p_patient_id: data.patientId,
        p_encounter_id: null,
        p_tooth_number: data.toothNumber,
        p_status: data.status,
        p_condition_code: data.conditionCode || null,
        p_condition_note: data.conditionNote || null,
        p_recommended_treatment: data.recommendedTreatment || null,
        p_treatment_priority: data.treatmentPriority || null,
        p_planned_date: data.plannedDate || null,
        p_estimated_fee: data.estimatedFee ?? null,
      },
    );

    if (rpcError) {
      console.error("[ODONTOGRAM_STANDALONE_SAVE_ERROR]", {
        patientId: data.patientId,
        toothNumber: data.toothNumber,
        error: rpcError,
      });
      return {
        data: null,
        error: sanitizeOdontogramError(rpcError.message),
      };
    }

    const validatedResponse = char9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8.safeParse(rpcData);
    if (!validatedResponse.success) {
      console.error("[ODONTOGRAM_RPC_RESPONSE_INVALID]", {
        response: rpcData,
        errors: validatedResponse.error.flatten(),
      });
      return {
        data: null,
        error: "Failed to save dental chart entry due to an unexpected database response.",
      };
    }

    revalidatePath("/clinical/odontogram");
    revalidatePath(`/patients/${data.patientId}`);
    revalidatePath("/portal/odontogram");

    return {
      data: validatedResponse.data,
      error: null,
    };
  } catch (error) {
    console.error("[ODONTOGRAM_UNHANDLED_ERROR]", error);
    return {
      data: null,
      error: sanitizeOdontogramError(error instanceof Error ? error.message : undefined),
    };
  }
}

/**
 * Encounter-aware consultation dental charting action:
 * Routes through the atomic PostgreSQL RPC `chart_patient_tooth` in encounter mode (p_encounter_id = encounterId, p_patient_id = null).
 */
export async function saveEncounterOdontogramAction(
  input: SaveEncounterOdontogramActionInput,
): Promise<SaveEncounterOdontogramActionResult> {
  try {
    const parsed = saveEncounterOdontogramSchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }
    const data = parsed.data;

    await requireClinician();
    const supabase = await createClient();

    const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)(
      "chart_patient_tooth",
      {
        p_patient_id: null,
        p_encounter_id: data.encounterId,
        p_tooth_number: data.toothNumber,
        p_status: data.status,
        p_condition_code: data.conditionCode || null,
        p_condition_note: data.conditionNote || null,
        p_recommended_treatment: data.recommendedTreatment || null,
        p_treatment_priority: data.treatmentPriority || null,
        p_planned_date: data.plannedDate || null,
        p_estimated_fee: data.estimatedFee ?? null,
      },
    );

    if (rpcError) {
      console.error("[ODONTOGRAM_ENCOUNTER_SAVE_ERROR]", {
        encounterId: data.encounterId,
        toothNumber: data.toothNumber,
        error: rpcError,
      });
      return {
        data: null,
        error: sanitizeOdontogramError(rpcError.message),
      };
    }

    const validatedResponse = char9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8.safeParse(rpcData);
    if (!validatedResponse.success) {
      console.error("[ODONTOGRAM_ENCOUNTER_RPC_RESPONSE_INVALID]", {
        response: rpcData,
        errors: validatedResponse.error.flatten(),
      });
      return {
        data: null,
        error: "Failed to save dental chart entry due to an unexpected database response.",
      };
    }

    const result = validatedResponse.data;
    if (result.encounter_id !== data.encounterId) {
      console.error("[ODONTOGRAM_ENCOUNTER_ID_MISMATCH]", {
        expected: data.encounterId,
        actual: result.encounter_id,
      });
      return {
        data: null,
        error: "Dental chart entry was not properly linked to the consultation.",
      };
    }

    revalidatePath(`/clinical/encounters/${data.encounterId}`);
    revalidatePath("/clinical/odontogram");
    revalidatePath(`/patients/${result.patient_id}`);
    revalidatePath("/portal/odontogram");

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    console.error("[ODONTOGRAM_ENCOUNTER_UNHANDLED_ERROR]", error);
    return {
      data: null,
      error: sanitizeOdontogramError(error instanceof Error ? error.message : undefined),
    };
  }
}

export async function getPatientOdontogram(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("odontogram_entries")
    .select("id, tooth_number, status, condition_code, condition_note, recommended_treatment, treatment_priority, planned_date, estimated_fee, recorded_at")
    .eq("patient_id", patientId)
    .eq("is_current", true)
    .order("tooth_number", { ascending: true });
  return data ?? [];
}

export async function getOwnOdontogram() {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!patient) return [];

  const { data } = await supabase
    .from("odontogram_entries")
    .select("id, tooth_number, status, condition_code, condition_note, recommended_treatment, treatment_priority, planned_date, estimated_fee, recorded_at")
    .eq("patient_id", patient.id)
    .eq("is_current", true)
    .order("tooth_number", { ascending: true });
  return data ?? [];
}



