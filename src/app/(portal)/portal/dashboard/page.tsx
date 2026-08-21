import type { Metadata } from "next";

import { PortalDashboardView } from "@/components/portal/portal-dashboard-view";
import { AppointmentSuccessToast } from "@/components/portal/appointment-success-toast";
import { getProfile } from "@/lib/auth/session";
import { getPatientPortalDashboard } from "@/lib/server/patient-portal";

export const metadata: Metadata = {
  title: "My Care Sanctuary | Patient Portal",
  description: "Personal dental care overview, upcoming visits, and appointments.",
};

export default async function PortalDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>;
}) {
  const [{ success }, profile, data] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({ success: undefined }),
    getProfile(),
    getPatientPortalDashboard(),
  ]);
  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "there";

  if (!data.patient) {
    return (
      <>
        <AppointmentSuccessToast success={success} />
        <PortalDashboardView
          firstName={firstName}
          patientReference={null}
          registered={false}
          upcomingAppointments={[]}
          allergies={[]}
          conditions={[]}
          medications={[]}
          notifications={[]}
        />
      </>
    );
  }

  const now = new Date();
  const appointments = data.appointments;
  const upcoming = appointments
    .filter(
      (appointment) =>
        ["pending", "confirmed"].includes(appointment.status) &&
        new Date(appointment.starts_at) > now,
    )
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  const mapAppointment = (appointment: (typeof appointments)[number]) => ({
    id: appointment.id,
    starts_at: appointment.starts_at,
    ends_at: appointment.ends_at ?? null,
    status: appointment.status,
    serviceName: appointment.services?.name ?? "Comprehensive Dental Care",
    price: appointment.services?.price ?? 0,
    duration: appointment.services?.duration_minutes ?? 45,
    practitionerName:
      appointment.practitioners?.profiles?.full_name ?? "Lead Dental Specialist",
    notes: appointment.notes ?? null,
  });

  return (
    <>
      <AppointmentSuccessToast success={success} />
      <PortalDashboardView
        firstName={data.patient.first_name || firstName}
        patientReference={data.patient.patient_reference}
        registered
        upcomingAppointments={upcoming.map(mapAppointment)}
        allergies={data.patient.medical_history?.allergies ?? []}
        conditions={data.patient.medical_history?.chronic_conditions ?? []}
        medications={data.patient.medical_history?.current_medications ?? []}
        notifications={data.notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          created_at: notification.created_at,
        }))}
      />
    </>
  );
}
