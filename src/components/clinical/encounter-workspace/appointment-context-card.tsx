import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Stethoscope,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EncounterWorkspaceAppointment } from "@/types/clinical";

interface AppointmentContextCardProps {
  appointment: EncounterWorkspaceAppointment | null;
}

export function AppointmentContextCard({ appointment }: AppointmentContextCardProps) {
  if (!appointment) {
    return (
      <Card className="border-border/70 shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Appointment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-5 text-muted-foreground">
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

  const rows = [
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
  }>;

  return (
    <Card className="border-border/70 shadow-[0_12px_34px_-30px_rgba(4,34,31,0.45)]">
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Appointment Summary
          </CardTitle>
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/8 text-[10px] font-medium capitalize text-emerald-700 dark:text-emerald-300"
          >
            {appointment.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-0">
        {rows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-border/45 py-3 last:border-b-0"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-3.5" />
              {label}
            </span>
            <span className="max-w-[190px] text-right text-xs font-semibold leading-5 text-foreground">
              {value}
            </span>
          </div>
        ))}

        {(appointment.service_duration !== null || appointment.service_price !== null) && (
          <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
            {appointment.service_duration !== null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Duration
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {appointment.service_duration} mins
                </p>
              </div>
            )}
            {appointment.service_price !== null && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Base fee
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  ${appointment.service_price.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {appointment.notes && (
          <div className="mt-3 rounded-xl bg-muted/35 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Booking note
            </p>
            <p className="mt-1 text-xs leading-5 text-foreground/80">{appointment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
