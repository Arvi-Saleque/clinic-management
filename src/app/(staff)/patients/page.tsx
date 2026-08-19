import type { Metadata } from "next";
import Link from "next/link";
import { differenceInYears, format } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  ContactRound,
  Phone,
  UserRoundSearch,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PatientSearchInput } from "@/components/staff/patient-search-input";
import { NewPatientDialog } from "@/components/staff/new-patient-dialog";
import { requireStaff } from "@/lib/auth/guards";
import { listPatients } from "@/lib/server/directory";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Patients" };

const STATUS_STYLE: Record<string, string> = {
  completed: "border-success/20 bg-success/10 text-success",
  confirmed: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  checked_in: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  pending: "border-warning/20 bg-warning/10 text-warning",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  no_show: "border-destructive/20 bg-destructive/10 text-destructive",
};

export default async function StaffPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireStaff();
  const { q } = await searchParams;
  const patients = await listPatients(q);
  const isReceptionist = profile.role === "receptionist";

  const withCompletedCare = patients.filter((patient) => patient.latest_visit?.status === "completed").length;
  const withFollowUp = patients.filter((patient) => patient.follow_up).length;

  return (
    <div className="space-y-6 w-full pb-12">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & ACTIONS                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <ContactRound className="size-3.5" />
            {isReceptionist ? "Patient Directory" : "Central Patient Records"}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {isReceptionist ? "Patients" : "Patient records"}
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            {isReceptionist
              ? "Search registered patients, review contact information, and open administrative profiles."
              : "One searchable history for visits, presenting problems, completed work, follow-ups, prescriptions, invoices and dental charting."}
          </p>
        </div>

        {/* Top Right Action: Register New Patient */}
        <div>
          <NewPatientDialog />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATS STRIP (Dentist View Only)                            */}
      {/* ------------------------------------------------------------- */}
      {!isReceptionist && (
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Records shown", value: patients.length, icon: Users, tone: "bg-primary-soft text-primary" },
            { label: "Care completed", value: withCompletedCare, icon: CircleCheck, tone: "bg-success/10 text-success" },
            { label: "Follow-up booked", value: withFollowUp, icon: CalendarClock, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
          ].map((item) => (
            <article key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
              <span className={cn("flex size-10 items-center justify-center rounded-xl", item.tone)}>
                <item.icon className="size-[18px]" />
              </span>
              <div>
                <p className="font-heading text-2xl font-extrabold text-foreground">{item.value}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PATIENTS TABLE CARD                                        */}
      {/* ------------------------------------------------------------- */}
      <section className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <PatientSearchInput />
          <p className="text-[11px] text-muted-foreground">
            Showing <strong className="text-foreground">{patients.length}</strong> {patients.length === 1 ? "patient" : "patients"}
          </p>
        </div>

        {patients.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <UserRoundSearch className="size-6" />
            </span>
            <p className="mt-4 text-sm font-extrabold text-foreground">No matching patient record</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              Try a full or partial name, phone number, or the PT-prefixed patient ID.
            </p>
          </div>
        ) : isReceptionist ? (
          /* RECEPTIONIST TABLE: Front-Desk Focused (Clean, Contact, Next Appointment, Zero Clinical Data) */
          <Table>
            <TableHeader className="bg-muted/25">
              <TableRow className="hover:bg-muted/25">
                <TableHead className="h-11 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Patient
                </TableHead>
                <TableHead className="h-11 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Patient ID
                </TableHead>
                <TableHead className="h-11 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="h-11 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  DOB / Age
                </TableHead>
                <TableHead className="h-11 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Next Appointment
                </TableHead>
                <TableHead className="h-11 w-12 text-right pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const followUp = patient.follow_up;
                const age = patient.dob
                  ? differenceInYears(new Date(), new Date(`${patient.dob}T00:00:00`))
                  : null;

                return (
                  <TableRow key={patient.id} className="group h-[72px] cursor-pointer hover:bg-muted/20">
                    {/* Patient Name + Initials */}
                    <TableCell className="px-5">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <span className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200/50">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </span>
                        <div>
                          <span className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {patient.first_name} {patient.last_name}
                          </span>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Reference ID */}
                    <TableCell>
                      <span className="rounded-lg border border-border/80 bg-muted/40 px-2 py-1 font-mono text-[10px] font-bold text-muted-foreground">
                        {patient.patient_reference}
                      </span>
                    </TableCell>

                    {/* Contact (Phone) */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-xs font-mono font-medium text-foreground">
                          <Phone className="size-3 text-muted-foreground/70" />
                          {patient.phone || "No phone"}
                        </p>
                      </div>
                    </TableCell>

                    {/* DOB / Age */}
                    <TableCell>
                      <p className="text-xs text-foreground font-medium">
                        {patient.dob ? format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy") : "—"}
                        {age !== null && <span className="text-muted-foreground font-normal ml-1">({age}y)</span>}
                      </p>
                    </TableCell>

                    {/* Next Appointment */}
                    <TableCell>
                      {followUp ? (
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <CalendarDays className="size-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {format(new Date(followUp.starts_at), "dd MMM, HH:mm")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {followUp.services?.name ?? "Booked Visit"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No upcoming visit</span>
                      )}
                    </TableCell>

                    {/* Action Arrow */}
                    <TableCell className="pr-5 text-right">
                      <Link
                        href={`/patients/${patient.id}`}
                        aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition group-hover:bg-[#0B3B36] group-hover:text-white"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          /* CLINICIAN / DENTIST TABLE (Preserved Clinical Workspace View) */
          <Table>
            <TableHeader className="bg-muted/25">
              <TableRow className="hover:bg-muted/25">
                <TableHead className="h-12 px-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Patient
                </TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Patient ID
                </TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Last visit &amp; problem
                </TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Care status
                </TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Follow-up
                </TableHead>
                <TableHead className="h-12 w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const latest = patient.latest_visit;
                const followUp = patient.follow_up;
                return (
                  <TableRow key={patient.id} className="group h-[78px] cursor-pointer hover:bg-muted/20">
                    <TableCell className="px-5">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-[11px] font-extrabold text-secondary-foreground">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </span>
                        <span>
                          <span className="block text-sm font-extrabold text-foreground">
                            {patient.first_name} {patient.last_name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {patient.phone ?? "No phone"}{patient.dob ? ` · DOB ${format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy")}` : ""}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-lg border border-border bg-muted px-2 py-1 font-mono text-[10px] font-bold tracking-wide">
                        {patient.patient_reference}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      {latest ? (
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {format(new Date(latest.starts_at), "dd MMM yyyy")} · {latest.services?.name ?? "Visit"}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {latest.notes || "No presenting complaint recorded"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No visit recorded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {latest ? (
                        <Badge variant="outline" className={cn("capitalize", STATUS_STYLE[latest.status])}>
                          {latest.status === "completed" ? "Work completed" : latest.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not started</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {followUp ? (
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300">
                            <Clock3 className="size-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {format(new Date(followUp.starts_at), "dd MMM, HH:mm")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {followUp.services?.name ?? "Follow-up visit"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not booked</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5">
                      <Link
                        href={`/patients/${patient.id}`}
                        aria-label={`Open ${patient.first_name} ${patient.last_name}`}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
