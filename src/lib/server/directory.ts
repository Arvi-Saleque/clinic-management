"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile, getUser } from "@/lib/auth/session";
import { requireClinician, requireStaff } from "@/lib/auth/guards";
import type { ServicePractitionerOption } from "@/types/services";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listPractitioners() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("id, title, branch_id, profiles:profile_id(full_name)")
    .eq("is_bookable", true)
    .order("id");
  return data ?? [];
}

export async function listPractitionersForService(serviceId: string): Promise<ServicePractitionerOption[]> {
  if (!serviceId || typeof serviceId !== "string" || !UUID_REGEX.test(serviceId)) {
    return [];
  }

  // 1. Resolve current authenticated profile and organization
  const profile = await getProfile();
  if (!profile?.organization_id) {
    return [];
  }

  const supabase = await createClient();

  // 2. Fetch the active service to ensure existence, active status, and canonical organization
  const { data: service } = await supabase
    .from("services")
    .select("id, organization_id, duration_minutes, price, is_active")
    .eq("id", serviceId)
    .eq("is_active", true)
    .maybeSingle();

  if (!service || service.organization_id !== profile.organization_id) {
    return [];
  }

  // 2. Query practitioner_services joined with bookable practitioners
  const { data: rows } = await supabase
    .from("practitioner_services")
    .select(`
      override_duration_minutes,
      override_price,
      practitioners:practitioner_id!inner (
        id,
        title,
        branch_id,
        is_bookable,
        branches:branch_id!inner (
          organization_id
        ),
        profiles:profile_id (
          full_name
        )
      )
    `)
    .eq("service_id", serviceId)
    .eq("practitioners.is_bookable", true);

  if (!rows || rows.length === 0) return [];

  const baseDuration = service.duration_minutes;
  const basePrice = Number(service.price);

  return rows
    .filter((row) => {
      const practitioner = row.practitioners as unknown as {
        id: string;
        title: string | null;
        branch_id: string;
        is_bookable: boolean;
        branches: { organization_id: string } | null;
        profiles: { full_name: string } | null;
      } | null;

      if (!practitioner) return false;
      // Enforce organization alignment
      if (practitioner.branches?.organization_id !== service.organization_id) return false;
      return true;
    })
    .map((row) => {
      const practitioner = row.practitioners as unknown as {
        id: string;
        title: string | null;
        branch_id: string;
        is_bookable: boolean;
        branches: { organization_id: string } | null;
        profiles: { full_name: string } | null;
      };

      const doctorName = practitioner.profiles?.full_name ?? "Doctor";
      const overrideDuration = row.override_duration_minutes ?? null;
      const overridePrice =
        row.override_price !== null && row.override_price !== undefined ? Number(row.override_price) : null;
      const effectiveDuration = overrideDuration ?? baseDuration;
      const effectivePrice = overridePrice ?? basePrice;

      return {
        id: practitioner.id,
        practitioner_id: practitioner.id,
        doctor_name: doctorName,
        title: practitioner.title,
        branch_id: practitioner.branch_id,
        service_id: service.id,
        effective_duration_minutes: effectiveDuration,
        base_duration_minutes: baseDuration,
        override_duration_minutes: overrideDuration,
        effective_price: effectivePrice,
        base_price: basePrice,
        override_price: overridePrice,
        profiles: practitioner.profiles ? { full_name: doctorName } : null,
      };
    })
    .sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));
}

