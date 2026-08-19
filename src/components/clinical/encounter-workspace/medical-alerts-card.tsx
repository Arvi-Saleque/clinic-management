import {
  Activity,
  AlertTriangle,
  FileText,
  Pill,
  ShieldCheck,
} from "lucide-react";
import type { EncounterMedicalHistory } from "@/types/clinical";

interface MedicalAlertsCardProps {
  medicalHistory: EncounterMedicalHistory | null;
}

export function MedicalAlertsCard({ medicalHistory }: MedicalAlertsCardProps) {
  const allergies = medicalHistory?.allergies ?? [];
  const medications = medicalHistory?.current_medications ?? [];
  const conditions = medicalHistory?.chronic_conditions ?? [];
  const notes =
    medicalHistory?.notes?.trim() ||
    "Patient completed online health intake registration.";

  const hasAllergies = allergies.length > 0;
  const hasMedications = medications.length > 0;
  const hasConditions = conditions.length > 0;

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center border border-amber-200/60 shrink-0">
          <AlertTriangle className="size-4" />
        </div>
        <h2 className="font-heading text-base font-bold text-foreground">
          Medical Alerts &amp; History
        </h2>
      </div>

      {/* 1. Allergies Box */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <AlertTriangle className="size-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Allergies
            </span>
          </div>

          {hasAllergies ? (
            <span className="rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 px-2.5 py-0.5 text-[10px] font-bold border border-orange-300/60">
              Allergy Alert
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold border border-emerald-200/60">
              None Reported
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {hasAllergies ? (
            allergies.map((allergy, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                {allergy}
              </span>
            ))
          ) : (
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              No known drug or environmental allergies
            </span>
          )}
        </div>
      </div>

      {/* 2. Current Medications Box */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center">
            <Pill className="size-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Current Medications
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {hasMedications ? (
            medications.map((med, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {med}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              No current medications recorded.
            </span>
          )}
        </div>
      </div>

      {/* 3. Chronic Conditions Box */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center">
            <Activity className="size-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Chronic Conditions
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {hasConditions ? (
            conditions.map((cond, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {cond}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              No chronic medical conditions reported.
            </span>
          )}
        </div>
      </div>

      {/* 4. Clinical Medical Notes Box */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
            <FileText className="size-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Clinical Medical Notes
          </span>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground pt-0.5">
          {notes}
        </p>
      </div>
    </div>
  );
}
