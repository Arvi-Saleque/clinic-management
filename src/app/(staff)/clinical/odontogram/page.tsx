import type { Metadata } from "next";
import { Box, History, ScanLine, Sparkles } from "lucide-react";

import { OdontogramPatientPicker } from "@/components/staff/odontogram-patient-picker";
import { requireClinician } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Dental Chart" };

export default async function StaffOdontogramPage() {
  await requireClinician();
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"><ScanLine className="size-3.5" />Interactive odontogram</div>
        <h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">Dental chart & treatment planning</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Select a patient, chart each tooth using a 3D-style FDI model, and document the finding, recommended care, priority, date and service fee.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Box, title: "3D-style dentition", text: "Anatomical tooth models are easier to scan than a plain number grid." },
          { icon: Sparkles, title: "Finding to treatment", text: "Connect the current condition directly to recommended care." },
          { icon: History, title: "Dated chart history", text: "Every change is recorded as a new event; earlier records remain available." },
        ].map((item) => <article key={item.title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><item.icon className="size-4" /></span><div><p className="text-xs font-extrabold">{item.title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{item.text}</p></div></article>)}
      </section>
      <OdontogramPatientPicker />
    </div>
  );
}
