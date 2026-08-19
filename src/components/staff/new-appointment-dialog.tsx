"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
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
import { searchPatients } from "@/lib/server/directory";
import { createStaffAppointment, getAvailableSlots } from "@/lib/server/appointments";
import type { SlotResult } from "@/types/availability";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface NewAppointmentDialogProps {
  practitionerId: string;
  branchId: string;
  date: string;
  services: Service[];
  initialPatient?: Patient | null;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerClassName?: string;
  hideTrigger?: boolean;
}

export function NewAppointmentDialog({
  practitionerId,
  branchId,
  date,
  services,
  initialPatient = null,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  triggerVariant = "outline",
  triggerClassName,
  hideTrigger = false,
}: NewAppointmentDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen ?? (() => {})) : setInternalOpen;

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(initialPatient);
  const [serviceId, setServiceId] = React.useState<string>("");
  const [slots, setSlots] = React.useState<SlotResult[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [booking, setBooking] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      const data = await searchPatients(query);
      setResults(data);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  // Fetch-on-dependency-change: the canonical data-fetching effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!serviceId || !practitionerId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    getAvailableSlots(practitionerId, serviceId, date)
      .then(({ slots }) => setSlots(slots))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, practitionerId, date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function reset() {
    setQuery("");
    setResults([]);
    setSelectedPatient(initialPatient);
    setServiceId("");
    setSlots([]);
  }

  async function handleBook(slot: SlotResult) {
    if (!selectedPatient) return;
    setBooking(true);
    const { error } = await createStaffAppointment({
      practitionerId,
      serviceId,
      branchId,
      patientId: selectedPatient.id,
      startsAt: slot.slot_start,
      bookingSource: "phone",
    });
    setBooking(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Appointment booked");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {!hideTrigger && (
        <DialogTrigger
          render={
            <Button
              variant={triggerVariant}
              className={triggerClassName || "h-9 gap-1.5 rounded-xl px-3.5 text-xs font-semibold border-border/80"}
            />
          }
        >
          <Plus className="size-3.5" />
          New appointment
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>For phone or walk-in bookings on {date}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-search">Patient</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span>
                  {selectedPatient.first_name} {selectedPatient.last_name}
                  {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="patient-search"
                    placeholder="Search by name or phone"
                    className="pl-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {results.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto rounded-lg border border-border">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPatient(p)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          {p.first_name} {p.last_name}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Service</Label>
            <Select value={serviceId} onValueChange={(value) => setServiceId(value ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service">
                  {(id: string) => {
                    const s = services.find((svc) => svc.id === id);
                    return s ? `${s.name} (${s.duration_minutes} min)` : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {serviceId && (
            <div className="space-y-2">
              <Label>Available times</Label>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open slots on this date.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <Button
                      key={slot.slot_start}
                      variant="outline"
                      size="sm"
                      disabled={!selectedPatient || booking}
                      onClick={() => handleBook(slot)}
                    >
                      {format(new Date(slot.slot_start), "HH:mm")}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