export async function listServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function searchPatients(query: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  let request = supabase
    .from("patients")
    .select("id, first_name, last_name, phone")
    .order("first_name")
    .limit(20);

  if (profile.organization_id) {
    request = request.eq("organization_id", profile.organization_id);
  }

  if (query.trim()) {
    request = request.or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`,
    );
  }

  const { data } = await request;
  return data ?? [];
}

export async function listAppointmentsForDay(practitionerId: string, date: string) {
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
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, notes, originating_encounter_id, patients:patient_id(id, first_name, last_name, phone), services:service_id(id, name, duration_minutes)",
    )
    .eq("practitioner_id", allowedPractitionerId)
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .order("starts_at");

  return data ?? [];
}

export async function listOwnAppointments() {
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
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, notes, practitioners:practitioner_id(profiles:profile_id(full_name)), services:service_id(name, duration_minutes, price)",
    )
    .eq("patient_id", patient.id)
    .order("starts_at", { ascending: false });

  return data ?? [];
}

export async function listInvoices(patientId?: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("id, invoice_number, status, subtotal, discount_amount, tax_amount, total, issue_date, due_date, created_at, patients:patient_id(id, first_name, last_name, phone)")
    .order("issue_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data } = await query;
  const invoices = data ?? [];
  if (invoices.length === 0) return [];
  const { data: payments } = await supabase.from("payments").select("invoice_id, amount").in("invoice_id", invoices.map((invoice) => invoice.id));
  return invoices.map((invoice) => {
    const paidAmount = (payments ?? []).filter((payment) => payment.invoice_id === invoice.id).reduce((sum, payment) => sum + Number(payment.amount), 0);
    return { ...invoice, paid_amount: paidAmount, balance: Math.max(0, Number(invoice.total) - paidAmount) };
  });
}

export async function listOwnInvoices() {
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
    .from("invoices")
    .select("id, invoice_number, status, subtotal, discount_amount, tax_amount, total, issue_date, due_date, payments(amount)")
    .eq("patient_id", patient.id)
    .order("issue_date", { ascending: false });
  return (data ?? []).map((invoice) => {
    const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return {
      ...invoice,
      paid_amount: paidAmount,
      balance: Math.max(0, Number(invoice.total) - paidAmount),
    };
  });
}

export async function getInvoiceDetail(invoiceId: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, subtotal, tax_amount, discount_amount, total, due_date, issue_date, notes, patients:patient_id(id, first_name, last_name, phone)",
    )
    .eq("id", invoiceId);

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data: invoice } = await query.maybeSingle();
  if (!invoice) return null;

  const { data: items } = await supabase
    .from("invoice_items")
    .select("id, description, quantity, unit_price, line_total")
    .eq("invoice_id", invoiceId);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, paid_at, reference")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });

  return { invoice, items: items ?? [], payments: payments ?? [] };
}

export async function listStaffPrescriptions() {
  await requireClinician();
  const supabase = await createClient();
  const { data } = await supabase
    .from("prescriptions")
    .select(
      "id, issued_at, status, notes, patients:patient_id(id, first_name, last_name, phone), practitioners:practitioner_id(profiles:profile_id(full_name)), prescription_items(id, medicine_name, dosage, frequency, duration, instructions)",
    )
    .order("issued_at", { ascending: false });
  return data ?? [];
}

export async function listOwnPrescriptions() {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!patient) return [];

  const { data: prescriptions, error: rxError } = await supabase
    .from("prescriptions")
    .select(
      "id, appointment_id, encounter_id, issued_at, status, notes, practitioners:practitioner_id(profiles:profile_id(full_name)), prescription_items(id, medicine_name, dosage, frequency, duration, instructions)",
    )
    .eq("patient_id", patient.id)
    .order("issued_at", { ascending: false });

  if (rxError || !prescriptions || prescriptions.length === 0) {
    return [];
  }

  // Gather encounter_ids and appointment_ids to resolve clinical encounter details
  const encounterIds = prescriptions.map((p) => p.encounter_id).filter(Boolean) as string[];
  const appointmentIds = prescriptions.map((p) => p.appointment_id).filter(Boolean) as string[];

  const encountersMap = new Map<
    string,
    { chief_complaint: string | null; diagnosis: string | null; performed_treatment: string | null; patient_notes: string | null }
  >();

  if (encounterIds.length > 0 || appointmentIds.length > 0) {
    const conditions: string[] = [];
    if (encounterIds.length > 0) {
      conditions.push(`id.in.(${encounterIds.join(",")})`);
    }
    if (appointmentIds.length > 0) {
      conditions.push(`appointment_id.in.(${appointmentIds.join(",")})`);
    }

    const { data: encs } = await supabase
      .from("clinical_encounters")
      .select("id, appointment_id, chief_complaint, diagnosis, performed_treatment, patient_notes")
      .or(conditions.join(","));

    if (encs) {
      for (const e of encs) {
        if (e.id) encountersMap.set(e.id, e);
        if (e.appointment_id) encountersMap.set(e.appointment_id, e);
      }
    }
  }

  return prescriptions.map((rx) => {
    const enc =
      (rx.encounter_id ? encountersMap.get(rx.encounter_id) : null) ||
      (rx.appointment_id ? encountersMap.get(rx.appointment_id) : null);

    return {
      ...rx,
      clinical_encounters: enc ?? null,
    };
  });
}

export async function listPatients(query?: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  const normalized = query?.trim() ?? "";
  const searchingByReference = /^pt-/i.test(normalized);

  // If user is a dentist/clinician, only show patients that made an appointment with this doctor
  let practitionerId: string | null = null;
  let assignedPatientIds: string[] | null = null;

  if (profile.role === "dentist") {
    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (practitioner) {
      practitionerId = practitioner.id;
      const { data: docAppointments } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("practitioner_id", practitioner.id);

      assignedPatientIds = Array.from(
        new Set((docAppointments ?? []).map((a) => a.patient_id).filter(Boolean)),
      );

      // If doctor has no booked patients yet, return empty list
      if (assignedPatientIds.length === 0) {
        return [];
      }
    }
  }

  let request = supabase
    .from("patients")
    .select("id, first_name, last_name, phone, dob, created_at")
    .order("created_at", { ascending: false })
    .limit(250);

  if (profile.organization_id) {
    request = request.eq("organization_id", profile.organization_id);
  }

  // Doctor side filtering: only patients that booked an appointment with this doctor
  if (assignedPatientIds !== null) {
    request = request.in("id", assignedPatientIds);
  }

  if (normalized && !searchingByReference) {
    request = request.or(
      `first_name.ilike.%${normalized}%,last_name.ilike.%${normalized}%,phone.ilike.%${normalized}%`,
    );
  }

  const { data } = await request;
  let patients = data ?? [];
  if (searchingByReference) {
    const wanted = normalized.replace(/[^a-z0-9]/gi, "").replace(/^pt/i, "").toLowerCase();
    patients = patients.filter((patient) =>
      patient.id.replace(/-/g, "").toLowerCase().startsWith(wanted),
    );
  }
  if (patients.length === 0) return [];

  // Query appointments - for dentist, filter by this practitioner
  let appointmentsQuery = supabase
    .from("appointments")
    .select("id, patient_id, practitioner_id, starts_at, status, notes, services:service_id(name)")
    .in("patient_id", patients.map((patient) => patient.id))
    .order("starts_at", { ascending: false });

  if (practitionerId) {
    appointmentsQuery = appointmentsQuery.eq("practitioner_id", practitionerId);
  }

  const { data: appointments } = await appointmentsQuery;

  const now = new Date();
  return patients.map((patient) => {
    const patientAppointments = (appointments ?? []).filter(
      (appointment) => appointment.patient_id === patient.id,
    );

    // Latest appointment of this patient with the doctor
    const rawLatestVisit = patientAppointments.length > 0 ? patientAppointments[0] : null;
    const latestVisit = rawLatestVisit
      ? {
          ...rawLatestVisit,
          status: rawLatestVisit.status === "pending" ? "confirmed" : rawLatestVisit.status,
        }
      : null;

    const followUp = [...patientAppointments]
      .reverse()
      .find(
        (appointment) =>
          new Date(appointment.starts_at) > now &&
          !["cancelled", "no_show"].includes(appointment.status),
      );

    return {
      ...patient,
      patient_reference: `PT-${patient.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      latest_visit: latestVisit,
      follow_up: followUp
        ? {
            ...followUp,
            status: followUp.status === "pending" ? "confirmed" : followUp.status,
          }
        : null,
    };
  });
}

