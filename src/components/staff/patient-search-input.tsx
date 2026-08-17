"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function PatientSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get("q") ?? "");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      router.push(`/patients?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
      <Input
        placeholder="Search name, phone or patient ID (PT-…)"
        className="h-11 rounded-xl bg-background pl-10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
