import type { Metadata } from "next";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, ShieldCheck, Smile, WalletCards } from "lucide-react";

import { OdontogramChart } from "@/components/shared/odontogram-chart";
import { Badge } from "@/components/ui/badge";
import { getOwnOdontogram } from "@/lib/server/odontogram";
import { getOwnPortalPatient } from "@/lib/server/patient-portal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My dental care" };

const PRIORITY_STYLE: Record<string, string> = {
  routine: "border-success/20 bg-success/10 text-success",
  priority: "border-warning/20 bg-warning/10 text-warning",
  urgent: "border-destructive/20 bg-destructive/10 text-destructive",
};

export default async function PortalOdontogramPage() {
  const [patient, entries] = await Promise.all([getOwnPortalPatient(), getOwnOdontogram()]);
  const planned = entries.filter((entry) => entry.recommended_treatment || ["planned", "in_progress"].includes(entry.status));
  const urgent = planned.filter((entry) => entry.treatment_priority === "urgent").length;
  const estimatedTotal = planned.reduce((sum, entry) => sum + Number(entry.estimated_fee ?? 0), 0);

  return (
    <div className="space-y-7">
      <section className="relative rounded-[30px] border-b border-border/60 pb-6 bg-transparent">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Tooth-by-tooth record
            </span>
            <h1 className="mt-3 font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">My dental care</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Explore your current dental chart, recorded conditions and recommended next treatments.</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-border bg-surface p-4 text-center shadow-xs"><p className="text-2xl font-bold text-foreground">{entries.length}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">Charted</p></div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-center shadow-xs"><p className="text-2xl font-bold text-foreground">{planned.length}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">Planned</p></div>
            <div className="rounded-2xl border border-border bg-surface p-4 text-center shadow-xs"><p className="text-2xl font-bold text-foreground">{urgent}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">Urgent</p></div>
          </div>
        </div>
      </section>

      {!patient ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface p-10 text-center"><Smile className="mx-auto size-9 text-text-muted" /><h2 className="mt-4 font-heading text-lg font-bold">Complete registration first</h2><p className="mt-2 text-sm text-text-muted">Your chart becomes available after your patient record is created.</p></div>
      ) : (
        <section className="rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Smile className="size-5" /></span><div><h2 className="font-heading text-lg font-bold">Interactive dental chart</h2><p className="text-xs text-text-muted">Select a tooth to review its latest clinical record.</p></div></div>
            <span className="flex items-center gap-2 text-xs text-text-muted"><ShieldCheck className="size-4 text-success" />Clinician-recorded · read only</span>
          </div>
          <OdontogramChart patientId={patient.id} entries={entries} editable={false} />
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><ClipboardList className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Next steps</p><h2 className="font-heading text-lg font-bold">Treatment recommendations</h2></div></div>
          {planned.length ? (
            <div className="mt-5 space-y-3">
              {planned.map((entry) => (
                <div key={entry.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[64px_1fr_auto] sm:items-center">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-background-subtle font-bold text-primary">{entry.tooth_number}</span>
                  <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{entry.recommended_treatment || entry.condition_code || "Clinical review"}</p>{entry.treatment_priority && <Badge variant="outline" className={cn("capitalize", PRIORITY_STYLE[entry.treatment_priority])}>{entry.treatment_priority}</Badge>}</div><p className="mt-1 text-xs text-text-muted">{entry.condition_code || entry.status.replace("_", " ")}{entry.planned_date ? ` · Planned ${new Date(entry.planned_date).toLocaleDateString()}` : ""}</p></div>
                  <p className="font-semibold">{entry.estimated_fee ? `€${Number(entry.estimated_fee).toLocaleString()}` : "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-success/8 p-5"><CheckCircle2 className="size-6 text-success" /><div><p className="font-semibold">No treatment currently planned</p><p className="mt-1 text-xs text-text-muted">New recommendations will appear after clinical charting.</p></div></div>
          )}
        </article>

        <div className="space-y-5">
          <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3"><WalletCards className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold">Service fee total</h2></div>
            <p className="mt-5 text-3xl font-bold">€{estimatedTotal.toLocaleString()}</p>
            <p className="mt-2 text-xs leading-5 text-text-muted">Service fees recorded against planned items. Your issued invoice is the final billing record.</p>
          </article>
          <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3"><CalendarDays className="size-5 text-primary" /><h2 className="font-heading text-lg font-bold">Chart recency</h2></div>
            <p className="mt-4 text-sm">{entries.length ? `Last updated ${new Date(Math.max(...entries.map((entry) => new Date(entry.recorded_at).getTime()))).toLocaleDateString()}` : "No chart entries yet"}</p>
          </article>
          {urgent > 0 && <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/8 p-4 text-sm"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" /><p>{urgent} urgent treatment item{urgent === 1 ? "" : "s"} recorded. Contact the clinic to arrange care.</p></div>}
        </div>
      </section>
    </div>
  );
}