export async function getPatientById(patientId: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select(
      "id, first_name, last_name, phone, email, dob, gender, address, emergency_contact_name, emergency_contact_phone, created_at",
    )
    .eq("id", patientId);

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data } = await query.maybeSingle();
  return data;
}

export async function getPatientMedicalHistory(patientId: string) {
  await requireClinician();
  const supabase = await createClient();
  const { data } = await supabase
    .from("medical_history")
    .select("allergies, current_medications, chronic_conditions, past_surgeries, notes, source, created_at")
    .eq("patient_id", patientId)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export interface PatientAppointmentHistoryItem {
  id: string;
  starts_at: string;
  status: string;
  notes: string | null;
  practitioners: { profiles: { full_name: string } | null } | null;
  services: { name: string } | null;
  encounter_id: string | null;
  encounter_status: string | null;
}

export async function listAppointmentsForPatient(
  patientId: string,
): Promise<PatientAppointmentHistoryItem[]> {
  const supabase = await createClient();

  // 1. Fetch appointments belonging to this patient
  const { data: appointments, error: apptError } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, status, notes, practitioners:practitioner_id(profiles:profile_id(full_name)), services:service_id(name)",
    )
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: false });

  if (apptError || !appointments || appointments.length === 0) {
    return [];
  }

  // 2. Extract appointment IDs for targeted encounter resolution
  const appointmentIds = appointments.map((appt) => appt.id);
  const encountersByApptId = new Map<string, { id: string; status: string }>();

  // 3. Query clinical_encounters ONLY for the loaded appointment IDs
  if (appointmentIds.length > 0) {
    const { data: encounters, error: encError } = await supabase
      .from("clinical_encounters")
      .select("id, appointment_id, status")
      .in("appointment_id", appointmentIds);

    if (encError) {
      console.error("Error fetching clinical encounters for patient appointments:", encError);
    }

    for (const enc of encounters ?? []) {
      if (enc.appointment_id) {
        encountersByApptId.set(enc.appointment_id, {
          id: enc.id,
          status: enc.status,
        });
      }
    }
  }

  // 4. Map appointments with resolved encounter metadata
  return appointments.map((row) => {
    const enc = encountersByApptId.get(row.id);
    return {
      id: row.id,
      starts_at: row.starts_at,
      status: row.status,
      notes: row.notes,
      practitioners: row.practitioners as unknown as {
        profiles: { full_name: string } | null;
      } | null,
      services: row.services as unknown as { name: string } | null,
      encounter_id: enc?.id ?? null,
      encounter_status: enc?.status ?? null,
    };
  });
}

export async function listInvoicesForPatient(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, issue_date")
    .eq("patient_id", patientId)
    .order("issue_date", { ascending: false });
  return data ?? [];
}

export async function listPrescriptionsForPatient(patientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prescriptions")
    .select(
      "id, issued_at, notes, practitioners:practitioner_id(profiles:profile_id(full_name)), prescription_items(id, medicine_name, dosage, frequency, duration, instructions)",
    )
    .eq("patient_id", patientId)
    .order("issued_at", { ascending: false });
  return data ?? [];
}

export async function listOwnNotifications() {
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
    .from("notifications_log")
    .select("id, type, status, created_at, appointments:appointment_id(starts_at)")
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}
