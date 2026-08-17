import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock, ChevronRight, CircleCheck, Clock3, ContactRound, UserRoundSearch, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PatientSearchInput } from "@/components/staff/patient-search-input";
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

export default async function StaffPatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const patients = await listPatients(q);
  const withCompletedCare = patients.filter((patient) => patient.latest_visit?.status === "completed").length;
  const withFollowUp = patients.filter((patient) => patient.follow_up).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"><ContactRound className="size-3.5" />Central patient profile</div>
          <h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">Patient records</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">One searchable history for visits, presenting problems, completed work, follow-ups, prescriptions, invoices and dental charting.</p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Records shown", value: patients.length, icon: Users, tone: "bg-primary-soft text-primary" },
          { label: "Care completed", value: withCompletedCare, icon: CircleCheck, tone: "bg-success/10 text-success" },
          { label: "Follow-up booked", value: withFollowUp, icon: CalendarClock, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
        ].map((item) => <article key={item.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"><span className={cn("flex size-10 items-center justify-center rounded-xl", item.tone)}><item.icon className="size-[18px]" /></span><div><p className="font-heading text-2xl font-extrabold">{item.value}</p><p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p></div></article>)}
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_22px_60px_-48px_rgba(9,47,44,0.6)]">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <PatientSearchInput />
          <p className="text-[11px] text-muted-foreground">Use the unique ID to identify patients with similar names.</p>
        </div>

        {patients.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><UserRoundSearch className="size-6" /></span>
            <p className="mt-4 text-sm font-extrabold">No matching patient record</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Try a full or partial name, phone number, or the PT-prefixed patient ID.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/55">
              <TableRow className="hover:bg-muted/55">
                <TableHead className="h-12 px-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Patient</TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Patient ID</TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Last visit & problem</TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Care status</TableHead>
                <TableHead className="h-12 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Follow-up</TableHead>
                <TableHead className="h-12 w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const latest = patient.latest_visit;
                const followUp = patient.follow_up;
                return (
                  <TableRow key={patient.id} className="group h-[78px] cursor-pointer hover:bg-primary-soft/30">
                    <TableCell className="px-5">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-[11px] font-extrabold text-secondary-foreground">{patient.first_name[0]}{patient.last_name[0]}</span>
                        <span><span className="block text-sm font-extrabold">{patient.first_name} {patient.last_name}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{patient.phone ?? "No phone"}{patient.dob ? ` · DOB ${format(new Date(`${patient.dob}T00:00:00`), "dd MMM yyyy")}` : ""}</span></span>
                      </Link>
                    </TableCell>
                    <TableCell><span className="rounded-lg border border-border bg-muted px-2 py-1 font-mono text-[10px] font-bold tracking-wide">{patient.patient_reference}</span></TableCell>
                    <TableCell className="max-w-[280px]">
                      {latest ? <div><p className="text-xs font-bold">{format(new Date(latest.starts_at), "dd MMM yyyy")} · {latest.services?.name ?? "Visit"}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{latest.notes || "No presenting complaint recorded"}</p></div> : <span className="text-xs text-muted-foreground">No visit recorded</span>}
                    </TableCell>
                    <TableCell>{latest ? <Badge variant="outline" className={cn("capitalize", STATUS_STYLE[latest.status])}>{latest.status === "completed" ? "Work completed" : latest.status.replace("_", " ")}</Badge> : <Badge variant="outline">Not started</Badge>}</TableCell>
                    <TableCell>{followUp ? <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300"><Clock3 className="size-3.5" /></span><div><p className="text-xs font-bold">{format(new Date(followUp.starts_at), "dd MMM, HH:mm")}</p><p className="text-[10px] text-muted-foreground">{followUp.services?.name ?? "Follow-up visit"}</p></div></div> : <span className="text-xs text-muted-foreground">Not booked</span>}</TableCell>
                    <TableCell><Link href={`/patients/${patient.id}`} aria-label={`Open ${patient.first_name} ${patient.last_name}`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"><ChevronRight className="size-4" /></Link></TableCell>
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
