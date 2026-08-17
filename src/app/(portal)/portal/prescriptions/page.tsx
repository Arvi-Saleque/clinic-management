import type { Metadata } from "next";
import { AlertTriangle, CalendarDays, FileText, Pill, ShieldCheck, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { listOwnPrescriptions } from "@/lib/server/directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My prescriptions" };

export default async function PortalPrescriptionsPage() {
  const prescriptions = await listOwnPrescriptions();
  const active = prescriptions.filter((prescription) => prescription.status !== "void");
  const medicineCount = active.flatMap((prescription) => prescription.prescription_items).length;
  const latest = active[0] ?? null;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-secondary p-6 text-secondary-foreground shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Medication record</p>
            <h1 className="mt-2 font-serif text-4xl">My prescriptions</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">Review exactly what was prescribed, how to take it, and the clinician’s instructions.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4"><p className="text-xs text-white/55">Records</p><p className="mt-1 text-2xl font-bold">{active.length}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4"><p className="text-xs text-white/55">Medicines</p><p className="mt-1 text-2xl font-bold">{medicineCount}</p></div>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/8 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <p><strong>Medicine safety:</strong> Follow the written dose and instructions. Contact the clinic or a qualified pharmacist if anything is unclear. Seek urgent medical help for a severe reaction.</p>
      </div>

      {latest && (
        <section className="rounded-3xl border border-primary/20 bg-primary-soft/40 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Pill className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Latest prescription</p><h2 className="font-heading text-lg font-bold">{new Date(latest.issued_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</h2></div></div>
            <p className="flex items-center gap-2 text-sm text-text-muted"><Stethoscope className="size-4 text-primary" />{latest.practitioners?.profiles?.full_name ?? "Clinic practitioner"}</p>
          </div>
        </section>
      )}

      {prescriptions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center"><Pill className="mx-auto size-9 text-text-muted" /><h2 className="mt-4 font-heading text-lg font-bold">No prescriptions yet</h2><p className="mt-2 text-sm text-text-muted">Medicines prescribed during your care will appear here.</p></div>
      ) : (
        <section className="space-y-4">
          {prescriptions.map((prescription, index) => (
            <article key={prescription.id} className={cn("overflow-hidden rounded-3xl border bg-surface shadow-sm", index === 0 && prescription.status !== "void" ? "border-primary/30" : "border-border")}>
              <div className="flex flex-col gap-4 border-b border-border bg-background-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5" /></span>
                  <div><p className="font-heading text-lg font-bold">Prescription · {new Date(prescription.issued_at).toLocaleDateString()}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted"><Stethoscope className="size-3.5" />{prescription.practitioners?.profiles?.full_name ?? "Clinic practitioner"}</p></div>
                </div>
                <div className="flex items-center gap-2"><Badge variant="outline" className={cn("capitalize", prescription.status === "void" ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-success/20 bg-success/10 text-success")}>{prescription.status}</Badge><span className="flex items-center gap-1 text-xs text-text-muted"><CalendarDays className="size-3.5" />{prescription.prescription_items.length} medicine{prescription.prescription_items.length === 1 ? "" : "s"}</span></div>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-2">
                {prescription.prescription_items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">{itemIndex + 1}</span><div><p className="font-semibold">{item.medicine_name}</p><p className="mt-1 text-xs text-text-muted">{[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ") || "Follow clinician instructions"}</p></div></div>
                    {item.instructions && <p className="mt-3 rounded-xl bg-background-subtle p-3 text-xs leading-5 text-text-muted"><strong className="text-foreground">Instructions:</strong> {item.instructions}</p>}
                  </div>
                ))}
              </div>
              {prescription.notes && <div className="border-t border-border px-5 py-4 text-sm text-text-muted"><strong className="text-foreground">Clinical note:</strong> {prescription.notes}</div>}
            </article>
          ))}
        </section>
      )}

      <p className="flex items-center gap-2 text-xs text-text-muted"><ShieldCheck className="size-4 text-success" />Prescription records are read-only and issued by an authorised clinic practitioner.</p>
    </div>
  );
}
