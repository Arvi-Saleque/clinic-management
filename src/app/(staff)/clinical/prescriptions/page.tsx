import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Activity, ArrowUpRight, FileCheck2, Pill, Plus, ShieldCheck, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireClinician } from "@/lib/auth/guards";
import { listStaffPrescriptions } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Prescriptions" };

export default async function StaffPrescriptionsPage() {
  await requireClinician();
  const prescriptions = await listStaffPrescriptions();
  const active = prescriptions.filter((prescription) => prescription.status === "active").length;
  const medicines = prescriptions.reduce((sum, prescription) => sum + prescription.prescription_items.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"><Pill className="size-3.5" />Clinical prescribing</div><h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">Prescriptions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Clear medicine, dose, frequency, duration and patient instructions—linked to the issuing clinician and patient record.</p></div>
        <ButtonLink href="/clinical/prescriptions/new" size="lg" className="h-11 gap-2 rounded-xl px-4"><Plus className="size-4" />New prescription</ButtonLink>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Prescriptions", value: prescriptions.length, icon: FileCheck2, tone: "bg-primary-soft text-primary" },
          { label: "Active records", value: active, icon: Activity, tone: "bg-success/10 text-success" },
          { label: "Medicine lines", value: medicines, icon: Pill, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
        ].map((item) => <article key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"><span className={`flex size-10 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="size-[18px]" /></span><div><p className="font-heading text-2xl font-extrabold">{item.value}</p><p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p></div></article>)}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/12 bg-primary-soft/40 p-4"><ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-primary" /><div><p className="text-xs font-extrabold">Prescribing safety</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Confirm the patient’s current medical history, allergies and medication before issuing. The treating clinician remains identifiable on every prescription.</p></div></div>

      {prescriptions.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Pill className="size-6" /></span><p className="mt-4 text-sm font-extrabold">No prescriptions recorded</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Create a prescription from a verified patient record after assessment.</p></div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {prescriptions.map((prescription) => (
            <article key={prescription.id} className="group rounded-3xl border border-border bg-surface p-5 shadow-[0_20px_50px_-44px_rgba(9,47,44,0.6)] transition hover:border-primary/25 sm:p-6">
              <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><Stethoscope className="size-[18px]" /></span><div><Link href={`/patients/${prescription.patients?.id ?? ""}`} className="text-sm font-extrabold hover:text-primary">{prescription.patients ? `${prescription.patients.first_name} ${prescription.patients.last_name}` : "Unknown patient"}</Link><p className="mt-1 text-[10px] text-muted-foreground">{prescription.patients?.phone ?? "No phone"} · {format(new Date(prescription.issued_at), "dd MMM yyyy, HH:mm")}</p></div></div><Badge variant="outline" className="border-success/20 bg-success/10 capitalize text-success">{prescription.status}</Badge></div>
              <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-background-subtle/40 px-4">
                {prescription.prescription_items.map((item) => <div key={item.id} className="py-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-extrabold">{item.medicine_name}</p><Pill className="size-3.5 text-primary" /></div><p className="mt-1 text-[11px] text-muted-foreground">{[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ") || "Dose details not recorded"}</p>{item.instructions && <p className="mt-1 text-[11px] font-semibold">{item.instructions}</p>}</div>)}
              </div>
              <div className="mt-4 flex items-center justify-between"><p className="text-[10px] text-muted-foreground">Issued by <strong className="text-foreground">{prescription.practitioners?.profiles?.full_name ?? "Practitioner"}</strong></p><Link href={`/patients/${prescription.patients?.id ?? ""}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">Patient record<ArrowUpRight className="size-3.5" /></Link></div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
