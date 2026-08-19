"use client";

import * as React from "react";
import Link from "next/link";
import { format, differenceInCalendarDays, isToday, isTomorrow } from "date-fns";
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Stethoscope,
  ArrowRight,
  Smile,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AppointmentSummary {
  id: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  serviceName: string;
  price: number;
  duration: number;
  practitionerName: string;
  notes: string | null;
}

export interface NotificationSummary {
  id: string;
  type: string;
  created_at: string;
}

export interface PortalDashboardViewProps {
  firstName: string;
  patientReference: string | null;
  registered: boolean;
  upcomingAppointments?: AppointmentSummary[];
  nextAppointment?: AppointmentSummary | null;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  notifications?: NotificationSummary[];
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return { text: `Good morning, ${name}`, emoji: "🌿" };
  if (hour < 17) return { text: `Good afternoon, ${name}`, emoji: "☀️" };
  return { text: `Good evening, ${name}`, emoji: "🌙" };
}

function getRelativeTimeBadge(date: Date, index: number) {
  if (isToday(date)) {
    return { label: "Today", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30" };
  }
  if (isTomorrow(date)) {
    return { label: "Tomorrow", tone: "bg-teal-500/15 text-teal-600 dark:text-teal-300 border-teal-500/30" };
  }
  const days = differenceInCalendarDays(date, new Date());
  if (days > 0 && days <= 7) {
    return { label: `In ${days} days`, tone: "bg-primary/15 text-primary border-primary/25" };
  }
  if (days > 7 && days <= 30) {
    const weeks = Math.round(days / 7);
    return { label: `In ${weeks} ${weeks === 1 ? "week" : "weeks"}`, tone: "bg-primary/10 text-primary border-primary/20" };
  }
  return {
    label: index === 0 ? "Next Visit" : `Visit #${index + 1}`,
    tone: "bg-primary/10 text-primary border-primary/20",
  };
}

function downloadIcsCalendar(appointment: AppointmentSummary) {
  const startDate = new Date(appointment.starts_at);
  const endDate = appointment.ends_at
    ? new Date(appointment.ends_at)
    : new Date(startDate.getTime() + (appointment.duration || 45) * 60 * 1000);

  const formatDateToICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smile Sanctuary Dental Clinic//Patient Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:apt-${appointment.id}@dentalcare.clinic`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${formatDateToICS(startDate)}`,
    `DTEND:${formatDateToICS(endDate)}`,
    `SUMMARY:${appointment.serviceName} - Dental Visit`,
    `DESCRIPTION:Dental visit with ${appointment.practitionerName}. Estimated duration: ${appointment.duration} minutes.`,
    "LOCATION:Smile Sanctuary Dental Clinic, Suite 402, Level 4, Healthcare Plaza",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `dental-appointment-${format(startDate, "yyyy-MM-dd")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openGoogleCalendar(appointment: AppointmentSummary) {
  const startDate = new Date(appointment.starts_at);
  const endDate = appointment.ends_at
    ? new Date(appointment.ends_at)
    : new Date(startDate.getTime() + (appointment.duration || 45) * 60 * 1000);

  const formatGoogleTime = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const title = encodeURIComponent(`${appointment.serviceName} | Dental Visit`);
  const details = encodeURIComponent(
    `Dental appointment with ${appointment.practitionerName}.\nEstimated duration: ${appointment.duration} mins.`,
  );
  const location = encodeURIComponent("Smile Sanctuary Dental Clinic, Suite 402, Level 4, Healthcare Plaza");
  const dates = `${formatGoogleTime(startDate)}/${formatGoogleTime(endDate)}`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  window.open(url, "_blank");
}

export function PortalDashboardView(props: PortalDashboardViewProps) {
  const [directionModalOpen, setDirectionModalOpen] = React.useState(false);
  const [activeCalendarAppt, setActiveCalendarAppt] = React.useState<AppointmentSummary | null>(null);

  const greeting = getGreeting(props.firstName);

  // Collect all upcoming visits
  const appointments: AppointmentSummary[] = React.useMemo(() => {
    if (props.upcomingAppointments && props.upcomingAppointments.length > 0) {
      return props.upcomingAppointments;
    }
    if (props.nextAppointment) {
      return [props.nextAppointment];
    }
    return [];
  }, [props.upcomingAppointments, props.nextAppointment]);

  if (!props.registered) {
    return (
      <section className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-gradient-to-br from-secondary via-secondary/95 to-primary/40 p-8 text-secondary-foreground shadow-2xl sm:p-12">
        <div className="absolute -right-20 -top-24 size-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <Badge className="bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            Welcome to Our Care Family
          </Badge>
          <h1 className="font-serif text-4xl font-normal leading-tight text-white sm:text-5xl">
            Welcome, {props.firstName} {greeting.emoji}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/80">
            Complete your quick digital registration to book visits, choose your practitioner, and access your private care details.
          </p>
          <div className="pt-3">
            <ButtonLink
              href="/portal/register"
              className="gap-2 rounded-2xl bg-accent px-6 py-6 text-base font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-[1.02] hover:bg-accent/90"
            >
              Begin registration <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-2 sm:py-6">
      {/* Top Welcome Header */}
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/80 px-3 py-0.5 text-xs font-semibold text-primary backdrop-blur-md">
              Patient Sanctuary
            </span>
            {props.patientReference && (
              <span className="text-xs font-medium text-text-muted">
                ID: {props.patientReference}
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {greeting.text} {greeting.emoji}
          </h1>

          <p className="text-sm text-text-secondary">
            {appointments.length > 1
              ? `You have ${appointments.length} upcoming visits scheduled.`
              : appointments.length === 1
                ? "Here is your upcoming dental visit summary."
                : "Here is your care overview."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ButtonLink
            href="/portal/appointments/book"
            className="gap-2 rounded-2xl bg-primary px-5 py-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover"
          >
            <CalendarPlus className="size-4" /> Book a Visit
          </ButtonLink>
          <ButtonLink
            href="/portal/appointments"
            variant="outline"
            className="gap-2 rounded-2xl border-border bg-surface px-4 py-5 text-sm font-medium hover:bg-surface-elevated"
          >
            <Calendar className="size-4" /> My visits
          </ButtonLink>
        </div>
      </section>

      {/* ALL UPCOMING APPOINTMENTS SECTION */}
      <section className="space-y-6">
        {appointments.length > 0 ? (
          <div className="space-y-6">
            {appointments.map((appointment, index) => {
              const apptDate = new Date(appointment.starts_at);
              const timeBadge = getRelativeTimeBadge(apptDate, index);
              const isFirst = index === 0;

              return (
                <div
                  key={appointment.id}
                  className={cn(
                    "relative overflow-hidden rounded-[32px] border bg-surface p-6 shadow-xl transition-all sm:p-8 lg:p-10",
                    isFirst
                      ? "border-primary/30 shadow-primary/5"
                      : "border-border/80 shadow-xs hover:border-primary/20",
                  )}
                >
                  {/* Soft subtle ambient background glow */}
                  {isFirst && (
                    <>
                      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
                      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-accent/5 blur-3xl" />
                    </>
                  )}

                  <div className="relative space-y-8">
                    {/* Header inside appointment card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">
                          {isFirst
                            ? appointments.length > 1
                              ? "Next Upcoming Visit (Visit 1 of " + appointments.length + ")"
                              : "Next Scheduled Appointment"
                            : `Upcoming Visit (${index + 1} of ${appointments.length})`}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("px-3 py-1 text-xs font-semibold capitalize", timeBadge.tone)}
                      >
                        {timeBadge.label}
                      </Badge>
                    </div>

                    {/* Main Appointment Details Grid */}
                    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                      {/* Date Calendar Tile */}
                      <div
                        className={cn(
                          "flex size-24 shrink-0 flex-col items-center justify-center rounded-3xl p-2 shadow-lg",
                          isFirst
                            ? "bg-gradient-to-br from-primary to-primary-hover text-primary-foreground shadow-primary/20"
                            : "bg-surface-elevated text-foreground border border-border/80 shadow-xs",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-widest",
                            isFirst ? "text-primary-foreground/80" : "text-primary",
                          )}
                        >
                          {format(apptDate, "MMM")}
                        </span>
                        <span className="font-heading text-3xl font-extrabold leading-none tracking-tight">
                          {format(apptDate, "dd")}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 text-[11px] font-medium",
                            isFirst ? "text-primary-foreground/90" : "text-text-muted",
                          )}
                        >
                          {format(apptDate, "EEEE")}
                        </span>
                      </div>

                      {/* Treatment & Time */}
                      <div className="space-y-2">
                        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                          {appointment.serviceName}
                        </h2>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Clock3 className="size-4 text-primary" />
                            {format(apptDate, "h:mm a")}
                            {appointment.ends_at
                              ? ` – ${format(new Date(appointment.ends_at), "h:mm a")}`
                              : ""}
                          </span>
                          <span>•</span>
                          <span className="text-text-muted">{appointment.duration} minutes</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Practitioner and Clinic Location Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background-subtle/70 p-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                          <Stethoscope className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Doctor</p>
                          <p className="truncate font-semibold text-foreground">{appointment.practitionerName}</p>
                          <p className="text-xs text-text-secondary">Dental Specialist</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-border/70 bg-background-subtle/70 p-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground dark:text-accent shadow-xs">
                            <MapPin className="size-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Location</p>
                            <p className="truncate font-semibold text-foreground">Suite 402, Level 4</p>
                            <p className="text-xs text-text-secondary">Healthcare Plaza</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setDirectionModalOpen(true)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-xs hover:bg-surface-elevated"
                        >
                          <Navigation className="size-3.5" /> Directions
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
                      <Button
                        variant="outline"
                        onClick={() => setActiveCalendarAppt(appointment)}
                        className="gap-2 rounded-2xl border-primary/30 bg-primary-soft/40 px-4 py-5 text-sm font-semibold text-primary hover:bg-primary-soft"
                      >
                        <CalendarCheck className="size-4" /> Add to Calendar
                      </Button>

                      {/* Reschedule Button */}
                      <ButtonLink
                        href={`/portal/appointments/book?reschedule=${appointment.id}`}
                        variant="outline"
                        className="gap-2 rounded-2xl border-border px-4 py-5 text-sm font-medium hover:bg-surface-elevated"
                      >
                        <RefreshCw className="size-4 text-text-muted" /> Reschedule Visit
                      </ButtonLink>

                      {/* Direct Message / Contact */}
                      <ButtonLink
                        href="/contact"
                        variant="ghost"
                        className="gap-2 rounded-2xl px-4 py-5 text-sm font-medium text-text-secondary hover:text-foreground"
                      >
                        <MessageCircle className="size-4" /> Contact Clinic
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State: Serene, Clean and Minimal */
          <div className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface p-8 text-center shadow-sm sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-72 rounded-full bg-accent/5 blur-3xl" />

            <div className="mx-auto max-w-md space-y-4">
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary-soft text-primary shadow-inner">
                <Smile className="size-10 stroke-[1.75]" />
              </div>

              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                All Caught Up
              </Badge>

              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                No Upcoming Appointments
              </h2>

              <p className="text-sm leading-relaxed text-text-secondary">
                You have no visits scheduled right now. When you&apos;re ready for your next checkup or cleaning, booking takes less than 2 minutes.
              </p>

              <div className="pt-2">
                <ButtonLink
                  href="/portal/appointments/book"
                  className="gap-2 rounded-2xl bg-primary px-6 py-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary-hover"
                >
                  <CalendarPlus className="size-4" /> Book an Appointment
                </ButtonLink>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ADD TO CALENDAR DIALOG */}
      <Dialog
        open={activeCalendarAppt !== null}
        onOpenChange={(open) => {
          if (!open) setActiveCalendarAppt(null);
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl">
              <CalendarCheck className="size-5 text-primary" /> Save to Your Calendar
            </DialogTitle>
            <DialogDescription>
              {activeCalendarAppt
                ? `${activeCalendarAppt.serviceName} on ${format(new Date(activeCalendarAppt.starts_at), "EEEE, MMM d, yyyy")}`
                : "Choose your preferred calendar service."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <button
              onClick={() => {
                if (activeCalendarAppt) openGoogleCalendar(activeCalendarAppt);
                setActiveCalendarAppt(null);
              }}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:border-primary hover:bg-primary-soft/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Calendar className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Google Calendar</p>
                  <p className="text-xs text-text-muted">Opens directly in Google Calendar</p>
                </div>
              </div>
              <ExternalLink className="size-4 text-text-muted" />
            </button>

            <button
              onClick={() => {
                if (activeCalendarAppt) downloadIcsCalendar(activeCalendarAppt);
                setActiveCalendarAppt(null);
              }}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:border-primary hover:bg-primary-soft/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarCheck className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Apple Calendar / Outlook (.ics)</p>
                  <p className="text-xs text-text-muted">Download universal calendar file</p>
                </div>
              </div>
              <ExternalLink className="size-4 text-text-muted" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIRECTION & CLINIC INFO MODAL */}
      <Dialog open={directionModalOpen} onOpenChange={setDirectionModalOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl">
              <MapPin className="size-5 text-primary" /> Clinic Location & Arrival
            </DialogTitle>
            <DialogDescription>
              Everything you need for a smooth and stress-free arrival.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-border bg-background-subtle p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Clinic Address</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Smile Sanctuary Dental Clinic</p>
              <p className="text-xs text-text-secondary">Suite 402, Level 4, Healthcare Plaza</p>
              <p className="text-xs text-text-muted">Road 11, Banani, Dhaka 1213</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-3.5">
                <p className="text-xs font-bold text-foreground">🚗 Complimentary Parking</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Free valet parking available at Entrance B (Basement 1).
                </p>
              </div>
              <div className="rounded-2xl border border-border p-3.5">
                <p className="text-xs font-bold text-foreground">☕ Reception Lounge</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Level 4 elevator opens directly to check-in.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=Smile+Sanctuary+Dental+Clinic"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover"
              >
                <Navigation className="size-4" /> Open in Google Maps
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
