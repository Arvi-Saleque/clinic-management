"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Clock, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAvailableSlots, rescheduleStaffAppointment } from "@/lib/server/appointments";
import type { SlotResult } from "@/types/availability";
import { cn, formatClinicDate, formatClinicTime } from "@/lib/utils";

interface RescheduleAppointmentDialogProps {
  appointmentId: string;
  patientName: string;
  serviceName: string;
  serviceId?: string;
  practitionerId: string;
  currentStartsAt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RescheduleAppointmentDialog({
  appointmentId,
  patientName,
  serviceName,
  serviceId,
  practitionerId,
  currentStartsAt,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleAppointmentDialogProps) {
  const [date, setDate] = React.useState<string>(() => {
    try {
      return format(new Date(currentStartsAt), "yyyy-MM-dd");
    } catch {
      return format(new Date(), "yyyy-MM-dd");
    }
  });

  const [slots, setSlots] = React.useState<SlotResult[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<SlotResult | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch-on-dependency-change: the canonical data-fetching effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open || !practitionerId || !serviceId || !date) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);

    getAvailableSlots(practitionerId, serviceId, date)
      .then(({ slots: availableSlots, error }) => {
        if (error) {
          toast.error(error);
          setSlots([]);
        } else {
          setSlots(availableSlots ?? []);
        }
      })
      .catch((err) => {
        console.error("Failed to load slots for reschedule:", err);
        setSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [open, practitionerId, serviceId, date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleConfirm() {
    if (!selectedSlot) return;

    setSubmitting(true);
    const { error } = await rescheduleStaffAppointment({
      appointmentId,
      newStartsAt: selectedSlot.slot_start,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Appointment rescheduled successfully");
    onOpenChange(false);
    onSuccess?.();
  }

  const formattedCurrentTime = React.useMemo(() => {
    try {
      return `${formatClinicDate(currentStartsAt, { weekday: "long", day: "numeric", month: "short", year: "numeric" })} · ${formatClinicTime(currentStartsAt)}`;
    } catch {
      return currentStartsAt;
    }
  }, [currentStartsAt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RefreshCw className="size-4" />
            </span>
            <DialogTitle className="text-lg font-bold font-heading">
              Reschedule Appointment
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Pick a new available date and time slot for this patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient & Service Summary Banner */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Patient:</span>
              <span className="font-bold text-foreground">{patientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Treatment:</span>
              <span className="font-semibold text-foreground">{serviceName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current time:</span>
              <span className="font-mono text-muted-foreground">{formattedCurrentTime}</span>
            </div>
          </div>

          {/* Target Date Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-date" className="text-xs font-semibold">
              Select New Date
            </Label>
            <div className="relative">
              <Input
                id="reschedule-date"
                type="date"
                value={date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setDate(e.target.value)}
                className="h-9.5 rounded-xl border-border/80 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Available Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Available Slots</Label>
              <span className="text-[10px] text-muted-foreground">
                {slots.length} {slots.length === 1 ? "slot" : "slots"} open
              </span>
            </div>

            {loadingSlots ? (
              <div className="flex h-28 items-center justify-center rounded-xl border border-border/60 bg-muted/10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <div className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-3 text-center">
                <Clock className="size-4 text-muted-foreground/60 mb-1" />
                <p className="text-xs font-medium text-muted-foreground">
                  No open slots on this date.
                </p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                  Try choosing another date or checking the practitioner&apos;s diary.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-0.5">
                {slots.map((slot) => {
                  const startTime = formatClinicTime(slot.slot_start);
                  const isSelected = selectedSlot?.slot_start === slot.slot_start;

                  return (
                    <button
                      key={slot.slot_start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "rounded-xl border py-2 text-center text-xs font-bold font-mono transition-all",
                        isSelected
                          ? "border-[#0B3B36] bg-[#0B3B36] text-white shadow-2xs"
                          : "border-border/70 bg-card hover:bg-muted/40 text-foreground",
                      )}
                    >
                      {startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedSlot || submitting}
            onClick={handleConfirm}
            className="h-9 rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Rescheduling…
              </>
            ) : (
              <>
                <CalendarDays className="size-3.5" />
                Confirm Reschedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
