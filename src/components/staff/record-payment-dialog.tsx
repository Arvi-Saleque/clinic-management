"use client";

import * as React from "react";
import { CreditCard, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordDirectPaymentAction } from "@/lib/server/invoices";
import { formatCurrency } from "@/lib/utils";

interface RecordPaymentDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  totalAmount: number;
  balanceAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export function RecordPaymentDialog({
  invoiceId,
  invoiceNumber,
  patientName,
  totalAmount,
  balanceAmount,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = React.useState<string>(balanceAmount.toString());
  const [method, setMethod] = React.useState<"cash" | "card" | "bank_transfer" | "other">("cash");
  const [reference, setReference] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setAmount(balanceAmount > 0 ? balanceAmount.toString() : "0");
      setMethod("cash");
      setReference("");
    }
  }, [open, balanceAmount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than zero");
      return;
    }

    if (numAmount > balanceAmount + 0.001) {
      toast.error(
        `Payment amount (${formatCurrency(numAmount)}) cannot exceed remaining balance (${formatCurrency(balanceAmount)})`,
      );
      return;
    }

    setSubmitting(true);
    const res = await recordDirectPaymentAction({
      invoiceId,
      amount: numAmount,
      method,
      reference: reference.trim() || undefined,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success(`Payment of ${formatCurrency(numAmount)} recorded successfully`);
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(res.error ?? "Failed to record payment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold font-heading">
              Record Payment
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Take payment for {invoiceNumber} and issue a receipt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Summary Box */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-bold text-foreground">{patientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invoice Total:</span>
              <span className="font-mono text-muted-foreground font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-border/50">
              <span className="font-semibold text-foreground">Remaining Balance:</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-sm">
                {formatCurrency(balanceAmount)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-amount" className="text-xs font-semibold">
                Payment Amount (€) *
              </Label>
              {balanceAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(balanceAmount.toString())}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balanceAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9.5 rounded-xl border-border/80 text-xs font-bold font-mono"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-method" className="text-xs font-semibold">
              Payment Method *
            </Label>
            <Select
              value={method}
              onValueChange={(val) => {
                if (val) setMethod(val);
              }}
            >
              <SelectTrigger id="payment-method" className="h-9.5 rounded-xl border-border/80 text-xs font-semibold">
                <SelectValue>{(v: string) => METHOD_LABEL[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash" className="text-xs">Cash</SelectItem>
                <SelectItem value="card" className="text-xs">Card (POS / Debit / Credit)</SelectItem>
                <SelectItem value="bank_transfer" className="text-xs">Bank Transfer</SelectItem>
                <SelectItem value="other" className="text-xs">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference / Transaction ID */}
          <div className="space-y-1.5">
            <Label htmlFor="payment-reference" className="text-xs font-semibold">
              Payment Reference <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Card slip no., Auth code, Receipt #"
              className="h-9.5 rounded-xl border-border/80 text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-9 rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Recording…
                </>
              ) : (
                <>
                  <DollarSign className="size-3.5" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
