"use client";

import * as React from "react";
import Link from "next/link";
import { format, differenceInCalendarDays, isToday, isTomorrow } from "date-fns";
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Stethoscope,
  ArrowRight,
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
import { cn, formatClinicDate, formatClinicTime } from "@/lib/utils";

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
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
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
    "PRODID:-//Clinic Care Dental//Patient Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:apt-${appointment.id}@dentalcare.clinic`,
    `DTSTAMP:${formatDateToICS(new Date())}`,
    `DTSTART:${formatDateToICS(startDate)}`,
    `DTEND:${formatDateToICS(endDate)}`,
    `SUMMARY:${appointment.serviceName} - Dental Visit`,
    `DESCRIPTION:Dental visit with ${appointment.practitionerName}. Estimated duration: ${appointment.duration} minutes.`,
    "LOCATION:Clinic Care — Main Branch, Healthcare Plaza",
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
  const location = encodeURIComponent("Clinic Care — Main Branch, Healthcare Plaza");
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
            Welcome, {props.firstName}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/80">
            Complete your quick digital registration to book appointments, choose your practitioner, and access your private care details.
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
              <span className="text-xs font-mono font-bold text-text-muted">
                ID: {props.patientReference}
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {greeting}
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary">
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
            className="gap-2 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-5 py-5 text-sm font-bold text-white shadow-md shadow-[#0B3B36]/20 transition-all hover:scale-[1.02]"
          >
            <CalendarPlus className="size-4 stroke-[2.5]" /> Book an Appointment
          </ButtonLink>
          <ButtonLink
            href="/portal/appointments"
            variant="outline"
            className="gap-2 rounded-2xl border-border bg-surface px-4 py-5 text-sm font-bold hover:bg-surface-elevated shadow-2xs"
          >
            <Calendar className="size-4" /> My visits
          </ButtonLink>
        </div>
      </section>

      {/* ALL UPCOMING APPOINTMENTS OR CLEAN CLASSY HERO */}
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
                    "relative overflow-hidden rounded-[32px] border bg-surface/90 backdrop-blur-xl p-6 shadow-xl transition-all sm:p-8 lg:p-10",
                    isFirst
                      ? "border-primary/35 shadow-lg shadow-primary/5 ring-1 ring-primary/10"
                      : "border-border/80 shadow-xs hover:border-primary/20",
                  )}
                >
                  {/* Soft subtle ambient background glow */}
                  {isFirst && (
                    <>
                      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-accent/10 blur-3xl" />
                    </>
                  )}

                  <div className="relative z-10 space-y-8">
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
                            {formatClinicTime(apptDate)}
                            {appointment.ends_at
                              ? ` – ${formatClinicTime(appointment.ends_at)}`
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
                      <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-md p-4 shadow-2xs">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                          <Stethoscope className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Doctor</p>
                          <p className="truncate font-semibold text-foreground">{appointment.practitionerName}</p>
                          <p className="text-xs text-text-secondary">Dental Specialist</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-border/80 bg-surface/85 backdrop-blur-md p-4 shadow-2xs">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground dark:text-accent shadow-xs">
                            <MapPin className="size-6" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Location</p>
                            <p className="truncate font-semibold text-foreground">Clinic Care — Main Branch</p>
                            <p className="text-xs text-text-secondary">Healthcare Plaza</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setDirectionModalOpen(true)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border/80 bg-surface/90 px-3 py-2 text-xs font-semibold text-primary shadow-xs hover:bg-surface-elevated transition-colors"
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
          /* CLEAN, SOPHISTICATED & PURPOSEFUL DENTAL SANCTUARY HERO */
          <div className="relative overflow-hidden rounded-[36px] border border-emerald-500/25 bg-gradient-to-br from-card via-card to-emerald-500/[0.06] p-8 sm:p-12 lg:p-14 shadow-xl backdrop-blur-xl text-center sm:text-left">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-teal-500/10 blur-3xl" />

            <div className="relative z-10 max-w-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-2xs">
                  Oral Wellness &amp; Prevention
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  &bull; Recommended every 6 months
                </span>
              </div>

              <h2 className="font-heading text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-[1.15]">
                Time for a Fresh, Healthy Smile Checkup?
              </h2>

              <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
                Regular preventive dental visits keep your enamel bright, detect micro-cavities early, and ensure optimal gum health with gentle, professional care.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
                <ButtonLink
                  href="/portal/appointments/book"
                  className="gap-2.5 rounded-2xl bg-[#0B3B36] hover:bg-[#0B3B36]/90 px-6 py-6 text-sm font-black text-white shadow-lg shadow-[#0B3B36]/25 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <CalendarPlus className="size-4.5 stroke-[2.5]" />
                  <span>Book an Appointment</span>
                </ButtonLink>

                <ButtonLink
                  href="/services"
                  variant="outline"
                  className="gap-2 rounded-2xl border-border/80 bg-card px-5 py-6 text-xs font-bold hover:bg-muted/40 transition shadow-2xs"
                >
                  <span>Explore Treatments</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
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
                ? `${activeCalendarAppt.serviceName} on ${formatClinicDate(activeCalendarAppt.starts_at, { weekday: "long", day: "numeric", month: "short", year: "numeric" })}`
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
                  <p className="text-sm font-semibold">Apple / Outlook Calendar (.ics)</p>
                  <p className="text-xs text-text-muted">Download .ics file to import</p>
                </div>
              </div>
              <ExternalLink className="size-4 text-text-muted" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CLINIC DIRECTIONS MODAL */}
      <Dialog open={directionModalOpen} onOpenChange={setDirectionModalOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-xl">
              <Navigation className="size-5 text-primary" /> Clinic Location &amp; Directions
            </DialogTitle>
            <DialogDescription>
              We are conveniently located in the Healthcare Plaza with free patient parking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm space-y-1.5">
              <p className="font-semibold text-foreground">Clinic Care — Main Branch</p>
              <p className="text-text-secondary text-xs">Suite 402, Level 4, Healthcare Plaza</p>
              <p className="text-text-muted text-xs">Reception: +44 1632 960123</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDirectionModalOpen(false)}
                className="rounded-2xl"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  window.open("https://maps.google.com/?q=Healthcare+Plaza", "_blank");
                  setDirectionModalOpen(false);
                }}
                className="gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                <ExternalLink className="size-4" /> Open in Google Maps
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
