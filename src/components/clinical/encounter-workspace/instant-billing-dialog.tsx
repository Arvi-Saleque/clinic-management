"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  CreditCard,
  FileEdit,
  Landmark,
  Loader2,
  Percent,
  Receipt,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createInstantEncounterInvoiceAction } from "@/lib/server/invoices";
import { cn, formatCurrency } from "@/lib/utils";

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

  // Clean practitioner name formatting (avoid "Dr. Dr. Nadia Islam")
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

      if (res.success) {
        if (targetStatus === "draft") {
          toast.success("Bill saved as Draft (#1 on Billing list for reception checkout).");
        } else if (targetStatus === "paid") {
          toast.success(`Invoice ${res.invoiceNumber} paid in full (€${netTotal.toFixed(2)}).`);
        } else if (targetStatus === "issued") {
          toast.success(`Invoice ${res.invoiceNumber} issued as Outstanding.`);
        } else {
          toast.success(`Invoice ${res.invoiceNumber} created with partial deposit.`);
        }

        onOpenChange(false);
        onCompleted?.();
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to create invoice.");
      }
    } catch {
      toast.error("Failed to generate billing invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border border-border/70 shadow-2xl bg-card">
        {/* ── Top Header Banner (Modern Glass Sanctuary) ── */}
        <div className="relative bg-gradient-to-r from-[#062420] via-[#0B3B36] to-[#0E4741] px-6 py-5 text-white overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="pointer-events-none absolute left-1/3 -bottom-10 size-32 rounded-full bg-teal-400/10 blur-xl" />

          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wide">
                <Sparkles className="size-2.5 text-emerald-300" />
                <span>Consultation Complete</span>
              </div>
              <h2 className="text-lg font-black font-heading text-white tracking-tight">
                Consultation Billing
              </h2>
            </div>

            {/* Patient Badge */}
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="rounded-lg bg-white/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-200 border border-white/15">
                {context.patientReference}
              </span>
              <span className="text-xs font-semibold text-emerald-100 truncate max-w-[170px]">
                {context.patientName}
              </span>
            </div>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* 1. Treatment & Fee Card */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Treatment &amp; Procedure
              </Label>
              <span className="text-[11px] font-bold text-primary dark:text-emerald-400">
                {doctorNameFormatted}
              </span>
            </div>

            <Input
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="Procedure description..."
              className="h-9.5 text-xs font-bold rounded-xl bg-card border-border/80"
            />

            {/* Fee & Discount Row */}
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              {/* Standard Fee */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
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
                    className="h-9.5 pl-7 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                  />
                </div>
              </div>

              {/* Discount Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
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
                    className="h-9.5 pl-7 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quick Discount Pill Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground mr-1">Presets:</span>
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
                      "rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all border cursor-pointer",
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

            {/* Net Total Highlight Bar */}
            <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-1 bg-card/60 -mx-4 -mb-4 p-4 rounded-b-2xl">
              <div>
                <span className="text-xs font-bold text-foreground">Net Payable</span>
                {calculatedDiscount > 0 && (
                  <span className="ml-2 inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                    -€{calculatedDiscount.toFixed(2)}{" "}
                    {discountType === "percentage" ? `(${discountValue}% off)` : ""}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xl font-black font-mono text-[#0B3B36] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/60 px-3.5 py-1 rounded-xl inline-block shadow-2xs">
                  €{netTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 4 Multi-Colored Payment Status Choices */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Payment Settlement
            </Label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. PAID (Emerald / Green Theme) */}
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

              {/* 2. ISSUED (Amber / Warm Ochre Theme) */}
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

              {/* 3. PART PAID (Blue / Cyan Theme) */}
              <button
                type="button"
                onClick={() => setStatus("partially_paid")}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer relative overflow-hidden",
                  status === "partially_paid"
                    ? "border-blue-500 bg-blue-500/10 dark:bg-blue-950/40 shadow-xs ring-1.5 ring-blue-500"
                    : "border-blue-200/50 bg-blue-50/25 dark:border-blue-900/30 dark:bg-blue-950/10 hover:border-blue-400",
                )}
              >
                <div
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    status === "partially_paid"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                  )}
                >
                  <Wallet className="size-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-foreground">Part Paid</span>
                    <span className="rounded px-1.5 py-0.2 text-[9px] font-black bg-blue-500/15 text-blue-800 dark:text-blue-300">
                      Deposit
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Partial deposit collected
                  </p>
                </div>
              </button>

              {/* 4. DRAFT (Purple / Slate Theme) */}
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

          {/* 3. Payment Method Section (Only when Paid or Part Paid) */}
          {(status === "paid" || status === "partially_paid") && (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 space-y-2.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Payment Method
                </Label>
                {status === "partially_paid" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground">Deposit Paid (€):</span>
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
                      className="h-7 w-20 rounded-lg bg-card text-xs font-bold font-mono px-2"
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
                      "flex items-center justify-center gap-1.5 rounded-xl py-2 px-2.5 text-xs font-bold transition-all border cursor-pointer",
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
                <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-muted-foreground border-t border-border/40">
                  <span>Balance remaining to bill:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    €{remainingBalance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <DialogFooter className="p-4 sm:px-6 border-t border-border/60 bg-muted/15 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Skip Button -> Saves as Draft automatically */}
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="w-full sm:w-auto h-10 px-4 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
            ) : (
              <FileEdit className="size-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
            )}
            Skip to Reception (Draft)
          </Button>

          {/* Confirm & Create Button */}
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(status)}
            className="w-full sm:w-auto h-10 px-6 text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white rounded-xl shadow-md shadow-[#0B3B36]/20 cursor-pointer"
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
                  ? `Confirm & Issue (€${netTotal.toFixed(2)})`
                  : `Confirm Deposit (€${partialPaidAmount.toFixed(2)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
