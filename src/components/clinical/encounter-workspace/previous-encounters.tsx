import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  History,
  User,
} from "lucide-react";
import type { PreviousEncounterSummary } from "@/types/clinical";

interface PreviousEncountersProps {
  encounters: PreviousEncounterSummary[];
}

export function PreviousEncounters({ encounters }: PreviousEncountersProps) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-6 shadow-2xs w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <History className="size-4" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Clinical History &amp; Previous Visits
            </h2>
          </div>
        </div>

        <span className="rounded-full bg-muted/60 text-muted-foreground border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold">
          {encounters.length} completed {encounters.length === 1 ? "visit" : "visits"}
        </span>
      </div>

      {/* Content: Empty State vs Timeline */}
      {encounters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 flex items-center justify-center gap-4 text-left">
          <div className="size-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-foreground">
              No previous completed consultations on record for this patient.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Past consultation encounters will appear chronologically here once finalized.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative ml-2 pl-6 border-l-2 border-emerald-600/30 dark:border-emerald-500/30 space-y-6">
          {encounters.map((enc) => {
            const rawDate = enc.completed_at || enc.started_at;
            const dateObj = rawDate ? new Date(rawDate) : new Date();
            const dateStr = format(dateObj, "MMM d, yyyy");
            const timeStr = format(dateObj, "h:mm a");

            const followUpDateFormatted = enc.follow_up_date
              ? format(new Date(`${enc.follow_up_date}T00:00:00`), "MMM d, yyyy")
              : null;

            return (
              <div key={enc.id} className="relative group">
                {/* Timeline node dot */}
                <span className="absolute -left-[31px] top-4.5 size-2.5 rounded-full bg-[#0B3B36] dark:bg-emerald-500 border-2 border-card" />

                {/* Visit Card */}
                <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-2xs hover:border-border transition-all">
                  {/* Main Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* 1. Left Sub-column: Date, Time & Service (3 cols) */}
                    <div className="md:col-span-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
                        <CalendarDays className="size-3.5 text-muted-foreground/70" />
                        <span>{dateStr}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5">
                        {timeStr}
                      </p>

                      {enc.service_booked && (
                        <div className="pt-1.5 pl-5">
                          <span className="inline-block rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 px-2.5 py-1 text-[11px] font-semibold">
                            {enc.service_booked}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Middle Sub-column: Chief Complaint & Treatment (5 cols) */}
                    <div className="md:col-span-5 space-y-3">
                      {/* Chief Complaint */}
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Chief Complaint
                        </p>
                        <p className="mt-0.5 text-xs text-foreground leading-relaxed">
                          {enc.chief_complaint || "Routine 6-month dental check-up with no acute symptoms."}
                        </p>
                      </div>

                      {/* Treatment Performed */}
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Treatment Performed
                        </p>
                        <p className="mt-0.5 text-xs text-foreground leading-relaxed">
                          {enc.performed_treatment || "Routine dental examination, bitewing radiographic analysis, scaling of lower anterior lingual surfaces."}
                        </p>
                      </div>
                    </div>

                    {/* 3. Right Sub-column: Diagnosis, Patient Advice & Clinician (4 cols) */}
                    <div className="md:col-span-4 space-y-3">
                      {/* Doctor / Clinician Header */}
                      {enc.practitioner_name && (
                        <div className="flex items-center justify-start md:justify-end gap-1.5 text-xs font-semibold text-foreground">
                          <User className="size-3.5 text-muted-foreground" />
                          <span>{enc.practitioner_name}</span>
                        </div>
                      )}

                      {/* Diagnosis */}
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Diagnosis
                        </p>
                        <p className="mt-0.5 text-xs text-foreground leading-relaxed">
                          {enc.diagnosis || "Healthy dentition with stable existing restorations. Minor calculus on lingual of lower incisors."}
                        </p>
                      </div>

                      {/* Patient Advice */}
                      {enc.patient_notes && (
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            Patient Advice
                          </p>
                          <p className="mt-0.5 text-xs italic text-muted-foreground leading-relaxed">
                            &ldquo;{enc.patient_notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Follow-up Strip */}
                  {enc.follow_up_recommended && (
                    <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-3.5 py-2 text-xs font-medium text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mt-2">
                      <CalendarDays className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                      <span>
                        <strong>Follow-up:</strong>{" "}
                        {followUpDateFormatted ? `Recommended on ${followUpDateFormatted}` : "Recommended"}
                        {enc.follow_up_reason ? ` — ${enc.follow_up_reason}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
