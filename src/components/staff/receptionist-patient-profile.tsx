"use client";

import * as React from "react";
import { format, differenceInYears } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  Trash2,
  UserPen,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientEditDialog } from "@/components/staff/patient-edit-dialog";
import { NewAppointmentDialog } from "@/components/staff/new-appointment-dialog";
import { RescheduleAppointmentDialog } from "@/components/staff/reschedule-appointment-dialog";
import { updateAppointmentStatus } from "@/lib/server/appointments";
import type { ReceptionistPatientProfileData } from "@/lib/server/patients";
import { cn, formatCurrency } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface Practitioner {
  id: string;
  title: string | null;
  profiles: { full_name: string } | null;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "confirmed":
      return "border-blue-200/80 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300";
    case "checked_in":
      return "border-purple-200/80 bg-purple-50/80 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300";
    case "completed":
      return "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "cancelled":
    case "no_show":
      return "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function formatStatusLabel(status: string) {
  if (status === "checked_in") return "Checked In";
  if (status === "no_show") return "Did Not Attend";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

export function ReceptionistPatientProfileView({
  data,
  practitioners = [],
  services = [],
  branchId = "",
}: {
  data: ReceptionistPatientProfileData;
  practitioners: Practitioner[];
  services: Service[];
  branchId: string;
}) {
  const router = useRouter();
  const { patient, nextAppointment, appointmentHistory, formStatus, accountSummary } = data;

  const [editOpen, setEditOpen] = React.useState(false);
  const [rescheduleTarget, setRescheduleTarget] = React.useState<typeof nextAppointment | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  const initials = `${patient.first_name[0] ?? ""}${patient.last_name[0] ?? ""}`.toUpperCase() || "PT";

  const age = patient.dob
    ? differenceInYears(new Date(), new Date(`${patient.dob}T00:00:00`))
    : null;

  async function handleCancelAppointment(appointmentId: string) {
    setCancelling(true);
    const { error } = await updateAppointmentStatus(appointmentId, "cancelled", "Cancelled by receptionist");
    setCancelling(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Appointment cancelled");
    router.refresh();
  }

  const defaultPractitionerId = nextAppointment?.practitionerId || practitioners[0]?.id || "";

  return (
    <div className="space-y-6 w-full pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP PATIENT IDENTITY CARD                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-5">
          {/* Avatar + Name + Reference */}
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-lg border border-emerald-200/60">
              {initials}
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {patient.full_name}
                </h1>
                <Badge
                  variant="outline"
                  className="rounded-lg border-border/80 bg-muted/30 font-mono text-[11px] font-bold text-muted-foreground"
                >
                  {patient.patient_reference}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Patient record · Registered {format(new Date(patient.created_at), "d MMMM yyyy")}
              </p>
            </div>
          </div>

          {/* Identity Quick Actions */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="h-9 gap-1.5 rounded-xl px-3.5 text-xs font-semibold border-border/80 hover:bg-muted/50"
            >
              <UserPen className="size-3.5" />
              Edit Details
            </Button>

            {defaultPractitionerId && (
              <NewAppointmentDialog
                practitionerId={defaultPractitionerId}
                branchId={branchId}
                date={format(new Date(), "yyyy-MM-dd")}
                services={services}
                initialPatient={{
                  id: patient.id,
                  first_name: patient.first_name,
                  last_name: patient.last_name,
                  phone: patient.phone,
                }}
                triggerVariant="default"
                triggerClassName="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs"
              />
            )}
          </div>
        </div>

        {/* Demographics & Contact 4-Column Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* DOB / Age */}
          <div className="rounded-2xl border border-border/60 bg-muted/15 p-3.5 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
              <Calendar className="size-3 text-muted-foreground/70" />
              Date of Birth / Age
            </span>
            <p className="font-semibold text-foreground text-sm">
              {patient.dob ? format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy") : "Not provided"}
              {age !== null && <span className="text-muted-foreground font-normal ml-1">({age}y)</span>}
            </p>
          </div>

          {/* Phone */}
          <div className="rounded-2xl border border-border/60 bg-muted/15 p-3.5 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
              <Phone className="size-3 text-muted-foreground/70" />
              Phone Number
            </span>
            <p className="font-semibold text-foreground text-sm font-mono">
              {patient.phone || "No phone recorded"}
            </p>
          </div>

          {/* Email */}
          <div className="rounded-2xl border border-border/60 bg-muted/15 p-3.5 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
              <Mail className="size-3 text-muted-foreground/70" />
              Email Address
            </span>
            <p className="font-semibold text-foreground text-sm truncate">
              {patient.email || "No email on record"}
            </p>
          </div>

          {/* Address */}
          <div className="rounded-2xl border border-border/60 bg-muted/15 p-3.5 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5">
              <MapPin className="size-3 text-muted-foreground/70" />
              Address
            </span>
            <p className="font-semibold text-foreground text-sm truncate">
              {patient.address || "No address on record"}
            </p>
          </div>
        </div>

        {/* Emergency Contact Notice if available */}
        {patient.emergency_contact_name && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border/60 px-3.5 py-2 text-xs text-muted-foreground">
            <Users className="size-3.5 text-muted-foreground/70" />
            <span>
              Emergency Contact: <strong className="text-foreground font-semibold">{patient.emergency_contact_name}</strong>
              {patient.emergency_contact_phone && (
                <span className="ml-1 font-mono">({patient.emergency_contact_phone})</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2-COLUMN OPERATIONAL BODY                                     */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (~67% / 8 Cols): Next Appointment + History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card B: NEXT APPOINTMENT */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CalendarCheck2 className="size-3.5" />
                </span>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Next Appointment
                </h2>
              </div>
              {nextAppointment && (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    statusBadgeClass(nextAppointment.status),
                  )}
                >
                  {formatStatusLabel(nextAppointment.status)}
                </Badge>
              )}
            </div>

            {nextAppointment ? (
              <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-extrabold text-foreground">
                      {format(new Date(nextAppointment.starts_at), "EEEE, d MMMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {format(new Date(nextAppointment.starts_at), "HH:mm")}
                      </span>
                      <span>·</span>
                      <span>{nextAppointment.duration_minutes} minutes</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-foreground">
                      {nextAppointment.serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Doctor: {nextAppointment.practitionerName}
                    </p>
                  </div>
                </div>

                {nextAppointment.notes && (
                  <div className="rounded-xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Booking note: </span>
                    {nextAppointment.notes}
                  </div>
                )}

                {/* Next Appointment Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cancelling}
                    onClick={() => handleCancelAppointment(nextAppointment.id)}
                    className="h-8.5 gap-1.5 rounded-xl px-3 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="size-3" />
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRescheduleTarget(nextAppointment)}
                    className="h-8.5 gap-1.5 rounded-xl px-3 text-xs font-semibold border-border/80 hover:bg-muted/50"
                  >
                    <RefreshCw className="size-3" />
                    Reschedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-8 text-center space-y-3">
                <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    No upcoming appointment
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This patient has no future visits scheduled.
                  </p>
                </div>
                {defaultPractitionerId && (
                  <NewAppointmentDialog
                    practitionerId={defaultPractitionerId}
                    branchId={branchId}
                    date={format(new Date(), "yyyy-MM-dd")}
                    services={services}
                    initialPatient={{
                      id: patient.id,
                      first_name: patient.first_name,
                      last_name: patient.last_name,
                      phone: patient.phone,
                    }}
                    triggerVariant="default"
                    triggerClassName="h-8.5 gap-1.5 rounded-xl px-4 text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-2xs"
                  />
                )}
              </div>
            )}
          </div>

          {/* Card C: APPOINTMENT HISTORY */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Clock3 className="size-3.5" />
                </span>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Appointment History
                </h2>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {appointmentHistory.length} {appointmentHistory.length === 1 ? "visit" : "visits"} recorded
              </span>
            </div>

            {appointmentHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No past appointment records found for this patient.
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 overflow-hidden">
                <div className="grid grid-cols-[110px_1fr_1fr_90px_110px] gap-3 border-b border-border/60 bg-muted/25 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Date & Time</span>
                  <span>Doctor</span>
                  <span>Treatment</span>
                  <span>Duration</span>
                  <span className="text-right">Status</span>
                </div>
                <ul className="divide-y divide-border/60 text-xs">
                  {appointmentHistory.map((appt) => (
                    <li
                      key={appt.id}
                      className="grid grid-cols-[110px_1fr_1fr_90px_110px] items-center gap-3 px-4 py-3 hover:bg-muted/15 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-foreground tabular-nums">
                          {format(new Date(appt.starts_at), "dd MMM yyyy")}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {format(new Date(appt.starts_at), "HH:mm")}
                        </p>
                      </div>

                      <div className="truncate font-medium text-foreground">
                        {appt.practitionerName}
                      </div>

                      <div className="truncate font-semibold text-foreground">
                        {appt.serviceName}
                      </div>

                      <div className="text-muted-foreground">
                        {appt.duration_minutes} min
                      </div>

                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            statusBadgeClass(appt.status),
                          )}
                        >
                          {formatStatusLabel(appt.status)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (~33% / 4 Cols): Status & Billing Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card D: REGISTRATION & FORM STATUS */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-3.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCheck2 className="size-3.5" />
              </span>
              <h2 className="font-heading text-base font-bold text-foreground">
                Registration &amp; Forms
              </h2>
            </div>

            <div className="space-y-3">
              {/* Registration Status */}
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 p-3.5">
                <div>
                  <p className="text-xs font-bold text-foreground">Patient Registration</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Demographic record</p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1"
                >
                  <Check className="size-2.5" /> Complete
                </Badge>
              </div>

              {/* Health/Medical Form Status */}
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 p-3.5">
                <div>
                  <p className="text-xs font-bold text-foreground">Medical / Health Form</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formStatus.medicalFormUpdatedAt
                      ? `Submitted ${format(new Date(formStatus.medicalFormUpdatedAt), "dd MMM yyyy")}`
                      : "Intake form status"}
                  </p>
                </div>
                {formStatus.medicalFormSubmitted ? (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1"
                  >
                    <Check className="size-2.5" /> Submitted
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    Pending Submission
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Front desk administrative tracking. Clinical medical answers are securely sealed for treating clinicians.
            </p>
          </div>

          {/* Card E: ACCOUNT & BILLING SUMMARY */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="size-3.5" />
                </span>
                <h2 className="font-heading text-base font-bold text-foreground">
                  Account Summary
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {/* Balance Box */}
              <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Outstanding Balance
                </span>
                <p className="font-heading text-2xl font-extrabold text-foreground tabular-nums">
                  {formatCurrency(accountSummary.outstandingBalance)}
                </p>
                {accountSummary.outstandingBalance > 0 ? (
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Payment pending on account
                  </p>
                ) : (
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    No outstanding balance
                  </p>
                )}
              </div>

              {/* Total Invoiced */}
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-muted-foreground">Total Invoiced:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatCurrency(accountSummary.totalInvoiced)}
                </span>
              </div>

              {/* Last Payment */}
              {accountSummary.lastPaymentDate && (
                <div className="flex justify-between items-center text-xs px-1">
                  <span className="text-muted-foreground">Last Payment:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(accountSummary.lastPaymentAmount ?? 0)} ({format(new Date(accountSummary.lastPaymentDate), "dd MMM")})
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/billing/invoices?patient=${patient.id}`)}
                className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5"
              >
                <Receipt className="size-3.5" />
                View Invoices &amp; Payments
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Patient Dialog */}
      <PatientEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        patientId={patient.id}
        initialData={patient}
        onSuccess={() => router.refresh()}
      />

      {/* Reschedule Modal Dialog */}
      {rescheduleTarget && (
        <RescheduleAppointmentDialog
          open={!!rescheduleTarget}
          onOpenChange={(isOpen) => !isOpen && setRescheduleTarget(null)}
          appointmentId={rescheduleTarget.id}
          patientName={patient.full_name}
          serviceName={rescheduleTarget.serviceName}
          serviceId={rescheduleTarget.serviceId}
          practitionerId={rescheduleTarget.practitionerId}
          currentStartsAt={rescheduleTarget.starts_at}
          onSuccess={() => {
            setRescheduleTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
