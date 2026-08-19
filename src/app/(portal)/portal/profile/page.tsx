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
      <div className="mx-auto max-w-3xl rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-8 sm:p-12 text-center shadow-lg space-y-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary mx-auto">
          <UserRound className="size-8" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-foreground">Complete your registration</h1>
        <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
          Your patient and medical profile has not been created yet.
        </p>
        <div className="pt-2">
          <ButtonLink href="/portal/register" className="rounded-2xl px-6 h-11 font-bold text-sm">
            Start registration
          </ButtonLink>
        </div>
      </div>
    );
  }

  const history = patient.medical_history;
  const completionFields = [
    patient.phone,
    patient.dob,
    patient.address,
    patient.emergency_contact_name,
    patient.emergency_contact_phone,
  ];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const initials = `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-8">
      {/* ── PROFILE HERO SANCTUARY CARD ── */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-xl transition-all">
        {/* Soft Ambient Background Glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
            {/* Initials Luxury Avatar */}
            <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-primary-hover font-serif text-3xl sm:text-4xl font-extrabold text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/10">
              {initials}
            </div>

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-3 py-0.5 text-xs shadow-xs">
                  Verified patient
                </Badge>
                <span className="text-xs font-mono font-bold tracking-widest text-text-muted">
                  {patient.patient_reference}
                </span>
              </div>

              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {patient.first_name} {patient.last_name}
              </h1>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm text-text-secondary">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <Phone className="size-3.5 text-primary" />
                  {patient.phone || "No phone"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-text-muted">
                  <CalendarDays className="size-3.5 text-primary" />
                  Patient since {new Date(patient.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Completeness Card */}
          <div className="w-full rounded-[24px] border border-border/80 bg-background-subtle/80 backdrop-blur-md p-4 sm:p-5 lg:w-64 shrink-0 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-secondary">Profile completeness</span>
              <strong className="font-heading text-sm font-extrabold text-primary">{completion}%</strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Complete details help the clinic provide safer care.
            </p>
          </div>
        </div>
      </section>

      {/* ── PROFILE DETAILS & MEDICAL SAFETY GRID ── */}
      <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr] items-start">
        {/* Left Column: Clinical Safety & Records */}
        <div className="space-y-6">
          {/* Card 1: Medical safety */}
          <article className="rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
                <FileHeart className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Clinical record</p>
                <h2 className="font-heading text-lg font-bold text-foreground">Medical safety</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background-subtle/60 p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Allergies</p>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {history?.allergies.length ? (
                    history.allergies.map((item) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="border-destructive/25 bg-destructive/8 text-destructive text-xs font-semibold px-2.5 py-0.5 gap-1.5"
                      >
                        <AlertTriangle className="size-3" />
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-text-secondary font-medium">None recorded</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background-subtle/60 p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Chronic conditions</p>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {history?.chronic_conditions.length ? history.chronic_conditions.join(", ") : "None recorded"}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background-subtle/60 p-3.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Current medication</p>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {history?.current_medications.length ? history.current_medications.join(", ") : "None recorded"}
                </p>
              </div>

              {history?.past_surgeries && (
                <div className="rounded-2xl border border-border/70 bg-background-subtle/60 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Past surgeries</p>
                  <p className="text-xs font-medium text-foreground leading-relaxed">{history.past_surgeries}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary-soft/50 p-4 text-xs leading-relaxed text-primary space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="size-4 shrink-0" />
                <span>Protected Record</span>
              </div>
              <p>Medical-history changes are reviewed with clinic staff to protect the accuracy of your clinical record.</p>
            </div>

            <ButtonLink
              href="/contact"
              variant="outline"
              className="w-full rounded-2xl text-xs font-bold border-border/80 bg-surface hover:bg-surface-elevated h-10 shadow-2xs"
            >
              Request a medical update
            </ButtonLink>
          </article>

          {/* Card 2: Emergency contact */}
          <article className="rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                <ContactRound className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Primary Support</p>
                <h2 className="font-heading text-base font-bold text-foreground">Emergency contact</h2>
              </div>
            </div>

            <div className="pt-1 space-y-1">
              <p className="text-sm font-bold text-foreground">{patient.emergency_contact_name || "Not provided"}</p>
              <p className="flex items-center gap-2 text-xs font-medium text-text-muted">
                <Phone className="size-3.5 text-primary" />
                {patient.emergency_contact_phone || "Not provided"}
              </p>
            </div>
          </article>

          {/* Card 3: Address on file */}
          <article className="rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                <MapPin className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Residence</p>
                <h2 className="font-heading text-base font-bold text-foreground">Address on file</h2>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-xs leading-relaxed text-text-secondary font-medium">
                {patient.address || "No address provided"}
              </p>
            </div>
          </article>
        </div>

        {/* Right Column: Personal & Contact Details Form */}
        <article className="rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 sm:p-8 lg:p-9 shadow-sm space-y-6">
          <div className="flex items-center gap-3.5 border-b border-border/60 pb-5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
              <UserRound className="size-6" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Self-service</p>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Personal & contact details</h2>
            </div>
          </div>

          <PatientProfileForm patient={patient} />
        </article>
      </section>

      {/* ── FOOTER REFERENCE BADGE ── */}
      <div className="flex items-center gap-3.5 rounded-[24px] border border-border/80 bg-surface/85 backdrop-blur-xl p-4.5 text-xs text-text-secondary shadow-xs">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <HeartPulse className="size-4.5" />
        </div>
        <p className="leading-relaxed">
          Your patient reference is <strong className="font-mono font-bold text-foreground">{patient.patient_reference}</strong>. Use it when contacting reception so your record can be located quickly.
        </p>
      </div>
    </div>
  );
}
