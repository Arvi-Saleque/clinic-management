import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { InvoiceDetail } from "@/components/shared/invoice-detail";
import { ButtonLink } from "@/components/ui/button";
import { getInvoiceDetail } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Invoice" };

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const result = await getInvoiceDetail(invoiceId);
  if (!result) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <ButtonLink href="/portal/invoices" variant="ghost" size="sm" className="-ml-2 gap-2"><ArrowLeft className="size-4" />Back to invoices</ButtonLink>
          <h1 className="mt-3 font-serif text-4xl">Invoice statement</h1>
          <p className="mt-2 text-sm text-text-muted">Itemised charges and all payments recorded against this invoice.</p>
        </div>
        <span className="flex items-center gap-2 text-xs text-text-muted"><ShieldCheck className="size-4 text-success" />Private billing record</span>
      </div>
      <InvoiceDetail invoice={result.invoice} items={result.items} payments={result.payments} />
    </div>
  );
}
