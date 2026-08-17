"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarClock,
  Clock,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStaffAppointment, getAvailableSlots } from "@/lib/server/appointments";
import type { SlotResult } from "@/types/availability";
import type { EncounterFollowUpSchedulingContext } from "@/types/clinical";

interface FollowUpAppointmentDialogProps {
  encounterId: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  scheduling: EncounterFollowUpSchedulingContext;
  initialDate: string;
}

export function FollowUpAppointmentDialog({
  encounterId,
  patient,
  scheduling,
  initialDate,
}: FollowUpAppointmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const [date, setDate] = React.useState(
    initialDate || format(new Date(), "yyyy-MM-dd"),
  );
  const [serviceId, setServiceId] = React.useState<string>(
    scheduling.services[0]?.id ?? "",
  );
  const [notes, setNotes] = React.useState("");
  const [slots, setSlots] = React.useState<SlotResult[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [bookingSlot, setBookingSlot] = React.useState<string | null>(null);

  // Fetch available slots when service, practitioner, or date changes
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open || !serviceId || !scheduling.practitioner_id || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    getAvailableSlots(scheduling.practitioner_id, serviceId, date)
      .then(({ slots: availableSlots }) => setSlots(availableSlots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [open, serviceId, scheduling.practitioner_id, date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function resetState() {
    setDate(initialDate || format(new Date(), "yyyy-MM-dd"));
    setServiceId(scheduling.services[0]?.id ?? "");
    setNotes("");
    setSlots([]);
    setBookingSlot(null);
  }

  async function handleBook(slot: SlotResult) {
    if (!patient.id || !serviceId || !scheduling.practitioner_id || !scheduling.branch_id) {
      return;
    }

    setBookingSlot(slot.slot_start);

    const result = await createStaffAppointment({
      practitionerId: scheduling.practitioner_id,
      serviceId,
      branchId: scheduling.branch_id,
      patientId: patient.id,
      startsAt: slot.slot_start,
      bookingSource: "phone",
      notes: notes.trim() || null,
      originatingEncounterId: encounterId,
    });

    setBookingSlot(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Follow-up appointment scheduled.");
    setOpen(false);
    resetState();
    router.refresh();
  }

  const hasServices = scheduling.services.length > 0;
  const isBusy = Boolean(bookingSlot);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger render={<Button size="sm" className="gap-1.5 font-medium shadow-xs" />}>
        <CalendarClock className="size-4" />
        <span>Schedule Follow-up Appointment</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-5 text-primary" />
            <span>Schedule Linked Follow-up</span>
          </DialogTitle>
          <DialogDescription>
            Book a future clinical visit linked to this consultation. Continuity of care with the treating practitioner is enforced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Read-only Context Summary */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/80 bg-muted/30 p-3 text-xs">
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="size-3" /> Patient
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {patient.first_name} {patient.last_name}
                {patient.phone ? ` · ${patient.phone}` : ""}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="size-3" /> Treating Doctor
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {scheduling.practitioner_name ? `Dr. ${scheduling.practitioner_name}` : "Attending Doctor"}
              </p>
            </div>
            <div className="col-span-2 pt-1 border-t border-border/50">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" /> Branch
              </span>
              <p className="font-medium text-foreground mt-0.5">
                {scheduling.branch_name ?? "Primary Clinic Branch"}
              </p>
            </div>
          </div>

          {/* Date Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="followup-date" className="text-xs font-medium text-foreground">
              Appointment Date
            </Label>
            <Input
              id="followup-date"
              type="date"
              value={date}
              disabled={isBusy}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background text-sm"
            />
          </div>

          {/* Service Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="followup-service" className="text-xs font-medium text-foreground">
              Procedure / Follow-up Service
            </Label>
            {hasServices ? (
              <Select
                value={serviceId}
                disabled={isBusy}
                onValueChange={(value) => setServiceId(value ?? "")}
              >
                <SelectTrigger id="followup-service" className="text-sm">
                  <SelectValue placeholder="Select procedure">
                    {(id: string) => {
                      const s = scheduling.services.find((item) => item.id === id);
                      return s
                        ? `${s.name} (${s.duration_minutes} min)${s.price != null ? ` · $${s.price}` : ""}`
                        : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {scheduling.services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min)
                      {s.price != null ? ` · $${s.price}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No active services are currently configured for this practitioner.
              </p>
            )}
          </div>

          {/* Operational Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="followup-notes" className="text-xs font-medium text-foreground">
              Operational Notes (Optional)
            </Label>
            <Input
              id="followup-notes"
              type="text"
              placeholder="e.g., Morning slot requested by patient"
              value={notes}
              disabled={isBusy}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background text-sm"
            />
          </div>

          {/* Available Slots Grid */}
          {hasServices && serviceId && date && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  Available Time Slots
                </Label>
                {loadingSlots && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Checking availability...
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border/80 p-6">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No available booking slots on {format(new Date(`${date}T00:00:00`), "MMM d, yyyy")}.
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Try selecting an adjacent date or different service duration.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {slots.map((slot) => {
                    const isSlotBooking = bookingSlot === slot.slot_start;
                    return (
                      <Button
                        key={slot.slot_start}
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleBook(slot)}
                        className="text-xs font-medium hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        {isSlotBooking ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          format(new Date(slot.slot_start), "h:mm a")
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
