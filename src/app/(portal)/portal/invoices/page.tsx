import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileText, Receipt, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { listOwnInvoices } from "@/lib/server/directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My billing" };

const STATUS_STYLE: Record<string, string> = {
  draft: "border-border bg-background-subtle text-text-muted",
  issued: "border-warning/20 bg-warning/10 text-warning",
  partially_paid: "border-primary/20 bg-primary-soft text-primary",
  paid: "border-success/20 bg-success/10 text-success",
  void: "border-destructive/20 bg-destructive/10 text-destructive",
};

export default async function PortalInvoicesPage() {
  const invoices = await listOwnInvoices();
  const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const openCount = invoices.filter((invoice) => invoice.balance > 0 && invoice.status !== "void").length;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-secondary p-6 text-secondary-foreground shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Patient accounts</p>
            <h1 className="mt-2 font-serif text-4xl">Billing & invoices</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">A clear record of treatment charges, payments, due dates and remaining balances.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4">
            <p className="text-xs text-white/55">Total outstanding</p>
            <p className="mt-1 text-3xl font-bold">৳{outstanding.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total billed", value: totalBilled, icon: Receipt, tone: "bg-primary-soft text-primary" },
          { label: "Payments recorded", value: totalPaid, icon: CheckCircle2, tone: "bg-success/10 text-success" },
          { label: "Balance due", value: outstanding, icon: WalletCards, tone: "bg-warning/10 text-warning" },
          { label: "Open invoices", value: openCount, icon: Clock3, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300", plain: true },
        ].map((metric) => (
          <article key={metric.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <span className={cn("flex size-11 items-center justify-center rounded-xl", metric.tone)}><metric.icon className="size-5" /></span>
            <div><p className="text-xl font-bold">{metric.plain ? metric.value : `৳${metric.value.toLocaleString()}`}</p><p className="text-xs text-text-muted">{metric.label}</p></div>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3"><FileText className="size-5 text-primary" /><div><h2 className="font-heading text-xl font-bold">Invoice history</h2><p className="text-xs text-text-muted">Select an invoice to view itemised treatment and payment details.</p></div></div>
        {invoices.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center"><Receipt className="mx-auto size-9 text-text-muted" /><h3 className="mt-4 font-heading text-lg font-bold">No invoices yet</h3><p className="mt-2 text-sm text-text-muted">Your clinic invoices will appear here.</p></div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="hidden grid-cols-[1fr_150px_150px_150px_44px] gap-4 border-b border-border bg-background-subtle px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted md:grid">
              <span>Invoice</span><span>Issued / due</span><span>Total</span><span>Balance</span><span />
            </div>
            {invoices.map((invoice) => (
              <Link key={invoice.id} href={`/portal/invoices/${invoice.id}`} className="group grid gap-4 border-b border-border p-5 transition-colors last:border-0 hover:bg-primary-soft/30 md:grid-cols-[1fr_150px_150px_150px_44px] md:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{invoice.invoice_number}</p><Badge variant="outline" className={cn("capitalize", STATUS_STYLE[invoice.status])}>{invoice.status.replace("_", " ")}</Badge></div><p className="mt-1 text-xs text-text-muted">Treatment account statement</p></div>
                <div className="text-sm"><p>{new Date(invoice.issue_date).toLocaleDateString()}</p><p className="mt-1 text-xs text-text-muted">Due {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "on receipt"}</p></div>
                <div><p className="text-xs text-text-muted md:hidden">Total</p><p className="font-semibold">৳{Number(invoice.total).toLocaleString()}</p><p className="text-xs text-text-muted">Paid ৳{invoice.paid_amount.toLocaleString()}</p></div>
                <div><p className="text-xs text-text-muted md:hidden">Balance</p><p className={cn("font-bold", invoice.balance ? "text-warning" : "text-success")}>৳{invoice.balance.toLocaleString()}</p></div>
                <span className="flex size-9 items-center justify-center rounded-xl bg-background-subtle text-primary transition-transform group-hover:translate-x-0.5"><ArrowRight className="size-4" /></span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="rounded-2xl border border-border bg-primary-soft/50 p-4 text-xs leading-5 text-primary">Payments are recorded by authorised clinic staff. If a payment or balance looks incorrect, contact reception and quote the invoice number.</p>
    </div>
  );
}
