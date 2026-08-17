import type { Metadata } from "next";

import { PortalDashboardView } from "@/components/portal/portal-dashboard-view";
import { getProfile } from "@/lib/auth/session";
import { getPatientPortalDashboard } from "@/lib/server/patient-portal";

export const metadata: Metadata = { title: "My care overview" };

export default async function PortalDashboardPage() {
  const [profile, data] = await Promise.all([getProfile(), getPatientPortalDashboard()]);
  const firstName = profile?.full_name.split(" ")[0] ?? "there";

  if (!data.patient) {
    return <PortalDashboardView firstName={firstName} patientReference={null} registered={false} nextAppointment={null} upcomingCount={0} completedCount={0} outstandingBalance={0} activePrescriptionCount={0} chartedTeeth={0} plannedTreatments={0} allergies={[]} conditions={[]} medications={[]} recentAppointments={[]} notifications={[]} />;
  }

  const now = new Date();
  const appointments = data.appointments;
  const upcoming = appointments
    .filter((appointment) => ["pending", "confirmed"].includes(appointment.status) && new Date(appointment.starts_at) > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const completedCount = appointments.filter((appointment) => appointment.status === "completed").length;
  const plannedTreatments = data.chart.filter((entry) => entry.recommended_treatment || ["planned", "in_progress"].includes(entry.status)).length;
  const activePrescriptions = data.prescriptions.filter((prescription) => prescription.status !== "void");
  const activePrescriptionCount = activePrescriptions.flatMap((prescription) => prescription.prescription_items).length;
  const mapAppointment = (appointment: (typeof appointments)[number]) => ({
    id: appointment.id,
    starts_at: appointment.starts_at,
    status: appointment.status,
    serviceName: appointment.services?.name ?? "Dental visit",
    practitionerName: appointment.practitioners?.profiles?.full_name ?? "Clinic practitioner",
  });

  return (
    <PortalDashboardView
      firstName={data.patient.first_name || firstName}
      patientReference={data.patient.patient_reference}
      registered
      nextAppointment={upcoming[0] ? mapAppointment(upcoming[0]) : null}
      upcomingCount={upcoming.length}
      completedCount={completedCount}
      outstandingBalance={data.invoices.reduce((sum, invoice) => sum + invoice.balance, 0)}
      activePrescriptionCount={activePrescriptionCount}
      chartedTeeth={data.chart.length}
      plannedTreatments={plannedTreatments}
      allergies={data.patient.medical_history?.allergies ?? []}
      conditions={data.patient.medical_history?.chronic_conditions ?? []}
      medications={data.patient.medical_history?.current_medications ?? []}
      recentAppointments={appointments.slice(0, 4).map(mapAppointment)}
      notifications={data.notifications.map((notification) => ({ id: notification.id, type: notification.type, created_at: notification.created_at }))}
    />
  );
}
