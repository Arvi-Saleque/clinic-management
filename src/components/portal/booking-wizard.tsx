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
  ArrowRight,
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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

  // Shift strip left by 7 days
  function handleStripPrevious() {
    setStripOffset((prev) => Math.max(0, prev - 7));
  }

  // Shift strip right by 7 days
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

  const stepsList = [
    { id: "service", num: "1", label: "Service" },
    { id: "practitioner", num: "2", label: "Doctor" },
    { id: "slot", num: "3", label: "Date & Time" },
    { id: "confirm", num: "4", label: "Confirmation" },
  ];
  const currentStepIndex = stepsList.findIndex((s) => s.id === step);

  return (
    <div className="relative overflow-hidden rounded-[36px] sm:rounded-[44px] border border-border/80 bg-surface/90 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl space-y-7 transition-all">
      {/* Soft Ambient Background Glow */}
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-accent/10 blur-3xl" />

      {/* ── OUTER CARD HEADER (CENTER-ALIGNED) ── */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-2xl mx-auto pt-2 pb-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 px-4 py-1 text-xs font-semibold text-primary backdrop-blur-md shadow-xs">
          {reschedule ? "Appointment Management" : "Clinical Sanctuary Scheduling"}
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {reschedule ? "Reschedule Appointment" : "Book an Appointment"}
        </h1>
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl mx-auto">
          {reschedule
            ? "Select a new date and time that fits your schedule."
            : "Choose your preferred dental service, practitioner, and an optimal appointment time."}
        </p>
      </div>

      {/* ── INNER NESTED LUXURY BOOKING CARD ("ONE CARD INSIDE ANOTHER") ── */}
      <div className="relative z-10 overflow-hidden rounded-[32px] border border-border/80 bg-background-subtle/80 backdrop-blur-xl shadow-lg">
        {/* Stepper Progress Bar */}
        {!reschedule && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-surface/90 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
              {stepsList.map((item, idx) => {
                const isCurrent = item.id === step;
                const isDone = idx < currentStepIndex;

                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                        isCurrent && "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/30",
                        isDone && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                        !isCurrent && !isDone && "bg-surface text-text-muted border border-border/70",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          isCurrent && "bg-white text-primary",
                          isDone && "bg-emerald-600 text-white",
                          !isCurrent && !isDone && "bg-background-subtle text-text-muted",
                        )}
                      >
                        {isDone ? <Check className="size-3 stroke-[2.5]" /> : item.num}
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </div>

                    {idx < stepsList.length - 1 && (
                      <span className="text-border text-sm hidden sm:inline">&rarr;</span>
                    )}
                  </div>
                );
              })}
            </div>

            {step !== "service" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-xl text-xs text-text-secondary hover:text-foreground"
                onClick={() => {
                  if (step === "confirm") setStep("slot");
                  else if (step === "slot") setStep("practitioner");
                  else if (step === "practitioner") setStep("service");
                }}
              >
                <ChevronLeft className="size-4" /> Previous Step
              </Button>
            )}
          </div>
        )}

        {/* Stepper Inner Content Area */}
        <div className="p-6 sm:p-8 lg:p-9 space-y-8">
        {/* ── STEP 1: SERVICE SELECTION ── */}
        {step === "service" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Select a Dental Procedure
              </h2>
              <p className="text-xs text-text-secondary">
                Choose the clinical treatment or consultation you need today.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectService(s)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-surface p-6 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary-soft/30 hover:shadow-xl"
                >
                  {/* Accent line on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary font-bold shadow-xs group-hover:scale-105 transition-transform">
                        <Stethoscope className="size-5" />
                      </div>
                      <span className="rounded-full border border-border bg-background-subtle px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                        Procedure 0{idx + 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        Comprehensive dental consultation & treatment
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 font-medium text-text-secondary">
                        <Clock className="size-3.5 text-primary" />
                        {s.duration_minutes} mins
                      </span>
                      <span>&bull;</span>
                      <span className="font-heading font-bold text-foreground">
                        €{s.price.toLocaleString()}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                      Select <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </button>
              ))}

              {services.length === 0 && (
                <div className="col-span-2 rounded-3xl border border-dashed border-border p-8 text-center text-text-muted">
                  No services are currently available to book online.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: DOCTOR SELECTION ── */}
        {step === "practitioner" && (
          <div className="space-y-6">
            {/* Selected Service Banner */}
            {service && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Selected Service</span>
                    <p className="font-semibold text-foreground text-sm">{service.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-text-muted">
                    {service.duration_minutes} mins &middot; €{service.price.toLocaleString()}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setStep("service")} className="rounded-xl text-xs">
                    Change
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Choose Your Dental Doctor
              </h2>
              <p className="text-xs text-text-secondary">
                Doctors actively offering this procedure at our clinic.
              </p>
            </div>

            {loadingPractitioners ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-text-muted gap-2">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-sm">Loading available doctors...</p>
              </div>
            ) : offeredPractitioners.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center space-y-3">
                <p className="font-semibold text-foreground">No doctors currently offer this service.</p>
                <p className="text-xs text-text-muted">Please choose another service or contact the clinic.</p>
                <Button variant="outline" size="sm" onClick={() => setStep("service")} className="rounded-xl mt-2">
                  <ChevronLeft className="size-4 mr-1" /> Change Service
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {offeredPractitioners.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPractitioner(p)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-surface p-6 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-primary-soft/30 hover:shadow-xl"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-primary-foreground font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                          <Stethoscope className="size-6" />
                        </div>
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[11px]">
                          Available
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {p.doctor_name}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {p.title || "Senior Dental Specialist"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 font-medium text-text-secondary">
                          <Clock className="size-3.5 text-primary" />
                          {p.effective_duration_minutes} min
                        </span>
                        <span>&bull;</span>
                        <span className="font-heading font-bold text-foreground">
                          €{p.effective_price.toLocaleString()}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                        Select Doctor <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: DATE & TIME SLOT SELECTION (7-DAY STRIP + 30-DAY CALENDAR) ── */}
        {step === "slot" && service && practitioner && (
          <div className="space-y-7">
            {/* Service & Doctor Context Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                  <Stethoscope className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {service.name} with <strong className="text-primary">{practitioner.doctor_name}</strong>
                  </p>
                  <p className="text-xs text-text-muted">
                    {practitioner.title || "Dental Specialist"} &middot; {practitioner.effective_duration_minutes} min &middot; €{practitioner.effective_price.toLocaleString()}
                  </p>
                </div>
              </div>

              {!reschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSlot(null);
                    setRecommendedSlot(null);
                    setStep("practitioner");
                  }}
                  className="rounded-xl text-xs"
                >
                  Change Doctor
                </Button>
              )}
            </div>

            {/* ==========================================================
                7-DAY STRIP & 30-DAY CALENDAR PICKER CONTAINER
                ========================================================== */}
            <div className="rounded-3xl border border-border/80 bg-surface p-6 shadow-sm space-y-6">
              {/* Header with Month / Year & 30-Day Calendar Popover */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {format(selectedDateObj, "MMMM yyyy")}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    Select a date within the upcoming 30-day window ({format(today, "MMM d")} &ndash; {format(maxBookingDate, "MMM d, yyyy")})
                  </p>
                </div>

                {/* 30-Day Popover Calendar Quick Trigger */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="gap-2 rounded-2xl border-primary/30 bg-primary-soft/40 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary-soft shadow-xs"
                      />
                    }
                  >
                    <CalendarDays className="size-4 text-primary" />
                    <span>Choose from 30 Days</span>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="p-0 rounded-3xl shadow-2xl border-border bg-surface">
                    <div className="p-3.5 border-b border-border bg-background-subtle text-center rounded-t-3xl">
                      <p className="text-xs font-bold text-foreground">30-Day Scheduling Window</p>
                      <p className="text-[11px] text-text-muted">Pick any day between {format(today, "MMM d")} and {format(maxBookingDate, "MMM d")}</p>
                    </div>
                    <div className="p-2.5">
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
              <div className="relative flex items-center justify-between gap-2 sm:gap-4">
                {/* Left Arrow Button */}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={stripOffset === 0}
                  onClick={handleStripPrevious}
                  aria-label="Previous 7 days"
                  className="size-11 shrink-0 rounded-2xl border-border/80 bg-background-subtle hover:bg-primary-soft hover:border-primary transition-all disabled:opacity-25 shadow-xs"
                >
                  <ChevronLeft className="size-5 text-foreground" />
                </Button>

                {/* 7-Day Strip Cards Grid */}
                <div className="grid flex-1 grid-cols-7 gap-2 sm:gap-3">
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
                          "group relative flex flex-col items-center justify-center rounded-2xl py-4 px-1.5 transition-all duration-200",
                          isSelected
                            ? "bg-gradient-to-br from-primary to-primary-hover text-primary-foreground font-bold shadow-lg shadow-primary/30 scale-[1.05] ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "bg-background-subtle hover:bg-primary-soft/50 border border-border/70 text-foreground hover:border-primary/40 hover:scale-[1.02]",
                          disabled && "opacity-30 pointer-events-none cursor-not-allowed",
                        )}
                      >
                        {/* Short Weekday */}
                        <span
                          className={cn(
                            "text-[11px] font-semibold tracking-wide",
                            isSelected ? "text-primary-foreground/90" : "text-text-muted",
                          )}
                        >
                          {weekdayShort}
                        </span>

                        {/* Day Number */}
                        <span
                          className={cn(
                            "font-heading text-xl sm:text-2xl font-extrabold leading-tight my-1",
                            isSelected ? "text-primary-foreground" : "text-foreground",
                          )}
                        >
                          {dayNum}
                        </span>

                        {/* Bottom Status Indicator Bar */}
                        <div
                          className={cn(
                            "mt-1 h-1 w-6 rounded-full transition-all",
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

                {/* Right Arrow Button */}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={stripOffset >= 23}
                  onClick={handleStripNext}
                  aria-label="Next 7 days"
                  className="size-11 shrink-0 rounded-2xl border-border/80 bg-background-subtle hover:bg-primary-soft hover:border-primary transition-all disabled:opacity-25 shadow-xs"
                >
                  <ChevronRight className="size-5 text-foreground" />
                </Button>
              </div>

              {/* Selected Day Context Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-background-subtle/80 px-4 py-3 text-xs">
                <span className="font-bold text-foreground text-sm">
                  {format(selectedDateObj, "EEEE, MMMM d, yyyy")}
                </span>
                <span className="text-primary font-semibold flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                  {loadingSlots
                    ? "Checking available times..."
                    : `${slots.length} open slots with ${practitioner.doctor_name}`}
                </span>
              </div>
            </div>

            {/* ==========================================================
                TIME SLOTS GRID (AESTHETIC CAPSULE PILL BUTTONS)
                ========================================================== */}
            <div className="rounded-3xl border border-primary/25 bg-surface p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold shadow-xs">
                    <Stethoscope className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-base font-bold text-foreground">
                      Available Appointment Times
                    </h4>
                    <p className="text-xs text-text-muted">
                      Select your preferred consultation time below.
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-xs font-semibold px-3 py-1">
                  Live Clinic Availability
                </Badge>
              </div>

              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-muted gap-3">
                  <Loader2 className="size-7 animate-spin text-primary" />
                  <p>Loading open times for {format(selectedDateObj, "EEEE, MMM d")}...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-background-subtle/50 p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-foreground">
                    No open slots for {practitioner.doctor_name} on {format(selectedDateObj, "EEEE, MMM d")}.
                  </p>
                  <p className="text-xs text-text-muted max-w-md mx-auto">
                    Please pick another day from the 7-day strip above, or check available times of other doctors below.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectDate(addDays(selectedDateObj, 1))}
                    className="rounded-xl border-primary/30 text-xs font-semibold text-primary hover:bg-primary-soft mt-2"
                  >
                    Check Next Day ({format(addDays(selectedDateObj, 1), "MMM d")}) &rarr;
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
                  {slots.map((slot) => {
                    const isChosen = selectedSlot?.slot_start === slot.slot_start;
                    const isHomepagePick = slot.slot_start === recommendedSlot;

                    return (
                      <button
                        key={slot.slot_start}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={cn(
                          "group relative flex items-center justify-center rounded-full py-3.5 px-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.03]",
                          isChosen
                            ? "bg-gradient-to-br from-primary to-primary-hover text-primary-foreground font-bold shadow-lg shadow-primary/35 ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border border-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-xs",
                          isHomepagePick && !isChosen && "ring-2 ring-accent border-accent bg-accent/15",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              isChosen
                                ? "bg-white"
                                : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]",
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
                ALTERNATIVE DOCTORS SECTION
                ========================================================== */}
            {offeredPractitioners.length > 1 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <Users className="size-4 text-primary" />
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">
                      Other Doctors Available on {format(selectedDateObj, "MMM d")}
                    </h4>
                    <p className="text-xs text-text-muted">
                      Need a different time? Click any slot below to proceed with that doctor.
                    </p>
                  </div>
                </div>

                {loadingOtherSlots ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-text-muted">
                    <Loader2 className="size-4 animate-spin text-primary" /> Checking other doctors...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {otherDoctorSlots.map((docData) => {
                      const doc = docData.practitioner;
                      const docSlots = docData.slots;

                      return (
                        <div
                          key={doc.id}
                          className="rounded-3xl border border-border/80 bg-background-subtle/60 p-5 space-y-3.5 transition-all hover:border-primary/40"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-surface text-primary border border-border/70 font-bold shadow-xs">
                                <Stethoscope className="size-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground">{doc.doctor_name}</p>
                                <p className="text-xs text-text-muted">
                                  {doc.title || "Dental Specialist"} &middot; {doc.effective_duration_minutes} min &middot; €{doc.effective_price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-text-muted">
                              {docSlots.length} {docSlots.length === 1 ? "slot" : "slots"} available
                            </span>
                          </div>

                          {docSlots.length === 0 ? (
                            <p className="text-xs text-text-muted italic py-1">
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
          </div>
        )}

        {/* ── STEP 4: REVIEW & CONFIRMATION ── */}
        {step === "confirm" && service && practitioner && selectedSlot && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Review & Confirm Appointment
              </h2>
              <p className="text-xs text-text-secondary">
                Please verify your visit details before finalising the booking.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-background-subtle/80 p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-surface p-4 space-y-1 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Procedure</span>
                  <p className="font-heading text-base font-bold text-foreground">{service.name}</p>
                  <p className="text-xs text-text-muted">{practitioner.effective_duration_minutes} minutes duration</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface p-4 space-y-1 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Doctor</span>
                  <p className="font-heading text-base font-bold text-foreground">{practitioner.doctor_name}</p>
                  <p className="text-xs text-text-muted">{practitioner.title || "Senior Dental Specialist"}</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface p-4 space-y-1 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Appointment Date</span>
                  <p className="font-heading text-base font-bold text-foreground">
                    {format(new Date(selectedSlot.slot_start), "EEEE, d MMMM yyyy")}
                  </p>
                  <p className="text-xs text-text-muted">Clinic Suite 402, Level 4</p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-surface p-4 space-y-1 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Time Window</span>
                  <p className="font-heading text-base font-bold text-primary">
                    {format(new Date(selectedSlot.slot_start), "HH:mm")} &ndash; {format(new Date(selectedSlot.slot_end), "HH:mm")}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Slot Reserved</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between border-t border-border/80 pt-5 text-sm gap-2">
                <span className="font-semibold text-text-secondary">Service fee:</span>
                <span className="font-heading text-2xl font-extrabold text-foreground">
                  €{practitioner.effective_price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Privacy & Safety Note */}
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 text-xs text-text-secondary leading-relaxed">
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <p>
                Your appointment will be confirmed immediately. You can view, manage, or add this visit to your calendar from your Patient Sanctuary dashboard anytime.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={booking !== null}
                onClick={() => setStep("slot")}
                className="rounded-2xl text-sm font-semibold"
              >
                <ChevronLeft className="size-4 mr-1.5" /> Change Time
              </Button>

              <Button
                size="lg"
                disabled={booking !== null}
                onClick={handleFinalConfirm}
                className="rounded-2xl bg-primary hover:bg-primary-hover px-8 py-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25"
              >
                {booking !== null ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" /> Confirming Appointment...
                  </>
                ) : (
                  <>
                    <Check className="size-5 mr-2 stroke-[2.5]" /> {reschedule ? "Confirm Reschedule" : "Confirm Appointment"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
