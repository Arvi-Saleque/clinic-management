"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleDollarSign,
  Clock3,
  FileSpreadsheet,
  History,
  Info,
  Loader2,
  ScanLine,
  Sparkles,
  Stethoscope,
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
  "Other",
];
const TREATMENTS = [
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
  { value: "healthy", label: "Healthy / observed", color: "#74b8aa" },
  { value: "existing_treatment", label: "Existing treatment", color: "#d3a44d" },
  { value: "planned_treatment", label: "Treatment planned", color: "#4d8ed3" },
  { value: "completed_treatment", label: "Treatment completed", color: "#2d8a63" },
  { value: "missing", label: "Missing / extracted", color: "#899895" },
  { value: "other", label: "Other finding", color: "#8a65c7" },
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
        "group flex w-[54px] shrink-0 flex-col items-center rounded-xl border px-1 py-2 transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
        selected
          ? "border-primary bg-primary-soft shadow-[0_12px_24px_-18px_var(--primary)]"
          : "border-transparent hover:border-border hover:bg-muted/60",
        upper ? "justify-end" : "justify-start",
      )}
    >
      {upper && (
        <span className="mb-1 font-mono text-[9px] font-bold text-muted-foreground">
          {tooth}
        </span>
      )}
      <svg
        viewBox="0 0 50 68"
        className={cn(
          "w-full drop-shadow-[0_7px_5px_rgba(25,63,58,0.18)] transition duration-200 group-hover:-translate-y-0.5",
          wide ? "h-[58px]" : "h-[54px]",
          !upper && "rotate-180",
        )}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`tooth-${tooth}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="0.48" stopColor="#e9f1ee" />
            <stop offset="1" stopColor="#b7cbc6" />
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
          strokeWidth={selected ? 2.8 : 1.7}
        />
        <path
          d="M13 15C20 10 30 10 37 15"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".72"
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
        <span className="mt-1 font-mono text-[9px] font-bold text-muted-foreground">
          {tooth}
        </span>
      )}
      <span
        className="mt-1 size-1.5 rounded-full"
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
  const [selectedTooth, setSelectedTooth] = React.useState(entries[0]?.tooth_number ?? "11");
  const [saving, setSaving] = React.useState(false);

  const byTooth = React.useMemo(() => {
    const map = new Map<string, OdontogramEntry>();
    entries.forEach((entry) => map.set(entry.tooth_number, entry));
    Object.values(overrides).forEach((entry) => map.set(entry.tooth_number, entry));
    return map;
  }, [entries, overrides]);

  const selectedEntry = byTooth.get(selectedTooth);
  const [status, setStatus] = React.useState(selectedEntry?.status ?? "healthy");
  const [condition, setCondition] = React.useState(selectedEntry?.condition_code ?? "Healthy");
  const [treatment, setTreatment] = React.useState(selectedEntry?.recommended_treatment ?? "No treatment");
  const [priority, setPriority] = React.useState(selectedEntry?.treatment_priority ?? "routine");
  const [plannedDate, setPlannedDate] = React.useState(selectedEntry?.planned_date ?? "");
  const [estimatedFee, setEstimatedFee] = React.useState(selectedEntry?.estimated_fee?.toString() ?? "");
  const [note, setNote] = React.useState(selectedEntry?.condition_note ?? "");

  // Combined encounter-specific entries (server entries + local session additions)
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
    setTreatment(entry?.recommended_treatment ?? "No treatment");
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
    <div className="space-y-5">
      <div className="grid gap-5 2xl:grid-cols-[1fr_350px]">
        {/* Visual 3D Odontogram Map */}
        <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-background to-primary-soft/30">
          <div className="flex flex-col justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <ScanLine className="size-[18px] text-primary" />
                <h3 className="font-heading text-lg font-extrabold">
                  {isEncounterMode && !editable
                    ? "Current Patient Dental Chart"
                    : "Permanent dentition · FDI notation"}
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isEncounterMode && !editable
                  ? "May include updates from later consultations. Select a tooth to view details."
                  : "Select a 3D tooth model to record its current condition and treatment plan."}
              </p>
            </div>
            <span className="w-fit rounded-xl border border-primary/15 bg-primary-soft px-3 py-1.5 text-[10px] font-bold text-primary">
              {documented.length} teeth documented
            </span>
          </div>

          <div className="overflow-x-auto p-5 sm:p-7">
            <div className="mx-auto min-w-[870px] max-w-[1040px]">
              {/* Maxilla (Upper Arch) */}
              <div className="rounded-[50%_50%_24px_24px] border border-border/70 bg-surface/80 px-5 pb-5 pt-3 shadow-inner">
                <div className="flex justify-center gap-0.5">
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
              </div>

              {/* Occlusal Plane Divider */}
              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Occlusal plane
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Mandible (Lower Arch) */}
              <div className="rounded-[24px_24px_50%_50%] border border-border/70 bg-surface/80 px-5 pb-3 pt-5 shadow-inner">
                <div className="flex justify-center gap-0.5">
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
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap gap-3 border-t border-border bg-surface/70 px-5 py-4">
            {STATUS_OPTIONS.map((item) => (
              <span
                key={item.value}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"
              >
                <i
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </section>

        {/* Selected Tooth Detail / Editor Aside */}
        <aside className="rounded-3xl border border-border bg-surface p-5 shadow-[0_22px_54px_-42px_rgba(9,47,44,0.6)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Selected tooth
              </p>
              <h3 className="mt-1 font-heading text-2xl font-extrabold">
                Tooth {selectedTooth}
              </h3>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Stethoscope className="size-5" />
            </span>
          </div>

          {selectedEntry && (
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock3 className="size-3" />
              Last charted {new Date(selectedEntry.recorded_at).toLocaleDateString()}
            </p>
          )}

          {editable ? (
            /* Editable Form Controls for In-Progress Consultations / Standalone */
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Chart status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => value && setStatus(value)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue>
                      {(val: string) =>
                        STATUS_OPTIONS.find((item) => item.value === val)?.label
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Clinical finding
                </Label>
                <Select
                  value={condition}
                  onValueChange={(value) => value && setCondition(value)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Recommended treatment
                </Label>
                <Select
                  value={treatment}
                  onValueChange={(value) => value && setTreatment(value)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREATMENTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(value) => value && setPriority(value)}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Planned date
                  </Label>
                  <Input
                    type="date"
                    value={plannedDate}
                    onChange={(event) => setPlannedDate(event.target.value)}
                    className="h-10 rounded-xl text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Estimated fee (BDT)
                </Label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    value={estimatedFee}
                    onChange={(event) => setEstimatedFee(event.target.value)}
                    className="h-10 rounded-xl pl-9"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Clinical note
                </Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Finding, rationale, consent or follow-up note…"
                  className="rounded-xl"
                />
              </div>

              <Button
                onClick={saveEntry}
                disabled={saving}
                size="lg"
                className="h-11 w-full gap-2 rounded-xl"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save tooth record
              </Button>
            </div>
          ) : (
            /* Read-Only State for Completed Consultations / Portal */
            <div className="mt-5 space-y-4 rounded-2xl bg-muted/40 p-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Status
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_OPTIONS.find((item) => item.value === selectedEntry?.status)
                          ?.color ?? "#74b8aa",
                    }}
                  />
                  <span className="font-semibold text-foreground">
                    {STATUS_OPTIONS.find((item) => item.value === selectedEntry?.status)
                      ?.label ?? "Healthy / observed"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Clinical Finding
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {selectedEntry?.condition_code || "Healthy"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Recommended Treatment
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {selectedEntry?.recommended_treatment || "No treatment"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Priority
                  </p>
                  <p className="mt-0.5 capitalize font-medium text-foreground">
                    {selectedEntry?.treatment_priority || "Routine"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Planned Date
                  </p>
                  <p className="mt-0.5 font-medium text-foreground">
                    {selectedEntry?.planned_date
                      ? new Date(`${selectedEntry.planned_date}T00:00:00`).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {selectedEntry?.estimated_fee != null && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Estimated Fee
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    BDT {Number(selectedEntry.estimated_fee).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedEntry?.condition_note && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Clinical Note
                  </p>
                  <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                    {selectedEntry.condition_note}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-2 text-[10px] text-muted-foreground border-t border-border/60">
                <Info className="size-3 text-primary shrink-0" />
                <span>Read-only view for completed consultation.</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Encounter-Specific History (Consultation Mode) */}
      {isEncounterMode ? (
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-[18px] text-primary" />
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Recorded This Consultation
                </h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Authoritative chronological record of dental chart findings and transitions recorded during this encounter.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-xl border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
              {combinedEncounterEntries.length} recorded
            </span>
          </div>

          {combinedEncounterEntries.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6 text-center">
              <p className="text-xs text-muted-foreground">
                No dental chart findings recorded during this consultation.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {combinedEncounterEntries.map((entry) => {
                const statusMeta =
                  STATUS_OPTIONS.find((item) => item.value === entry.status) ?? STATUS_OPTIONS[0];

                return (
                  <button
                    type="button"
                    key={entry.id}
                    onClick={() => selectTooth(entry.tooth_number)}
                    className="rounded-2xl border border-border bg-background-subtle/40 p-4 text-left transition hover:border-primary/40 hover:bg-background-subtle/80"
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-lg bg-secondary px-2 py-1 font-mono text-[10px] font-extrabold text-secondary-foreground">
                        Tooth {entry.tooth_number}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(entry.recorded_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: statusMeta.color }}
                      />
                      <p className="text-xs font-bold text-foreground">
                        {entry.condition_code || statusMeta.label}
                      </p>
                    </div>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {entry.recommended_treatment || "No treatment recorded"}
                      {entry.planned_date
                        ? ` · ${new Date(`${entry.planned_date}T00:00:00`).toLocaleDateString()}`
                        : ""}
                    </p>

                    {(entry.treatment_priority || entry.estimated_fee != null) && (
                      <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
                        {entry.treatment_priority && (
                          <span className="capitalize font-semibold text-foreground/80">
                            {entry.treatment_priority} priority
                          </span>
                        )}
                        {entry.estimated_fee != null && (
                          <span>· BDT {Number(entry.estimated_fee).toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* Overall Treatment Timeline (Standalone Mode) */
        <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-[18px] text-primary" />
              <div>
                <h3 className="text-sm font-extrabold">Charted treatment timeline</h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Current entries retain the date and planned care; prior versions remain in the database audit history.
                </p>
              </div>
            </div>
            <Sparkles className="size-4 text-accent" />
          </div>

          {documented.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-muted/55 p-5 text-center text-xs text-muted-foreground">
              No conditions or treatments have been charted yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {documented
                .sort(
                  (a, b) =>
                    new Date(b.recorded_at).getTime() -
                    new Date(a.recorded_at).getTime(),
                )
                .map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    onClick={() => selectTooth(entry.tooth_number)}
                    className="rounded-2xl border border-border bg-background-subtle/35 p-4 text-left transition hover:border-primary/25"
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-lg bg-secondary px-2 py-1 font-mono text-[10px] font-extrabold text-secondary-foreground">
                        Tooth {entry.tooth_number}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(entry.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-extrabold">
                      {entry.condition_code ||
                        STATUS_OPTIONS.find((item) => item.value === entry.status)
                          ?.label}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {entry.recommended_treatment || "No treatment recorded"}
                      {entry.planned_date
                        ? ` · ${new Date(`${entry.planned_date}T00:00:00`).toLocaleDateString()}`
                        : ""}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
