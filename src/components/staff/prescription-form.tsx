"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertTriangle, Loader2, Plus, Search, ShieldCheck, Trash2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPatientMedicalHistory, searchPatients } from "@/lib/server/directory";
import { createPrescriptionAction, type PrescriptionActionState } from "@/lib/server/prescriptions";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}
interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const initialState: PrescriptionActionState = { error: null };
const emptyItem: MedicineItem = {
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

export function PrescriptionForm({
  initialPatient = null,
  initialClinicalContext = null,
}: {
  initialPatient?: Patient | null;
  initialClinicalContext?: { allergies: string[]; current_medications: string[]; chronic_conditions: string[] } | null;
}) {
  const [state, formAction, pending] = useActionState(createPrescriptionAction, initialState);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(initialPatient);
  const [clinicalContext, setClinicalContext] = React.useState<{ allergies: string[]; current_medications: string[]; chronic_conditions: string[] } | null>(initialClinicalContext);
  const [items, setItems] = React.useState<MedicineItem[]>([{ ...emptyItem }]);

  React.useEffect(() => {
    if (selectedPatient) return;
    const timer = setTimeout(async () => setResults(await searchPatients(query)), 250);
    return () => clearTimeout(timer);
  }, [query, selectedPatient]);

  function updateItem(index: number, patch: Partial<MedicineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function selectPatient(patient: Patient) {
    setSelectedPatient(patient);
    setClinicalContext(await getPatientMedicalHistory(patient.id));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
        <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Patient identity</Label>
        {selectedPatient ? (
          <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary-soft/45 px-4 py-3 text-sm">
            <span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><UserCheck className="size-4" /></span><span><strong className="block text-xs">{selectedPatient.first_name} {selectedPatient.last_name}</strong><small className="text-[10px] text-muted-foreground">{selectedPatient.phone || "No phone recorded"}</small></span></span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedPatient(null); setClinicalContext(null); }}>
              Change
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or phone"
                className="h-11 rounded-xl bg-background pl-10"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-lg">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold hover:bg-muted"
                    >
                      {p.first_name} {p.last_name}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {selectedPatient && clinicalContext && (
        <div className={clinicalContext.allergies.length > 0 ? "rounded-2xl border border-destructive/20 bg-destructive/6 p-4" : "rounded-2xl border border-success/15 bg-success/6 p-4"}>
          <div className="flex items-center gap-2 text-xs font-extrabold">{clinicalContext.allergies.length > 0 ? <AlertTriangle className="size-4 text-destructive" /> : <ShieldCheck className="size-4 text-success" />}Clinical safety context</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Allergies</p><p className="mt-1 text-[11px] font-semibold">{clinicalContext.allergies.join(", ") || "None recorded"}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Current medicines</p><p className="mt-1 text-[11px] font-semibold">{clinicalContext.current_medications.join(", ") || "None recorded"}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Conditions</p><p className="mt-1 text-[11px] font-semibold">{clinicalContext.chronic_conditions.join(", ") || "None recorded"}</p></div></div>
        </div>
      )}

      <div className="space-y-3">
        <div><Label className="text-sm font-extrabold">Medicines</Label><p className="mt-1 text-[11px] text-muted-foreground">Use one line per medicine with complete dosing and patient directions.</p></div>
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-border bg-background-subtle/35 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Medicine {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={items.length === 1}
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove medicine"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Input
              placeholder="Medicine name"
              value={item.medicineName}
              onChange={(e) => updateItem(index, { medicineName: e.target.value })}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                placeholder="Dosage (e.g. 500mg)"
                value={item.dosage}
                onChange={(e) => updateItem(index, { dosage: e.target.value })}
              />
              <Input
                placeholder="Frequency (e.g. 2x/day)"
                value={item.frequency}
                onChange={(e) => updateItem(index, { frequency: e.target.value })}
              />
              <Input
                placeholder="Duration (e.g. 7 days)"
                value={item.duration}
                onChange={(e) => updateItem(index, { duration: e.target.value })}
              />
            </div>
            <Input
              placeholder="Instructions (e.g. after meals)"
              value={item.instructions}
              onChange={(e) => updateItem(index, { instructions: e.target.value })}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
        >
          <Plus className="size-4" />
          Add medicine
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" size="lg" className="h-11 w-full rounded-xl" disabled={pending || !selectedPatient}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save prescription
      </Button>
    </form>
  );
}
