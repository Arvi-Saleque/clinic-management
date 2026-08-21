"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Banknote,
  Check,
  Clock3,
  CreditCard,
  FileEdit,
  Landmark,
  Loader2,
  Phone,
  Plus,
  Printer,
  Receipt,
  Sparkles,
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
import { RecordPaymentDialog } from "@/components/staff/record-payment-dialog";
import { getInvoiceDetail } from "@/lib/server/directory";
import {
  issueDraftInvoiceAction,
  updateDraftInvoiceAction,
} from "@/lib/server/invoices";
import { cn, formatCurrency } from "@/lib/utils";

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

function formatStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return "border-emerald-400 bg-emerald-500/15 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "partially_paid":
      return "border-blue-400 bg-blue-500/15 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    case "issued":
      return "border-amber-400 bg-amber-500/15 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    case "draft":
      return "border-purple-400 bg-purple-500/15 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
    case "void":
      return "border-red-400 bg-red-500/15 text-red-800 dark:bg-red-950/60 dark:text-red-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
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
      return "Draft (Editable)";
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
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  // Draft Edit State
  const [editableItems, setEditableItems] = React.useState<EditableItem[]>([]);
  const [discountType, setDiscountType] = React.useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = React.useState<number>(0);
  const [settlementStatus, setSettlementStatus] = React.useState<BillingStatus>("paid");
  const [partialAmount, setPartialAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("card");

  const fetchDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await getInvoiceDetail(id);
      setData(res);

      if (res?.invoice && res.invoice.status === "draft") {
        const mappedItems: EditableItem[] = res.items.length > 0
          ? res.items.map((i) => ({
              id: i.id,
              description: i.description,
              quantity: i.quantity,
              unitPrice: Number(i.unit_price),
            }))
          : [{ description: "Clinical Treatment", quantity: 1, unitPrice: Number(res.invoice.subtotal) || 0 }];

        setEditableItems(mappedItems);
        setDiscountValue(Number(res.invoice.discount_amount) || 0);
        setDiscountType("fixed");
        setSettlementStatus("paid");
        setPartialAmount(0);
        setPaymentMethod("card");
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
      (sum, item) => sum + Math.max(1, Number(item.quantity || 1)) * Math.max(0, Number(item.unitPrice || 0)),
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
    window.print();
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
        if (targetStatus === "draft") {
          toast.success("Draft invoice changes saved.");
        } else if (targetStatus === "paid") {
          toast.success(`Invoice ${invoice.invoice_number} settled & marked Paid (€${draftNetTotal.toFixed(2)}).`);
        } else if (targetStatus === "issued") {
          toast.success(`Invoice ${invoice.invoice_number} issued as Outstanding.`);
        } else {
          toast.success(`Invoice ${invoice.invoice_number} updated with partial deposit.`);
        }

        fetchDetail(invoice.id);
        onPaymentSuccess?.();
        if (targetStatus !== "draft") {
          onOpenChange(false);
        }
      } else {
        toast.error(res.error || "Failed to update draft invoice.");
      }
    } catch {
      toast.error("Failed to update draft invoice.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px] rounded-3xl p-0 overflow-hidden border border-border/80 shadow-2xl bg-card">
          {loading || !invoice ? (
            <div className="flex h-72 items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col">
              {/* ── Top Header Banner (Glass Sanctuary) ── */}
              <div className="relative bg-gradient-to-r from-[#062420] via-[#0B3B36] to-[#0E4741] px-6 py-5 text-white overflow-hidden">
                <div className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-emerald-400/15 blur-2xl" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-emerald-300 border border-white/15">
                        <Receipt className="size-4" />
                      </span>
                      <h2 className="font-heading text-lg font-black text-white font-mono tracking-tight">
                        {invoice.invoice_number}
                      </h2>
                    </div>
                    <p className="text-[11px] font-medium text-emerald-100/80 pl-9">
                      Issued {format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMM yyyy")}
                      {invoice.due_date &&
                        ` · Due ${format(new Date(`${invoice.due_date}T00:00:00`), "dd MMM yyyy")}`}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-extrabold capitalize border shadow-2xs",
                      formatStatusBadge(invoice.status),
                    )}
                  >
                    {formatStatusLabel(invoice.status)}
                  </Badge>
                </div>
              </div>

              {/* ── Patient Information Card ── */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <User className="size-4" />
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
                    <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Phone className="size-3 text-muted-foreground/70" />
                      <span>{invoice.patients.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── MAIN BODY: EDITABLE FOR DRAFT vs READ-ONLY FOR SETTLED ── */}
              <div className="px-6 py-3 space-y-4.5 max-h-[64vh] overflow-y-auto overflow-x-hidden">
                {isDraft ? (
                  /* ────────────────────────────────────────────────────────
                   * 1. FULLY EDITABLE DRAFT MODE
                   * ──────────────────────────────────────────────────────── */
                  <div className="space-y-4">
                    {/* Itemised Editable Treatments */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Treatments &amp; Line Items
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddItem}
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 border-border/70 hover:bg-muted/40 cursor-pointer"
                        >
                          <Plus className="size-3 text-primary" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {editableItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 rounded-2xl border border-border/80 bg-muted/15"
                          >
                            {/* Procedure Description */}
                            <Input
                              value={item.description}
                              onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                              placeholder="Procedure or service name..."
                              className="h-9 text-xs font-bold rounded-xl bg-card border-border/80 flex-1"
                            />

                            {/* Quantity */}
                            <div className="w-16">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  handleUpdateItem(idx, "quantity", Math.max(1, Number(e.target.value)))
                                }
                                placeholder="Qty"
                                className="h-9 text-center text-xs font-bold rounded-xl bg-card border-border/80 font-mono px-1"
                              />
                            </div>

                            {/* Unit Fee */}
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                €
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={item.unitPrice || ""}
                                onChange={(e) =>
                                  handleUpdateItem(idx, "unitPrice", Math.max(0, Number(e.target.value)))
                                }
                                placeholder="Fee"
                                className="h-9 pl-6 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                              />
                            </div>

                            {/* Delete Button (if > 1 item) */}
                            {editableItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Discount & Net Total Block */}
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              Clinician Discount
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
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              {discountType === "fixed" ? "€" : "%"}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              max={discountType === "percentage" ? 100 : draftSubtotal}
                              value={discountValue || ""}
                              onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                              placeholder="0"
                              className="h-8.5 pl-7 text-xs font-bold rounded-xl bg-card border-border/80 font-mono"
                            />
                          </div>
                        </div>

                        {/* Net Total Pill */}
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-muted-foreground block">
                            Net Payable
                          </span>
                          <span className="text-lg font-black font-mono text-[#0B3B36] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/70 px-3.5 py-0.5 rounded-xl inline-block mt-0.5 shadow-2xs">
                            €{draftNetTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Discount Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
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
                    </div>

                    {/* Settlement Choice (4 Distinct Signature Colors) */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Settlement Status
                      </Label>

                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. PAID */}
                        <button
                          type="button"
                          onClick={() => setSettlementStatus("paid")}
                          className={cn(
                            "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                            settlementStatus === "paid"
                              ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 shadow-xs ring-1.5 ring-emerald-500"
                              : "border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-900/30 dark:bg-emerald-950/10 hover:border-emerald-400",
                          )}
                        >
                          <div
                            className={cn(
                              "size-7 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              settlementStatus === "paid"
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                            )}
                          >
                            <Check className="size-3.5 stroke-[2.5]" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-foreground block leading-tight">
                              Paid
                            </span>
                            <span className="text-[10px] text-muted-foreground">100% Settled</span>
                          </div>
                        </button>

                        {/* 2. ISSUED */}
                        <button
                          type="button"
                          onClick={() => setSettlementStatus("issued")}
                          className={cn(
                            "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                            settlementStatus === "issued"
                              ? "border-amber-500 bg-amber-500/10 dark:bg-amber-950/40 shadow-xs ring-1.5 ring-amber-500"
                              : "border-amber-200/50 bg-amber-50/25 dark:border-amber-900/30 dark:bg-amber-950/10 hover:border-amber-400",
                          )}
                        >
                          <div
                            className={cn(
                              "size-7 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              settlementStatus === "issued"
                                ? "bg-amber-600 text-white"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                            )}
                          >
                            <Clock3 className="size-3.5 stroke-[2.5]" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-foreground block leading-tight">
                              Issued
                            </span>
                            <span className="text-[10px] text-muted-foreground">Outstanding</span>
                          </div>
                        </button>

                        {/* 3. PART PAID */}
                        <button
                          type="button"
                          onClick={() => setSettlementStatus("partially_paid")}
                          className={cn(
                            "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                            settlementStatus === "partially_paid"
                              ? "border-blue-500 bg-blue-500/10 dark:bg-blue-950/40 shadow-xs ring-1.5 ring-blue-500"
                              : "border-blue-200/50 bg-blue-50/25 dark:border-blue-900/30 dark:bg-blue-950/10 hover:border-blue-400",
                          )}
                        >
                          <div
                            className={cn(
                              "size-7 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              settlementStatus === "partially_paid"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                            )}
                          >
                            <Wallet className="size-3.5 stroke-[2.5]" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-foreground block leading-tight">
                              Part Paid
                            </span>
                            <span className="text-[10px] text-muted-foreground">Deposit</span>
                          </div>
                        </button>

                        {/* 4. DRAFT */}
                        <button
                          type="button"
                          onClick={() => setSettlementStatus("draft")}
                          className={cn(
                            "flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all cursor-pointer",
                            settlementStatus === "draft"
                              ? "border-purple-500 bg-purple-500/10 dark:bg-purple-950/40 shadow-xs ring-1.5 ring-purple-500"
                              : "border-purple-200/50 bg-purple-50/25 dark:border-purple-900/30 dark:bg-purple-950/10 hover:border-purple-400",
                          )}
                        >
                          <div
                            className={cn(
                              "size-7 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              settlementStatus === "draft"
                                ? "bg-purple-600 text-white"
                                : "bg-purple-500/15 text-purple-700 dark:text-purple-300",
                            )}
                          >
                            <FileEdit className="size-3.5 stroke-[2.5]" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-foreground block leading-tight">
                              Draft
                            </span>
                            <span className="text-[10px] text-muted-foreground">Keep in Draft</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Payment Method Selector (if Paid or Part Paid) */}
                    {(settlementStatus === "paid" || settlementStatus === "partially_paid") && (
                      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 space-y-2 animate-in fade-in-50">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Payment Method
                          </Label>
                          {settlementStatus === "partially_paid" && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Deposit Paid (€):
                              </span>
                              <Input
                                type="number"
                                min="1"
                                max={draftNetTotal}
                                step="1"
                                value={partialAmount || ""}
                                onChange={(e) =>
                                  setPartialAmount(
                                    Math.min(draftNetTotal, Math.max(0, Number(e.target.value))),
                                  )
                                }
                                className="h-7 w-20 rounded-lg bg-card text-xs font-bold font-mono px-2"
                                placeholder="0"
                              />
                            </div>
                          )}
                        </div>

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
                                "flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-2 text-xs font-bold transition-all border cursor-pointer",
                                paymentMethod === m.id
                                  ? "bg-[#0B3B36] text-white border-[#0B3B36] shadow-xs"
                                  : "bg-card text-foreground border-border/80 hover:bg-muted/40",
                              )}
                            >
                              <m.icon className="size-3" />
                              <span>{m.label}</span>
                            </button>
                          ))}
                        </div>

                        {settlementStatus === "partially_paid" && (
                          <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-muted-foreground border-t border-border/40">
                            <span>Remaining balance to bill:</span>
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                              €{draftRemainingBalance.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ────────────────────────────────────────────────────────
                   * 2. LOCKED READ-ONLY VIEW (Issued, Part Paid, Paid, Void)
                   * ──────────────────────────────────────────────────────── */
                  <div className="space-y-4">
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
                              className="grid grid-cols-[1fr_50px_95px_95px] gap-2 px-4 py-3 items-center"
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
                    <div className="ml-auto w-full sm:max-w-xs space-y-2 rounded-2xl border border-border/70 bg-muted/15 p-4 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal:</span>
                        <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
                      </div>

                      {Number(invoice.discount_amount) > 0 && (
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span>Discount:</span>
                          <span className="font-mono">-{formatCurrency(invoice.discount_amount)}</span>
                        </div>
                      )}

                      {Number(invoice.tax_amount) > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax:</span>
                          <span className="font-mono">{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-black text-foreground pt-1.5 border-t border-border/50 text-sm">
                        <span>Total Billed:</span>
                        <span className="font-mono">{formatCurrency(invoice.total)}</span>
                      </div>

                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-bold">
                        <span>Total Paid:</span>
                        <span className="font-mono">{formatCurrency(totalPaid)}</span>
                      </div>

                      <div className="flex items-center justify-between font-black text-foreground pt-1.5 border-t border-border/50 text-sm">
                        <span>Remaining Balance:</span>
                        <span
                          className={cn(
                            "font-mono rounded-lg px-2 py-0.5",
                            balance > 0
                              ? "bg-amber-50 text-amber-900 border border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-900 border border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300",
                          )}
                        >
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>

                    {/* Payment History Ledger */}
                    {payments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Payment Ledger
                        </Label>
                        <div className="rounded-2xl border border-border/70 overflow-hidden text-xs bg-card">
                          <div className="grid grid-cols-[100px_90px_1fr_85px] gap-2 border-b border-border/60 bg-muted/25 px-4 py-2 font-black uppercase tracking-wider text-[10px] text-muted-foreground">
                            <span>Date</span>
                            <span>Method</span>
                            <span>Reference</span>
                            <span className="text-right">Amount</span>
                          </div>
                          <ul className="divide-y divide-border/60">
                            {payments.map((p) => (
                              <li
                                key={p.id}
                                className="grid grid-cols-[100px_90px_1fr_85px] gap-2 px-4 py-2.5 items-center text-xs"
                              >
                                <span className="text-muted-foreground font-mono text-[11px]">
                                  {format(new Date(p.paid_at), "dd MMM yyyy")}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {formatPaymentMethodLabel(p.method)}
                                </span>
                                <span className="truncate text-[11px] text-muted-foreground">
                                  {p.reference || "—"}
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

              {/* ── Modal Footer Actions ── */}
              <DialogFooter className="p-4 sm:px-6 border-t border-border/60 bg-muted/15 flex flex-col sm:flex-row items-center justify-between gap-2">
                {!isDraft ? (
                  /* Read-Only Footer */
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="w-full sm:w-auto h-9.5 rounded-xl text-xs font-bold gap-1.5 border-border/80 cursor-pointer"
                    >
                      <Printer className="size-3.5" />
                      Print Statement
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-9.5 rounded-xl text-xs font-semibold hover:bg-muted/50 cursor-pointer"
                      >
                        Close
                      </Button>

                      {balance > 0 && invoice.status !== "void" && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setPaymentOpen(true)}
                          className="h-9.5 rounded-xl text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5 shadow-md shadow-[#0B3B36]/20 cursor-pointer"
                        >
                          <CreditCard className="size-3.5" />
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  /* Draft Edit Footer */
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSubmitting}
                      onClick={() => handleSaveDraftAction("draft")}
                      className="w-full sm:w-auto h-9.5 px-4 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      ) : (
                        <FileEdit className="size-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
                      )}
                      Save Draft
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-9.5 rounded-xl text-xs font-semibold border-border/80 cursor-pointer"
                      >
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSaveDraftAction(settlementStatus)}
                        className="h-9.5 px-5 text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white rounded-xl shadow-md shadow-[#0B3B36]/20 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 animate-spin mr-1.5" />
                        ) : (
                          <Check className="size-4 mr-1.5 stroke-[2.5]" />
                        )}
                        {settlementStatus === "draft"
                          ? "Save Changes"
                          : settlementStatus === "paid"
                            ? `Confirm & Settle (€${draftNetTotal.toFixed(2)})`
                            : settlementStatus === "issued"
                              ? `Confirm & Issue (€${draftNetTotal.toFixed(2)})`
                              : `Confirm Deposit (€${partialAmount.toFixed(2)})`}
                      </Button>
                    </div>
                  </>
                )}
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
