import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Layers,
  ShieldCheck,
  Smile,
  Stethoscope,
  WalletCards,
} from "lucide-react";

import { OdontogramChart } from "@/components/shared/odontogram-chart";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getOwnOdontogram } from "@/lib/server/odontogram";
import { getOwnPortalPatient } from "@/lib/server/patient-portal";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "My Dental Care" };

const PRIORITY_STYLE: Record<string, string> = {
  routine: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold",
  priority: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold",
  urgent: "border-destructive/20 bg-destructive/10 text-destructive font-bold",
};

export default async function PortalOdontogramPage() {
  const [patient, entries] = await Promise.all([getOwnPortalPatient(), getOwnOdontogram()]);
  const planned = entries.filter(
    (entry) => entry.recommended_treatment || ["planned", "in_progress"].includes(entry.status),
  );
  const urgent = planned.filter((entry) => entry.treatment_priority === "urgent").length;
  const estimatedTotal = planned.reduce((sum, entry) => sum + Number(entry.estimated_fee ?? 0), 0);

  const lastUpdated = entries.length
    ? new Date(Math.max(...entries.map((entry) => new Date(entry.recorded_at).getTime())))
    : null;

  return (
    <div className="space-y-8">
      {/* ── HEADER & STATS OVERVIEW ── */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/85 backdrop-blur-xl p-6 sm:p-8 shadow-sm transition-all">
        {/* Soft Ambient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-60 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_auto] lg:items-end">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft/80 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md shadow-xs">
              <Smile className="size-3.5" /> Tooth-by-tooth record
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              My dental care
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
              Explore your current dental chart, recorded conditions and recommended next treatments.
            </p>
          </div>

          {/* Quick Metrics Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-[24px] border border-border/80 bg-surface/90 backdrop-blur-xl p-4.5 text-center shadow-xs transition-all hover:border-primary/40 hover:scale-[1.02]">
              <div className="flex items-center justify-center text-primary mb-1">
                <Layers className="size-4" />
              </div>
              <p className="font-heading text-2xl font-extrabold text-foreground">{entries.length}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Charted</p>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-surface/90 backdrop-blur-xl p-4.5 text-center shadow-xs transition-all hover:border-primary/40 hover:scale-[1.02]">
              <div className="flex items-center justify-center text-primary mb-1">
                <ClipboardList className="size-4" />
              </div>
              <p className="font-heading text-2xl font-extrabold text-foreground">{planned.length}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Planned</p>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-surface/90 backdrop-blur-xl p-4.5 text-center shadow-xs transition-all hover:border-destructive/40 hover:scale-[1.02]">
              <div className="flex items-center justify-center text-amber-500 mb-1">
                <AlertTriangle className="size-4" />
              </div>
              <p className={cn("font-heading text-2xl font-extrabold", urgent > 0 ? "text-destructive" : "text-foreground")}>
                {urgent}
              </p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Urgent</p>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-surface/90 backdrop-blur-xl p-4.5 text-center shadow-xs transition-all hover:border-primary/40 hover:scale-[1.02]">
              <div className="flex items-center justify-center text-primary mb-1">
                <WalletCards className="size-4" />
              </div>
              <p className="font-heading text-2xl font-extrabold text-foreground">{formatCurrency(estimatedTotal)}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Service Total</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE 3D ODONTOGRAM CHART ── */}
      {!patient ? (
        <div className="rounded-[32px] border border-dashed border-border/80 bg-surface/90 backdrop-blur-xl p-12 text-center space-y-3 shadow-xl">
          <Smile className="mx-auto size-12 text-text-muted" />
          <h2 className="font-heading text-xl font-bold text-foreground">Complete registration first</h2>
          <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
            Your anatomical chart becomes fully interactive once your clinical record has been verified.
          </p>
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl transition-all">
          {/* Ambient Lighting Background */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 size-80 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative mb-6 flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                <Smile className="size-6" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Interactive dental chart</h2>
                <p className="text-xs text-text-muted">Select any tooth to review its anatomical condition and clinical record.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Clinician-recorded &middot; Read-only</span>
            </div>
          </div>

          <OdontogramChart patientId={patient.id} entries={entries} editable={false} />
        </section>
      )}

      {/* ── TREATMENT RECOMMENDATIONS & INSIGHTS ── */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] items-start">
        {/* Left Column: Treatment recommendations */}
        <article className="rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Next Steps</p>
                <h2 className="font-heading text-lg font-bold text-foreground">Treatment recommendations</h2>
              </div>
            </div>

            <span className="rounded-full border border-border bg-background-subtle px-3 py-1 text-xs font-semibold text-text-muted">
              {planned.length} {planned.length === 1 ? "procedure" : "procedures"} recommended
            </span>
          </div>

          {planned.length ? (
            <div className="space-y-3.5">
              {planned.map((entry) => (
                <div
                  key={entry.id}
                  className="grid gap-3.5 rounded-2xl border border-border/80 bg-background-subtle/80 backdrop-blur-md p-4.5 sm:grid-cols-[56px_1fr_auto] sm:items-center transition-all hover:border-primary/40 hover:bg-background-subtle hover:shadow-md"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-surface font-mono text-lg font-extrabold text-primary shadow-xs">
                    {entry.tooth_number}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-sm font-bold text-foreground">
                        {entry.recommended_treatment || entry.condition_code || "Clinical review"}
                      </p>
                      {entry.treatment_priority && (
                        <Badge variant="outline" className={cn("capitalize text-[11px] px-2 py-0.5", PRIORITY_STYLE[entry.treatment_priority])}>
                          {entry.treatment_priority}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1 font-medium text-text-secondary">
                        <Smile className="size-3 text-primary" />
                        Tooth #{entry.tooth_number} &middot; {entry.condition_code || entry.status.replace("_", " ")}
                      </span>
                      {entry.planned_date && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="size-3 text-primary" />
                          Target Date: {new Date(entry.planned_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>

                    {entry.condition_note && (
                      <p className="text-xs text-text-secondary pt-1 italic">
                        &ldquo;{entry.condition_note}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="text-left sm:text-right pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">Service fee</span>
                    <span className="font-heading text-base font-bold text-foreground">
                      {entry.estimated_fee ? formatCurrency(entry.estimated_fee) : "Included"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6 stroke-[2.25]" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">No active treatment planned</h3>
              <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                All teeth are charted healthy or fully observed. New recommendations will appear automatically after your next clinical review.
              </p>
            </div>
          )}
        </article>

        {/* Right Column: Financial & Clinical Summary Cards */}
        <div className="space-y-6">
          {/* Card 1: Service fee total */}
          <article className="relative overflow-hidden rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                  <WalletCards className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Total Care Value</p>
                  <h3 className="font-heading text-base font-bold text-foreground">Service fee total</h3>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {formatCurrency(estimatedTotal)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Service fees recorded against planned items. Your issued clinic invoice is the final billing record upon completion of care.
              </p>
            </div>
          </article>

          {/* Card 2: Chart Recency */}
          <article className="rounded-[32px] border border-border/80 bg-surface/90 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Verification</p>
                <h3 className="font-heading text-base font-bold text-foreground">Chart recency</h3>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-sm font-semibold text-foreground">
                {lastUpdated
                  ? `Last charted on ${lastUpdated.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
                  : "No chart entries recorded yet"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Updated in real-time by your clinician during in-office dental consultations.
              </p>
            </div>
          </article>

          {/* Card 3: Urgent Notice if present */}
          {urgent > 0 && (
            <article className="rounded-[32px] border border-destructive/30 bg-destructive/10 backdrop-blur-md p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Urgent Care Attention</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                You have <strong className="text-destructive font-bold">{urgent} urgent treatment item{urgent === 1 ? "" : "s"}</strong> recorded on your chart. Please arrange a visit with your doctor promptly.
              </p>
              <ButtonLink
                href="/portal/appointments/book"
                size="sm"
                className="rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-white w-full shadow-md shadow-destructive/20 h-9"
              >
                Book Recommended Care
              </ButtonLink>
            </article>
          )}

          {/* Card 4: Quick Action Banner */}
          <div className="rounded-[32px] border border-primary/25 bg-primary-soft/60 backdrop-blur-md p-6 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <Stethoscope className="size-4" /> Schedule Follow-up Visit
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Need to proceed with any of your planned restorations or consultations? Secure your preferred time slot online in seconds.
            </p>
            <ButtonLink
              href="/portal/appointments/book"
              className="w-full rounded-2xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-md shadow-primary/20 h-10"
            >
              Book an Appointment
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
