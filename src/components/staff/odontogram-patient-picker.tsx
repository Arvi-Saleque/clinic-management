"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchPatients } from "@/lib/server/directory";
import { getPatientOdontogram } from "@/lib/server/odontogram";
import { OdontogramChart } from "@/components/shared/odontogram-chart";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}
interface Entry {
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

export function OdontogramPatientPicker() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Patient[]>([]);
  const [selected, setSelected] = React.useState<Patient | null>(null);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (selected) return;
    const timer = setTimeout(async () => setResults(await searchPatients(query)), 250);
    return () => clearTimeout(timer);
  }, [query, selected]);

  async function selectPatient(p: Patient) {
    setSelected(p);
    setLoading(true);
    setEntries(await getPatientOdontogram(p.id));
    setLoading(false);
  }

  if (!selected) {
    return (
      <Card className="rounded-3xl border-border shadow-[0_22px_60px_-48px_rgba(9,47,44,0.6)]">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-extrabold">Open a patient dental chart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone"
              className="h-11 rounded-xl pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {results.length > 0 && (
            <ul className="max-h-60 overflow-y-auto rounded-xl border border-border p-1">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-border shadow-[0_22px_60px_-48px_rgba(9,47,44,0.6)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {selected.first_name} {selected.last_name}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          Change patient
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        ) : (
          <OdontogramChart patientId={selected.id} entries={entries} editable />
        )}
      </CardContent>
    </Card>
  );
}
