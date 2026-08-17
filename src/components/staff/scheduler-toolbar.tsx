"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Practitioner {
  id: string;
  title: string | null;
  profiles: { full_name: string } | null;
}

export function SchedulerToolbar({
  practitioners,
  practitionerId,
  date,
  canSelectPractitioner = true,
}: {
  practitioners: Practitioner[];
  practitionerId: string;
  date: string;
  canSelectPractitioner?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(next: { practitioner?: string; date?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.practitioner) params.set("practitioner", next.practitioner);
    if (next.date) params.set("date", next.date);
    router.push(`/scheduler?${params.toString()}`);
  }

  function shiftDay(delta: number) {
    const next = addDays(new Date(`${date}T00:00:00`), delta);
    navigate({ date: format(next, "yyyy-MM-dd") });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canSelectPractitioner && practitioners.length > 1 ? <Select
        value={practitionerId}
        onValueChange={(value) => value && navigate({ practitioner: value })}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Select practitioner">
            {(id: string) => {
              const p = practitioners.find((prac) => prac.id === id);
              return p ? `${p.profiles?.full_name ?? "Practitioner"}${p.title ? ` — ${p.title}` : ""}` : null;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {practitioners.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.profiles?.full_name ?? "Practitioner"} {p.title ? `— ${p.title}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select> : <div className="rounded-xl border border-border bg-muted/45 px-3 py-2 text-xs font-bold">{practitioners.find((p) => p.id === practitionerId)?.profiles?.full_name ?? "My diary"}</div>}

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => shiftDay(-1)} aria-label="Previous day">
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ date: format(new Date(), "yyyy-MM-dd") })}
        >
          Today
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => shiftDay(1)} aria-label="Next day">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <span className="text-sm font-medium">{format(new Date(`${date}T00:00:00`), "EEEE, d MMMM yyyy")}</span>
    </div>
  );
}
