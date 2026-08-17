"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireClinician } from "@/lib/auth/guards";
import {
  createClinicalPr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8,
  createPrescriptionSchema,
  saveEncounterPrescriptionSchema,
  type CreateClinicalPrescriptionRpcResponse,
  type SaveEncounterPrescriptionInput,
} from "@/lib/validation/prescription";

export type PrescriptionActionState = { error: string | null };

export type SaveEncounterPrescriptionActionResult = {
  data: CreateClinicalPrescriptionRpcResponse | null;
  error: string | null;
};

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid input";
}

function sanitizePrescriptionError(rawMessage?: string | null): string {
  if (!rawMessage) {
    return "Failed to create prescription.";
  }

  const msg = rawMessage.toLowerCase();

  if (
    msg.includes("permission denied") ||
    msg.includes("unauthorized")
  ) {
    if (msg.includes("own clinical encounters") || msg.includes("only issue prescriptions for their own")) {
      return "Permission denied: You can only issue prescriptions for your own clinical encounters.";
    }
    return "Permission denied: Only clinicians can issue prescriptions.";
  }

  if (msg.includes("not found in current organization") || msg.includes("encounter not found")) {
    return "The requested consultation or patient record could not be found.";
  }

  if (msg.includes("is not in progress") || msg.includes("encounter is not in progress")) {
    return "Prescriptions can only be created for in-progress clinical encounters.";
  }

  if (msg.includes("active practitioner profile") || msg.includes("practitioner profile")) {
    return "Only clinicians with an active practitioner profile in this clinic can issue prescriptions.";
  }

  if (msg.includes("practitioner does not belong")) {
    return "The practitioner is not authorized in this clinic organization.";
  }

  if (msg.includes("without a linked appointment")) {
    return "Cannot link prescription to an encounter without a linked appointment.";
  }

  if (msg.includes("completed clinical encounter") || msg.includes("cannot be modified")) {
    return "Prescriptions linked to a completed clinical encounter cannot be created or modified.";
  }

  if (msg.includes("medicine name is required")) {
    return "Medicine name is required for all prescription items.";
  }

  if (msg.includes("must contain at least one medicine item") || msg.includes("prescription items are required")) {
    return "Prescription must contain at least one medicine item.";
  }

  if (msg.includes("must be text")) {
    return "Prescription item fields must be text.";
  }

  if (msg.includes("invalid parameters")) {
    return "Invalid prescription parameters.";
  }

  return "Failed to create prescription.";
}

/**
 * Standalone prescription creation action:
 * Routes through the atomic PostgreSQL RPC `create_clinical_prescription` in standalone mode (p_encounter_id = null).
 */
export async function createPrescriptionAction(
  _prev: PrescriptionActionState,
  formData: FormData,
): Promise<PrescriptionActionState> {
  try {
    await requireClinician();

    const rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
    const parsed = createPrescriptionSchema.safeParse({
      patientId: formData.get("patientId"),
      notes: formData.get("notes") || undefined,
      items: rawItems,
    });
    if (!parsed.success) return { error: firstIssue(parsed.error) };
    const input = parsed.data;

    const supabase = await createClient();

    const canonicalItems = input.items.map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage || null,
      frequency: item.frequency || null,
      duration: item.duration || null,
      instructions: item.instructions || null,
    }));

    const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)(
      "create_clinical_prescription",
      {
        p_patient_id: input.patientId,
        p_encounter_id: null,
        p_notes: input.notes || null,
        p_items: canonicalItems,
      },
    );

    if (rpcError) {
      console.error("[PRESCRIPTION_STANDALONE_CREATE_ERROR]", {
        patientId: input.patientId,
        error: rpcError,
      });
      return { error: sanitizePrescriptionError(rpcError.message) };
    }

    const validatedResponse = createClinicalPr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8.safeParse(rpcData);
    if (!validatedResponse.success) {
      console.error("[PRESCRIPTION_RPC_RESPONSE_INVALID]", {
        response: rpcData,
        errors: validatedResponse.error.flatten(),
      });
      return { error: "Failed to create prescription due to an unexpected database response." };
    }

    if (validatedResponse.data.patient_id !== input.patientId) {
      console.error("[PRESCRIPTION_RPC_PATIENT_MISMATCH]", {
        expected: input.patientId,
        actual: validatedResponse.data.patient_id,
      });
      return { error: "Failed to create prescription due to patient identity mismatch." };
    }

    revalidatePath("/clinical/prescriptions");
    revalidatePath(`/patients/${input.patientId}`);
    revalidatePath("/portal/prescriptions");
  } catch (error) {
    console.error("[PRESCRIPTION_STANDALONE_UNHANDLED_ERROR]", error);
    return { error: sanitizePrescriptionError(error instanceof Error ? error.message : undefined) };
  }

  redirect("/clinical/prescriptions");
}

/**
 * Encounter-aware consultation prescription creation action:
 * Routes through the atomic PostgreSQL RPC `create_clinical_prescription` in encounter mode (p_encounter_id = encounterId, p_patient_id = null).
 */
export async function saveEncounterPrescriptionAction(
  input: SaveEncounterPrescriptionInput,
): Promise<SaveEncounterPrescriptionActionResult> {
  try {
    await requireClinician();

    const parsed = saveEncounterPrescriptionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        data: null,
        error: parsed.error.issues[0]?.message ?? "Invalid prescription input",
      };
    }
    const data = parsed.data;

    const supabase = await createClient();

    const canonicalItems = data.items.map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage || null,
      frequency: item.frequency || null,
      duration: item.duration || null,
      instructions: item.instructions || null,
    }));

    const { data: rpcData, error: rpcError } = await (supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)(
      "create_clinical_prescription",
      {
        p_patient_id: null,
        p_encounter_id: data.encounterId,
        p_notes: data.notes || null,
        p_items: canonicalItems,
      },
    );

    if (rpcError) {
      console.error("[PRESCRIPTION_ENCOUNTER_SAVE_ERROR]", {
        encounterId: data.encounterId,
        error: rpcError,
      });
      return {
        data: null,
        error: sanitizePrescriptionError(rpcError.message),
      };
    }

    const validatedResponse = createClinicalPr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8.safeParse(rpcData);
    if (!validatedResponse.success) {
      console.error("[PRESCRIPTION_RPC_RESPONSE_INVALID]", {
        response: rpcData,
        errors: validatedResponse.error.flatten(),
      });
      return {
        data: null,
        error: "Failed to create prescription due to an unexpected database response.",
      };
    }

    if (validatedResponse.data.encounter_id !== data.encounterId) {
      console.error("[PRESCRIPTION_RPC_ENCOUNTER_MISMATCH]", {
        expected: data.encounterId,
        actual: validatedResponse.data.encounter_id,
      });
      return {
        data: null,
        error: "Failed to create prescription due to encounter identity mismatch.",
      };
    }

    revalidatePath(`/clinical/encounters/${data.encounterId}`);
    revalidatePath("/clinical/prescriptions");
    revalidatePath(`/patients/${validatedResponse.data.patient_id}`);
    revalidatePath("/portal/prescriptions");

    return {
      data: validatedResponse.data,
      error: null,
    };
  } catch (error) {
    console.error("[PRESCRIPTION_ENCOUNTER_UNHANDLED_ERROR]", error);
    return {
      data: null,
      error: sanitizePrescriptionError(error instanceof Error ? error.message : undefined),
    };
  }
}
