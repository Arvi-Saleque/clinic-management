"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Check,
  Clock3,
  FileText,
  Info,
  Loader2,
  Smile,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveEncounterOdontogramAction,
  upsertOdontogramEntryAction,
} from "@/lib/server/odontogram";
import { cn } from "@/lib/utils";

const UPPER_ROW = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER_ROW = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];

const CONDITIONS = [
  "Healthy",
  "Caries",
  "Fracture",
  "Sensitivity",
  "Gingival concern",
  "Missing",
  "Existing restoration",
  "AM-14",
  "Other",
];

const TREATMENTS = [
  "Observation",
  "No treatment",
  "Review / monitor",
  "Composite filling",
  "Root canal treatment",
  "Crown",
  "Extraction",
  "Implant consultation",
  "Periodontal care",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "healthy", label: "Healthy / observed", color: "#10b981" },
  { value: "existing_treatment", label: "Existing treatment", color: "#f59e0b" },
  { value: "planned_treatment", label: "Treatment planned", color: "#3b82f6" },
  { value: "completed_treatment", label: "Treatment completed", color: "#059669" },
  { value: "missing", label: "Missing / extracted", color: "#6b7280" },
  { value: "other", label: "Other finding", color: "#8b5cf6" },
] as const;

export interface OdontogramEntry {
  id: string;
  tooth_number: string;
  status: string;
  condition_code: string | null;
  condition_note: string | null;
  recommended_treatment: string | null;
  treatment_priority: string | null;
  planned_date: string | null;
  estimated_fee: number | null;
  recorded_at: string;
}

export interface OdontogramChartProps {
  patientId?: string;
  encounterId?: string;
  entries: OdontogramEntry[];
  encounterEntries?: OdontogramEntry[];
  editable?: boolean;
  onEntrySaved?: (entry: OdontogramEntry) => void;
}

