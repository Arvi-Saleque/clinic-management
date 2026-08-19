"use client";

import * as React from "react";
import {
  format,
  addDays,
  differenceInDays,
  startOfDay,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAvailableSlots, type SlotResult } from "@/lib/server/appointments";
import { listPractitionersForService } from "@/lib/server/directory";
import { bookOwnAppointmentAction, rescheduleOwnAppointmentAction } from "@/lib/server/booking";
import { clearPendingBooking, readPendingBooking } from "@/lib/pending-booking";
import type { ServicePractitionerOption } from "@/types/services";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

type Step = "service" | "practitioner" | "slot" | "confirm";

interface OtherDoctorAvailability {
  practitioner: ServicePractitionerOption;
  slots: SlotResult[];
}

export function BookingWizard({
  services,
  reschedule,
}: {
  services: Service[];
  reschedule?: { id: string; startsAt: string; serviceId: string; practitionerId: string } | null;
}) {
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const maxBookingDate = React.useMemo(() => addDays(today, 30), [today]);

  const [step, setStep] = React.useState<Step>(reschedule ? "slot" : "service");
  const [service, setService] = React.useState<Service | null>(() =>
    reschedule ? services.find((item) => item.id === reschedule.serviceId) ?? null : null,
  );
  const [offeredPractitioners, setOfferedPractitioners] = React.useState<ServicePractitionerOption[]>([]);
  const [loadingPractitioners, setLoadingPractitioners] = React.useState(false);
  const [practitioner, setPractitioner] = React.useState<ServicePractitionerOption | null>(null);

  // Selected date ("yyyy-MM-dd")
  const [date, setDate] = React.useState(() =>
    format(reschedule ? new Date(reschedule.startsAt) : today, "yyyy-MM-dd"),
  );

  // Offset for 7-day strip window (0 to 24 days from today)
  const [stripOffset, setStripOffset] = React.useState<number>(() => {
    if (reschedule) {
      const diff = differenceInDays(startOfDay(new Date(reschedule.startsAt)), today);
      return Math.max(0, Math.min(23, diff - 2));
    }
    return 0;
  });

  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const [slots, setSlots] = React.useState<SlotResult[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [otherDoctorSlots, setOtherDoctorSlots] = React.useState<OtherDoctorAvailability[]>([]);
  const [loadingOtherSlots, setLoadingOtherSlots] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<SlotResult | null>(null);
  const [booking, setBooking] = React.useState<string | null>(null);
  const [recommendedSlot, setRecommendedSlot] = React.useState<string | null>(null);

  // Calculate the 7 days currently in the visible strip
  const visible7Days = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => addDays(today, stripOffset + idx));
  }, [today, stripOffset]);

  // Selected date object
  const selectedDateObj = React.useMemo(() => {
    try {
      return new Date(`${date}T00:00:00`);
    } catch {
      return today;
    }
  }, [date, today]);

  // Handle selecting a specific date (from 7-day strip or calendar picker)
  function handleSelectDate(d: Date) {
    const formatted = format(d, "yyyy-MM-dd");
    setDate(formatted);
    setSelectedSlot(null);
    setRecommendedSlot(null);

    // Keep the 7-day strip in sync if picked date is outside current window
    const diff = differenceInDays(startOfDay(d), today);
    if (diff < stripOffset || diff >= stripOffset + 7) {
      setStripOffset(Math.max(0, Math.min(23, diff - 2)));
    }
  }

  // Shift strip left by 7 days (or 1 day)
  function handleStripPrevious() {
    setStripOffset((prev) => Math.max(0, prev - 7));
  }

  // Shift strip right by 7 days (or 1 day)
  function handleStripNext() {
    setStripOffset((prev) => Math.min(23, prev + 7));
  }

  // Handle service selection: state reset + dynamic doctor loading
  async function handleSelectService(s: Service) {
    setService(s);
    setPractitioner(null);
    setSelectedSlot(null);
    setSlots([]);
    setOtherDoctorSlots([]);
    setRecommendedSlot(null);
    setStep("practitioner");
    setLoadingPractitioners(true);
    try {
      const docs = await listPractitionersForService(s.id);
      setOfferedPractitioners(docs);
    } catch {
      toast.error("Failed to load available doctors for this service.");
      setOfferedPractitioners([]);
    } finally {
      setLoadingPractitioners(false);
    }
  }

  // Handle doctor selection: reset downstream slot state
  function handleSelectPractitioner(p: ServicePractitionerOption) {
    setPractitioner(p);
    setSelectedSlot(null);
    setStep("slot");
  }

  // Handle slot click on selected doctor
  function handleSelectSlot(slot: SlotResult) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  // Handle slot click from alternative doctor
  function handleSelectOtherDoctorSlot(doc: ServicePractitionerOption, slot: SlotResult) {
    setPractitioner(doc);
    setSelectedSlot(slot);
    setStep("confirm");
  }

  // Initial consumption of pending booking or reschedule state
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (reschedule && service) {
      setLoadingPractitioners(true);
      listPractitionersForService(service.id)
        .then((docs) => {
          setOfferedPractitioners(docs);
          const matched = docs.find((d) => d.id === reschedule.practitionerId);
          if (matched) {
            setPractitioner(matched);
          } else {
            setPractitioner({
              id: reschedule.practitionerId,
              practitioner_id: reschedule.practitionerId,
              doctor_name: "Assigned Practitioner",
              title: null,
              branch_id: "",
              service_id: service.id,
              effective_duration_minutes: service.duration_minutes,
              base_duration_minutes: service.duration_minutes,
              override_duration_minutes: null,
              effective_price: service.price,
              base_price: service.price,
              override_price: null,
              profiles: { full_name: "Assigned Practitioner" },
            });
          }
        })
        .catch(() => setOfferedPractitioners([]))
        .finally(() => setLoadingPractitioners(false));
      return;
    }

    const pending = readPendingBooking();
    if (!pending) return;
    clearPendingBooking();

    const matchedService = services.find((s) => s.id === pending.serviceId);
    if (!matchedService) return;

    setService(matchedService);
    setLoadingPractitioners(true);
    listPractitionersForService(matchedService.id)
      .then((docs) => {
        setOfferedPractitioners(docs);
        const matchedDoc = docs.find((p) => p.id === pending.practitionerId);
        if (matchedDoc) {
          setPractitioner(matchedDoc);
          setDate(pending.date);
          const diff = differenceInDays(startOfDay(new Date(pending.date)), today);
          setStripOffset(Math.max(0, Math.min(23, diff - 2)));
          setRecommendedSlot(pending.slotStart);
          setStep("slot");
        } else {
          setStep("practitioner");
          toast.info("Please select an available doctor for this service.");
        }
      })
      .catch(() => {
        setOfferedPractitioners([]);
        setStep("service");
      })
      .finally(() => setLoadingPractitioners(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch available slots for selected doctor AND all other doctors offering this service
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if ((step !== "slot" && step !== "confirm") || !service || !practitioner) return;
    let isCurrent = true;

    // 1. Fetch slots for selected doctor
    setLoadingSlots(true);
    getAvailableSlots(practitioner.id, service.id, date)
      .then(({ slots: fetchedSlots, error }) => {
        if (!isCurrent) return;
        if (error) toast.error(error);
        setSlots(fetchedSlots);
      })
      .finally(() => {
        if (isCurrent) {
          setLoadingSlots(false);
        }
      });

    // 2. Fetch slots for all other doctors who offer this service
    const otherDoctors = offeredPractitioners.filter((p) => p.id !== practitioner.id);
    if (otherDoctors.length > 0) {
      setLoadingOtherSlots(true);
      Promise.all(
        otherDoctors.map(async (doc) => {
          const res = await getAvailableSlots(doc.id, service.id, date);
          return {
            practitioner: doc,
            slots: res.slots ?? [],
          };
        }),
      )
        .then((results) => {
          if (isCurrent) {
            setOtherDoctorSlots(results);
          }
        })
        .catch((err) => {
          console.error("Failed to load alternative doctor slots:", err);
        })
        .finally(() => {
          if (isCurrent) {
            setLoadingOtherSlots(false);
          }
        });
    } else {
      setOtherDoctorSlots([]);
    }

    return () => {
      isCurrent = false;
    };
  }, [step, service, practitioner, date, offeredPractitioners]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Final confirmation execution
  async function handleFinalConfirm() {
    if (!service || !practitioner || !selectedSlot) return;
    setBooking(selectedSlot.slot_start);
    try {
      const result = reschedule
        ? await rescheduleOwnAppointmentAction(reschedule.id, selectedSlot.slot_start)
        : await bookOwnAppointmentAction({
            practitionerId: practitioner.id,
            serviceId: service.id,
            branchId: practitioner.branch_id,
            startsAt: selectedSlot.slot_start,
          });

      if (result?.error) {
        toast.error(result.error);
        setBooking(null);
      }
    } catch (err: unknown) {
      const isRedirect =
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT");

      if (isRedirect) {
        throw err;
      }

      toast.error("Failed to confirm appointment. Please check availability and try again.");
      setBooking(null);
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl shadow-sm border border-border/80 bg-surface">
      {/* Header Banner */}
      <div className="bg-secondary px-5 py-6 text-secondary-foreground sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 shadow-xs">
            {reschedule ? <RefreshCw className="size-5 text-accent" /> : <ShieldCheck className="size-5 text-accent" />}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Secure online scheduling</p>
            <h2 className="font-heading text-xl font-bold">{reschedule ? "Reschedule visit" : "Book a visit"}</h2>
          </div>
        </div>
      </div>

      {/* Step Progress Indicator */}
      {!reschedule && (
        <div className="flex items-center justify-between border-b border-border/60 bg-surface/50 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-2 text-xs">
            {[
              { id: "service", label: "1. Service" },
              { id: "practitioner", label: "2. Doctor" },
              { id: "slot", label: "3. Time" },
              { id: "confirm", label: "4. Confirm" },
            ].map((s, idx) => {
              const steps = ["service", "practitioner", "slot", "confirm"];
              const currentIndex = steps.indexOf(step);
              const isCurrent = s.id === step;
              const isDone = idx < currentIndex;
              return (
                <React.Fragment key={s.id}>
                  {idx > 0 && <span className="text-border">/</span>}
                  <span
                    className={cn(
                      "transition-colors",
                      isCurrent && "font-bold text-primary",
                      isDone && "font-medium text-foreground",
                      !isCurrent && !isDone && "text-muted-foreground/60",
                    )}
                  >
                    {s.label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
          {step !== "service" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (step === "confirm") setStep("slot");
                else if (step === "slot") setStep("practitioner");
                else if (step === "practitioner") setStep("service");
              }}
            >
              <ChevronLeft className="size-3.5 mr-0.5" /> Back
            </Button>
          )}
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-base">
          {reschedule
            ? "Choose a new date and time"
            : step === "service"
              ? "Select a dental procedure"
              : step === "practitioner"
                ? "Select a doctor"
                : step === "slot"
                  ? "Choose appointment date & time"
                  : "Review appointment details"}
        </CardTitle>
        <CardDescription>
          {reschedule && "Your service and practitioner will stay the same."}
          {!reschedule && step === "service" && "Step 1 of 4 — choose the care service you need"}
          {!reschedule && step === "practitioner" && "Step 2 of 4 — doctors who actively provide this procedure"}
          {!reschedule && step === "slot" && "Step 3 of 4 — select from 7-day strip or pick any date within 30 days"}
          {!reschedule && step === "confirm" && "Step 4 of 4 — review and confirm your visit details"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* STEP 1: SERVICE */}
        {step === "service" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectService(s)}
                className="rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/45 hover:shadow-sm"
              >
                <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Check className="size-4" />
                </span>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {s.duration_minutes} min &middot; ৳{s.price.toLocaleString()}
                </p>
              </button>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">No services are available to book online yet.</p>
            )}
          </div>
        )}

        {/* STEP 2: PRACTITIONER */}
        {step === "practitioner" && (
          <div className="space-y-4">
            {service && (
              <div className="flex items-center justify-between rounded-2xl border border-border bg-background-subtle px-4 py-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Selected Service</span>
                  <p className="font-medium text-foreground">{service.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("service")}>
                  Change
                </Button>
              </div>
            )}

            {loadingPractitioners ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="mt-2 text-sm">Loading doctors offering this service...</p>
              </div>
            ) : offeredPractitioners.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background-subtle p-6 text-center">
                <p className="font-semibold text-foreground">No doctors currently offer this service.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please choose another service or contact the clinic reception for assistance.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("service")}
                  className="mt-4"
                >
                  <ChevronLeft className="size-4" /> Change Service
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {offeredPractitioners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPractitioner(p)}
                    className="group rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary-soft/45 hover:shadow-sm"
                  >
                    <p className="font-semibold text-foreground group-hover:text-primary">{p.doctor_name}</p>
                    {p.title && <p className="text-xs text-muted-foreground mt-0.5">{p.title}</p>}
                    <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span>{p.effective_duration_minutes} min</span>
                        {p.override_duration_minutes !== null && (
                          <span className="text-[10px] text-primary font-medium">(custom)</span>
                        )}
                      </span>
                      <span>&middot;</span>
                      <span className="font-medium text-foreground">
                        ৳{p.effective_price.toLocaleString()}
                        {p.override_price !== null && (
                          <span className="ml-1 text-[10px] text-primary font-medium">(custom)</span>
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loadingPractitioners && offeredPractitioners.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep("service")}>
                <ChevronLeft className="size-4" /> Back to Services
              </Button>
            )}
          </div>
        )}

        {/* STEP 3: DATE & TIME SLOT PICKER (7-DAY STRIP + 30-DAY CALENDAR) */}
        {step === "slot" && service && practitioner && (
          <div className="space-y-6">
            {/* Service & Primary Doctor Info Bar */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-background-subtle p-4 text-sm">
              <div>
                <p className="font-semibold text-foreground">{service.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Selected Doctor: <strong className="text-foreground">{practitioner.doctor_name}</strong> &middot; {practitioner.effective_duration_minutes} min &middot; ৳{practitioner.effective_price.toLocaleString()}
                </p>
              </div>
              {!reschedule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSlot(null);
                    setRecommendedSlot(null);
                    setStep("practitioner");
                  }}
                >
                  Change
                </Button>
              )}
            </div>

            {recommendedSlot && (
              <p className="text-xs text-muted-foreground">
                Picked from the homepage &mdash; select your time below to proceed to confirmation.
              </p>
            )}

            {/* ==========================================================
                7-DAY STRIP & 30-DAY CALENDAR PICKER CARD
                ========================================================== */}
            <div className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-6 shadow-sm space-y-5">
              {/* Month Header & 30-Day Calendar Quick Picker */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {format(selectedDateObj, "MMMM yyyy")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a date within the upcoming 30 days ({format(today, "MMM d")} &ndash; {format(maxBookingDate, "MMM d, yyyy")})
                  </p>
                </div>

                {/* 30-Day Popover Calendar Trigger */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl border-border bg-background-subtle px-3.5 text-xs font-semibold text-foreground hover:border-primary hover:bg-primary-soft/40 shadow-xs"
                      />
                    }
                  >
                    <CalendarDays className="size-4 text-primary" />
                    <span>Choose from 30 Days</span>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="p-0 rounded-2xl shadow-xl border-border">
                    <div className="p-3 border-b border-border bg-background-subtle text-center">
                      <p className="text-xs font-semibold text-foreground">Available Booking Window</p>
                      <p className="text-[11px] text-muted-foreground">Pick any day within the next 30 days</p>
                    </div>
                    <div className="p-2">
                      <Calendar
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={(d) => {
                          if (d) {
                            handleSelectDate(d);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={(d) => isBefore(d, today) || isAfter(d, maxBookingDate)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 7-Day Interactive Strip Navigation */}
              <div className="relative flex items-center justify-between gap-2 sm:gap-3">
                {/* Left Button */}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={stripOffset === 0}
                  onClick={handleStripPrevious}
                  aria-label="Previous 7 days"
                  className="size-10 shrink-0 rounded-2xl border-border/80 bg-background-subtle/80 hover:bg-primary-soft hover:border-primary transition-all disabled:opacity-30 shadow-xs"
                >
                  <ChevronLeft className="size-4 text-foreground" />
                </Button>

                {/* 7-Day Strip Cards Grid */}
                <div className="grid flex-1 grid-cols-7 gap-1.5 sm:gap-2.5">
                  {visible7Days.map((dayItem) => {
                    const isSelected = isSameDay(dayItem, selectedDateObj);
                    const isCurrentDay = isToday(dayItem);
                    const isPast = isBefore(dayItem, today);
                    const isBeyond30 = isAfter(dayItem, maxBookingDate);
                    const disabled = isPast || isBeyond30;

                    const weekdayShort = format(dayItem, "EEE");
                    const dayNum = format(dayItem, "d");

                    return (
                      <button
                        key={dayItem.toISOString()}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelectDate(dayItem)}
                        className={cn(
                          "group relative flex flex-col items-center justify-center rounded-2xl py-3 px-1 transition-all duration-200",
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25 scale-[1.04] ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "bg-background-subtle hover:bg-primary-soft/50 border border-border/70 text-foreground hover:border-primary/40",
                          disabled && "opacity-35 pointer-events-none cursor-not-allowed",
                        )}
                      >
                        {/* Short Weekday */}
                        <span
                          className={cn(
                            "text-[11px] font-medium tracking-wide",
                            isSelected ? "text-primary-foreground/90 font-semibold" : "text-muted-foreground",
                          )}
                        >
                          {weekdayShort}
                        </span>

                        {/* Day Number */}
                        <span
                          className={cn(
                            "font-heading text-lg sm:text-xl font-bold leading-tight my-0.5",
                            isSelected ? "text-primary-foreground" : "text-foreground",
                          )}
                        >
                          {dayNum}
                        </span>

                        {/* Bottom Status Indicator */}
                        <div
                          className={cn(
                            "mt-1 h-1 w-5 rounded-full transition-colors",
                            isSelected
                              ? "bg-white"
                              : isCurrentDay
                                ? "bg-accent"
                                : "bg-emerald-500/40 group-hover:bg-emerald-500",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Right Button */}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={stripOffset >= 23}
                  onClick={handleStripNext}
                  aria-label="Next 7 days"
                  className="size-10 shrink-0 rounded-2xl border-border/80 bg-background-subtle/80 hover:bg-primary-soft hover:border-primary transition-all disabled:opacity-30 shadow-xs"
                >
                  <ChevronRight className="size-4 text-foreground" />
                </Button>
              </div>

              {/* Selected Day Context Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-background-subtle/70 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {format(selectedDateObj, "EEEE, MMMM d, yyyy")}
                </span>
                <span className="text-primary font-medium flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {loadingSlots ? "Checking slots..." : `${slots.length} available slots for ${practitioner.doctor_name}`}
                </span>
              </div>
            </div>

            {/* ==========================================================
                TIME SLOTS GRID (AESTHETIC PILL BUTTONS)
                ========================================================== */}
            <div className="rounded-3xl border border-primary/25 bg-surface p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold shadow-xs">
                    <Stethoscope className="size-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-base font-bold text-foreground">
                        {practitioner.doctor_name}
                      </h3>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                        Selected Doctor
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {practitioner.title || "Dental Specialist"} &middot; {practitioner.effective_duration_minutes} min duration
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Available Slots
                </span>
              </div>

              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p>Loading open times for {format(selectedDateObj, "MMM d")}...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    No open slots for {practitioner.doctor_name} on {format(selectedDateObj, "EEEE, MMM d")}.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Please pick another date from the 7-day strip above, or select an alternative doctor below.
                  </p>
                  {/* Quick jump to next day button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectDate(addDays(selectedDateObj, 1))}
                    className="rounded-xl border-primary/30 text-xs font-semibold text-primary hover:bg-primary-soft"
                  >
                    Check Next Day ({format(addDays(selectedDateObj, 1), "MMM d")}) &rarr;
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 pt-1">
                  {slots.map((slot) => {
                    const isChosen = selectedSlot?.slot_start === slot.slot_start;
                    const isHomepagePick = slot.slot_start === recommendedSlot;

                    return (
                      <button
                        key={slot.slot_start}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={cn(
                          "group relative flex items-center justify-center rounded-full py-3 px-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.03]",
                          isChosen
                            ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30 ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-xs",
                          isHomepagePick && !isChosen && "ring-1 ring-accent border-accent bg-accent/15",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isChosen ? "bg-white" : "bg-emerald-500",
                            )}
                          />
                          {format(new Date(slot.slot_start), "HH:mm")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ==========================================================
                ALTERNATIVE DOCTORS SLOTS ON THE SAME DATE
                ========================================================== */}
            {offeredPractitioners.length > 1 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <Users className="size-4 text-primary" />
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      Other Doctors Available on {format(selectedDateObj, "MMM d")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Need a different time? Click any open slot below to book with that doctor instead.
                    </p>
                  </div>
                </div>

                {loadingOtherSlots ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" /> Checking schedules of other doctors...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {otherDoctorSlots.map((docData) => {
                      const doc = docData.practitioner;
                      const docSlots = docData.slots;

                      return (
                        <div
                          key={doc.id}
                          className="rounded-3xl border border-border/80 bg-background-subtle/60 p-4 sm:p-5 space-y-3 transition-all hover:border-primary/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 items-center justify-center rounded-xl bg-surface text-primary border border-border/70 font-bold shadow-xs">
                                <Stethoscope className="size-4" />
                              </span>
                              <div>
                                <p className="font-semibold text-sm text-foreground">{doc.doctor_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.title || "Dental Specialist"} &middot; {doc.effective_duration_minutes} min &middot; ৳{doc.effective_price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-text-muted">
                              {docSlots.length} available {docSlots.length === 1 ? "time" : "times"}
                            </span>
                          </div>

                          {docSlots.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic py-1">
                              No open slots on this date for {doc.doctor_name}.
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 pt-1">
                              {docSlots.map((slot) => (
                                <button
                                  key={slot.slot_start}
                                  type="button"
                                  onClick={() => handleSelectOtherDoctorSlot(doc, slot)}
                                  className="group flex items-center justify-center rounded-full py-2.5 px-3 text-xs font-semibold border border-border/80 bg-surface hover:border-primary hover:bg-primary-soft/40 hover:scale-[1.03] transition-all shadow-xs"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    {format(new Date(slot.slot_start), "HH:mm")}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!reschedule && (
              <Button variant="ghost" size="sm" onClick={() => setStep("practitioner")}>
                <ChevronLeft className="size-4" /> Back to Doctor Selection
              </Button>
            )}
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === "confirm" && service && practitioner && selectedSlot && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-background-subtle p-5 space-y-4">
              <h3 className="font-heading text-base font-semibold text-foreground">Appointment Summary</h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-surface p-3.5 space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Procedure / Service</span>
                  <p className="font-semibold text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{practitioner.effective_duration_minutes} min duration</p>
                </div>

                <div className="rounded-xl border border-border/70 bg-surface p-3.5 space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Doctor</span>
                  <p className="font-semibold text-foreground">{practitioner.doctor_name}</p>
                  {practitioner.title && <p className="text-xs text-muted-foreground">{practitioner.title}</p>}
                </div>

                <div className="rounded-xl border border-border/70 bg-surface p-3.5 space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Appointment Date</span>
                  <p className="font-semibold text-foreground">
                    {format(new Date(selectedSlot.slot_start), "EEEE, d MMMM yyyy")}
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-surface p-3.5 space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time Window</span>
                  <p className="font-semibold text-primary">
                    {format(new Date(selectedSlot.slot_start), "HH:mm")} &ndash; {format(new Date(selectedSlot.slot_end), "HH:mm")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="font-medium text-muted-foreground">Estimated Consultation / Service Fee:</span>
                <span className="text-lg font-bold text-foreground">৳{practitioner.effective_price.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-3.5 text-xs text-muted-foreground">
              <p>
                Live slot availability will be confirmed at the moment of booking. You will receive an instant confirmation in your portal dashboard.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={booking !== null}
                onClick={() => setStep("slot")}
              >
                <ChevronLeft className="size-4" /> Change Time
              </Button>

              <Button
                size="lg"
                disabled={booking !== null}
                onClick={handleFinalConfirm}
                className="w-full sm:w-auto"
              >
                {booking !== null ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Confirming appointment...
                  </>
                ) : (
                  <>
                    <Check className="size-4 mr-2" /> {reschedule ? "Confirm Reschedule" : "Confirm Appointment"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
