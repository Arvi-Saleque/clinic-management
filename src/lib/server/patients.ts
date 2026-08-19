"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/guards";

export interface ReceptionistPatientProfileData {
  patient: {
    id: string;
    patient_reference: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    dob: string | null;
    gender: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    created_at: string;
  };
  nextAppointment: {
    id: string;
    starts_at: string;
    ends_at: string;
    status: string;
    notes: string | null;
    practitionerName: string;
    serviceName: string;
    duration_minutes: number;
    practitionerId: string;
    serviceId?: string;
  } | null;
  appointmentHistory: {
    id: string;
    starts_at: string;
    status: string;
    practitionerName: string;
    serviceName: string;
    duration_minutes: number;
  }[];
  formStatus: {
    registrationComplete: boolean;
    medicalFormSubmitted: boolean;
    medicalFormUpdatedAt: string | null;
  };
  accountSummary: {
    totalInvoiced: number;
    outstandingBalance: number;
    paidAmount: number;
    hasInvoices: boolean;
    lastPaymentDate: string | null;
    lastPaymentAmount: number | null;
  };
}

export async function getReceptionistPatientProfile(
  patientId: string,
): Promise<ReceptionistPatientProfileData | null> {
  const profile = await requireStaff();
  const supabase = await createClient();

  // 1. Fetch Patient Demographics only (NO medical details/clinical history)
  let patientQuery = supabase
    .from("patients")
    .select(
      "id, first_name, last_name, phone, email, dob, gender, address, emergency_contact_name, emergency_contact_phone, created_at",
    )
    .eq("id", patientId);

  if (profile.organization_id) {
    patientQuery = patientQuery.eq("organization_id", profile.organization_id);
  }

  const { data: patient, error: patientError } = await patientQuery.maybeSingle();

  if (patientError || !patient) {
    return null;
  }

  // 2. Fetch Operational Appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, notes, practitioner_id, service_id, practitioners:practitioner_id(id, profiles:profile_id(full_name)), services:service_id(id, name, duration_minutes)",
    )
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: false });

  const now = new Date();
  const allAppts = appointments ?? [];

  // Determine Next Appointment (earliest active future appointment)
  const activeUpcoming = allAppts
    .filter(
      (a) =>
        new Date(a.starts_at) >= now &&
        !["cancelled", "no_show", "completed"].includes(a.status),
    )
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const rawNext = activeUpcoming[0] ?? null;

  let nextAppointment: ReceptionistPatientProfileData["nextAppointment"] = null;
  if (rawNext) {
    const pract = rawNext.practitioners as unknown as {
      id?: string;
      profiles: { full_name: string } | null;
    } | null;
    const serv = rawNext.services as unknown as {
      id?: string;
      name: string;
      duration_minutes: number;
    } | null;

    nextAppointment = {
      id: rawNext.id,
      starts_at: rawNext.starts_at,
      ends_at: rawNext.ends_at,
      status: rawNext.status,
      notes: rawNext.notes,
      practitionerName: pract?.profiles?.full_name ?? "Assigned Doctor",
      serviceName: serv?.name ?? "Dental Procedure",
      duration_minutes: serv?.duration_minutes ?? 30,
      practitionerId: rawNext.practitioner_id,
      serviceId: rawNext.service_id,
    };
  }

  // Format Appointment History (compact, operational, NO clinical notes or consultation IDs)
  const appointmentHistory = allAppts.map((appt) => {
    const pract = appt.practitioners as unknown as {
      profiles: { full_name: string } | null;
    } | null;
    const serv = appt.services as unknown as {
      name: string;
      duration_minutes: number;
    } | null;

    return {
      id: appt.id,
      starts_at: appt.starts_at,
      status: appt.status,
      practitionerName: pract?.profiles?.full_name ?? "Doctor",
      serviceName: serv?.name ?? "General Visit",
      duration_minutes: serv?.duration_minutes ?? 30,
    };
  });

  // 3. Form Status (Check presence ONLY without querying sensitive medical responses)
  const { data: medHistory, count: medHistoryCount } = await supabase
    .from("medical_history")
    .select("created_at", { count: "exact" })
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1);

  const medicalFormSubmitted = (medHistoryCount ?? 0) > 0;
  const medicalFormUpdatedAt = medHistory?.[0]?.created_at ?? null;

  // 4. Account Summary
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, total, status, issue_date")
    .eq("patient_id", patientId)
    .order("issue_date", { ascending: false });

  const invoiceList = invoices ?? [];
  const invoiceIds = invoiceList.map((i) => i.id);

  let paidAmount = 0;
  let lastPaymentDate: string | null = null;
  let lastPaymentAmount: number | null = null;

  if (invoiceIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, paid_at")
      .in("invoice_id", invoiceIds)
      .order("paid_at", { ascending: false });

    const paymentList = payments ?? [];
    paidAmount = paymentList.reduce((sum, p) => sum + Number(p.amount), 0);
    if (paymentList.length > 0) {
      lastPaymentDate = paymentList[0].paid_at;
      lastPaymentAmount = Number(paymentList[0].amount);
    }
  }

  const totalInvoiced = invoiceList.reduce((sum, i) => sum + Number(i.total), 0);
  const outstandingBalance = Math.max(0, totalInvoiced - paidAmount);

  return {
    patient: {
      ...patient,
      patient_reference: `PT-${patient.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      full_name: `${patient.first_name} ${patient.last_name}`.trim(),
    },
    nextAppointment,
    appointmentHistory,
    formStatus: {
      registrationComplete: true,
      medicalFormSubmitted,
      medicalFormUpdatedAt,
    },
    accountSummary: {
      totalInvoiced,
      outstandingBalance,
      paidAmount,
      hasInvoices: invoiceList.length > 0,
      lastPaymentDate,
      lastPaymentAmount,
    },
  };
}

const patientAdminSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(40),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(40).optional(),
});

export type PatientAdminInput = z.infer<typeof patientAdminSchema>;

export async function updatePatientAdministrativeAction(
  patientId: string,
  input: PatientAdminInput,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const profile = await requireStaff();
    const parsed = patientAdminSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid patient details" };
    }

    const data = parsed.data;
    const supabase = await createClient();

    let updateQuery = supabase
      .from("patients")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email || null,
        dob: data.dob,
        gender: data.gender || null,
        address: data.address || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    if (profile.organization_id) {
      updateQuery = updateQuery.eq("organization_id", profile.organization_id);
    }

    const { error } = await updateQuery;

    if (error) return { success: false, error: error.message };

    revalidatePath(`/patients/${patientId}`);
    revalidatePath("/patients");
    return { success: true, error: null };
  } catch (err) {
    console.error("Failed to update patient administrative details:", err);
    return { success: false, error: err instanceof Error ? err.message : "Internal error updating patient" };
  }
}

export async function createPatientByStaffAction(
  input: PatientAdminInput,
): Promise<{ success: boolean; patientId: string | null; error: string | null }> {
  try {
    const profile = await requireStaff();
    const parsed = patientAdminSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, patientId: null, error: parsed.error.issues[0]?.message ?? "Invalid patient details" };
    }

    if (!profile.organization_id) {
      return { success: false, patientId: null, error: "Staff member is not associated with an organization." };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const { data: created, error } = await supabase
      .from("patients")
      .insert({
        organization_id: profile.organization_id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email || null,
        dob: data.dob,
        gender: data.gender || null,
        address: data.address || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, patientId: null, error: error.message };
    }

    revalidatePath("/patients");
    return { success: true, patientId: created.id, error: null };
  } catch (err) {
    console.error("Failed to create patient by staff:", err);
    return { success: false, patientId: null, error: err instanceof Error ? err.message : "Internal error creating patient" };
  }
}
