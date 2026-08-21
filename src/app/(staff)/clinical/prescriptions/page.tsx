import type { Metadata } from "next";
import { Activity, FileCheck2, Pill, Plus, ShieldCheck } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { PrescriptionsCatalogView } from "@/components/staff/prescriptions-catalog-view";
import { requireClinician } from "@/lib/auth/guards";
import { listStaffPrescriptions } from "@/lib/server/directory";

export const metadata: Metadata = { title: "Prescriptions" };

export default async function StaffPrescriptionsPage() {
  await requireClinician();
  const prescriptions = await listStaffPrescriptions();
  const active = prescriptions.filter((prescription) => prescription.status === "active").length;
  const medicines = prescriptions.reduce((sum, prescription) => sum + prescription.prescription_items.length, 0);

  return (
    <div className="space-y-6 w-full max-w-[1600px] pb-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-border/60 pb-5">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <Pill className="size-3.5" />
            Clinical Prescribing
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Prescriptions
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            Clear medication, dose, frequency, duration and patient instructions &mdash; linked to the issuing clinician and central patient record.
          </p>
        </div>
        <ButtonLink
          href="/clinical/prescriptions/new"
          className="h-10 gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-5 text-xs font-bold text-white shadow-md shadow-[#0B3B36]/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>New Prescription</span>
        </ButtonLink>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Prescriptions", value: prescriptions.length, icon: FileCheck2, tone: "bg-primary-soft text-primary" },
          { label: "Active Treatments", value: active, icon: Activity, tone: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60" },
          { label: "Medicine Lines", value: medicines, icon: Pill, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60" },
        ].map((item) => (
          <article key={item.label} className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 shadow-xs">
            <span className={`flex size-11 items-center justify-center rounded-2xl ${item.tone}`}>
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-black text-foreground">{item.value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft/30 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-bold text-foreground">Prescribing Safety &amp; Governance</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Confirm the patient&apos;s current medical history, allergies and contraindications before issuing. The treating clinician remains identifiable on every prescription.
          </p>
        </div>
      </div>

      {/* Paginated Prescriptions View */}
      <PrescriptionsCatalogView prescriptions={prescriptions} />
    </div>
  );
}
