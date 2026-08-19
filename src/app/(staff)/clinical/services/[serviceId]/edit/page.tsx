import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSingleServiceContext } from "@/lib/server/doctor-services";
import { ServiceForm } from "@/components/staff/service-form";

export const metadata: Metadata = {
  title: "Edit Service | Clinical Services",
  description: "Update treatment configuration, appointment duration and practitioner fee.",
};

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ practitioner?: string }>;
}) {
  const { serviceId } = await params;
  const { practitioner } = await searchParams;

  const context = await getSingleServiceContext(serviceId, practitioner);

  if (context.serviceNotFound || !context.service) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ServiceForm mode="edit" context={context} />
    </div>
  );
}
