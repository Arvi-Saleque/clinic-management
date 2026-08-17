import "server-only";

import { cache } from "react";

import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const getOwnPortalPatient = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, phone, email, dob, gender, address, emergency_contact_name, emergency_contact_phone, created_at, updated_at",
    )
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!patient) return null;

  const { data: medicalHistory } = await supabase
    .from("medical_history")
    .select(
      "allergies, current_medications, chronic_conditions, past_surgeries, notes, source, created_at",
    )
    .eq("patient_id", patient.id)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ...patient,
    patient_reference: `PT-${patient.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    medical_history: medicalHistory,
  };
});

export async function getPatientPortalDashboard() {
  const patient = await getOwnPortalPatient();
  if (!patient) return { patient: null };
  const supabase = await createClient();

  const [appointmentsResult, invoicesResult, prescriptionsResult, notificationsResult, chartResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, starts_at, ends_at, status, notes, practitioners:practitioner_id(profiles:profile_id(full_name)), services:service_id(name, duration_minutes, price)",
        )
        .eq("patient_id", patient.id)
        .order("starts_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("id, invoice_number, status, total, issue_date, due_date")
        .eq("patient_id", patient.id)
        .order("issue_date", { ascending: false }),
      supabase
        .from("prescriptions")
        .select(
          "id, issued_at, status, practitioners:practitioner_id(profiles:profile_id(full_name)), prescription_items(id, medicine_name, dosage, frequency, duration, instructions)",
        )
        .eq("patient_id", patient.id)
        .order("issued_at", { ascending: false }),
      supabase
        .from("notifications_log")
        .select("id, type, status, created_at, appointments:appointment_id(starts_at)")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("odontogram_entries")
        .select(
          "id, tooth_number, status, condition_code, recommended_treatment, treatment_priority, planned_date, estimated_fee, recorded_at",
        )
        .eq("patient_id", patient.id)
        .eq("is_current", true),
    ]);

  const appointments = appointmentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const { data: payments } = invoiceIds.length
    ? await supabase.from("payments").select("invoice_id, amount").in("invoice_id", invoiceIds)
    : { data: [] as { invoice_id: string; amount: number }[] };

  const invoicesWithBalance = invoices.map((invoice) => {
    const paid = (payments ?? [])
      .filter((payment) => payment.invoice_id === invoice.id)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      ...invoice,
      paid,
      balance: Math.max(0, Number(invoice.total) - paid),
    };
  });

  return {
    patient,
    appointments,
    invoices: invoicesWithBalance,
    prescriptions: prescriptionsResult.data ?? [],
    notifications: notificationsResult.data ?? [],
    chart: chartResult.data ?? [],
  };
}

export async function getOwnAppointmentForReschedule(appointmentId: string) {
  const patient = await getOwnPortalPatient();
  if (!patient) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, status, practitioner_id, service_id, branch_id, practitioners:practitioner_id(id, title, branch_id, profiles:profile_id(full_name)), services:service_id(id, name, duration_minutes, price)",
    )
    .eq("id", appointmentId)
    .eq("patient_id", patient.id)
    .maybeSingle();
  if (!data || !["pending", "confirmed"].includes(data.status)) return null;
  return data;
}

