import type { Metadata } from "next";

import { requireClinician } from "@/lib/auth/guards";
import { getDoctorServicesContext } from "@/lib/server/doctor-services";
import { DoctorServicesManager } from "@/components/staff/doctor-services-manager";

export const metadata: Metadata = {
  title: "Services & Treatments",
  description: "Configure offered clinical services and customized appointment durations.",
};

export default async function DoctorServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ practitioner?: string }>;
}) {
  await requireClinician();
  const params = await searchParams;
  const context = await getDoctorServicesContext(params.practitioner);

  return <DoctorServicesManager key={context.practitioner?.id ?? "none"} context={context} />;
}
