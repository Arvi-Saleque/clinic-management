import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, FileCheck2, Receipt, ShieldCheck } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { InvoiceForm } from "@/components/staff/invoice-form";
import { requireClinician } from "@/lib/auth/guards";
import { getPatientById } from "@/lib/server/directory";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ patientId?: string }> }) {
  await requireClinician();
  const { patientId } = await searchParams;
  const initialPatient = patientId ? await getPatientById(patientId) : null;
  return (
    <div className="space-y-6">
      <div><ButtonLink href="/billing/invoices" variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5"><ArrowLeft className="size-4" />Invoice register</ButtonLink><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Receipt className="size-5" /></span><div><h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">Create patient invoice</h1><p className="mt-1 text-sm text-muted-foreground">Itemise treatment charges and issue a clear patient statement.</p></div></div></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-[0_24px_58px_-46px_rgba(9,47,44,0.6)] sm:p-7"><InvoiceForm initialPatient={initialPatient} /></section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-primary/12 bg-secondary p-6 text-white"><ShieldCheck className="size-5 text-accent" /><h2 className="mt-4 font-heading text-lg font-extrabold">Invoice quality check</h2><div className="mt-4 space-y-3 text-xs leading-5 text-white/70">{["Confirm the correct patient record.", "Use one clear line per treatment or service.", "Record discounts and tax transparently.", "Set a realistic due date and patient note."].map((item) => <p key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" />{item}</p>)}</div></div>
          <div className="rounded-3xl border border-border bg-surface p-5"><FileCheck2 className="size-5 text-primary" /><h3 className="mt-3 text-sm font-extrabold">After issuing</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">The invoice opens with its line items, totals, due balance and payment ledger. Reception can record partial or full payment.</p></div>
        </aside>
      </div>
    </div>
  );
}
