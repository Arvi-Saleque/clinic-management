import { requirePatient } from "@/lib/auth/guards";
import { PortalShell } from "@/components/portal/portal-shell";
import { getOwnPortalPatient } from "@/lib/server/patient-portal";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePatient();
  const patient = await getOwnPortalPatient();

  return (
    <PortalShell
      profile={{ full_name: profile.full_name, email: profile.email }}
      patientReference={patient?.patient_reference ?? null}
      registered={Boolean(patient)}
    >
      {children}
    </PortalShell>
  );
}
