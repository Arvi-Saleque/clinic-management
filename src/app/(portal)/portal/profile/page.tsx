import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarDays,
  ContactRound,
  FileHeart,
  HeartPulse,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { PatientProfileForm } from "@/components/portal/patient-profile-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getOwnPortalPatient } from "@/lib/server/patient-portal";

export const metadata: Metadata = { title: "My health profile" };

export default async function PortalProfilePage() {
  const patient = await getOwnPortalPatient();

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl rounded-[28px] border border-border bg-surface p-8 text-center shadow-sm">
        <UserRound className="mx-auto size-10 text-text-muted" />
        <h1 className="mt-4 font-serif text-3xl">Complete your registration</h1>
        <p className="mt-2 text-sm text-text-muted">Your patient and medical profile has not been created yet.</p>
        <ButtonLink href="/portal/register" className="mt-6">Start registration</ButtonLink>
      </div>
    );
  }

  const history = patient.medical_history;
  const completionFields = [patient.phone, patient.dob, patient.address, patient.emergency_contact_name, patient.emergency_contact_phone];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const initials = `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-secondary p-6 text-secondary-foreground shadow-xl sm:p-8">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/10 font-serif text-3xl">{initials}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-accent text-accent-foreground">Verified patient</Badge>
              <span className="text-xs font-bold tracking-[0.16em] text-white/55">{patient.patient_reference}</span>
            </div>
            <h1 className="mt-3 font-serif text-4xl">{patient.first_name} {patient.last_name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
              <span className="flex items-center gap-2"><Phone className="size-4" />{patient.phone || "No phone"}</span>
              <span className="flex items-center gap-2"><CalendarDays className="size-4" />Patient since {new Date(patient.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
            </div>
          </div>
          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.07] p-4 sm:w-56">
            <div className="flex items-center justify-between text-xs"><span className="text-white/60">Profile completeness</span><strong>{completion}%</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent" style={{ width: `${completion}%` }} /></div>
            <p className="mt-2 text-[11px] text-white/50">Complete details help the clinic provide safer care.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.68fr_1.32fr]">
        <div className="space-y-5">
          <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><FileHeart className="size-5" /></span>
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Clinical record</p><h2 className="font-heading text-lg font-bold">Medical safety</h2></div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Allergies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {history?.allergies.length ? history.allergies.map((item) => <Badge key={item} variant="outline" className="border-destructive/20 bg-destructive/5 text-destructive"><AlertTriangle className="size-3" />{item}</Badge>) : <span className="text-sm">None recorded</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Chronic conditions</p>
                <p className="mt-2 text-sm leading-6">{history?.chronic_conditions.length ? history.chronic_conditions.join(", ") : "None recorded"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Current medication</p>
                <p className="mt-2 text-sm leading-6">{history?.current_medications.length ? history.current_medications.join(", ") : "None recorded"}</p>
              </div>
              {history?.past_surgeries && <div><p className="text-xs font-bold uppercase tracking-wider text-text-muted">Past surgeries</p><p className="mt-2 text-sm leading-6">{history.past_surgeries}</p></div>}
            </div>

            <div className="mt-5 rounded-2xl bg-primary-soft p-4 text-xs leading-5 text-primary">
              <ShieldCheck className="mb-2 size-4" /> Medical-history changes are reviewed with clinic staff to protect the accuracy of your clinical record.
            </div>
            <ButtonLink href="/contact" variant="outline" className="mt-4 w-full">Request a medical update</ButtonLink>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3"><ContactRound className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold">Emergency contact</h2></div>
            <p className="mt-4 text-sm font-semibold">{patient.emergency_contact_name || "Not provided"}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-text-muted"><Phone className="size-4" />{patient.emergency_contact_phone || "Not provided"}</p>
          </article>

          <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3"><MapPin className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold">Address on file</h2></div>
            <p className="mt-4 text-sm leading-6 text-text-muted">{patient.address || "No address provided"}</p>
          </article>
        </div>

        <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
          <div className="mb-7 flex items-center gap-3 border-b border-border pb-5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><UserRound className="size-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Self-service</p><h2 className="font-heading text-xl font-bold">Personal & contact details</h2></div>
          </div>
          <PatientProfileForm patient={patient} />
        </article>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm text-text-muted">
        <HeartPulse className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>Your patient reference is <strong className="text-foreground">{patient.patient_reference}</strong>. Use it when contacting reception so your record can be located quickly.</p>
      </div>
    </div>
  );
}
