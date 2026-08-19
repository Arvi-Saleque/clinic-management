import { CalendarCheck2, CheckCircle2, Clock3, Plus, Receipt, Sparkles, Users, WalletCards } from "lucide-react";

import { StaffShell } from "@/components/staff/staff-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type { Profile } from "@/lib/auth/session";

const profile: Profile = {
  id: "demo-dentist",
  organization_id: "demo-clinic",
  full_name: "Dr Amelia Rahman",
  email: "amelia@cliniccare.demo",
  phone: "+44 20 0000 0000",
  role: "dentist",
  avatar_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const appointments = [
  { time: "09:00", patient: "Sophie Turner", treatment: "Routine examination", duration: "30 min", status: "Completed", color: "bg-success/10 text-success border-success/20" },
  { time: "10:15", patient: "James Wilson", treatment: "Composite restoration", duration: "45 min", status: "Checked in", color: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300" },
  { time: "11:30", patient: "Maya Patel", treatment: "Root canal review", duration: "40 min", status: "Confirmed", color: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300" },
  { time: "14:00", patient: "Oliver Smith", treatment: "Hygiene appointment", duration: "30 min", status: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
];

export default function WorkspaceDemoPage() {
  return (
    <StaffShell profile={profile}>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[28px] bg-secondary p-8 text-white"><div className="absolute -right-8 -top-16 size-64 rounded-full bg-primary/20 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75"><Sparkles className="size-3.5 text-accent" />Live workspace concept</span><h1 className="mt-4 font-heading text-[38px] font-extrabold tracking-[-0.035em]">Good morning, Amelia.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Your patient flow, clinical diary and outstanding work are visible in one calm command centre.</p></div><ButtonLink href="/scheduler" size="lg" className="h-11 gap-2 bg-accent text-accent-foreground"><Plus className="size-4" />New appointment</ButtonLink></div></section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "My appointments", value: "12", note: "4 completed · 1 checked in", icon: CalendarCheck2, tone: "bg-primary-soft text-primary" },
            { label: "Active patients", value: "1,248", note: "+34 this month", icon: Users, tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
            { label: "Outstanding balance", value: "€82,450", note: "8 open invoices", icon: WalletCards, tone: "bg-warning/10 text-warning" },
            { label: "Care completed", value: "86%", note: "Today’s visit progress", icon: CheckCircle2, tone: "bg-success/10 text-success" },
          ].map((metric) => <article key={metric.label} className="rounded-2xl border border-border bg-surface p-5"><span className={`flex size-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon className="size-[18px]" /></span><p className="mt-5 text-xs font-semibold text-muted-foreground">{metric.label}</p><p className="mt-1 font-heading text-[28px] font-extrabold tracking-[-0.035em]">{metric.value}</p><p className="mt-2 text-[11px] text-muted-foreground">{metric.note}</p></article>)}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.5fr_0.75fr]">
          <article className="overflow-hidden rounded-3xl border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-6 py-4"><div><h2 className="font-heading text-lg font-extrabold">Today’s clinical diary</h2><p className="mt-1 text-xs text-muted-foreground">Friday, 14 August · My schedule only</p></div><span className="rounded-xl bg-primary-soft px-3 py-1.5 text-[10px] font-bold text-primary">8 hours available</span></div><div className="divide-y divide-border">{appointments.map((item) => <div key={item.time} className="grid gap-3 px-6 py-4 sm:grid-cols-[70px_1fr_auto] sm:items-center"><div><p className="font-heading text-base font-extrabold">{item.time}</p><p className="text-[10px] text-muted-foreground">{item.duration}</p></div><div><p className="text-sm font-extrabold">{item.patient}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.treatment}</p></div><Badge variant="outline" className={item.color}>{item.status}</Badge></div>)}</div></article>
          <div className="grid gap-5"><article className="rounded-3xl border border-border bg-surface p-6"><h2 className="font-heading text-lg font-extrabold">7-day activity</h2><p className="mt-1 text-xs text-muted-foreground">Appointments by day</p><div className="mt-7 flex h-40 items-end justify-between gap-3">{[50, 74, 42, 88, 64, 35, 58].map((height, index) => <div key={index} className="flex h-full flex-1 items-end rounded-full bg-muted"><span className="w-full rounded-full bg-gradient-to-t from-primary to-accent" style={{ height: `${height}%` }} /></div>)}</div></article><article className="rounded-3xl border border-primary/12 bg-secondary p-6 text-white"><Clock3 className="size-5 text-accent" /><h3 className="mt-4 font-heading text-lg font-extrabold">Next: James Wilson</h3><p className="mt-2 text-xs text-white/65">10:15 · Composite restoration · Tooth 26</p></article></div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">{[
          { icon: Users, title: "Open patient profile", text: "Timeline, medical alerts, dental chart and follow-up." },
          { icon: Receipt, title: "Create itemised invoice", text: "Treatment lines, payment status and due balance." },
          { icon: CalendarCheck2, title: "Set my availability", text: "Only enabled weekly windows become bookable." },
        ].map((item) => <article key={item.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><item.icon className="size-[18px]" /></span><div><h3 className="text-sm font-extrabold">{item.title}</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.text}</p></div></article>)}</section>
      </div>
    </StaffShell>
  );
}
