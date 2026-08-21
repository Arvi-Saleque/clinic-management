import type { ReactNode } from "react";
import { format } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  Eye,
  FileHeart,
  FileText,
  Lock,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type {
  ClinicalEncounter,
  EncounterFollowUpSchedulingContext,
  EncounterWorkspaceAppointment,
  EncounterWorkspacePatient,
} from "@/types/clinical";
import { FollowUpAppointmentDialog } from "./follow-up-appointment-dialog";

interface ClinicalDocumentationSummaryProps {
  encounter: ClinicalEncounter;
  privateNotes: string | null;
  patient: EncounterWorkspacePatient;
  followUpScheduling: EncounterFollowUpSchedulingContext | null;
  followUpAppointments: EncounterWorkspaceAppointment[];
  isEditable: boolean;
}

function renderStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return <Badge className="border-blue-500/20 bg-blue-500/8 text-[10px] font-normal text-blue-700">Confirmed</Badge>;
    case "checked_in":
      return <Badge className="border-violet-500/20 bg-violet-500/8 text-[10px] font-normal text-violet-700">Checked in</Badge>;
    case "completed":
      return <Badge className="border-emerald-500/20 bg-emerald-500/8 text-[10px] font-normal text-emerald-700">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">Cancelled</Badge>;
    case "no_show":
      return <Badge variant="destructive" className="text-[10px] font-normal">No show</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-normal capitalize">{status.replace(/_/g, " ")}</Badge>;
  }
}

const RETRYABLE_FOLLOW_UP_STATUSES = new Set(["cancelled", "no_show"]);

function SummaryRow({
  icon: Icon,
  title,
  value,
  badge,
}: {
  icon: typeof ClipboardList;
  title: string;
  value: string | null | undefined;
  badge?: ReactNode;
}) {
  return (
    <div className="border-b border-border/60 px-5 py-4 last:border-b-0">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
            {badge}
          </div>
          <p className={value?.trim() ? "mt-1.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground" : "mt-1.5 text-xs italic text-muted-foreground"}>
            {value?.trim() || "Not documented."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ClinicalDocumentationSummary({
  encounter,
  privateNotes,
  patient,
  followUpScheduling,
  followUpAppointments,
  isEditable,
}: ClinicalDocumentationSummaryProps) {
  const followUpDateFormatted = encounter.follow_up_date
    ? format(new Date(`${encounter.follow_up_date}T00:00:00`), "MMM d, yyyy")
    : null;

  const canScheduleFollowUp =
    followUpAppointments.length === 0 ||
    followUpAppointments.every((appointment) => RETRYABLE_FOLLOW_UP_STATUSES.has(appointment.status));

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs shadow-xs">
        <SummaryRow icon={FileHeart} title="1. Patient Concerns & Symptoms" value={encounter.chief_complaint} />
        <SummaryRow icon={FileText} title="2. Clinical Findings & Diagnosis (Dx)" value={encounter.diagnosis} />
        <SummaryRow icon={ClipboardList} title="3. Treatment Provided (Tx)" value={encounter.performed_treatment} />
        <SummaryRow
          icon={MessageSquare}
          title="4. Post-Operative Advice & Instructions (POA)"
          value={encounter.patient_notes}
          badge={
            <Badge variant="outline" className="border-teal-200/60 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 text-[10px] font-bold">
              <Eye className="mr-1 size-3" /> Patient Portal Visible
            </Badge>
          }
        />
        <SummaryRow
          icon={Lock}
          title="5. Private Clinician Notes"
          value={privateNotes}
          badge={<Badge variant="secondary" className="text-[10px] font-bold">Internal Practice Only</Badge>}
        />
      </div>

      <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xs p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
              <CalendarClock className="size-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-foreground">6. Follow-up &amp; Recall Plan</h3>
              {encounter.follow_up_recommended ? (
                <>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-foreground font-medium">
                    {encounter.follow_up_reason || "Clinical review recommended."}
                  </p>
                  {followUpDateFormatted && (
                    <p className="mt-1 text-xs text-muted-foreground">Target Review Date: <span className="font-bold text-foreground">{followUpDateFormatted}</span></p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">No routine follow-up currently required.</p>
              )}
            </div>
          </div>

          {!isEditable && encounter.follow_up_recommended && canScheduleFollowUp && followUpScheduling && (
            <FollowUpAppointmentDialog
              encounterId={encounter.id}
              patient={patient}
              scheduling={followUpScheduling}
              initialDate={encounter.follow_up_date ?? ""}
            />
          )}
        </div>

        {!isEditable && encounter.follow_up_recommended && canScheduleFollowUp && !followUpScheduling && (
          <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Follow-up scheduling is currently unavailable for this practitioner.
          </p>
        )}

        {followUpAppointments.length > 0 && (
          <details className="group mt-4 border-t border-border/60 pt-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-foreground marker:hidden">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                Linked follow-up appointments ({followUpAppointments.length})
              </span>
              <span className="text-[11px] font-bold text-primary hover:underline">View</span>
            </summary>
            <div className="mt-3 space-y-2">
              {followUpAppointments.map((appt) => {
                const startsAtFormatted = format(new Date(appt.starts_at), "MMM d, yyyy · h:mm a");
                const schedulerDate = format(new Date(appt.starts_at), "yyyy-MM-dd");

                return (
                  <div key={appt.id} className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{startsAtFormatted}</span>
                        {renderStatusBadge(appt.status)}
                      </div>
                      <p className="mt-1 text-muted-foreground font-medium">
                        {appt.service_name ?? "Dental Procedure"} · {appt.practitioner_name ?? "Clinician"}
                      </p>
                    </div>
                    <ButtonLink href={`/scheduler?date=${schedulerDate}`} variant="outline" size="sm" className="h-8 rounded-xl gap-1.5 self-start text-xs font-bold sm:self-center border-border/80">
                      View in Scheduler <ExternalLink className="size-3" />
                    </ButtonLink>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
