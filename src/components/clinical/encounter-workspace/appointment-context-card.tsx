import { format } from "date-fns";
import {
  CalendarDays,
  Info,
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

export function AppointmentContextCard({
  appointment,
}: AppointmentContextCardProps) {
  if (!appointment) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-primary" />
            <span>Booked Appointment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            This consultation is a walk-in or direct clinical encounter without a scheduled appointment link.
          </p>
        </CardContent>
      </Card>
    );
  }

  const slotDate = appointment.starts_at
    ? format(new Date(appointment.starts_at), "EEEE, MMM d, yyyy")
    : null;
  const slotTime = appointment.starts_at
    ? `${format(new Date(appointment.starts_at), "h:mm a")} - ${format(new Date(appointment.ends_at), "h:mm a")}`
    : null;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-primary" />
            <span>Booked Appointment</span>
          </CardTitle>
          <Badge
            variant="outline"
            className="border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-700 dark:text-violet-300 capitalize"
          >
            {appointment.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs sm:text-sm">
        <div className="rounded-md border border-blue-500/20 bg-blue-50/50 p-2 text-[11px] text-blue-900 leading-snug dark:border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-200">
          <div className="flex gap-1.5">
            <Info className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Read-only context:</strong> Represents initial booking details and does not overwrite actual performed treatment.
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {appointment.service_name && (
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Stethoscope className="size-3.5 text-primary" />
                <span>Service</span>
              </span>
              <span className="font-semibold text-foreground">
                {appointment.service_name}
              </span>
            </div>
          )}

          {slotDate && (
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-3.5 text-primary" />
                <span>Date & Time</span>
              </span>
              <span className="text-right font-medium text-foreground">
                <div>{slotDate}</div>
                <div className="text-xs text-muted-foreground">{slotTime}</div>
              </span>
            </div>
          )}

          {appointment.practitioner_name && (
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <User className="size-3.5 text-primary" />
                <span>Clinician</span>
              </span>
              <span className="font-medium text-foreground">
                {appointment.practitioner_name}
              </span>
            </div>
          )}

          {appointment.branch_name && (
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                <span>Branch</span>
              </span>
              <span className="font-medium text-foreground">
                {appointment.branch_name}
              </span>
            </div>
          )}

          {(appointment.service_duration !== null || appointment.service_price !== null) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {appointment.service_duration !== null && (
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Booked Duration</p>
                  <p className="font-semibold text-foreground">{appointment.service_duration} mins</p>
                </div>
              )}
              {appointment.service_price !== null && (
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Base Fee</p>
                  <p className="font-semibold text-foreground">${appointment.service_price.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {appointment.notes && (
            <div className="border-t border-border/50 pt-2 text-xs">
              <p className="font-semibold text-muted-foreground uppercase text-[10px]">Booking Notes</p>
              <p className="mt-1 rounded bg-muted/30 p-2 text-muted-foreground italic">
                &ldquo;{appointment.notes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
