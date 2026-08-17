"use client";

import * as React from "react";
import { useActionState } from "react";
import { Calculator, Loader2, Plus, Search, Trash2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { searchPatients } from "@/lib/server/directory";
import { createInvoiceAction, type InvoiceActionState } from "@/lib/server/invoices";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}
interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

const initialState: InvoiceActionState = { error: null };
const emptyItem: LineItem = { description: "", quantity: 1, unitPrice: 0 };

export function InvoiceForm({ initialPatient = null }: { initialPatient?: Patient | null }) {
  const [state, formAction, pending] = useActionState(createInvoiceAction, initialState);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(initialPatient);
  const [items, setItems] = React.useState<LineItem[]>([{ ...emptyItem }]);
  const [discount, setDiscount] = React.useState(0);
  const [tax, setTax] = React.useState(0);

  React.useEffect(() => {
    if (selectedPatient) return;
    const timer = setTimeout(async () => setResults(await searchPatients(query)), 250);
    return () => clearTimeout(timer);
  }, [query, selectedPatient]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal + tax - discount);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
        <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Bill to patient</Label>
        {selectedPatient ? (
          <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary-soft/45 px-4 py-3 text-sm">
            <span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserCheck className="size-4" /></span><span><strong className="block text-xs">{selectedPatient.first_name} {selectedPatient.last_name}</strong><small className="text-[10px] text-muted-foreground">{selectedPatient.phone || "No phone recorded"}</small></span></span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
              Change
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or phone"
                className="h-11 rounded-xl bg-background pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-lg">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(p)}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-muted"
                    >
                      {p.first_name} {p.last_name}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <div><Label className="text-sm font-extrabold">Treatment line items</Label><p className="mt-1 text-[11px] text-muted-foreground">Describe each service clearly so the patient can understand the statement.</p></div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid items-end gap-2 rounded-2xl border border-border bg-background-subtle/40 p-3 sm:grid-cols-[1fr_88px_130px_36px]">
              <div className="flex-1 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="e.g. General Check-up"
                />
              </div>
              <div className="space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Unit price</Label>}
                <Input
                  type="number"
                  min={0}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={items.length === 1}
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove item"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
        >
          <Plus className="size-4" />
          Add line item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="discountAmount">Discount</Label>
          <Input id="discountAmount" name="discountAmount" type="number" min={0} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxAmount">Tax</Label>
          <Input id="taxAmount" name="taxAmount" type="number" min={0} value={tax} onChange={(event) => setTax(Number(event.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="ml-auto max-w-sm rounded-2xl border border-primary/12 bg-primary-soft/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-primary"><Calculator className="size-4" />Invoice summary</div>
        <div className="space-y-2 text-xs"><div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div><div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-৳{discount.toLocaleString()}</span></div><div className="flex justify-between text-muted-foreground"><span>Tax</span><span>৳{tax.toLocaleString()}</span></div><div className="mt-2 flex justify-between border-t border-primary/15 pt-3 font-heading text-base font-extrabold"><span>Total</span><span>৳{total.toLocaleString()}</span></div></div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" size="lg" className="h-11 w-full rounded-xl" disabled={pending || !selectedPatient}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Create invoice
      </Button>
    </form>
  );
}
