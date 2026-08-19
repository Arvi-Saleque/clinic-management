"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CreditCard,
  FileText,
  Loader2,
  Printer,
  Receipt,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecordPaymentDialog } from "@/components/staff/record-payment-dialog";
import { getInvoiceDetail } from "@/lib/server/directory";
import { cn, formatCurrency } from "@/lib/utils";

interface InvoiceDetailDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

type InvoiceDetailData = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;

function formatStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "partially_paid":
      return "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300";
    case "issued":
      return "border-blue-200/80 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
    case "void":
      return "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function formatPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash":
      return "Cash";
    case "card":
      return "Card";
    case "bank_transfer":
      return "Bank Transfer";
    case "other":
      return "Other";
    default:
      return method.replace("_", " ");
  }
}

export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
  onPaymentSuccess,
}: InvoiceDetailDialogProps) {
  const [data, setData] = React.useState<InvoiceDetailData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  const fetchDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await getInvoiceDetail(id);
      setData(res);
    } catch (err) {
      console.error("Failed to load invoice details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open && invoiceId) {
      fetchDetail(invoiceId);
    } else {
      setData(null);
    }
  }, [open, invoiceId, fetchDetail]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const invoice = data?.invoice;
  const items = data?.items ?? [];
  const payments = data?.payments ?? [];

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = invoice ? Math.max(0, Number(invoice.total) - totalPaid) : 0;
  const patientName = invoice?.patients
    ? `${invoice.patients.first_name} ${invoice.patients.last_name}`
    : "Patient";

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          {loading || !invoice ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Receipt className="size-5" />
                    </span>
                    <div>
                      <DialogTitle className="font-heading text-xl font-bold text-foreground">
                        {invoice.invoice_number}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        Issued {format(new Date(`${invoice.issue_date}T00:00:00`), "d MMMM yyyy")}
                        {invoice.due_date && ` · Due ${format(new Date(`${invoice.due_date}T00:00:00`), "d MMM yyyy")}`}
                      </DialogDescription>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                      formatStatusBadge(invoice.status),
                    )}
                  >
                    {invoice.status.replace("_", " ")}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Patient Banner */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <User className="size-4 text-muted-foreground/70" />
                  <div>
                    <span className="text-muted-foreground">Patient: </span>
                    {invoice.patients ? (
                      <Link
                        href={`/patients/${invoice.patients.id}`}
                        onClick={() => onOpenChange(false)}
                        className="font-bold text-foreground hover:text-primary transition-colors underline"
                      >
                        {patientName}
                      </Link>
                    ) : (
                      <span className="font-bold text-foreground">{patientName}</span>
                    )}
                  </div>
                </div>
                {invoice.patients?.phone && (
                  <span className="font-mono text-muted-foreground">{invoice.patients.phone}</span>
                )}
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span>Itemised Treatments &amp; Services</span>
                </div>

                <div className="rounded-xl border border-border/70 overflow-hidden text-xs">
                  <div className="grid grid-cols-[1fr_60px_90px_90px] gap-2 border-b border-border/60 bg-muted/30 px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                    <span>Description</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Unit</span>
                    <span className="text-right">Total</span>
                  </div>
                  <ul className="divide-y divide-border/60">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="grid grid-cols-[1fr_60px_90px_90px] gap-2 px-3 py-2.5 items-center"
                      >
                        <span className="font-medium text-foreground">{item.description}</span>
                        <span className="text-center text-muted-foreground">{item.quantity}</span>
                        <span className="text-right font-mono text-muted-foreground">
                          {formatCurrency(item.unit_price)}
                        </span>
                        <span className="text-right font-mono font-bold text-foreground">
                          {formatCurrency(item.line_total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="ml-auto max-w-xs space-y-1.5 text-xs rounded-xl border border-border/60 bg-muted/15 p-3.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {Number(invoice.tax_amount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax:</span>
                    <span className="font-mono font-medium">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount:</span>
                    <span className="font-mono font-medium">-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50 text-sm">
                  <span>Total Billed:</span>
                  <span className="font-mono">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-medium">
                  <span>Total Paid:</span>
                  <span className="font-mono font-bold">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-foreground pt-1 border-t border-border/50 text-sm">
                  <span>Remaining Balance:</span>
                  <span className={cn("font-mono", balance > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300")}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              {/* Payment History Ledger */}
              {payments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <CreditCard className="size-3.5 text-muted-foreground" />
                    <span>Payment History</span>
                  </div>
                  <div className="rounded-xl border border-border/70 overflow-hidden text-xs">
                    <div className="grid grid-cols-[110px_90px_1fr_90px] gap-2 border-b border-border/60 bg-muted/30 px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                      <span>Date</span>
                      <span>Method</span>
                      <span>Reference</span>
                      <span className="text-right">Amount</span>
                    </div>
                    <ul className="divide-y divide-border/60">
                      {payments.map((p) => (
                        <li
                          key={p.id}
                          className="grid grid-cols-[110px_90px_1fr_90px] gap-2 px-3 py-2 items-center text-xs"
                        >
                          <span className="text-muted-foreground">
                            {format(new Date(p.paid_at), "dd MMM yyyy")}
                          </span>
                          <span className="font-medium text-foreground">{formatPaymentMethodLabel(p.method)}</span>
                          <span className="truncate text-[11px] text-muted-foreground">{p.reference || "—"}</span>
                          <span className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-9 rounded-xl text-xs gap-1.5"
                >
                  <Printer className="size-3.5" />
                  Print Statement
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="h-9 rounded-xl text-xs"
                  >
                    Close
                  </Button>

                  {balance > 0 && invoice.status !== "void" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPaymentOpen(true)}
                      className="h-9 rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5 shadow-2xs"
                    >
                      <CreditCard className="size-3.5" />
                      Record Payment
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Nested Modal */}
      {invoice && paymentOpen && (
        <RecordPaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          patientName={patientName}
          totalAmount={Number(invoice.total)}
          balanceAmount={balance}
          onSuccess={() => {
            if (invoiceId) fetchDetail(invoiceId);
            onPaymentSuccess?.();
          }}
        />
      )}
    </>
  );
}
