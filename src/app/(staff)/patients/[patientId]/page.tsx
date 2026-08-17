import type { Metadata } from "next";
import Link from "next/link";
import { differenceInYears, format } from "date-fns";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarClock, CalendarPlus, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, FileText, HeartPulse, Mail, MapPin, Phone, Pill, Receipt, ShieldAlert, Smile, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OdontogramChart } from "@/components/shared/odontogram-chart";
import { getPatientById, getPatientMedicalHistory, listAppointmentsForPatient, listInvoicesForPatient, listPrescriptionsForPatient } from "@/lib/server/directory";
import { getPatientOdontogram } from "@/lib/server/odontogram";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ patientId: string }> }): Promise<Metadata> {
  const { patientId } = await params;
  const patient = await getPatientById(patientId);
  return { title: patient ? `${patient.first_name} ${patient.last_name}` : "Patient" };
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-warning/20 bg-warning/10 text-warning",
  confirmed: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  checked_in: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  completed: "border-success/20 bg-success/10 text-success",
  cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
  no_show: "border-destructive/20 bg-destructive/10 text-destructive",
  issued: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  partially_paid: "border-warning/20 bg-warning/10 text-warning",
  paid: "border-success/20 bg-success/10 text-success",
  void: "border-destructive/20 bg-destructive/10 text-destructive",
};

