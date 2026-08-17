import { format } from "date-fns";
import {
  CheckCircle2,
  History,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PreviousEncounterSummary } from "@/types/clinical";

interface PreviousEncountersProps {
  encounters: PreviousEncounterSummary[];
}

export function PreviousEncounters({ encounters }: PreviousEncountersProps) {
  if (encounters.length === 0) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <History className="size-4 text-primary" />
            <span>Clinical History & Previous Visits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
            No previous completed consultations on record for this patient.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <History className="size-4 text-primary" />
            <span>Clinical History & Previous Visits</span>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {encounters.length} completed visit{encounters.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {encounters.map((enc) => {
          const completedDate = enc.completed_at
            ? format(new Date(enc.completed_at), "MMM d, yyyy · h:mm a")
            : enc.started_at
              ? format(new Date(enc.started_at), "MMM d, yyyy")
              : "Date unknown";

          return (
            <div
              key={enc.id}
              className="rounded-lg border border-border/60 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-xs text-foreground">
                    {completedDate}
                  </span>
                  {enc.service_booked && (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {enc.service_booked}
                    </Badge>
                  )}
                </div>

                {enc.practitioner_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="size-3 text-primary" />
                    <span>{enc.practitioner_name}</span>
                  </div>
                )}
              </div>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs">
                {enc.chief_complaint && (
                  <div>
                    <span className="font-medium text-muted-foreground">Chief Complaint:</span>
                    <p className="mt-0.5 text-foreground leading-relaxed">
                      {enc.chief_complaint}
                    </p>
                  </div>
                )}

                {enc.diagnosis && (
                  <div>
                    <span className="font-medium text-muted-foreground">Diagnosis:</span>
                    <p className="mt-0.5 text-foreground leading-relaxed">
                      {enc.diagnosis}
                    </p>
                  </div>
                )}

                {enc.performed_treatment && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-muted-foreground">Treatment Performed:</span>
                    <p className="mt-0.5 text-foreground leading-relaxed">
                      {enc.performed_treatment}
                    </p>
                  </div>
                )}

                {enc.patient_notes && (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-muted-foreground">Patient Advice:</span>
                    <p className="mt-0.5 text-muted-foreground italic leading-relaxed">
                      &ldquo;{enc.patient_notes}&rdquo;
                    </p>
                  </div>
                )}

                {enc.follow_up_recommended && (
                  <div className="sm:col-span-2 rounded bg-primary/5 p-2 text-[11px] text-primary">
                    <strong>Follow-up:</strong>{" "}
                    {enc.follow_up_date
                      ? `Recommended on ${format(new Date(`${enc.follow_up_date}T00:00:00`), "MMM d, yyyy")}`
                      : "Recommended"}
                    {enc.follow_up_reason ? ` — ${enc.follow_up_reason}` : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
