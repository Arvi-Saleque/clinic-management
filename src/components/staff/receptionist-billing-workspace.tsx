"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock3,
  CreditCard,
  Eye,
  Plus,
  Receipt,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecordPaymentDialog } from "@/components/staff/record-payment-dialog";
import { InvoiceDetailDialog } from "@/components/staff/invoice-detail-dialog";
import { TablePagination } from "@/components/shared/table-pagination";
import { useTablePagination } from "@/lib/hooks/use-table-pagination";
import { cn, formatCurrency } from "@/lib/utils";

export interface BillingInvoiceItem {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string | null;
  paid_amount: number;
  balance: number;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
}

interface ReceptionistBillingWorkspaceProps {
  invoices: BillingInvoiceItem[];
  userRole: string;
  patientFilterId?: string;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  issued: "border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  partially_paid: "border-blue-200/80 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  paid: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  void: "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
};

function formatStatusBadgeLabel(status: string) {
  if (status === "issued") return "Outstanding";
  if (status === "partially_paid") return "Part Paid";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ReceptionistBillingWorkspace({
  invoices,
  userRole,
  patientFilterId,
}: ReceptionistBillingWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReceptionist = userRole === "receptionist";

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "outstanding" | "paid" | "void">("all");

  // Dialog targets
  const [activeDetailId, setActiveDetailId] = React.useState<string | null>(null);
  const [activePaymentTarget, setActivePaymentTarget] = React.useState<BillingInvoiceItem | null>(null);

  // Operational KPI metrics (Reduced to 2 items for UK receptionist focus)
  const metrics = React.useMemo(() => {
    const totalDue = invoices.reduce((sum, inv) => sum + (inv.status !== "void" ? inv.balance : 0), 0);
    const dueCount = invoices.filter((inv) => ["issued", "partially_paid"].includes(inv.status) && inv.balance > 0).length;

    return { totalDue, dueCount };
  }, [invoices]);

  // Filtered List
  const filteredInvoices = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return invoices.filter((inv) => {
      // 1. Search match
      const patientName = inv.patients
        ? `${inv.patients.first_name} ${inv.patients.last_name}`.toLowerCase()
        : "";
      const phone = inv.patients?.phone?.toLowerCase() ?? "";
      const invNum = inv.invoice_number.toLowerCase();

      const matchesSearch =
        !normalized ||
        patientName.includes(normalized) ||
        phone.includes(normalized) ||
        invNum.includes(normalized);

      // 2. Status filter
      let matchesStatus = true;
      if (statusFilter === "outstanding") {
        matchesStatus = (inv.status === "issued" || inv.status === "partially_paid") && inv.balance > 0;
      } else if (statusFilter === "paid") {
        matchesStatus = inv.status === "paid";
      } else if (statusFilter === "void") {
        matchesStatus = inv.status === "void";
      }

      return matchesSearch && matchesStatus;
    });
  }, [invoices, query, statusFilter]);

  // Standard Modern Pagination
  const pagination = useTablePagination(filteredInvoices, {
    initialPageSize: 10,
  });

  // Filtered patient info
  const filteredPatient = React.useMemo(() => {
    if (!patientFilterId) return null;
    const match = invoices.find((i) => i.patients?.id === patientFilterId);
    return match?.patients ?? null;
  }, [invoices, patientFilterId]);

  function clearPatientFilter() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("patient");
    router.push(`/billing/invoices${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & SUMMARY STRIP                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Receipt className="size-3.5" />
            Billing &amp; Payments
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Patient Accounts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Itemised treatment billing, payment collection, and account balance statements.
          </p>
        </div>

        {/* Clinician / Admin can create invoices */}
        {!isReceptionist && (
          <Button
            type="button"
            onClick={() => router.push("/billing/invoices/new")}
            className="h-10 gap-2 rounded-xl px-4 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs shrink-0"
          >
            <Plus className="size-4" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* 2 Focused Operational Summary Cards (Reduced from 3 to 2 for UK focus) */}
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Outstanding Balance */}
        <article className="rounded-2xl border border-border/80 bg-card p-4.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <WalletCards className="size-4" />
              Outstanding Balance
            </span>
          </div>
          <p className="font-heading text-2xl font-extrabold text-foreground tabular-nums pt-1">
            {formatCurrency(metrics.totalDue)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Across {metrics.dueCount} unpaid {metrics.dueCount === 1 ? "invoice" : "invoices"}
          </p>
        </article>

        {/* Due Invoices */}
        <article className="rounded-2xl border border-border/80 bg-card p-4.5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-4" />
              Due Invoices
            </span>
          </div>
          <p className="font-heading text-2xl font-extrabold text-foreground tabular-nums pt-1">
            {metrics.dueCount}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Pending front-desk collection
          </p>
        </article>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. FILTER BAR & PATIENT CHIP                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="flex flex-col gap-3.5 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {/* Search Input */}
          <div className="relative min-w-[260px] sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient name, phone, or invoice #…"
              className="h-9.5 rounded-xl border-border/80 bg-card pl-8.5 pr-3 text-xs placeholder:text-muted-foreground/70 w-full"
            />
          </div>

          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                statusFilter === "all"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("outstanding")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                statusFilter === "outstanding"
                  ? "bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Outstanding
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("paid")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                statusFilter === "paid"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("void")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                statusFilter === "void"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Void
            </button>
          </div>
        </div>

        {/* Active Patient Filter Banner (if opened from Phase 3 profile) */}
        {patientFilterId && (
          <div className="flex items-center justify-between bg-primary-soft/40 border-b border-primary/20 px-5 py-2.5 text-xs">
            <span className="text-foreground">
              Filtering invoices for: <strong className="font-bold">{filteredPatient ? `${filteredPatient.first_name} ${filteredPatient.last_name}` : "Selected Patient"}</strong>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPatientFilter}
              className="h-7 text-xs text-primary hover:text-primary gap-1 px-2 font-bold"
            >
              <X className="size-3" />
              Clear Filter
            </Button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. INVOICE LIST TABLE                                         */}
        {/* ------------------------------------------------------------- */}
        {filteredInvoices.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Receipt className="size-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground">No invoices found</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {invoices.length === 0
                ? "No billing records have been created yet."
                : "Try clearing your search query or switching status filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border/60 bg-muted/25 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="py-3">Patient</th>
                  <th className="py-3">Issued / Due</th>
                  <th className="py-3 text-right">Total</th>
                  <th className="py-3 text-right">Paid</th>
                  <th className="py-3 text-right">Balance</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagination.paginatedItems.map((invoice) => {
                  const patientName = invoice.patients
                    ? `${invoice.patients.first_name} ${invoice.patients.last_name}`
                    : "—";

                  return (
                    <tr
                      key={invoice.id}
                      className="group hover:bg-muted/15 transition-colors h-[70px]"
                    >
                      {/* Invoice # */}
                      <td className="px-5 font-mono font-bold text-foreground">
                        <button
                          type="button"
                          onClick={() => setActiveDetailId(invoice.id)}
                          className="text-primary hover:underline font-extrabold cursor-pointer"
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>

                      {/* Patient Name (links to Phase 3 Admin Profile) */}
                      <td>
                        {invoice.patients ? (
                          <Link
                            href={`/patients/${invoice.patients.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors block"
                          >
                            {patientName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-foreground">{patientName}</span>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {invoice.patients?.phone || "No phone"}
                        </p>
                      </td>

                      {/* Issued Date & Due Date */}
                      <td>
                        <p className="font-medium text-foreground">
                          {format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMM yyyy")}
                        </p>
                        {invoice.due_date && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Due {format(new Date(`${invoice.due_date}T00:00:00`), "dd MMM")}
                          </p>
                        )}
                      </td>

                      {/* Total */}
                      <td className="text-right font-mono font-bold text-foreground">
                        {formatCurrency(invoice.total)}
                      </td>

                      {/* Paid Amount */}
                      <td className="text-right font-mono font-medium text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(invoice.paid_amount)}
                      </td>

                      {/* Balance Amount */}
                      <td className="text-right font-mono font-extrabold">
                        <span
                          className={
                            invoice.balance > 0
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-muted-foreground"
                          }
                        >
                          {formatCurrency(invoice.balance)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            STATUS_STYLE[invoice.status],
                          )}
                        >
                          {formatStatusBadgeLabel(invoice.status)}
                        </Badge>
                      </td>

                      {/* Operational Actions */}
                      <td className="px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Payment Button */}
                          {invoice.balance > 0 && invoice.status !== "void" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setActivePaymentTarget(invoice)}
                              className="h-8 rounded-xl px-2.5 text-[11px] font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1 shadow-2xs cursor-pointer"
                            >
                              <CreditCard className="size-3" />
                              Pay
                            </Button>
                          )}

                          {/* View Detail Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveDetailId(invoice.id)}
                            className="h-8 rounded-xl px-2.5 text-[11px] font-semibold border-border/80 hover:bg-muted/50 cursor-pointer"
                          >
                            <Eye className="size-3 text-muted-foreground" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Standard Modern Pagination */}
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          itemLabel="invoices"
        />
      </section>

      {/* Invoice Detail Dialog Modal */}
      {activeDetailId && (
        <InvoiceDetailDialog
          invoiceId={activeDetailId}
          open={!!activeDetailId}
          onOpenChange={(isOpen) => !isOpen && setActiveDetailId(null)}
          onPaymentSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Record Payment Dialog Modal */}
      {activePaymentTarget && (
        <RecordPaymentDialog
          invoiceId={activePaymentTarget.id}
          invoiceNumber={activePaymentTarget.invoice_number}
          patientName={
            activePaymentTarget.patients
              ? `${activePaymentTarget.patients.first_name} ${activePaymentTarget.patients.last_name}`
              : "Patient"
          }
          totalAmount={Number(activePaymentTarget.total)}
          balanceAmount={activePaymentTarget.balance}
          open={!!activePaymentTarget}
          onOpenChange={(isOpen) => !isOpen && setActivePaymentTarget(null)}
          onSuccess={() => {
            setActivePaymentTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