export default async function PatientDetailPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = await getPatientById(patientId);
  if (!patient) notFound();
  const [history, appointments, invoices, prescriptions, odontogramEntries] = await Promise.all([
    getPatientMedicalHistory(patientId),
    listAppointmentsForPatient(patientId),
    listInvoicesForPatient(patientId),
    listPrescriptionsForPatient(patientId),
    getPatientOdontogram(patientId),
  ]);

  const now = new Date();
  const latestVisit = appointments.find((appointment) => new Date(appointment.starts_at) <= now);
  const nextVisit = [...appointments].reverse().find((appointment) => new Date(appointment.starts_at) > now && !["cancelled", "no_show"].includes(appointment.status));
  const patientReference = `PT-${patient.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const outstanding = invoices.filter((invoice) => ["issued", "partially_paid"].includes(invoice.status)).reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const age = patient.dob ? differenceInYears(now, new Date(`${patient.dob}T00:00:00`)) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <ButtonLink href="/patients" variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5"><ArrowLeft className="size-4" />All patients</ButtonLink>
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary font-heading text-base font-extrabold text-secondary-foreground shadow-[0_14px_32px_-22px_rgba(5,40,38,0.85)]">{patient.first_name[0]}{patient.last_name[0]}</span>
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="font-heading text-3xl font-extrabold tracking-[-0.035em]">{patient.first_name} {patient.last_name}</h1><Badge variant="outline" className="font-mono text-[10px] tracking-wide">{patientReference}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{[age !== null ? `${age} years` : null, patient.gender, patient.phone].filter(Boolean).join(" · ") || "Patient details pending"}</p></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/clinical/prescriptions/new?patientId=${patientId}`} variant="outline" size="lg" className="h-11 gap-2 rounded-xl"><Pill className="size-4" />Prescription</ButtonLink>
          <ButtonLink href={`/billing/invoices/new?patientId=${patientId}`} variant="outline" size="lg" className="h-11 gap-2 rounded-xl"><Receipt className="size-4" />Invoice</ButtonLink>
          <ButtonLink href={`/scheduler?patientId=${patientId}`} size="lg" className="h-11 gap-2 rounded-xl"><CalendarPlus className="size-4" />Book follow-up</ButtonLink>
        </div>
      </div>

      {(history?.allergies.length ?? 0) > 0 && <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/7 p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><ShieldAlert className="size-[18px]" /></span><div><p className="text-xs font-extrabold text-destructive">Clinical alert · allergies recorded</p><p className="mt-1 text-xs text-muted-foreground">{history?.allergies.join(", ")}</p></div></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Last visit", value: latestVisit ? format(new Date(latestVisit.starts_at), "dd MMM yyyy") : "No visit", note: latestVisit?.services?.name ?? "—", icon: ClipboardList, tone: "bg-primary-soft text-primary" },
          { label: "Care status", value: latestVisit?.status === "completed" ? "Completed" : latestVisit ? latestVisit.status.replace("_", " ") : "Not started", note: latestVisit?.notes || "No problem note", icon: CheckCircle2, tone: "bg-success/10 text-success" },
          { label: "Next follow-up", value: nextVisit ? format(new Date(nextVisit.starts_at), "dd MMM") : "Not booked", note: nextVisit ? format(new Date(nextVisit.starts_at), "HH:mm") : "Review follow-up need", icon: CalendarClock, tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
          { label: "Open balance", value: `৳${outstanding.toLocaleString()}`, note: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"} total`, icon: CircleDollarSign, tone: "bg-warning/10 text-warning" },
        ].map((item) => <article key={item.label} className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-start gap-3"><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", item.tone)}><item.icon className="size-[17px]" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p><p className="mt-1 truncate font-heading text-lg font-extrabold capitalize">{item.value}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{item.note}</p></div></div></article>)}
      </section>

      <Tabs defaultValue="overview" className="space-y-5">
        <div className="overflow-x-auto"><TabsList className="h-11 min-w-max rounded-xl bg-muted p-1"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="appointments">Visit timeline</TabsTrigger><TabsTrigger value="odontogram">Dental chart</TabsTrigger><TabsTrigger value="prescriptions">Prescriptions</TabsTrigger><TabsTrigger value="invoices">Invoices</TabsTrigger></TabsList></div>

        <TabsContent value="overview" className="mt-0 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-5">
            <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="size-[18px] text-primary" />Medical history</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                ["Allergies", history?.allergies.length ? history.allergies.join(", ") : "None recorded"],
                ["Current medications", history?.current_medications.length ? history.current_medications.join(", ") : "None recorded"],
                ["Chronic conditions", history?.chronic_conditions.length ? history.chronic_conditions.join(", ") : "None recorded"],
                ["Past surgeries", history?.past_surgeries || "None recorded"],
              ].map(([label, value]) => <div key={label} className="rounded-2xl bg-muted/55 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.11em] text-muted-foreground">{label}</p><p className="mt-2 text-xs font-semibold leading-5">{value}</p></div>)}
              {history?.notes && <div className="rounded-2xl bg-primary-soft/45 p-4 sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-[0.11em] text-primary">Clinical note</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{history.notes}</p></div>}
            </CardContent></Card>
            <Card className="rounded-3xl"><CardHeader><CardTitle className="text-base">Recent clinical activity</CardTitle></CardHeader><CardContent>
              {appointments.length === 0 ? <p className="text-xs text-muted-foreground">No visits recorded.</p> : <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">{appointments.slice(0, 5).map((appointment) => <div key={appointment.id} className="relative flex gap-4"><span className={cn("relative z-10 mt-1 size-[15px] rounded-full border-4 border-surface", appointment.status === "completed" ? "bg-success" : "bg-primary")} /><div className="flex-1 border-b border-border pb-4 last:border-0"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-extrabold">{appointment.services?.name ?? "Clinical visit"}</p><p className="mt-1 text-[11px] text-muted-foreground">{format(new Date(appointment.starts_at), "dd MMM yyyy, HH:mm")} · {appointment.practitioners?.profiles?.full_name ?? "Practitioner"}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={cn("capitalize", STATUS_STYLE[appointment.status])}>{appointment.status.replace("_", " ")}</Badge>{appointment.encounter_id && <ButtonLink href={`/clinical/encounters/${appointment.encounter_id}`} variant="outline" size="xs" className="gap-1 text-xs"><FileText className="size-3" /><span>{appointment.encounter_status === "completed" ? "View Consultation" : "Open Consultation"}</span></ButtonLink>}</div></div>{appointment.notes && <p className="mt-2 text-xs leading-5 text-muted-foreground">{appointment.notes}</p>}</div></div>)}</div>}
            </CardContent></Card>
          </div>
          <Card className="h-fit rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-[18px] text-primary" />Contact & identity</CardTitle></CardHeader><CardContent className="space-y-4">
            {[
              { icon: Phone, label: "Phone", value: patient.phone },
              { icon: Mail, label: "Email", value: patient.email },
              { icon: MapPin, label: "Address", value: patient.address },
              { icon: AlertTriangle, label: "Emergency contact", value: patient.emergency_contact_name ? `${patient.emergency_contact_name} · ${patient.emergency_contact_phone}` : null },
            ].map((item) => <div key={item.label} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><item.icon className="size-3.5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{item.label}</p><p className="mt-1 break-words text-xs font-semibold">{item.value || "Not provided"}</p></div></div>)}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-0"><Card className="rounded-3xl"><CardHeader><CardTitle className="text-base">Complete visit history</CardTitle></CardHeader><CardContent>{appointments.length === 0 ? <p className="text-xs text-muted-foreground">No appointments yet.</p> : <div className="divide-y divide-border">{appointments.map((appointment) => <div key={appointment.id} className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[150px_1fr_auto] sm:items-center"><div><p className="text-xs font-extrabold">{format(new Date(appointment.starts_at), "dd MMM yyyy")}</p><p className="text-[10px] text-muted-foreground">{format(new Date(appointment.starts_at), "HH:mm")}</p></div><div><p className="text-xs font-bold">{appointment.services?.name ?? "Clinical visit"}</p><p className="mt-1 text-[11px] text-muted-foreground">{appointment.notes || "No problem or outcome note recorded"}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={cn("w-fit capitalize", STATUS_STYLE[appointment.status])}>{appointment.status.replace("_", " ")}</Badge>{appointment.encounter_id && <ButtonLink href={`/clinical/encounters/${appointment.encounter_id}`} variant="outline" size="xs" className="gap-1 text-xs"><FileText className="size-3" /><span>{appointment.encounter_status === "completed" ? "View Consultation" : "Open Consultation"}</span></ButtonLink>}</div></div>)}</div>}</CardContent></Card></TabsContent>

        <TabsContent value="odontogram" className="mt-0"><Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Smile className="size-[18px] text-primary" />Interactive odontogram</CardTitle></CardHeader><CardContent><OdontogramChart patientId={patientId} entries={odontogramEntries} editable /></CardContent></Card></TabsContent>

        <TabsContent value="prescriptions" className="mt-0"><div className="grid gap-4">{prescriptions.length === 0 ? <Card className="rounded-3xl p-8 text-center text-xs text-muted-foreground">No prescriptions yet.</Card> : prescriptions.map((prescription) => <Card key={prescription.id} className="rounded-3xl"><CardHeader className="flex-row items-start justify-between"><div><CardTitle className="text-base">Prescription · {format(new Date(prescription.issued_at), "dd MMM yyyy")}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Issued by {prescription.practitioners?.profiles?.full_name ?? "Practitioner"}</p></div><FileText className="size-5 text-primary" /></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{prescription.prescription_items.map((item) => <div key={item.id} className="rounded-2xl bg-muted/55 p-4"><p className="text-xs font-extrabold">{item.medicine_name}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")}</p>{item.instructions && <p className="mt-2 text-[11px] font-semibold">{item.instructions}</p>}</div>)}</CardContent></Card>)}</div></TabsContent>

        <TabsContent value="invoices" className="mt-0"><Card className="rounded-3xl"><CardHeader><CardTitle className="text-base">Invoices & payment status</CardTitle></CardHeader><CardContent>{invoices.length === 0 ? <p className="text-xs text-muted-foreground">No invoices yet.</p> : <div className="divide-y divide-border">{invoices.map((invoice) => <Link key={invoice.id} href={`/billing/invoices/${invoice.id}`} className="group flex items-center justify-between gap-4 py-4 first:pt-0"><div><p className="text-xs font-extrabold">{invoice.invoice_number}</p><p className="mt-1 text-[10px] text-muted-foreground">Issued {format(new Date(`${invoice.issue_date}T00:00:00`), "dd MMM yyyy")}</p></div><div className="flex items-center gap-3"><span className="text-sm font-extrabold">৳{Number(invoice.total).toLocaleString()}</span><Badge variant="outline" className={cn("capitalize", STATUS_STYLE[invoice.status])}>{invoice.status.replace("_", " ")}</Badge><ChevronRight className="size-4 text-muted-foreground transition group-hover:text-primary" /></div></Link>)}</div>}</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
