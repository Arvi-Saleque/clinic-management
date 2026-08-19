import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Stethoscope,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ClinicalEncounter,
  EncounterWorkspaceAppointment,
} from "@/types/clinical";

interface AppointmentContextCardProps {
  appointment: EncounterWorkspaceAppointment | null;
  encounter?: ClinicalEncounter;
  isDirty?: boolean;
}

export function AppointmentContextCard({
  appointment,
  encounter,
  isDirty = false,
}: AppointmentContextCardProps) {
  if (!appointment) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
              <FileText className="size-4 text-primary" />
              Consultation Snapshot
            </CardTitle>
            <Badge
              variant="outline"
              className="border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            >
              Direct Visit
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Direct clinical encounter without a linked appointment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const slotDate = format(new Date(appointment.starts_at), "MMM d, yyyy");
  const slotTime = `${format(new Date(appointment.starts_at), "h:mm a")} – ${format(
    new Date(appointment.ends_at),
    "h:mm a",
  )}`;

  const isCompleted = encounter?.status === "completed";

  const rows = [
    {
      icon: CheckCircle2,
      label: "Status",
      value: isCompleted ? "Completed" : "Consultation in progress",
      isStatus: true,
    },
    appointment.service_name
      ? { icon: Stethoscope, label: "Service", value: appointment.service_name }
      : null,
    { icon: CalendarDays, label: "Date", value: slotDate },
    { icon: Clock3, label: "Time", value: slotTime },
    appointment.practitioner_name
      ? { icon: User, label: "Clinician", value: appointment.practitioner_name }
      : null,
    appointment.branch_name
      ? { icon: MapPin, label: "Branch", value: appointment.branch_name }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof CalendarDays;
    label: string;
    value: string;
    isStatus?: boolean;
  }>;

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <FileText className="size-4 text-primary" />
            Consultation Snapshot
          </CardTitle>
          {isDirty ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-600" />
              Unsaved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Saved
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-3.5 space-y-0">
        {rows.map(({ icon: Icon, label, value, isStatus }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 last:border-b-0"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-3.5 text-muted-foreground/70" />
              {label}
            </span>
            {isStatus ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                {value}
              </span>
            ) : (
              <span className="max-w-[190px] text-right text-xs font-semibold text-foreground truncate">
                {value}
              </span>
            )}
          </div>
        ))}

        {/* Metrics Row: Duration and Base Fee */}
        {(appointment.service_duration !== null || appointment.service_price !== null) && (
          <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3 mt-1">
            {appointment.service_duration !== null && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Duration
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">
                  {appointment.service_duration} mins
                </p>
              </div>
            )}
            {appointment.service_price !== null && (
              <div className="text-right">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Base Fee
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
                  ${appointment.service_price.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Booking Note */}
        {appointment.notes && (
          <div className="mt-3.5 rounded-xl bg-muted/25 border border-border/60 p-3 space-y-1">
            <p className="text-[11px] font-bold text-foreground">
              Booking Note
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {appointment.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
