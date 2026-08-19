import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, HeartPulse, Pill, ShieldAlert } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { PrescriptionForm } from "@/components/staff/prescription-form";
import { requireClinician } from "@/lib/auth/guards";
import { getPatientById, getPatientMedicalHistory } from "@/lib/server/directory";

export const metadata: Metadata = { title: "New prescription" };

export default async function NewPrescriptionPage({ searchParams }: { searchParams: Promise<{ patientId?: string }> }) {
  await requireClinician();
  const { patientId } = await searchParams;
  const [initialPatient, initialClinicalContext] = patientId
    ? await Promise.all([getPatientById(patientId), getPatientMedicalHistory(patientId)])
    : [null, null];
  return (
    <div className="space-y-6">
      <div><ButtonLink href="/clinical/prescriptions" variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5"><ArrowLeft className="size-4" />Prescription register</ButtonLink><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Pill className="size-5" /></span><div><h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">New prescription</h1><p className="mt-1 text-sm text-muted-foreground">Create a clear, patient-linked medicine record after clinical assessment.</p></div></div></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="rounded-3xl border border-border bg-surface p-5 shadow-[0_24px_58px_-46px_rgba(9,47,44,0.6)] sm:p-7"><PrescriptionForm initialPatient={initialPatient} initialClinicalContext={initialClinicalContext} /></section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-destructive/18 bg-destructive/6 p-5"><ShieldAlert className="size-5 text-destructive" /><h2 className="mt-3 text-sm font-extrabold">Before prescribing</h2><div className="mt-3 space-y-3 text-xs leading-5 text-muted-foreground">{["Verify patient identity.", "Review allergies and current medicines.", "Confirm dose, frequency and duration.", "Give unambiguous patient instructions."].map((item) => <p key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />{item}</p>)}</div></div>
          <div className="rounded-3xl border border-primary/12 bg-secondary p-6 text-white"><HeartPulse className="size-5 text-accent" /><h3 className="mt-4 font-heading text-lg font-extrabold">Accurate clinical record</h3><p className="mt-2 text-xs leading-6 text-white/65">Every saved prescription is linked to the patient and issuing practitioner, so future clinicians can understand what was prescribed and when.</p></div>
        </aside>
      </div>
    </div>
  );
}
