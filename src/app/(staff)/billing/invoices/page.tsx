import type { Metadata } from "next";

import { ReceptionistBillingWorkspace } from "@/components/staff/receptionist-billing-workspace";
import { requireStaff } from "@/lib/auth/guards";
import { listInvoices } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Billing & Invoices" };

export default async function StaffInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const profile = await requireStaff();
  const params = await searchParams;
  const invoices = await listInvoices(params.patient);

  return (
    <ReceptionistBillingWorkspace
      invoices={invoices}
      userRole={profile.role}
      patientFilterId={params.patient}
    />
  );
}
