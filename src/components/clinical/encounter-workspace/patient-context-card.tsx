import { differenceInYears, format } from "date-fns";
import {
  Activity,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  EncounterMedicalHistory,
  EncounterWorkspacePatient,
} from "@/types/clinical";

interface PatientContextCardProps {
  patient: EncounterWorkspacePatient;
  medicalHistory?: EncounterMedicalHistory | null;
}

export function PatientContextCard({
  patient,
  medicalHistory,
}: PatientContextCardProps) {
  const age = patient.dob
    ? differenceInYears(new Date(), new Date(`${patient.dob}T00:00:00`))
    : null;

  const dobFormatted = patient.dob
    ? format(new Date(`${patient.dob}T00:00:00`), "MMM d, yyyy")
    : null;

  const allergiesCount = medicalHistory?.allergies?.length ?? 0;
  const medsCount = medicalHistory?.current_medications?.length ?? 0;
  const conditionsCount = medicalHistory?.chronic_conditions?.length ?? 0;

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <UserRound className="size-4" />
          </div>
          <h2 className="font-heading text-base font-bold text-foreground">
            Patient Demographics
          </h2>
        </div>
      </div>

      {/* 2x2 Demographic Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. DOB / Age */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground shrink-0">
            <CalendarDays className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              DOB / Age
            </p>
            <p className="font-heading text-sm font-bold text-foreground truncate">
              {dobFormatted ? `${dobFormatted} (${age}y)` : "Not provided"}
            </p>
          </div>
        </div>

        {/* 2. Gender */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground shrink-0">
            <UserRound className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              Gender
            </p>
            <p className="font-heading text-sm font-bold text-foreground capitalize truncate">
              {patient.gender || "Not specified"}
            </p>
          </div>
        </div>

        {/* 3. Phone */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground shrink-0">
            <Phone className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              Phone
            </p>
            {patient.phone ? (
              <a
                href={`tel:${patient.phone}`}
                className="font-heading text-sm font-bold text-foreground hover:text-primary truncate block"
              >
                {patient.phone}
              </a>
            ) : (
              <p className="font-heading text-sm font-bold text-muted-foreground">
                Not provided
              </p>
            )}
          </div>
        </div>

        {/* 4. Email */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground shrink-0">
            <Mail className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground">
              Email
            </p>
            {patient.email ? (
              <a
                href={`mailto:${patient.email}`}
                className="font-heading text-sm font-bold text-foreground hover:text-primary truncate block"
                title={patient.email}
              >
                {patient.email}
              </a>
            ) : (
              <p className="font-heading text-sm font-bold text-muted-foreground">
                Not provided
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Address Row */}
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
        <div className="flex size-9 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground shrink-0">
          <MapPin className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Address
          </p>
          <p className="font-heading text-sm font-bold text-foreground truncate">
            {patient.address || "No residential address provided"}
          </p>
        </div>
      </div>

      {/* Bottom 3-Metric Summary Strip */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-4">
        {/* Metric 1: Allergies */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              No. of Allergies
            </p>
            <p className="font-heading text-base font-extrabold text-foreground leading-tight">
              {allergiesCount}
            </p>
          </div>
        </div>

        {/* Metric 2: Current Medications */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-100/60 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 shrink-0">
            <Pill className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Medications
            </p>
            <p className="font-heading text-base font-extrabold text-foreground leading-tight">
              {medsCount}
            </p>
          </div>
        </div>

        {/* Metric 3: Chronic Conditions */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100/60 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Chronic Conditions
            </p>
            <p className="font-heading text-base font-extrabold text-foreground leading-tight">
              {conditionsCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
