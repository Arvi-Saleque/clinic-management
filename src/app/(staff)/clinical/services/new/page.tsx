import type { Metadata } from "next";
import { requireClinician } from "@/lib/auth/guards";
import { getNewServiceContext } from "@/lib/server/doctor-services";
import { ServiceForm } from "@/components/staff/service-form";

export const metadata: Metadata = {
  title: "Add Service | Clinical Services",
  description: "Create and configure a new clinical treatment offering.",
};

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ practitioner?: string }>;
}) {
  await requireClinician();
  const params = await searchParams;
  const context = await getNewServiceContext(params.practitioner);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ServiceForm mode="create" context={context} />
    </div>
  );
}
