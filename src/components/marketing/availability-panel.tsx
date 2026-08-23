"use client";

import * as React from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableSlots, type SlotResult } from "@/lib/server/appointments";
import { savePendingBooking } from "@/lib/pending-booking";
import { cn, formatClinicTime } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
}
interface Practitioner {
  id: string;
  title: string | null;
  profiles: { full_name: string } | null;
}

export function AvailabilityPanel({
  services,
  practitioners,
  className,
  variant = "floating",
}: {
  services: Service[];
  practitioners: Practitioner[];
  className?: string;
  /** "embedded" drops the card chrome (border/shadow/background) for use inside a dialog that already provides a surface. */
  variant?: "floating" | "embedded";
}) {
  const [serviceId, setServiceId] = React.useState(services[0]?.id ?? "");
  const [practitionerId, setPractitionerId] = React.useState(practitioners[0]?.id ?? "");
  const [date, setDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = React.useState<SlotResult[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!serviceId || !practitionerId) return;
    setLoading(true);
    setSelectedSlot(null);
    getAvailableSlots(practitionerId, serviceId, date)
      .then(({ slots }) => setSlots(slots))
      .finally(() => setLoading(false));
  }, [serviceId, practitionerId, date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const canGoBack = !isBefore(new Date(`${date}T00:00:00`), addDays(startOfDay(new Date()), 1));

  const isEmbedded = variant === "embedded";

  function handleContinue() {
    if (!serviceId || !practitionerId) return;
    savePendingBooking({ serviceId, practitionerId, date, slotStart: selectedSlot });
    window.dispatchEvent(
      new CustomEvent("clinic:open-booking", {
        detail: { serviceId, practitionerId },
      }),
    );
  }

  return (
    <div
      className={cn(
        "w-full text-foreground",
        isEmbedded ? "max-w-lg" : "max-w-sm rounded-3xl border border-border bg-surface-elevated p-5 shadow-2xl",
        className,
      )}
    >
      {!isEmbedded && (
        <>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            Find a time that works for you
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-success">
            <span className="size-1.5 rounded-full bg-success" />
            Live availability
          </div>
        </>
      )}

      <div className={cn(isEmbedded ? "space-y-4" : "mt-4 space-y-3")}>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Service</label>
          <Select value={serviceId} onValueChange={(v) => v && setServiceId(v)}>
            <SelectTrigger className="h-10 w-full rounded-xl">
              <SelectValue placeholder="Choose a service">
                {(id: string) => services.find((s) => s.id === id)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Practitioner</label>
          <Select value={practitionerId} onValueChange={(v) => v && setPractitionerId(v)}>
            <SelectTrigger className="h-10 w-full rounded-xl">
              <SelectValue placeholder="Any practitioner">
                {(id: string) => practitioners.find((p) => p.id === id)?.profiles?.full_name ?? "Practitioner"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {practitioners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.profiles?.full_name ?? "Practitioner"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Date</label>
          <div className="flex items-center justify-between rounded-xl border border-input px-2 py-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canGoBack}
              onClick={() => setDate(format(addDays(new Date(`${date}T00:00:00`), -1), "yyyy-MM-dd"))}
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">{format(new Date(`${date}T00:00:00`), "EEEE, d MMMM yyyy")}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDate(format(addDays(new Date(`${date}T00:00:00`), 1), "yyyy-MM-dd"))}
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex h-20 items-center justify-center text-text-secondary">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl bg-muted px-3 py-4 text-center text-sm text-text-secondary">
              No open slots on this date — try another day.
            </p>
          ) : (
            <div className={cn("grid gap-2", isEmbedded ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4")}>
              {slots.slice(0, isEmbedded ? 16 : 8).map((slot) => (
                <button
                  key={slot.slot_start}
                  onClick={() => setSelectedSlot(slot.slot_start)}
                  data-selected={selectedSlot === slot.slot_start}
                  className={cn(
                    "rounded-lg border border-input font-medium transition-colors hover:border-primary hover:text-primary data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                    isEmbedded ? "py-2.5 text-sm" : "py-2 text-xs",
                  )}
                >
                  {formatClinicTime(slot.slot_start)}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!serviceId || !practitionerId}
          className="mt-2 w-full justify-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Continue booking
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
