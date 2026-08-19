import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ReceptionistPatientProfileView } from "@/components/staff/receptionist-patient-profile";
import { requireStaff } from "@/lib/auth/guards";
import { resolveOrCreatePatientEncounterId } from "@/lib/server/encounters";
import { getReceptionistPatientProfile } from "@/lib/server/patients";
import { listPractitioners, listServices } from "@/lib/server/directory";

interface PageProps {
  params: Promise<{ patientId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { patientId } = await params;
  const profile = await requireStaff();

  if (profile.role === "receptionist") {
    const data = await getReceptionistPatientProfile(patientId);
    if (!data) return { title: "Patient Profile" };
    return {
      title: `${data.patient.full_name} (${data.patient.patient_reference}) | Patient Profile`,
    };
  }

  return { title: "Patient Details" };
}

export default async function PatientDetailPage({ params }: PageProps) {
  const profile = await requireStaff();
  const { patientId } = await params;

  // 1. RECEPTIONIST FLOW: Dedicated Administrative Patient Profile
  if (profile.role === "receptionist") {
    const [data, practitioners, services] = await Promise.all([
      getReceptionistPatientProfile(patientId),
      listPractitioners(),
      listServices(),
    ]);

    if (!data) {
      notFound();
    }

    const defaultBranchId = practitioners[0]?.branch_id ?? "";

    return (
      <ReceptionistPatientProfileView
        data={data}
        practitioners={practitioners}
        services={services}
        branchId={defaultBranchId}
      />
    );
  }

  // 2. DENTIST / CLINICIAN FLOW: Automatic Clinical Consultation Routing
  const encounterId = await resolveOrCreatePatientEncounterId(patientId);

  if (!encounterId) {
    notFound();
  }

  redirect(`/clinical/encounters/${encounterId}`);
}
