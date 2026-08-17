import {
  AlertTriangle,
  Activity,
  Pill,
  Scissors,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EncounterMedicalHistory } from "@/types/clinical";

interface MedicalAlertsCardProps {
  medicalHistory: EncounterMedicalHistory | null;
}

export function MedicalAlertsCard({ medicalHistory }: MedicalAlertsCardProps) {
  const hasAllergies =
    medicalHistory?.allergies && medicalHistory.allergies.length > 0;
  const hasMedications =
    medicalHistory?.current_medications &&
    medicalHistory.current_medications.length > 0;
  const hasConditions =
    medicalHistory?.chronic_conditions &&
    medicalHistory.chronic_conditions.length > 0;
  const hasSurgeries = !!medicalHistory?.past_surgeries?.trim();
  const hasNotes = !!medicalHistory?.notes?.trim();

  const hasAnyData =
    hasAllergies ||
    hasMedications ||
    hasConditions ||
    hasSurgeries ||
    hasNotes;

  return (
    <Card
      className={
        hasAllergies
          ? "border-amber-500/30 bg-amber-50/40 shadow-sm dark:border-amber-500/20 dark:bg-amber-950/10"
          : "border-border/80 shadow-sm"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {hasAllergies ? (
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Activity className="size-4 text-primary" />
            )}
            <span>Medical Alerts & History</span>
          </CardTitle>
          {hasAllergies && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/15 font-semibold text-amber-800 dark:text-amber-300"
            >
              Allergy Alert
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3.5 text-sm">
        {!hasAnyData ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-muted-foreground/80" />
            <span>No current medical history recorded for this patient.</span>
          </div>
        ) : (
          <>
            {/* Allergies Section */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Allergies
              </p>
              {hasAllergies ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {medicalHistory!.allergies!.map((allergy, idx) => (
                    <Badge
                      key={idx}
                      variant="destructive"
                      className="border-red-500/30 bg-red-500/15 text-xs font-medium text-red-800 dark:text-red-300"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  No known allergies
                </p>
              )}
            </div>

            {/* Current Medications */}
            {hasMedications && (
              <div className="border-t border-border/40 pt-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Pill className="size-3 text-primary" />
                  <span>Current Medications</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {medicalHistory!.current_medications!.map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs text-foreground"
                    >
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chronic Conditions */}
            {hasConditions && (
              <div className="border-t border-border/40 pt-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Activity className="size-3 text-primary" />
                  <span>Chronic Conditions</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {medicalHistory!.chronic_conditions!.map((cond, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs text-foreground"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Past Surgeries */}
            {hasSurgeries && (
              <div className="border-t border-border/40 pt-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Scissors className="size-3 text-primary" />
                  <span>Past Surgeries / Hospitalizations</span>
                </p>
                <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                  {medicalHistory!.past_surgeries}
                </p>
              </div>
            )}

            {/* Medical Notes */}
            {hasNotes && (
              <div className="border-t border-border/40 pt-2.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="size-3 text-primary" />
                  <span>Clinical Medical Notes</span>
                </p>
                <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                  {medicalHistory!.notes}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
