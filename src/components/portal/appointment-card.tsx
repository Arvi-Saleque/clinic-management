"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarClock, Clock3, FileText, RefreshCw, Stethoscope, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelOwnAppointmentAction } from "@/lib/server/booking";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  id: string;
  starts_at: string;
  ends_at?: string;
  status: string;
  practitionerName: string;
  serviceName: string;
  price: number;
  duration?: number;
  notes?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-warning/20 bg-warning/10 text-warning",
  confirmed: "border-primary/20 bg-primary-soft text-primary",
  checked_in: "border-accent/20 bg-accent/15 text-primary",
  completed: "border-success/20 bg-success/10 text-success",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  no_show: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function AppointmentCard(props: AppointmentCardProps) {
  const [cancelling, setCancelling] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const canChange = ["pending", "confirmed"].includes(props.status) && new Date(props.starts_at) > new Date();

  async function handleCancel() {
    setCancelling(true);
    const { error } = await cancelOwnAppointmentAction(props.id, "Cancelled by patient");
    setCancelling(false);
    if (error) toast.error(error);
    else {
      toast.success("Appointment cancelled");
      setDialogOpen(false);
    }
  }

  const date = new Date(props.starts_at);

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:border-primary/25 hover:shadow-md">
      <div className="grid md:grid-cols-[150px_1fr]">
        <div className="flex items-center gap-4 border-b border-border bg-background-subtle p-5 md:block md:border-b-0 md:border-r md:text-center">
          <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm md:mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest">{format(date, "MMM")}</span>
            <span className="text-2xl font-bold leading-none">{format(date, "dd")}</span>
          </div>
          <div className="md:mt-3">
            <p className="text-sm font-semibold">{format(date, "EEEE")}</p>
            <p className="mt-0.5 text-xs text-text-muted">{format(date, "yyyy")}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-lg font-bold">{props.serviceName}</h2>
                <Badge variant="outline" className={cn("capitalize", STATUS_STYLE[props.status])}>
                  {props.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
                <span className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />{format(date, "HH:mm")}{props.ends_at ? ` – ${format(new Date(props.ends_at), "HH:mm")}` : ""}</span>
                <span className="flex items-center gap-2"><Stethoscope className="size-4 text-primary" />{props.practitionerName}</span>
                {props.duration && <span className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" />{props.duration} minutes</span>}
              </div>
              {props.notes && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-background-subtle p-3 text-xs leading-5 text-text-muted">
                  <FileText className="mt-0.5 size-3.5 shrink-0" /> {props.notes}
                </div>
              )}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-text-muted">Estimated fee</p>
              <p className="mt-1 text-lg font-bold">৳{Number(props.price).toLocaleString()}</p>
            </div>
          </div>

          {canChange && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <ButtonLink href={`/portal/appointments/book?reschedule=${props.id}`} variant="outline" className="gap-2">
                <RefreshCw className="size-4" /> Reschedule
              </ButtonLink>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger render={<Button variant="ghost" className="gap-2 text-destructive" />}>
                  <XCircle className="size-4" /> Cancel appointment
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel this appointment?</DialogTitle>
                    <DialogDescription>
                      {format(date, "EEEE, d MMMM 'at' HH:mm")} · {props.serviceName}. This action cannot be undone from the portal.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Keep appointment</DialogClose>
                    <Button variant="destructive" disabled={cancelling} onClick={handleCancel}>
                      {cancelling ? "Cancelling..." : "Yes, cancel"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
