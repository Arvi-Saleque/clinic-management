"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordPaymentAction, type InvoiceActionState } from "@/lib/server/invoices";

const initialState: InvoiceActionState = { error: null };

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(
    recordPaymentAction.bind(null, invoiceId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" min={0} step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <Select name="method" defaultValue="cash">
            <SelectTrigger id="method">
              <SelectValue>{(v: string) => METHOD_LABEL[v]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reference">Reference (optional)</Label>
        <Input id="reference" name="reference" placeholder="Transaction ID, cheque no., etc." />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Record payment
      </Button>
    </form>
  );
}
