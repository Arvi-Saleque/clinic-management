"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileEdit,
  Landmark,
  Loader2,
  Phone,
  Plus,
  Printer,
  Receipt,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { getInvoiceDetail } from "@/lib/server/directory";
import {
  recordDirectPaymentAction,
  updateDraftInvoiceAction,
} from "@/lib/server/invoices";
import { cn, formatClinicDate, formatCurrency } from "@/lib/utils";
import {
  PaymentSuccessDialog,
  PaymentSuccessData,
} from "@/components/staff/payment-success-dialog";
import { printInvoiceStatement } from "@/lib/utils/print-invoice";

interface InvoiceDetailDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess?: () => void;
}

type InvoiceDetailData = NonNullable<Awaited<ReturnType<typeof getInvoiceDetail>>>;

type BillingStatus = "draft" | "issued" | "partially_paid" | "paid";
type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";

interface EditableItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function formatStatusHeaderBadge(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "partially_paid":
      return "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300";
    case "issued":
      return "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
    case "draft":
      return "bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300";
    default:
      return "bg-muted text-foreground border-border";
  }
}

function formatStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid in Full";
    case "partially_paid":
      return "Part Paid";
    case "issued":
      return "Outstanding";
    case "draft":
      return "Draft";
    case "void":
      return "Void";
    default:
      return status.replace("_", " ");
  }
}

function formatPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash":
      return "Cash";
    case "card":
      return "Card / POS";
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Draft Edit State
  const [editableItems, setEditableItems] = React.useState<EditableItem[]>([]);
  const [discountType, setDiscountType] = React.useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = React.useState<number>(0);
  const [settlementStatus, setSettlementStatus] = React.useState<BillingStatus>("paid");
  const [partialAmount, setPartialAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("card");

  // Outstanding Installment Payment State
  const [installmentAmount, setInstallmentAmount] = React.useState<number>(0);
  const [installmentMethod, setInstallmentMethod] = React.useState<PaymentMethod>("card");
  const [isRecordingInstallment, setIsRecordingInstallment] = React.useState(false);

  // Payment Success Confirmation Modal State
  const [successModalOpen, setSuccessModalOpen] = React.useState(false);
  const [successModalData, setSuccessModalData] = React.useState<PaymentSuccessData | null>(null);

  const fetchDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await getInvoiceDetail(id);
      setData(res);

      if (res?.invoice) {
        const currentPaid = (res.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
        const currentBalance = Math.max(0, Number(res.invoice.total) - currentPaid);
        setInstallmentAmount(currentBalance);
        setInstallmentMethod("card");

        if (res.invoice.status === "draft") {
          const mappedItems: EditableItem[] =
            res.items.length > 0
              ? res.items.map((i) => ({
                  id: i.id,
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: Number(i.unit_price),
                }))
              : [
                  {
                    description: "Clinical Treatment",
                    quantity: 1,
                    unitPrice: Number(res.invoice.subtotal) || 0,
                  },
                ];

          setEditableItems(mappedItems);
          setDiscountValue(Number(res.invoice.discount_amount) || 0);
          setDiscountType("fixed");
          setSettlementStatus("issued");
          setPartialAmount(0);
          setPaymentMethod("card");
        }
      }
    } catch (err) {
      console.error("Failed to load invoice details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && invoiceId) {
      fetchDetail(invoiceId);
    } else {
      setData(null);
    }
  }, [open, invoiceId, fetchDetail]);

  const invoice = data?.invoice;
  const isDraft = invoice?.status === "draft";
  const items = data?.items ?? [];
  const payments = data?.payments ?? [];

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = invoice ? Math.max(0, Number(invoice.total) - totalPaid) : 0;
  const patientName = invoice?.patients
    ? `${invoice.patients.first_name} ${invoice.patients.last_name}`
    : "Patient";

  // Draft Calculation Logic
  const draftSubtotal = React.useMemo(() => {
    return editableItems.reduce(
      (sum, item) =>
        sum +
        Math.max(1, Number(item.quantity || 1)) * Math.max(0, Number(item.unitPrice || 0)),
      0,
    );
  }, [editableItems]);

  const calculatedDiscount = React.useMemo(() => {
    if (discountType === "percentage") {
      return (draftSubtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(draftSubtotal, Math.max(0, discountValue));
  }, [draftSubtotal, discountType, discountValue]);

  const draftNetTotal = Math.max(0, draftSubtotal - calculatedDiscount);
  const draftRemainingBalance = Math.max(0, draftNetTotal - partialAmount);

  // Line Item Handlers
  const handleAddItem = () => {
    setEditableItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (editableItems.length <= 1) return;
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof EditableItem, value: any) => {
    setEditableItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const applyQuickDiscount = (val: number, type: "fixed" | "percentage") => {
    setDiscountType(type);
    setDiscountValue(val);
  };

  function handlePrint() {
    if (!invoice) return;
    printInvoiceStatement({
      invoiceNumber: invoice.invoice_number,
      issueDate: format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMMM yyyy"),
      dueDate: invoice.due_date
        ? format(new Date(`${invoice.due_date}T00:00:00`), "dd MMMM yyyy")
        : null,
      status: invoice.status,
      patientName: patientName,
      patientPhone: invoice.patients?.phone,
      patientRef: invoice.patients?.id
        ? `PT-${invoice.patients.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`
        : null,
      subtotal: Number(invoice.subtotal),
      discountAmount: Number(invoice.discount_amount),
      total: Number(invoice.total),
      totalPaid: totalPaid,
      balance: balance,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        lineTotal: Number(i.line_total),
      })),
      payments: payments.map((p) => ({
        date: formatClinicDate(p.paid_at, { day: "2-digit", month: "long", year: "numeric" }),
        method: p.method,
        amount: Number(p.amount),
      })),
    });
  }

  // Handle Save / Finalize Draft
  async function handleSaveDraftAction(targetStatus: BillingStatus) {
    if (!invoice) return;
    setIsSubmitting(true);

    try {
      const res = await updateDraftInvoiceAction({
        invoiceId: invoice.id,
        items: editableItems,
        discountAmount: calculatedDiscount,
        taxAmount: 0,
        status: targetStatus,
        paidAmount: targetStatus === "partially_paid" ? partialAmount : undefined,
        paymentMethod:
          targetStatus === "paid" || targetStatus === "partially_paid"
            ? paymentMethod
            : undefined,
      });

      if (res.success) {
        if (targetStatus === "paid") {
          if (draftNetTotal > 0) {
            setSuccessModalData({
              invoiceNumber: invoice.invoice_number,
              patientName: patientName,
              amountPaid: draftNetTotal,
              paymentMethod: paymentMethod,
              balanceRemaining: 0,
              isFullSettlement: true,
              date: new Date(),
              invoiceId: invoice.id,
            });
            setSuccessModalOpen(true);
          }
          onPaymentSuccess?.();
          onOpenChange(false);
        } else if (targetStatus === "partially_paid") {
          const remBal = Math.max(0, draftNetTotal - partialAmount);
          if (partialAmount > 0) {
            setSuccessModalData({
              invoiceNumber: invoice.invoice_number,
              patientName: patientName,
              amountPaid: partialAmount,
              paymentMethod: paymentMethod,
              balanceRemaining: remBal,
              isFullSettlement: remBal <= 0.01,
              date: new Date(),
              invoiceId: invoice.id,
            });
            setSuccessModalOpen(true);
          }
          onPaymentSuccess?.();
          // Seamlessly reload to Outstanding / Part-Paid view
          await fetchDetail(invoice.id);
        } else if (targetStatus === "issued") {
          toast.success(`Invoice ${invoice.invoice_number} issued to Outstanding.`, {
            position: "top-center",
            duration: 4500,
          });
          onPaymentSuccess?.();
          // Directly transition to the Outstanding modal view
          await fetchDetail(invoice.id);
        } else {
          toast.success("Draft invoice changes saved.", {
            position: "top-center",
            duration: 4000,
          });
          onPaymentSuccess?.();
          onOpenChange(false);
        }
      } else {
        toast.error(res.error || "Failed to update draft invoice.", { position: "top-center" });
      }
    } catch {
      toast.error("Failed to update draft invoice.", { position: "top-center" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Inline Installment Payment
  async function handleRecordInstallment() {
    if (!invoice) return;
    if (installmentAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than £0.", {
        position: "top-center",
      });
      return;
    }
    if (installmentAmount > balance + 0.01) {
      toast.error(`Payment cannot exceed the remaining balance of £${balance.toFixed(2)}.`, {
        position: "top-center",
      });
      return;
    }

    setIsRecordingInstallment(true);
    try {
      const res = await recordDirectPaymentAction({
        invoiceId: invoice.id,
        amount: installmentAmount,
        method: installmentMethod,
      });

      if (res.success) {
        const nextBal = Math.max(0, balance - installmentAmount);

        setSuccessModalData({
          invoiceNumber: invoice.invoice_number,
          patientName: patientName,
          amountPaid: installmentAmount,
          paymentMethod: installmentMethod,
          balanceRemaining: nextBal,
          isFullSettlement: nextBal <= 0.01,
          date: new Date(),
          invoiceId: invoice.id,
        });
        setSuccessModalOpen(true);

        onPaymentSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to record payment.", { position: "top-center" });
      }
    } catch {
      toast.error("Failed to record installment payment.", { position: "top-center" });
    } finally {
      setIsRecordingInstallment(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[640px] rounded-3xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card print:hidden"
        >
          {loading || !invoice ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col">
              {/* ── 1. Clean Modern Standard Header (No Dark Green BG) ── */}
              <div className="px-7 py-4.5 border-b border-border/80 bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs">
                    <Receipt className="size-4.5" />
                  </span>
                  <div>
                    <h2 className="font-heading text-base font-black text-foreground font-mono tracking-tight flex items-center gap-2">
                      {invoice.invoice_number}
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      Issued {format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMMM yyyy")}
                      {invoice.due_date &&
                        ` · Due ${format(new Date(`${invoice.due_date}T00:00:00`), "dd MMM yyyy")}`}
                    </p>
                  </div>
                </div>

                {/* Status Badge + Clean Circular Close (X) Button */}
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black capitalize border shadow-2xs",
                      formatStatusHeaderBadge(invoice.status),
                    )}
                  >
                    {formatStatusLabel(invoice.status)}
                  </Badge>

                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/80 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    title="Close dialog"
                  >
                    <X className="size-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* ── 2. Modal Body (Smooth Aesthetic Custom Scrollbar) ── */}
              <div className="p-6 sm:p-7 space-y-4.5 max-h-[70vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                {/* Patient Banner */}
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <User className="size-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                        Patient
                      </span>
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
                    <span className="font-mono text-xs text-muted-foreground">
                      {invoice.patients.phone}
                    </span>
                  )}
                </div>

                {isDraft ? (
                  /* ────────────────────────────────────────────────────────
                   * DRAFT MODE (EDITABLE)
                   * ──────────────────────────────────────────────────────── */
                  <div className="space-y-4">
                    {/* Line Items Table Editor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Itemised Treatments &amp; Services
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddItem}
                          className="h-7 px-2.5 text-[10px] font-bold rounded-lg gap-1 border-border/70 hover:bg-muted/40 cursor-pointer"
                        >
                          <Plus className="size-3 text-primary" />
                          Add Line
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {editableItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-2xl border border-border/80 bg-muted/15"
                          >
                            <Input
                              value={item.description}
                              onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                              placeholder="Treatment / procedure name..."
                              className="h-9 text-xs font-bold rounded-xl bg-card border-border/80 flex-1"
                            />
                            <div className="w-14">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    idx,
                                    "quantity",
                                    Math.max(1, Number(e.target.value)),
                                  )
                                }
                                className="h-9 text-center text-xs font-bold rounded-xl bg-card border-border/80 font-mono px-1"
                              />
                            </div>
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={item.unitPrice || ""}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    idx,
                                    "unitPrice",
                                    Math.max(0, Number(e.target.value)),
                                  )
                                }
                                className="h-9 pl-5 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                              />
                            </div>
                            {editableItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0 cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Discount & Net Total */}
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Discount
                          </Label>
                          <div className="flex items-center rounded-md bg-muted/50 p-0.5 border border-border/60">
                            <button
                              type="button"
                              onClick={() => setDiscountType("percentage")}
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[9px] font-bold transition-all cursor-pointer",
                                discountType === "percentage"
                                  ? "bg-card text-foreground shadow-2xs"
                                  : "text-muted-foreground",
                              )}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiscountType("fixed")}
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[9px] font-bold transition-all cursor-pointer",
                                discountType === "fixed"
                                  ? "bg-card text-foreground shadow-2xs"
                                  : "text-muted-foreground",
                              )}
                            >
                              £
                            </button>
                          </div>
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              {discountType === "fixed" ? "£" : "%"}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max={discountType === "percentage" ? 100 : draftSubtotal}
                              value={discountValue || ""}
                              onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                              className="h-8.5 pl-6 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-muted-foreground block">
                            Net Payable
                          </span>
                          <span className="text-base font-black font-mono text-[#0B3B36] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/70 px-3 py-0.5 rounded-xl inline-block mt-0.5 shadow-2xs">
                            {formatCurrency(draftNetTotal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                        <span className="text-[10px] font-semibold text-muted-foreground mr-1">
                          Presets:
                        </span>
                        {[
                          { label: "0%", val: 0, type: "percentage" as const },
                          { label: "-5%", val: 5, type: "percentage" as const },
                          { label: "-10%", val: 10, type: "percentage" as const },
                          { label: "-20%", val: 20, type: "percentage" as const },
                          { label: "-£10", val: 10, type: "fixed" as const },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => applyQuickDiscount(chip.val, chip.type)}
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold border transition-all cursor-pointer",
                              discountValue === chip.val && discountType === chip.type
                                ? "bg-emerald-500/15 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-card text-muted-foreground border-border/60 hover:text-foreground",
                            )}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Settlement Status Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "paid" as const, label: "Paid", color: "emerald" },
                        { id: "issued" as const, label: "Issued", color: "amber" },
                        { id: "partially_paid" as const, label: "Part Paid", color: "blue" },
                        { id: "draft" as const, label: "Draft", color: "purple" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSettlementStatus(s.id)}
                          className={cn(
                            "py-2.5 px-2 text-center rounded-2xl border text-xs font-bold transition-all cursor-pointer",
                            settlementStatus === s.id
                              ? s.color === "emerald"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : s.color === "amber"
                                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                  : s.color === "blue"
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "bg-purple-600 text-white border-purple-600 shadow-xs"
                              : "bg-card text-foreground border-border/80 hover:bg-muted/40",
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ────────────────────────────────────────────────────────
                   * SETTLED VIEW (Locked Items + Clean Layout)
                   * ──────────────────────────────────────────────────────── */
                  <div className="space-y-4.5">
                    {/* Itemised Services Table */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Itemised Treatments &amp; Services
                      </Label>

                      <div className="rounded-2xl border border-border/70 overflow-hidden text-xs bg-card">
                        <div className="grid grid-cols-[1fr_50px_95px_95px] gap-2 border-b border-border/60 bg-muted/25 px-4 py-2.5 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                          <span>Description</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Unit Fee</span>
                          <span className="text-right">Total</span>
                        </div>
                        <ul className="divide-y divide-border/60">
                          {items.map((item) => (
                            <li
                              key={item.id}
                              className="grid grid-cols-[1fr_50px_95px_95px] gap-2 px-4 py-2.5 items-center"
                            >
                              <span className="font-bold text-foreground">{item.description}</span>
                              <span className="text-center font-mono text-muted-foreground">
                                {item.quantity}
                              </span>
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

                    {/* Financial Summary Calculation Box */}
                    <div className="ml-auto w-full sm:max-w-xs space-y-1.5 rounded-2xl border border-border/70 bg-muted/15 p-3.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal:</span>
                        <span className="font-mono font-medium">
                          {formatCurrency(invoice.subtotal)}
                        </span>
                      </div>

                      {Number(invoice.discount_amount) > 0 && (
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span>Discount:</span>
                          <span className="font-mono">-{formatCurrency(invoice.discount_amount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-black text-foreground pt-1 border-t border-border/50 text-sm">
                        <span>Total Billed:</span>
                        <span className="font-mono">{formatCurrency(invoice.total)}</span>
                      </div>

                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-bold">
                        <span>Total Paid:</span>
                        <span className="font-mono">{formatCurrency(totalPaid)}</span>
                      </div>

                      <div className="flex items-center justify-between font-black text-foreground pt-1 border-t border-border/50 text-sm">
                        <span>Remaining Balance:</span>
                        <span
                          className={cn(
                            "font-mono rounded-lg px-2 py-0.5",
                            balance > 0
                              ? "bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300",
                          )}
                        >
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>

                    {/* ── Pay Installment / Settle Balance Card ── */}
                    {balance > 0 && invoice.status !== "void" && (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/25 dark:border-emerald-900/40 dark:bg-emerald-950/15 p-4 space-y-3.5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="size-6 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                              £
                            </span>
                            <span className="text-xs font-black text-foreground">
                              Pay Installment / Settle Balance
                            </span>
                          </div>
                          <span className="rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-300/70 px-2 py-0.5 text-[10px] font-black font-mono">
                            {formatCurrency(balance)} Outstanding
                          </span>
                        </div>

                        {/* Inputs Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              Amount Paying Now (£)
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                min="1"
                                max={balance}
                                step="1"
                                value={installmentAmount || ""}
                                onChange={(e) =>
                                  setInstallmentAmount(
                                    Math.min(balance, Math.max(0, Number(e.target.value))),
                                  )
                                }
                                placeholder="0.00"
                                className="h-9.5 pl-7 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                              />
                            </div>
                          </div>

                          {/* Quick Presets */}
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              Quick Fill
                            </Label>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInstallmentAmount(balance)}
                                className="rounded-lg px-2.5 py-1.5 text-[10px] font-black bg-[#0B3B36] text-white hover:bg-[#0B3B36]/90 transition-colors cursor-pointer shadow-2xs"
                              >
                                Full ({formatCurrency(balance)})
                              </button>
                              {balance >= 50 && (
                                <button
                                  type="button"
                                  onClick={() => setInstallmentAmount(Math.round(balance / 2))}
                                  className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold bg-card border border-border/80 hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                  50% (£{Math.round(balance / 2)})
                                </button>
                              )}
                              {balance >= 100 && (
                                <button
                                  type="button"
                                  onClick={() => setInstallmentAmount(100)}
                                  className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold bg-card border border-border/80 hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                  £100
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Payment Method
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "card" as const, label: "Card / POS", icon: CreditCard },
                              { id: "cash" as const, label: "Cash", icon: Banknote },
                              {
                                id: "bank_transfer" as const,
                                label: "Bank Transfer",
                                icon: Landmark,
                              },
                            ].map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setInstallmentMethod(m.id)}
                                className={cn(
                                  "flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all border cursor-pointer",
                                  installmentMethod === m.id
                                    ? "bg-[#0B3B36] text-white border-[#0B3B36] shadow-xs"
                                    : "bg-card text-foreground border-border/80 hover:bg-muted/40",
                                )}
                              >
                                <m.icon className="size-3.5" />
                                <span>{m.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                          <div className="text-[11px] font-semibold text-muted-foreground">
                            {balance - installmentAmount <= 0.01 ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                ✓ Will settle invoice in full
                              </span>
                            ) : (
                              <span>
                                Remaining:{" "}
                                <strong className="font-mono text-foreground">
                                  {formatCurrency(Math.max(0, balance - installmentAmount))}
                                </strong>
                              </span>
                            )}
                          </div>

                          <Button
                            type="button"
                            disabled={isRecordingInstallment || installmentAmount <= 0}
                            onClick={handleRecordInstallment}
                            className="h-9.5 px-5 text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white rounded-xl shadow-sm cursor-pointer"
                          >
                            {isRecordingInstallment ? (
                              <Loader2 className="size-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Check className="size-3.5 mr-1.5 stroke-[2.5]" />
                            )}
                            Record {formatCurrency(installmentAmount)} Payment
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Payment History Ledger (Without Reference column per request) */}
                    {payments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Payment Ledger ({payments.length} Transaction
                            {payments.length > 1 ? "s" : ""})
                          </Label>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Total Received:{" "}
                            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(totalPaid)}
                            </strong>
                          </span>
                        </div>

                        <div className="rounded-2xl border border-border/70 overflow-hidden text-xs bg-card">
                          <div className="grid grid-cols-[140px_1fr_110px] gap-2 border-b border-border/60 bg-muted/25 px-4 py-2 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                            <span>Date</span>
                            <span>Payment Method</span>
                            <span className="text-right">Amount Paid</span>
                          </div>
                          <ul className="divide-y divide-border/60">
                            {payments.map((p) => (
                              <li
                                key={p.id}
                                className="grid grid-cols-[140px_1fr_110px] gap-2 px-4 py-2.5 items-center text-xs"
                              >
                                <span className="text-muted-foreground font-mono text-[11px]">
                                  {formatClinicDate(p.paid_at, { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {formatPaymentMethodLabel(p.method)}
                                </span>
                                <span className="text-right font-mono font-black text-emerald-700 dark:text-emerald-300">
                                  {formatCurrency(p.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 3. Modal Footer Actions (Generous Padding & Standard Symmetry) ── */}
              <DialogFooter className="px-8 pt-5 pb-8 sm:pb-9 border-t border-border/70 bg-muted/20 flex flex-row items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  className="h-11 px-5 rounded-xl text-xs font-bold gap-2.5 border-border/80 hover:bg-muted/50 transition-all cursor-pointer shadow-2xs"
                >
                  <Printer className="size-4 text-muted-foreground" />
                  <span>Print Statement</span>
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-11 px-7 rounded-xl text-xs font-bold border-border/80 hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    Close
                  </Button>

                  {isDraft && (
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveDraftAction(settlementStatus)}
                      className="h-11 px-6 text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white rounded-xl shadow-md shadow-[#0B3B36]/20 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Check className="size-4 mr-1.5 stroke-[2.5]" />
                      )}
                      {settlementStatus === "draft"
                        ? "Save Draft"
                        : settlementStatus === "paid"
                          ? `Settle & Pay in Full (£${draftNetTotal.toFixed(2)})`
                          : settlementStatus === "issued"
                            ? `Issue to Outstanding (£${draftNetTotal.toFixed(2)})`
                            : `Record Deposit & Issue (£${partialAmount.toFixed(2)})`}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 4. Standard Payment Success Confirmation Modal ── */}
      <PaymentSuccessDialog
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        data={successModalData}
        onPrint={handlePrint}
      />
    </>
  );
}
