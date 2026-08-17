import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, CircleDollarSign, Clock3, CreditCard, FileCheck2, Plus, Receipt, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listInvoices } from "@/lib/server/directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_STYLE: Record<string, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  issued: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  partially_paid: "border-warning/20 bg-warning/10 text-warning",
  paid: "border-success/20 bg-success/10 text-success",
  void: "border-destructive/20 bg-destructive/10 text-destructive",
};

export default async function StaffInvoicesPage() {
  const invoices = await listInvoices();
  const billed = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const received = invoices.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  const due = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const open = invoices.filter((invoice) => ["issued", "partially_paid"].includes(invoice.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"><Receipt className="size-3.5" />Patient accounts</div><h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">Billing & invoices</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Itemised treatment charges, payment history, open balance and due dates in one account view.</p></div>
        <ButtonLink href="/billing/invoices/new" size="lg" className="h-11 gap-2 rounded-xl px-4"><Plus className="size-4" />Create invoice</ButtonLink>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total billed", value: `৳${billed.toLocaleString()}`, note: `${invoices.length} invoices`, icon: FileCheck2, tone: "bg-primary-soft text-primary" },
          { label: "Payments received", value: `৳${received.toLocaleString()}`, note: "Recorded transactions", icon: CreditCard, tone: "bg-success/10 text-success" },
          { label: "Outstanding", value: `৳${due.toLocaleString()}`, note: `${open} open invoices`, icon: WalletCards, tone: "bg-warning/10 text-warning" },
          { label: "Collection rate", value: billed > 0 ? `${Math.round((received / billed) * 100)}%` : "0%", note: "Paid against billed", icon: CircleDollarSign, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
        ].map((item) => <article key={item.label} className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-start justify-between"><span className={cn("flex size-10 items-center justify-center rounded-xl", item.tone)}><item.icon className="size-[18px]" /></span><ArrowUpRight className="size-4 text-muted-foreground" /></div><p className="mt-4 text-[11px] font-semibold text-muted-foreground">{item.label}</p><p className="mt-1 font-heading text-2xl font-extrabold tracking-[-0.03em]">{item.value}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.note}</p></article>)}
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_22px_60px_-48px_rgba(9,47,44,0.6)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-heading text-lg font-extrabold">Invoice register</h2><p className="mt-1 text-xs text-muted-foreground">Open any invoice for the itemised statement and payment ledger.</p></div><span className="rounded-xl bg-muted px-3 py-1.5 text-[10px] font-bold text-muted-foreground">Latest first</span></div>
        {invoices.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Receipt className="size-6" /></span><p className="mt-4 text-sm font-extrabold">No invoices created</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Create an itemised invoice after recording treatment or a consultation.</p></div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/55"><TableRow className="hover:bg-muted/55"><TableHead className="h-12 px-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Invoice</TableHead><TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Patient</TableHead><TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Issued / due</TableHead><TableHead className="h-12 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Total</TableHead><TableHead className="h-12 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Paid</TableHead><TableHead className="h-12 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Balance</TableHead><TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Status</TableHead></TableRow></TableHeader>
            <TableBody>{invoices.map((invoice) => <TableRow key={invoice.id} className="group h-[76px] hover:bg-primary-soft/30"><TableCell className="px-5"><Link href={`/billing/invoices/${invoice.id}`} className="font-mono text-xs font-extrabold text-primary hover:underline">{invoice.invoice_number}</Link></TableCell><TableCell><Link href={`/patients/${invoice.patients?.id ?? ""}`} className="text-xs font-bold hover:text-primary">{invoice.patients ? `${invoice.patients.first_name} ${invoice.patients.last_name}` : "—"}</Link><p className="mt-1 text-[10px] text-muted-foreground">{invoice.patients?.phone ?? "No phone"}</p></TableCell><TableCell><p className="text-xs font-semibold">{format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMM yyyy")}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock3 className="size-3" />{invoice.due_date ? `Due ${format(new Date(`${invoice.due_date}T00:00:00`), "dd MMM")}` : "No due date"}</p></TableCell><TableCell className="text-right text-xs font-extrabold">৳{Number(invoice.total).toLocaleString()}</TableCell><TableCell className="text-right text-xs font-bold text-success">৳{invoice.paid_amount.toLocaleString()}</TableCell><TableCell className="text-right text-xs font-extrabold">৳{invoice.balance.toLocaleString()}</TableCell><TableCell><Badge variant="outline" className={cn("capitalize", STATUS_STYLE[invoice.status])}>{invoice.status.replace("_", " ")}</Badge></TableCell></TableRow>)}</TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
