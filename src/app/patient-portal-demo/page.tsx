import type { Metadata } from "next";

import { PortalDashboardView } from "@/components/portal/portal-dashboard-view";
import { PortalShell } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: "Patient portal concept" };

export default function PatientPortalDemoPage() {
  const visit1Date = new Date(Date.now() + 86400000 * 2).toISOString();
  const visit2Date = new Date(Date.now() + 86400000 * 21).toISOString();

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
        upcomingAppointments={[
          {
            id: "demo-next-1",
            starts_at: visit1Date,
            ends_at: null,
            status: "confirmed",
            serviceName: "Gentle Cleaning & Composite Restoration",
            price: 3200,
            duration: 45,
            practitionerName: "Dr. Amelia Rahman",
            notes: "Comfort kit requested",
          },
          {
            id: "demo-next-2",
            starts_at: visit2Date,
            ends_at: null,
            status: "confirmed",
            serviceName: "Enamel Polish & Follow-Up Evaluation",
            price: 1800,
            duration: 30,
            practitionerName: "Dr. Amelia Rahman",
            notes: "Follow-up visit",
          },
        ]}
      />
    </PortalShell>
  );
}
