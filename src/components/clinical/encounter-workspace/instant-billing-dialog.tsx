"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Check,
  Clock3,
  CreditCard,
  FileEdit,
  Landmark,
  Loader2,
  Percent,
  Receipt,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { createInstantEncounterInvoiceAction } from "@/lib/server/invoices";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PaymentSuccessDialog,
  PaymentSuccessData,
} from "@/components/staff/payment-success-dialog";
import { printInvoiceStatement } from "@/lib/utils/print-invoice";

export interface InstantBillingContext {
  patientId: string;
  patientName: string;
  patientReference: string;
  encounterId: string;
  appointmentId?: string | null;
  practitionerName?: string | null;
  procedureName: string;
  defaultPrice: number;
}

export type BillingStatus = "draft" | "issued" | "partially_paid" | "paid";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";

export interface InstantBillingFinalizePayload {
  targetStatus: BillingStatus;
  procedureName: string;
  unitPrice: number;
  discountAmount: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

interface InstantBillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: InstantBillingContext;
  onFinalize?: (payload: InstantBillingFinalizePayload) => Promise<boolean>;
  onCompleted?: () => void;
}

export function InstantBillingDialog({
  open,
  onOpenChange,
  context,
  onFinalize,
  onCompleted,
}: InstantBillingDialogProps) {
  const router = useRouter();

  const [procedureName, setProcedureName] = React.useState(
    context.procedureName || "Clinical Consultation & Treatment",
  );
  const [unitPrice, setUnitPrice] = React.useState<number>(context.defaultPrice || 0);
  const [discountType, setDiscountType] = React.useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = React.useState<number>(0);
  const [status, setStatus] = React.useState<BillingStatus>("paid");
  const [partialPaidAmount, setPartialPaidAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Success Pop-Up State
  const [successModalOpen, setSuccessModalOpen] = React.useState(false);
  const [successModalData, setSuccessModalData] = React.useState<PaymentSuccessData | null>(null);

  // Sync with context updates
  React.useEffect(() => {
    if (open) {
      setProcedureName(context.procedureName || "Clinical Consultation & Treatment");
      setUnitPrice(context.defaultPrice || 0);
      setDiscountValue(0);
      setStatus("paid");
      setPartialPaidAmount(0);
      setPaymentMethod("card");
    }
  }, [open, context]);

  // Clean practitioner name formatting
  const doctorNameFormatted = React.useMemo(() => {
    if (!context.practitionerName) return "Practitioner";
    const raw = context.practitionerName.trim();
    return raw.toLowerCase().startsWith("dr.") || raw.toLowerCase().startsWith("dr ")
      ? raw
      : `Dr. ${raw}`;
  }, [context.practitionerName]);

  // Calculate discount and net total
  const calculatedDiscount = React.useMemo(() => {
    if (discountType === "percentage") {
      return (unitPrice * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(unitPrice, Math.max(0, discountValue));
  }, [unitPrice, discountType, discountValue]);

  const netTotal = Math.max(0, unitPrice - calculatedDiscount);
  const remainingBalance = Math.max(0, netTotal - partialPaidAmount);

  // Quick discount presets
  const applyQuickDiscount = (val: number, type: "fixed" | "percentage") => {
    setDiscountType(type);
    setDiscountValue(val);
  };

  const handlePrintReceipt = () => {
    if (!successModalData) return;
    printInvoiceStatement({
      invoiceNumber: successModalData.invoiceNumber,
      issueDate: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      status: successModalData.isFullSettlement ? "paid" : "partially_paid",
      patientName: successModalData.patientName,
      patientRef: context.patientReference,
      subtotal: unitPrice,
      discountAmount: calculatedDiscount,
      total: netTotal,
      totalPaid: successModalData.amountPaid,
      balance: successModalData.balanceRemaining,
      items: [
        {
          description: procedureName.trim() || "Clinical Consultation & Treatment",
          quantity: 1,
          unitPrice: unitPrice,
          lineTotal: unitPrice,
        },
      ],
      payments: [
        {
          date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          method: successModalData.paymentMethod,
          amount: successModalData.amountPaid,
        },
      ],
    });
  };

  const handleSubmit = async (targetStatus: BillingStatus) => {
    setIsSubmitting(true);

    try {
      if (onFinalize) {
        const ok = await onFinalize({
          targetStatus,
          procedureName: procedureName.trim() || "Clinical Consultation & Treatment",
          unitPrice,
          discountAmount: calculatedDiscount,
          paidAmount: targetStatus === "partially_paid" ? partialPaidAmount : undefined,
          paymentMethod:
            targetStatus === "paid" || targetStatus === "partially_paid"
              ? paymentMethod
              : undefined,
        });

        if (ok) {
          onOpenChange(false);
          onCompleted?.();
        }
        return;
      }

      // Fallback direct invoice creation
      const res = await createInstantEncounterInvoiceAction({
        patientId: context.patientId,
        encounterId: context.encounterId,
        appointmentId: context.appointmentId,
        procedureName: procedureName.trim() || "Clinical Consultation & Treatment",
        unitPrice,
        quantity: 1,
        discountAmount: calculatedDiscount,
        taxAmount: 0,
        status: targetStatus,
        paidAmount: targetStatus === "partially_paid" ? partialPaidAmount : undefined,
        paymentMethod:
          targetStatus === "paid" || targetStatus === "partially_paid"
            ? paymentMethod
            : undefined,
      });

      if (res.success && res.invoiceNumber) {
        if (targetStatus === "paid" || targetStatus === "partially_paid") {
          const paidAmt = targetStatus === "paid" ? netTotal : partialPaidAmount;
          const balRem = targetStatus === "paid" ? 0 : remainingBalance;

          setSuccessModalData({
            invoiceNumber: res.invoiceNumber,
            patientName: context.patientName,
            amountPaid: paidAmt,
            paymentMethod: paymentMethod,
            balanceRemaining: balRem,
            isFullSettlement: balRem <= 0.01,
            date: new Date(),
            invoiceId: res.invoiceId,
          });
          setSuccessModalOpen(true);
        } else if (targetStatus === "draft") {
          toast.success("Bill saved as Draft (#1 on Billing list for reception checkout).", {
            position: "top-center",
          });
        } else {
          toast.success(`Invoice ${res.invoiceNumber} issued as Outstanding.`, {
            position: "top-center",
          });
        }

        onOpenChange(false);
        onCompleted?.();
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to create invoice.", { position: "top-center" });
      }
    } catch {
      toast.error("Failed to generate billing invoice.", { position: "top-center" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[640px] rounded-3xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card print:hidden"
        >
          <div className="flex flex-col">
            {/* ── 1. Clean Modern Standard Header (Matching Billing View Modal) ── */}
            <div className="px-7 py-4.5 border-b border-border/80 bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15 shadow-2xs">
                  <Receipt className="size-4.5" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-black text-foreground tracking-tight flex items-center gap-2">
                    Consultation Billing
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                    Clinical sign-off &bull; {doctorNameFormatted}
                  </p>
                </div>
              </div>

              {/* Patient Badge + Clean Circular Close (X) Button */}
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-black capitalize border shadow-2xs bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono"
                >
                  {context.patientReference}
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

            {/* ── 2. Modal Body (Matching Billing View Layout) ── */}
            <div className="p-6 sm:p-7 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar">
              {/* Patient Banner */}
              <div className="rounded-2xl border border-border/70 bg-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="size-4" />
                  </span>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Patient
                    </Label>
                    <p className="text-sm font-bold text-foreground">{context.patientName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-muted-foreground font-bold">
                    {context.patientReference}
                  </span>
                </div>
              </div>

              {/* Itemised Treatments & Procedure Section */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Itemised Treatments &amp; Services
                </Label>

                <div className="rounded-2xl border border-border/70 bg-card p-4.5 space-y-3.5 shadow-2xs">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      Description of Clinical Service
                    </Label>
                    <Input
                      value={procedureName}
                      onChange={(e) => setProcedureName(e.target.value)}
                      placeholder="Procedure description..."
                      className="h-10 text-xs font-bold rounded-xl bg-muted/20 border-border/80"
                    />
                  </div>

                  {/* Fee & Discount Inputs */}
                  <div className="grid grid-cols-2 gap-3.5 pt-0.5">
                    {/* Standard Fee */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Standard Fee (€)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          €
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={unitPrice || ""}
                          onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                          className="h-10 pl-7 text-xs font-bold rounded-xl bg-muted/20 border-border/80 font-mono"
                        />
                      </div>
                    </div>

                    {/* Discount Input */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-semibold text-foreground">
                          Clinician Discount
                        </Label>
                        <div className="flex items-center rounded-lg bg-muted/50 p-0.5 border border-border/60">
                          <button
                            type="button"
                            onClick={() => setDiscountType("percentage")}
                            className={cn(
                              "rounded px-1.5 py-0.2 text-[9px] font-bold transition-all cursor-pointer",
                              discountType === "percentage"
                                ? "bg-card text-foreground shadow-2xs"
                                : "text-muted-foreground hover:text-foreground",
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
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            €
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          {discountType === "fixed" ? "€" : "%"}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max={discountType === "percentage" ? 100 : unitPrice}
                          step="1"
                          value={discountValue || ""}
                          onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="h-10 pl-7 text-xs font-bold rounded-xl bg-muted/20 border-border/80 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discount Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground mr-1">
                      Presets:
                    </span>
                    {[
                      { label: "0%", val: 0, type: "percentage" as const },
                      { label: "-5%", val: 5, type: "percentage" as const },
                      { label: "-10%", val: 10, type: "percentage" as const },
                      { label: "-20%", val: 20, type: "percentage" as const },
                      { label: "-€10", val: 10, type: "fixed" as const },
                      { label: "-€25", val: 25, type: "fixed" as const },
                    ].map((chip) => {
                      const isSelected = discountValue === chip.val && discountType === chip.type;
                      return (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => applyQuickDiscount(chip.val, chip.type)}
                          className={cn(
                            "rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all border cursor-pointer",
                            isSelected
                              ? "bg-emerald-500/15 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs"
                              : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40",
                          )}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Financial Calculation Summary (Right Aligned Card matching Billing View) */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 rounded-2xl border border-border/70 bg-card p-4 space-y-2 text-xs shadow-2xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatCurrency(unitPrice)}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>
                        Clinician Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}:
                      </span>
                      <span className="font-mono">-{formatCurrency(calculatedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-foreground font-black text-sm border-t border-border/60 pt-2">
                    <span>Total Billed:</span>
                    <span className="font-mono">{formatCurrency(netTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-foreground">Net Payable:</span>
                    <span className="font-mono font-black text-base text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 px-3 py-1 rounded-xl shadow-2xs">
                      {formatCurrency(netTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Settlement Choices */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Payment Settlement
                </Label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Paid (Green Theme) */}
                  <button
                    type="button"
                    onClick={() => setStatus("paid")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden",
                      status === "paid"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 shadow-xs ring-1.5 ring-emerald-500"
                        : "border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/10 hover:border-emerald-400",
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        status === "paid"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                      )}
                    >
                      <Check className="size-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground">Paid</span>
                        <span className="rounded px-1.5 py-0.2 text-[9px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                          100% Settled
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Chairside full payment
                      </p>
                    </div>
                  </button>

                  {/* Issued (Amber Theme) */}
                  <button
                    type="button"
                    onClick={() => setStatus("issued")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden",
                      status === "issued"
                        ? "border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 shadow-xs ring-1.5 ring-amber-500"
                        : "border-amber-200/50 bg-amber-50/25 dark:border-amber-900/30 dark:bg-amber-950/10 hover:border-amber-400",
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        status === "issued"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                      )}
                    >
                      <Clock3 className="size-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground">Issued</span>
                        <span className="rounded px-1.5 py-0.2 text-[9px] font-black bg-amber-500/15 text-amber-800 dark:text-amber-300">
                          Outstanding
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Unpaid balance due
                      </p>
                    </div>
                  </button>

                  {/* Part Paid (Cyan Theme) */}
                  <button
                    type="button"
                    onClick={() => setStatus("partially_paid")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden",
                      status === "partially_paid"
                        ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-950/40 shadow-xs ring-1.5 ring-cyan-500"
                        : "border-cyan-200/50 bg-cyan-50/25 dark:border-cyan-900/30 dark:bg-cyan-950/10 hover:border-cyan-400",
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        status === "partially_paid"
                          ? "bg-cyan-600 text-white shadow-xs"
                          : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
                      )}
                    >
                      <Wallet className="size-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground">Part Paid</span>
                        <span className="rounded px-1.5 py-0.2 text-[9px] font-black bg-cyan-500/15 text-cyan-800 dark:text-cyan-300">
                          Deposit
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Partial deposit collected
                      </p>
                    </div>
                  </button>

                  {/* Draft (Purple Theme) */}
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden",
                      status === "draft"
                        ? "border-purple-500 bg-purple-500/10 dark:bg-purple-950/40 shadow-xs ring-1.5 ring-purple-500"
                        : "border-purple-200/50 bg-purple-50/25 dark:border-purple-900/30 dark:bg-purple-950/10 hover:border-purple-400",
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        status === "draft"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-purple-500/15 text-purple-700 dark:text-purple-300",
                      )}
                    >
                      <FileEdit className="size-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-foreground">Draft</span>
                        <span className="rounded px-1.5 py-0.2 text-[9px] font-black bg-purple-500/15 text-purple-800 dark:text-purple-300">
                          Front Desk
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        Reception to finalize
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Method Section (Only when Paid or Part Paid) */}
              {(status === "paid" || status === "partially_paid") && (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 space-y-3 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Payment Method
                    </Label>
                    {status === "partially_paid" && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Deposit Paid (€):
                        </span>
                        <Input
                          type="number"
                          min="1"
                          max={netTotal}
                          step="1"
                          value={partialPaidAmount || ""}
                          onChange={(e) =>
                            setPartialPaidAmount(
                              Math.min(netTotal, Math.max(0, Number(e.target.value))),
                            )
                          }
                          className="h-8 w-24 rounded-lg bg-card text-xs font-bold font-mono px-2"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Segmented Method Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "card" as const, label: "Card / POS", icon: CreditCard },
                      { id: "cash" as const, label: "Cash", icon: Banknote },
                      { id: "bank_transfer" as const, label: "Bank Transfer", icon: Landmark },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all border cursor-pointer",
                          paymentMethod === m.id
                            ? "bg-[#0B3B36] text-white border-[#0B3B36] shadow-xs"
                            : "bg-card text-foreground border-border/80 hover:bg-muted/40",
                        )}
                      >
                        <m.icon className="size-3.5" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  {status === "partially_paid" && (
                    <div className="flex items-center justify-between pt-1.5 text-xs font-semibold text-muted-foreground border-t border-border/40">
                      <span>Remaining Balance:</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 3. Modal Footer Actions (Generous Padding & Standard Symmetry) ── */}
            <DialogFooter className="px-8 pt-5 pb-8 sm:pb-9 border-t border-border/70 bg-muted/20 flex flex-row items-center justify-between gap-4">
              {/* Skip to Reception (Draft) */}
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleSubmit("draft")}
                className="h-11 px-5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border-border/80 transition-all cursor-pointer shadow-2xs"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <FileEdit className="size-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                )}
                Skip to Reception (Draft)
              </Button>

              {/* Confirm & Settle Button */}
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(status)}
                className="h-11 px-6 text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white rounded-xl shadow-md shadow-[#0B3B36]/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Check className="size-4 mr-1.5 stroke-[2.5]" />
                )}
                {status === "draft"
                  ? "Save as Draft"
                  : status === "paid"
                    ? `Confirm & Settle (€${netTotal.toFixed(2)})`
                    : status === "issued"
                      ? `Issue Outstanding (€${netTotal.toFixed(2)})`
                      : `Confirm Deposit (€${partialPaidAmount.toFixed(2)})`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Standard Payment Success Modal */}
      <PaymentSuccessDialog
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        data={successModalData}
        onPrint={handlePrintReceipt}
      />
    </>
  );
}