function ToothModel({
  tooth,
  entry,
  selected,
  onSelect,
  upper,
}: {
  tooth: string;
  entry?: OdontogramEntry;
  selected: boolean;
  onSelect: () => void;
  upper: boolean;
}) {
  const status =
    STATUS_OPTIONS.find((item) => item.value === entry?.status) ?? STATUS_OPTIONS[0];
  const wide = ["18", "17", "16", "26", "27", "28", "38", "37", "36", "46", "47", "48"].includes(tooth);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select tooth ${tooth}`}
      className={cn(
        "group flex flex-1 min-w-[20px] max-w-[54px] flex-col items-center rounded-xl sm:rounded-2xl border px-0.5 sm:px-1 py-1 sm:py-1.5 transition-all duration-150 focus-visible:outline-none",
        selected
          ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/20 scale-[1.04]"
          : "border-transparent hover:border-border/80 hover:bg-muted/40",
        upper ? "justify-end" : "justify-start",
      )}
    >
      {upper && (
        <span className={cn(
          "mb-0.5 sm:mb-1 font-mono text-[9px] sm:text-[11px] font-bold",
          selected ? "text-emerald-800 dark:text-emerald-300 font-extrabold" : "text-muted-foreground"
        )}>
          {tooth}
        </span>
      )}
      <svg
        viewBox="0 0 50 68"
        className={cn(
          "w-full drop-shadow-xs transition duration-150 group-hover:-translate-y-0.5",
          wide ? "h-[36px] sm:h-[46px] md:h-[52px]" : "h-[32px] sm:h-[42px] md:h-[48px]",
          !upper && "rotate-180",
        )}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`tooth-${tooth}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>
        <path
          d={
            wide
              ? "M8 12C10 4 20 2 25 7C31 2 42 5 43 14C44 23 38 28 36 39C34 50 33 62 27 64C23 65 23 48 19 47C15 48 16 65 11 63C5 60 7 49 6 39C5 29 3 22 8 12Z"
              : "M12 12C14 4 21 3 25 8C30 3 38 5 39 14C40 23 34 29 33 39C32 51 31 63 27 64C23 65 23 48 20 47C16 48 17 64 13 63C8 60 9 50 8 39C7 28 7 20 12 12Z"
          }
          fill={`url(#tooth-${tooth})`}
          stroke={status.color}
          strokeWidth={selected ? 2.6 : 1.6}
        />
        <path
          d="M13 15C20 10 30 10 37 15"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity=".8"
        />
        {entry?.status === "planned_treatment" && (
          <path
            d="M15 26L34 39M34 26L15 39"
            stroke={status.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        {entry?.status === "completed_treatment" && (
          <path
            d="M15 34L22 41L35 26"
            stroke={status.color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {entry?.status === "missing" && (
          <path
            d="M11 12L39 58M39 12L11 58"
            stroke={status.color}
            strokeWidth="3"
            opacity=".75"
          />
        )}
      </svg>
      {!upper && (
        <span className={cn(
          "mt-0.5 sm:mt-1 font-mono text-[9px] sm:text-[11px] font-bold",
          selected ? "text-emerald-800 dark:text-emerald-300 font-extrabold" : "text-muted-foreground"
        )}>
          {tooth}
        </span>
      )}
      <span
        className="mt-0.5 sm:mt-1 size-1.5 rounded-full"
        style={{ backgroundColor: status.color }}
      />
    </button>
  );
}

export function OdontogramChart({
  patientId,
  encounterId,
  entries,
  encounterEntries = [],
  editable = false,
  onEntrySaved,
}: OdontogramChartProps) {
  const router = useRouter();
  const isEncounterMode = Boolean(encounterId);

  const [overrides, setOverrides] = React.useState<Record<string, OdontogramEntry>>({});
  const [localEncounterEntries, setLocalEncounterEntries] = React.useState<OdontogramEntry[]>([]);
  const [selectedTooth, setSelectedTooth] = React.useState(entries[0]?.tooth_number ?? "14");
  const [saving, setSaving] = React.useState(false);

  const byTooth = React.useMemo(() => {
    const map = new Map<string, OdontogramEntry>();
    entries.forEach((entry) => map.set(entry.tooth_number, entry));
    Object.values(overrides).forEach((entry) => map.set(entry.tooth_number, entry));
    return map;
  }, [entries, overrides]);

  const selectedEntry = byTooth.get(selectedTooth);
  const [status, setStatus] = React.useState(selectedEntry?.status ?? "existing_treatment");
  const [condition, setCondition] = React.useState(selectedEntry?.condition_code ?? "AM-14");
  const [treatment, setTreatment] = React.useState(selectedEntry?.recommended_treatment ?? "Observation");
  const [priority, setPriority] = React.useState(selectedEntry?.treatment_priority ?? "routine");
  const [plannedDate, setPlannedDate] = React.useState(selectedEntry?.planned_date ?? "");
  const [estimatedFee, setEstimatedFee] = React.useState(selectedEntry?.estimated_fee?.toString() ?? "");
  const [note, setNote] = React.useState(selectedEntry?.condition_note ?? "Class II MO amalgam filling intact");

  // Combined encounter-specific entries
  const combinedEncounterEntries = React.useMemo(() => {
    const map = new Map<string, OdontogramEntry>();
    encounterEntries.forEach((e) => map.set(e.id, e));
    localEncounterEntries.forEach((e) => map.set(e.id, e));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
  }, [encounterEntries, localEncounterEntries]);

  function selectTooth(tooth: string) {
    const entry = byTooth.get(tooth);
    setSelectedTooth(tooth);
    setStatus(entry?.status ?? "healthy");
    setCondition(entry?.condition_code ?? "Healthy");
    setTreatment(entry?.recommended_treatment ?? "Observation");
    setPriority(entry?.treatment_priority ?? "routine");
    setPlannedDate(entry?.planned_date ?? "");
    setEstimatedFee(entry?.estimated_fee?.toString() ?? "");
    setNote(entry?.condition_note ?? "");
  }

  async function saveEntry() {
    if (!editable) return;
    setSaving(true);

    try {
      if (isEncounterMode && encounterId) {
        // Encounter-specific charting path
        const result = await saveEncounterOdontogramAction({
          encounterId,
          toothNumber: selectedTooth,
          status,
          conditionCode: condition,
          conditionNote: note,
          recommendedTreatment: treatment,
          treatmentPriority: priority as "routine" | "priority" | "urgent",
          plannedDate,
          estimatedFee: estimatedFee ? Number(estimatedFee) : undefined,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        const newEntry: OdontogramEntry = {
          id: result.data?.entry_id ?? selectedEntry?.id ?? `${selectedTooth}-${Date.now()}`,
          tooth_number: selectedTooth,
          status,
          condition_code: condition,
          condition_note: note || null,
          recommended_treatment: treatment,
          treatment_priority: priority,
          planned_date: plannedDate || null,
          estimated_fee: estimatedFee ? Number(estimatedFee) : null,
          recorded_at: result.data?.recorded_at ?? new Date().toISOString(),
        };

        setOverrides((current) => ({ ...current, [selectedTooth]: newEntry }));
        setLocalEncounterEntries((current) => [...current, newEntry]);
        toast.success(`Tooth ${selectedTooth} recorded for consultation`);
        onEntrySaved?.(newEntry);
        router.refresh();
      } else if (patientId) {
        // Standalone charting path
        const result = await upsertOdontogramEntryAction({
          patientId,
          toothNumber: selectedTooth,
          status,
          conditionCode: condition,
          conditionNote: note,
          recommendedTreatment: treatment,
          treatmentPriority: priority as "routine" | "priority" | "urgent",
          plannedDate,
          estimatedFee: estimatedFee ? Number(estimatedFee) : undefined,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        const newEntry: OdontogramEntry = {
          id: result.data?.entry_id ?? selectedEntry?.id ?? selectedTooth,
          tooth_number: selectedTooth,
          status,
          condition_code: condition,
          condition_note: note || null,
          recommended_treatment: treatment,
          treatment_priority: priority,
          planned_date: plannedDate || null,
          estimated_fee: estimatedFee ? Number(estimatedFee) : null,
          recorded_at: result.data?.recorded_at ?? new Date().toISOString(),
        };

        setOverrides((current) => ({ ...current, [selectedTooth]: newEntry }));
        toast.success(`Tooth ${selectedTooth} chart updated`);
        onEntrySaved?.(newEntry);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const documented = Array.from(byTooth.values()).filter(
    (entry) => entry.status !== "healthy",
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">
      {/* ------------------------------------------------------------- */}
      {/* LEFT COLUMN (8 cols): Arch Map + Consultation Records        */}
      {/* ------------------------------------------------------------- */}
      <div className="xl:col-span-8 space-y-6 min-w-0">
        {/* Card 1: Permanent dentition · FDI notation */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-2xs">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Permanent dentition · FDI notation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a tooth to view and record its current condition and treatment plan.
              </p>
            </div>

            <span className="rounded-full bg-muted/60 text-muted-foreground border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold">
              {documented.length} teeth documented
            </span>
          </div>

          {/* Odontogram Arch Map (Full Width, Zero Side Scrolling) */}
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-3 sm:p-5 md:p-6 space-y-4 w-full">
            <div className="w-full space-y-4 max-w-4xl mx-auto">
              {/* Upper Arch Label */}
              <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
                Upper Arch
              </p>

              {/* Upper Teeth Row */}
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 w-full">
                {UPPER_ROW.map((tooth) => (
                  <ToothModel
                    key={tooth}
                    tooth={tooth}
                    entry={byTooth.get(tooth)}
                    selected={selectedTooth === tooth}
                    onSelect={() => selectTooth(tooth)}
                    upper
                  />
                ))}
              </div>

              {/* Lower Arch Label */}
              <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground pt-3 border-t border-border/40">
                Lower Arch
              </p>

              {/* Lower Teeth Row */}
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 w-full">
                {LOWER_ROW.map((tooth) => (
                  <ToothModel
                    key={tooth}
                    tooth={tooth}
                    entry={byTooth.get(tooth)}
                    selected={selectedTooth === tooth}
                    onSelect={() => selectTooth(tooth)}
                    upper={false}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status Legend Bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-[11px] font-medium text-muted-foreground">
            {STATUS_OPTIONS.map((item) => (
              <span key={item.value} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Recorded this consultation */}
        {isEncounterMode && (
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Recorded this consultation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Authoritative chronological record of dental chart findings and transitions recorded during this encounter.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-muted/60 text-muted-foreground border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold">
                {combinedEncounterEntries.length} recorded
              </span>
            </div>

            {/* Empty State vs List */}
            {combinedEncounterEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-8 flex items-center justify-center gap-4 text-left">
                <div className="size-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200/50">
                  <Smile className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-foreground">
                    No dental chart findings recorded during this consultation.
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Select a tooth to view, examine and record findings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {combinedEncounterEntries.map((entry) => {
                  const statusMeta =
                    STATUS_OPTIONS.find((item) => item.value === entry.status) ?? STATUS_OPTIONS[0];

                  return (
                    <button
                      type="button"
                      key={entry.id}
                      onClick={() => selectTooth(entry.tooth_number)}
                      className="rounded-2xl border border-border/80 bg-card p-3.5 text-left transition hover:border-primary/50 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 px-2 py-0.5 font-mono text-[10px] font-bold">
                          Tooth {entry.tooth_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(entry.recorded_at), "h:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: statusMeta.color }}
                        />
                        <p className="text-xs font-bold text-foreground truncate">
                          {entry.condition_code || statusMeta.label}
                        </p>
                      </div>

                      {entry.condition_note && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {entry.condition_note}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT COLUMN (4 cols): Selected Tooth Editor                  */}
      {/* ------------------------------------------------------------- */}
      <aside className="xl:col-span-4 sticky top-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Selected Tooth
              </p>
              <h3 className="font-heading text-xl font-extrabold text-foreground">
                Tooth {selectedTooth}
              </h3>
              {selectedEntry?.recorded_at && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="size-3 text-muted-foreground/70" />
                  Last updated {format(new Date(selectedEntry.recorded_at), "dd/MM/yyyy")}
                </p>
              )}
            </div>

            <div className="size-10 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/50 shrink-0">
              <Smile className="size-5" />
            </div>
          </div>

          {/* Form Fields (when editable) */}
          {editable ? (
            <div className="space-y-3.5 pt-1">
              {/* Field 1: Chart status */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Chart status
                </Label>
                <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                    <SelectValue>
                      {(val: string) => STATUS_OPTIONS.find((item) => item.value === val)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Field 2: Clinical finding */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Clinical finding
                </Label>
                <Select value={condition} onValueChange={(val) => val && setCondition(val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((item) => (
                      <SelectItem key={item} value={item} className="text-xs">
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Field 3: Recommended treatment */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Recommended treatment
                </Label>
                <Select value={treatment} onValueChange={(val) => val && setTreatment(val)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENTS.map((item) => (
                      <SelectItem key={item} value={item} className="text-xs">
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2-Column Row: Priority & Planned Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Priority
                  </Label>
                  <Select value={priority} onValueChange={(val) => val && setPriority(val)}>
                    <SelectTrigger className="h-9 rounded-xl text-xs bg-card border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine" className="text-xs">Routine</SelectItem>
                      <SelectItem value="priority" className="text-xs">Priority</SelectItem>
                      <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Planned date
                  </Label>
                  <Input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="h-9 rounded-xl text-xs bg-card border-border/80"
                  />
                </div>
              </div>

              {/* Field 4: Service fee (EUR) */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Service fee (€)
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    €
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={estimatedFee}
                    onChange={(e) => setEstimatedFee(e.target.value)}
                    placeholder="Optional"
                    className="h-9 rounded-xl text-xs bg-card border-border/80 pl-8"
                  />
                </div>
              </div>

              {/* Field 5: Clinical note */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    Clinical note
                  </Label>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {note.length} / 200
                  </span>
                </div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="Finding, rationale, or follow-up note…"
                  className="rounded-xl border-border/80 bg-card text-xs resize-none"
                />
              </div>

              {/* Save Tooth Record CTA */}
              <div className="pt-1">
                <Button
                  onClick={saveEntry}
                  disabled={saving}
                  className="h-10 w-full rounded-xl text-xs font-bold bg-[#0B3B36] hover:bg-[#0B3B36]/90 text-white shadow-xs gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      Save tooth record
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Luxury Read-Only State for Patient Portal & Completed Consultations */
            <div className="mt-4 space-y-3.5 rounded-2xl bg-background-subtle/80 border border-border/80 p-4 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Tooth Status
                  </p>
                  <div className="mt-1 flex items-center gap-2 font-bold text-foreground text-sm">
                    <span
                      className="size-2.5 rounded-full ring-2 ring-border/50"
                      style={{
                        backgroundColor:
                          STATUS_OPTIONS.find((item) => item.value === selectedEntry?.status)
                            ?.color ?? "#10b981",
                      }}
                    />
                    <span>
                      {STATUS_OPTIONS.find((item) => item.value === selectedEntry?.status)
                        ?.label ?? "Healthy / observed"}
                    </span>
                  </div>
                </div>

                {selectedEntry?.treatment_priority && (
                  <span className="rounded-xl border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold capitalize text-foreground shadow-2xs">
                    {selectedEntry.treatment_priority}
                  </span>
                )}
              </div>

              <div className="space-y-1 rounded-xl bg-surface/80 border border-border/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Clinical Finding
                </p>
                <p className="font-heading text-sm font-bold text-foreground">
                  {selectedEntry?.condition_code || "Healthy Tooth"}
                </p>
              </div>

              <div className="space-y-1 rounded-xl bg-surface/80 border border-border/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Recommended Treatment
                </p>
                <p className="font-heading text-sm font-bold text-foreground">
                  {selectedEntry?.recommended_treatment || "Routine observation & hygiene"}
                </p>
              </div>

              {selectedEntry?.estimated_fee && (
                <div className="flex items-center justify-between rounded-xl bg-primary-soft/40 border border-primary/20 p-3">
                  <span className="text-xs font-semibold text-text-secondary">Service Fee:</span>
                  <span className="font-heading text-sm font-extrabold text-foreground">
                    €{Number(selectedEntry.estimated_fee).toLocaleString()}
                  </span>
                </div>
              )}

              {selectedEntry?.condition_note && (
                <div className="space-y-1 rounded-xl bg-surface/80 border border-border/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Clinical Note
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed italic">
                    &ldquo;{selectedEntry.condition_note}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 text-[11px] text-text-muted border-t border-border/60">
                <Info className="size-3.5 text-primary shrink-0" />
                <span>Recorded by attending clinician during chart examination.</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
