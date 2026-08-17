import type { Metadata } from "next";

import { PortalDashboardView } from "@/components/portal/portal-dashboard-view";
import { PortalShell } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: "Patient portal concept" };

export default function PatientPortalDemoPage() {
  return (
    <PortalShell
      profile={{ full_name: "Sophie Turner", email: "sophie@example.com" }}
      patientReference="PT-81F4C2A9"
      registered
    >
      <PortalDashboardView
        firstName="Sophie"
        patientReference="PT-81F4C2A9"
        registered
        nextAppointment={{
          id: "demo-next",
          starts_at: "2026-08-17T10:30:00+06:00",
          status: "confirmed",
          serviceName: "Composite restoration",
          practitionerName: "Dr Amelia Rahman",
        }}
        upcomingCount={2}
        completedCount={6}
        outstandingBalance={3200}
        activePrescriptionCount={2}
        chartedTeeth={8}
        plannedTreatments={2}
        allergies={["Penicillin"]}
        conditions={[]}
        medications={["Ibuprofen 400mg"]}
        recentAppointments={[
          { id: "demo-1", starts_at: "2026-08-17T10:30:00+06:00", status: "confirmed", serviceName: "Composite restoration", practitionerName: "Dr Amelia Rahman" },
          { id: "demo-2", starts_at: "2026-07-28T09:00:00+06:00", status: "completed", serviceName: "Routine examination", practitionerName: "Dr Amelia Rahman" },
          { id: "demo-3", starts_at: "2026-06-18T14:15:00+06:00", status: "completed", serviceName: "Dental hygiene", practitionerName: "Dr Karim Hasan" },
        ]}
        notifications={[
          { id: "note-1", type: "booking_confirmation", created_at: "2026-08-14T10:00:00+06:00" },
          { id: "note-2", type: "reminder", created_at: "2026-07-27T10:00:00+06:00" },
        ]}
      />
    </PortalShell>
  );
}
