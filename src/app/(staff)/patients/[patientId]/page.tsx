import { notFound, redirect } from "next/navigation";
import { resolveOrCreatePatientEncounterId } from "@/lib/server/encounters";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const encounterId = await resolveOrCreatePatientEncounterId(patientId);

  if (!encounterId) {
    notFound();
  }

  redirect(`/clinical/encounters/${encounterId}`);
}
