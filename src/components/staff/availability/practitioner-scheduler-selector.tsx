"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export function PractitionerSchedulerSelector({
  practitioners,
  currentPractitionerId,
}: {
  practitioners: Practitioner[];
  currentPractitionerId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (practitionerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("practitioner", practitionerId);
    router.push(`/scheduler?${params.toString()}`);
  };

  if (practitioners.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPractitionerId} onValueChange={(val) => val && handleSelect(val)}>
        <SelectTrigger className="h-9 min-w-[200px] text-xs font-semibold rounded-xl bg-card border-border/80">
          <SelectValue placeholder="Select Doctor" />
        </SelectTrigger>
        <SelectContent>
          {practitioners.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs">
              {p.profiles?.full_name ?? "Practitioner"} {p.title ? `(${p.title})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
