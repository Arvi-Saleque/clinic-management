"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  Ban,
  Clock3,
  CreditCard,
  Eye,
  FileEdit,
  Plus,
  Receipt,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  draft: "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300",
  issued: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  partially_paid: "border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300",
  paid: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  void: "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
};

function formatStatusBadgeLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "issued") return "Outstanding";
  if (status === "partially_paid") return "Part Paid";
  if (status === "paid") return "Paid in Full";
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
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "draft" | "partially_paid" | "outstanding" | "paid"
  >("all");
  const [sortOrder, setSortOrder] = React.useState<"earliest" | "latest">("earliest");

  // Dialog targets
  const [activeDetailId, setActiveDetailId] = React.useState<string | null>(null);

  // Operational KPI metrics (UK clinic focus)
  const metrics = React.useMemo(() => {
    const totalDue = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const dueCount = invoices.filter(
      (inv) => ["issued", "partially_paid"].includes(inv.status) && inv.balance > 0,
    ).length;

    return { totalDue, dueCount };
  }, [invoices]);

  // Tab Counts for Instant Visual Feedback
  const tabCounts = React.useMemo(() => {
    return {
      all: invoices.length,
      draft: invoices.filter((i) => i.status === "draft").length,
      partially_paid: invoices.filter((i) => i.status === "partially_paid").length,
      outstanding: invoices.filter((i) => i.status === "issued").length,
      paid: invoices.filter((i) => i.status === "paid").length,
    };
  }, [invoices]);

  // Filtered & Chronologically Sorted List
  const filteredInvoices = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const matches = invoices.filter((inv) => {
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
      if (statusFilter === "draft") {
        matchesStatus = inv.status === "draft";
      } else if (statusFilter === "partially_paid") {
        matchesStatus = inv.status === "partially_paid";
      } else if (statusFilter === "outstanding") {
        matchesStatus = inv.status === "issued";
      } else if (statusFilter === "paid") {
        matchesStatus = inv.status === "paid";
      }

      return matchesSearch && matchesStatus;
    });

    return [...matches].sort((a, b) => {
      const timeA = new Date(
        a.issue_date || (a as { created_at?: string }).created_at || 0,
      ).getTime();
      const timeB = new Date(
        b.issue_date || (b as { created_at?: string }).created_at || 0,
      ).getTime();
      return sortOrder === "earliest" ? timeA - timeB : timeB - timeA;
    });
  }, [invoices, query, statusFilter, sortOrder]);

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
      {/* ── 1. HEADER & OPERATIONAL SUMMARY STRIP ── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Receipt className="size-4" />
            <span>Practice Accounts &bull; UK Clinic</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Patient Invoices &amp; Ledger
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Itemised dental treatments, chairside collections, installments, and statement history.
          </p>
        </div>

        {/* Clinician / Admin can create invoices */}
        {!isReceptionist && (
          <Button
            type="button"
            onClick={() => router.push("/billing/invoices/new")}
            className="h-10 gap-2 rounded-2xl px-5 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-md shadow-[#0B3B36]/15 shrink-0 cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Operational Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        {/* Outstanding Balance */}
        <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold">
            <span className="flex items-center gap-2">
              <WalletCards className="size-4.5 text-amber-600 dark:text-amber-400" />
              Total Outstanding Balance
            </span>
          </div>
          <p className="font-heading text-3xl font-black text-foreground tabular-nums font-mono pt-1">
            {formatCurrency(metrics.totalDue)}
          </p>
          <p className="text-xs text-muted-foreground">
            Across {metrics.dueCount} unpaid {metrics.dueCount === 1 ? "invoice" : "invoices"}
          </p>
        </article>

        {/* Pending Invoices */}
        <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-cyan-800 dark:text-cyan-300 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Clock3 className="size-4.5 text-cyan-600 dark:text-cyan-400" />
              Pending Settlement
            </span>
          </div>
          <p className="font-heading text-3xl font-black text-foreground tabular-nums font-mono pt-1">
            {metrics.dueCount}
          </p>
          <p className="text-xs text-muted-foreground">Pending front-desk or installment collection</p>
        </article>
      </section>

      {/* ── 2. FILTER BAR & PATIENT CHIP ── */}
      <section className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="flex flex-col gap-3.5 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {/* Search Input */}
          <div className="relative min-w-[260px] sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient name, phone, or invoice #…"
              className="h-10 rounded-2xl border-border/80 bg-card pl-9.5 pr-3 text-xs placeholder:text-muted-foreground/70 w-full"
            />
          </div>

          {/* Quick Status Filter Tabs with Counts */}
          <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/80 bg-muted/20 p-1">
            {[
              { id: "all" as const, label: "All", count: tabCounts.all },
              { id: "draft" as const, label: "Drafts", count: tabCounts.draft },
              { id: "partially_paid" as const, label: "Part Paid", count: tabCounts.partially_paid },
              { id: "outstanding" as const, label: "Outstanding", count: tabCounts.outstanding },
              { id: "paid" as const, label: "Paid", count: tabCounts.paid },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  statusFilter === tab.id
                    ? tab.id === "draft"
                      ? "bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 shadow-2xs"
                      : tab.id === "partially_paid"
                        ? "bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-200 shadow-2xs"
                        : tab.id === "outstanding"
                          ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 shadow-2xs"
                          : tab.id === "paid"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 shadow-2xs"
                            : "bg-card text-foreground border border-border/80 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                    statusFilter === tab.id ? "bg-black/10 dark:bg-white/10" : "text-muted-foreground/80",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Patient Filter Banner */}
        {patientFilterId && (
          <div className="flex items-center justify-between bg-primary/10 border-b border-primary/20 px-5 py-2.5 text-xs">
            <span className="text-foreground">
              Filtering invoices for:{" "}
              <strong className="font-bold">
                {filteredPatient
                  ? `${filteredPatient.first_name} ${filteredPatient.last_name}`
                  : "Selected Patient"}
              </strong>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearPatientFilter}
              className="h-7 text-xs text-primary hover:text-primary gap-1 px-2 font-bold cursor-pointer"
            >
              <X className="size-3" />
              Clear Filter
            </Button>
          </div>
        )}

        {/* ── 3. INVOICE LIST TABLE (UK STYLE & BIGGER TEXT) ── */}
        {filteredInvoices.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground shadow-inner">
              <Receipt className="size-6" />
            </span>
            <p className="mt-3.5 text-base font-black text-foreground">No invoices found</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              {invoices.length === 0
                ? "No billing records have been created yet."
                : "Try adjusting your search query or selecting a different status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border/70 bg-muted/30 text-xs font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Invoice Ref</th>
                  <th className="py-3.5">Patient / Contact</th>
                  <th className="py-3.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder(sortOrder === "earliest" ? "latest" : "earliest")
                      }
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer group"
                      title={
                        sortOrder === "earliest"
                          ? "Sorted: Earliest to Farthest (Click to reverse)"
                          : "Sorted: Farthest to Earliest (Click to reverse)"
                      }
                    >
                      <span>Issued / Due</span>
                      <ArrowUpDown
                        className={cn(
                          "size-3.5 transition-colors",
                          sortOrder === "earliest"
                            ? "text-primary font-bold"
                            : "text-muted-foreground",
                        )}
                      />
                      <span className="text-[10px] font-mono text-primary/80 lowercase">
                        ({sortOrder === "earliest" ? "earliest" : "latest"})
                      </span>
                    </button>
                  </th>
                  <th className="py-3.5 text-right">Total Billed</th>
                  <th className="py-3.5 text-right">Amount Paid</th>
                  <th className="py-3.5 text-right">Balance Due</th>
                  <th className="py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
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
                      className="group hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors h-[76px]"
                    >
                      {/* Invoice # */}
                      <td className="px-6 font-mono font-black text-sm">
                        <button
                          type="button"
                          onClick={() => setActiveDetailId(invoice.id)}
                          className="text-primary hover:underline font-extrabold cursor-pointer"
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>

                      {/* Patient Name */}
                      <td>
                        {invoice.patients ? (
                          <Link
                            href={`/patients/${invoice.patients.id}`}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors block"
                          >
                            {patientName}
                          </Link>
                        ) : (
                          <span className="font-bold text-sm text-foreground">{patientName}</span>
                        )}
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {invoice.patients?.phone || "No phone recorded"}
                        </p>
                      </td>

                      {/* Issued Date & Due Date */}
                      <td>
                        <p className="font-semibold text-xs text-foreground">
                          {format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMM yyyy")}
                        </p>
                        {invoice.due_date && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Due {format(new Date(`${invoice.due_date}T00:00:00`), "dd MMM yyyy")}
                          </p>
                        )}
                      </td>

                      {/* Total */}
                      <td className="text-right font-mono font-bold text-sm text-foreground">
                        {formatCurrency(invoice.total)}
                      </td>

                      {/* Paid Amount */}
                      <td className="text-right font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(invoice.paid_amount)}
                      </td>

                      {/* Balance Amount */}
                      <td className="text-right font-mono font-black text-sm">
                        <span
                          className={
                            invoice.balance > 0
                              ? "text-amber-800 dark:text-amber-300"
                              : "text-muted-foreground"
                          }
                        >
                          {formatCurrency(invoice.balance)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border shadow-2xs",
                            STATUS_STYLE[invoice.status],
                          )}
                        >
                          {formatStatusBadgeLabel(invoice.status)}
                        </Badge>
                      </td>

                      {/* Operational Actions */}
                      <td className="px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Settle / Pay Installment */}
                          {invoice.balance > 0 && invoice.status !== "void" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setActiveDetailId(invoice.id)}
                              className="h-8.5 rounded-xl px-3 text-xs font-black bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CreditCard className="size-3.5" />
                              Pay
                            </Button>
                          )}

                          {/* View Detail Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveDetailId(invoice.id)}
                            className="h-8.5 rounded-xl px-3 text-xs font-bold border-border/80 hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <Eye className="size-3.5 text-muted-foreground mr-1" />
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

      {/* Invoice Detail Dialog Modal (Handles both View and Pay) */}
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
    </div>
  );
}
