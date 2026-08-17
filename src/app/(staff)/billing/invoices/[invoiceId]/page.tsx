import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceDetail } from "@/components/shared/invoice-detail";
import { RecordPaymentForm } from "@/components/staff/record-payment-form";
import { getInvoiceDetail } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Invoice" };

export default async function StaffInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const result = await getInvoiceDetail(invoiceId);
  if (!result) notFound();

  const balance = Number(result.invoice.total) - result.payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <InvoiceDetail invoice={result.invoice} items={result.items} payments={result.payments}>
      {balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record a payment</CardTitle>
          </CardHeader>
          <CardContent>
            <RecordPaymentForm invoiceId={invoiceId} />
          </CardContent>
        </Card>
      )}
    </InvoiceDetail>
  );
}
