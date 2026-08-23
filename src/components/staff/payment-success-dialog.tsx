"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  Printer,
  Receipt,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

export interface PaymentSuccessData {
  invoiceNumber: string;
  patientName: string;
  amountPaid: number;
  paymentMethod: string;
  balanceRemaining: number;
  isFullSettlement: boolean;
  date?: Date | string;
  invoiceId?: string;
}

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PaymentSuccessData | null;
  onPrint?: () => void;
}

function getMethodIcon(method: string) {
  switch (method?.toLowerCase()) {
    case "card":
    case "card / pos":
      return CreditCard;
    case "cash":
      return Banknote;
    case "bank_transfer":
    case "bank transfer":
      return Landmark;
    default:
      return Wallet;
  }
}

function formatMethodLabel(method: string) {
  switch (method?.toLowerCase()) {
    case "card":
      return "Card / POS";
    case "cash":
      return "Cash";
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return method?.replace("_", " ") || "Payment";
  }
}

export function PaymentSuccessDialog({
  open,
  onOpenChange,
  data,
  onPrint,
}: PaymentSuccessDialogProps) {
  if (!data) return null;

  const MethodIcon = getMethodIcon(data.paymentMethod);
  const formattedDate = data.date
    ? format(new Date(data.date), "dd MMM yyyy, HH:mm")
    : format(new Date(), "dd MMM yyyy, HH:mm");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[460px] rounded-3xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card z-[60]"
      >
        {/* Top Glowing Emerald Banner */}
        <div className="relative bg-gradient-to-b from-[#041D1A] via-[#093530] to-[#0D443D] px-6 pt-7 pb-6 text-white text-center overflow-hidden">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 size-40 rounded-full bg-emerald-500/15 blur-2xl" />

          {/* Close button in top-right */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 size-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/15 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title="Close modal"
          >
            <X className="size-4 stroke-[2.5]" />
          </button>

          {/* Glowing Animated Icon */}
          <div className="relative mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/50 shadow-lg shadow-emerald-950/50 backdrop-blur-md">
            <CheckCircle2 className="size-9 stroke-[2.5] text-emerald-300 animate-in zoom-in-50 duration-300" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 px-3 py-0.5 text-[11px] font-black text-emerald-200 uppercase tracking-wider mb-1.5 backdrop-blur-md">
            <Check className="size-3 text-emerald-300 stroke-[2.5]" />
            <span>Payment Confirmed</span>
          </div>

          <h2 className="text-xl font-black font-heading text-white tracking-tight">
            Payment Recorded Successfully!
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-[320px] mx-auto">
            Ledger updated &amp; transaction verified in real time.
          </p>
        </div>

        {/* Modal Body: Receipt Summary Card */}
        <div className="p-6 space-y-4">
          {/* Amount Paid Highlight */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 text-center space-y-1 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Amount Received
            </span>
            <div className="text-3xl font-black font-mono tracking-tight text-[#0B3B36] dark:text-emerald-300">
              {formatCurrency(data.amountPaid)}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border/80 px-2.5 py-1 text-xs font-bold text-foreground mt-1 shadow-2xs">
              <MethodIcon className="size-3.5 text-primary" />
              <span>{formatMethodLabel(data.paymentMethod)}</span>
            </div>
          </div>

          {/* Receipt Breakdown Details */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Invoice Number:</span>
              <span className="font-mono font-black text-foreground">{data.invoiceNumber}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Patient Name:</span>
              <span className="font-bold text-foreground">{data.patientName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Date &amp; Time:</span>
              <span className="font-mono text-muted-foreground">{formattedDate}</span>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-muted-foreground font-bold">Settlement Status:</span>
              {data.isFullSettlement || data.balanceRemaining <= 0.01 ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/60 px-2.5 py-0.5 text-xs font-black">
                  <Check className="size-3 stroke-[3]" />
                  Paid in Full (£0.00 Due)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/60 px-2.5 py-0.5 text-xs font-black font-mono">
                  Remaining: {formatCurrency(data.balanceRemaining)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Generous Padding */}
        <DialogFooter className="px-6 pt-4 pb-7 sm:pb-8 border-t border-border/70 bg-muted/20 flex flex-row items-center justify-between gap-3">
          {onPrint ? (
            <Button
              type="button"
              variant="outline"
              onClick={onPrint}
              className="h-11 px-4 rounded-2xl text-xs font-bold gap-2 border-border/80 hover:bg-muted/50 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="size-4 text-muted-foreground" />
              <span>Print Receipt</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 px-8 rounded-2xl text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-md shadow-[#0B3B36]/20 transition-all cursor-pointer"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
