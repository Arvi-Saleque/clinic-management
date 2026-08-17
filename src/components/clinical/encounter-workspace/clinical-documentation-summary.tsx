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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      return (
        <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-normal">
          Confirmed
        </Badge>
      );
    case "checked_in":
      return (
        <Badge className="border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-normal">
          Checked in
        </Badge>
      );
    case "completed":
      return (
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-normal">
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="text-muted-foreground text-[10px] line-through font-normal">
          Cancelled
        </Badge>
      );
    case "no_show":
      return (
        <Badge variant="destructive" className="text-[10px] font-normal">
          No show
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-normal capitalize">
          {status.replace(/_/g, " ")}
        </Badge>
      );
  }
}

const RETRYABLE_FOLLOW_UP_STATUSES = new Set(["cancelled", "no_show"]);

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
    followUpAppointments.every((appointment) =>
      RETRYABLE_FOLLOW_UP_STATUSES.has(appointment.status),
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <ClipboardList className="size-5 text-primary" />
          <span>Clinical Documentation</span>
        </h2>
        {isEditable ? (
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-xs text-primary font-normal">
            Ready for drafting
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs text-muted-foreground font-normal">
            Final record
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Chief Complaint */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileHeart className="size-4 text-primary" />
              <span>Chief Complaint</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encounter.chief_complaint?.trim() ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {encounter.chief_complaint}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No chief complaint documented.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="size-4 text-primary" />
              <span>Clinical Diagnosis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encounter.diagnosis?.trim() ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {encounter.diagnosis}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No diagnosis documented.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performed Treatment */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="size-4 text-primary" />
            <span>Performed Treatment & Procedures</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {encounter.performed_treatment?.trim() ? (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {encounter.performed_treatment}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              No treatment details documented yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Patient-Facing Advice / Notes */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="size-4 text-primary" />
              <span>Patient Advice & Instructions</span>
            </CardTitle>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300">
              <Eye className="mr-1 size-3" />
              Patient Visible
            </Badge>
          </CardHeader>
          <CardContent>
            {encounter.patient_notes?.trim() ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {encounter.patient_notes}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No patient instructions recorded.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Private Clinician Notes */}
        <Card className="border-slate-300/80 bg-slate-50/50 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="size-4 text-slate-700 dark:text-slate-300" />
              <span>Private Clinician Notes</span>
            </CardTitle>
            <Badge variant="secondary" className="bg-slate-200/80 text-[10px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              Internal / Confidential
            </Badge>
          </CardHeader>
          <CardContent>
            {privateNotes?.trim() ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {privateNotes}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No private clinician notes on record.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Section */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarClock className="size-4 text-primary" />
            <span>Follow-up & Recall Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {encounter.follow_up_recommended ? (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary">
                    Follow-up Recommended
                  </p>
                  {encounter.follow_up_reason && (
                    <p className="mt-0.5 text-xs text-foreground">
                      <strong>Reason:</strong> {encounter.follow_up_reason}
                    </p>
                  )}
                </div>
                {followUpDateFormatted && (
                  <div className="sm:text-right">
                    <span className="text-xs text-muted-foreground">Target Date:</span>
                    <p className="font-semibold text-sm text-foreground">{followUpDateFormatted}</p>
                  </div>
                )}
              </div>

              {/* Action area: shown only for completed encounters when scheduling is eligible */}
              {!isEditable && canScheduleFollowUp && (
                <div className="pt-2 border-t border-primary/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {followUpAppointments.length > 0
                      ? "Previous follow-up was cancelled or missed. You may schedule a new visit."
                      : "Schedule the recommended follow-up visit with the treating doctor."}
                  </span>
                  {followUpScheduling ? (
                    <FollowUpAppointmentDialog
                      encounterId={encounter.id}
                      patient={patient}
                      scheduling={followUpScheduling}
                      initialDate={encounter.follow_up_date ?? ""}
                    />
                  ) : (
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Follow-up scheduling is currently unavailable for this practitioner.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No follow-up appointment currently recommended for this encounter.
            </p>
          )}

          {/* Linked Follow-up Appointments History */}
          {followUpAppointments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/70">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-primary" />
                  <span>Linked Follow-up Appointments ({followUpAppointments.length})</span>
                </p>
              </div>

              <div className="space-y-2">
                {followUpAppointments.map((appt) => {
                  const startsAtFormatted = format(
                    new Date(appt.starts_at),
                    "MMM d, yyyy · h:mm a",
                  );
                  const schedulerDate = format(new Date(appt.starts_at), "yyyy-MM-dd");

                  return (
                    <div
                      key={appt.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {startsAtFormatted}
                          </span>
                          {renderStatusBadge(appt.status)}
                        </div>
                        <p className="text-muted-foreground">
                          {appt.service_name ?? "Dental Procedure"} · {appt.practitioner_name ? `Dr. ${appt.practitioner_name}` : "Doctor"} · {appt.branch_name ?? "Clinic"}
                        </p>
                        {appt.notes && (
                          <p className="text-muted-foreground italic text-[11px]">
                            Memo: {appt.notes}
                          </p>
                        )}
                      </div>

                      <ButtonLink
                        href={`/scheduler?date=${schedulerDate}`}
                        variant="outline"
                        size="sm"
                        className="self-start sm:self-center gap-1 text-xs h-7"
                      >
                        <span>View in Scheduler</span>
                        <ExternalLink className="size-3" />
                      </ButtonLink>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
