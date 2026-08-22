"use client";

import * as React from "react";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  Search,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PractitionerOption {
  id: string;
  title: string | null;
  branch_id?: string;
  profiles: { full_name: string } | null;
}

interface PractitionerAppointmentSelectorProps {
  practitioners: PractitionerOption[];
  currentPractitionerId: string;
  onSelect: (practitionerId: string) => void;
  className?: string;
}

export function PractitionerAppointmentSelector({
  practitioners,
  currentPractitionerId,
  onSelect,
  className,
}: PractitionerAppointmentSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const isAll = !currentPractitionerId || currentPractitionerId === "all";
  const activePractitioner = practitioners.find((p) => p.id === currentPractitionerId);

  const currentDisplayName = isAll
    ? "All Doctors"
    : activePractitioner?.profiles?.full_name || "All Doctors";

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (practitionerId: string) => {
    setIsOpen(false);
    setSearchQuery("");
    onSelect(practitionerId);
  };

  const filteredPractitioners = practitioners.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (p.profiles?.full_name || "").toLowerCase();
    const title = (p.title || "").toLowerCase();
    return name.includes(q) || title.includes(q);
  });

  const showAllOption =
    !searchQuery.trim() ||
    "all doctors".includes(searchQuery.toLowerCase()) ||
    "everyone".includes(searchQuery.toLowerCase());

  return (
    <div ref={containerRef} className={cn("relative z-30", className)}>
      {/* 1. Classy Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "group flex items-center justify-between gap-3 rounded-2xl border bg-card/95 py-1.5 pl-2.5 pr-3 text-left shadow-2xs backdrop-blur-xs transition-all duration-200 cursor-pointer select-none min-w-[200px] sm:min-w-[240px]",
          isOpen
            ? "border-primary ring-2 ring-primary/15 shadow-md"
            : "border-border/80 hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon Capsule */}
          <div className="size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            {isAll ? <Users className="size-3.5" /> : <Stethoscope className="size-3.5" />}
          </div>

          {/* Doctor Name & Subtitle */}
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground leading-none block">
              Doctor Filter
            </span>
            <p className="mt-0.5 text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {currentDisplayName}
            </p>
          </div>
        </div>

        {/* Chevrons Icon */}
        <div className="shrink-0 pl-1.5 border-l border-border/60">
          <ChevronsUpDown
            className={cn(
              "size-3.5 text-muted-foreground/80 transition-transform duration-200 group-hover:text-foreground",
              isOpen && "rotate-180 text-primary"
            )}
          />
        </div>
      </button>

      {/* 2. Popover Panel with Instant Search */}
      {isOpen && (
        <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-2 w-[320px] sm:w-[360px] origin-top-right rounded-3xl border border-border/90 bg-card p-3 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10">
          {/* Header & Instant Search Box */}
          <div className="space-y-2.5 pb-2.5 border-b border-border/70">
            <div className="flex items-center justify-between px-1 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Stethoscope className="size-3.5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Select Doctor
                </span>
              </div>
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {practitioners.length + 1} Options
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor by name..."
                className="w-full h-9 rounded-xl border border-border/80 bg-background/80 pl-9 pr-8 text-xs font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Doctors List */}
          <div
            role="listbox"
            className="my-2 max-h-[280px] overflow-y-auto space-y-1 pr-1 overscroll-contain focus:outline-none"
          >
            {/* All Doctors Option */}
            {showAllOption && (
              <button
                type="button"
                role="option"
                aria-selected={isAll}
                onClick={() => handleSelect("all")}
                className={cn(
                  "group w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 cursor-pointer",
                  isAll
                    ? "bg-primary/10 border border-primary/30 shadow-2xs"
                    : "hover:bg-muted/50 border border-transparent hover:border-border/60"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "size-8.5 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                      isAll
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    <Users className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs font-bold truncate leading-tight transition-colors",
                        isAll ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}
                    >
                      All Doctors
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                      Show full clinic schedule
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isAll ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      <Check className="size-2.5 stroke-[3]" />
                      Active
                    </span>
                  ) : (
                    <div className="size-6 rounded-lg flex items-center justify-center text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                      <ChevronRight className="size-3.5" />
                    </div>
                  )}
                </div>
              </button>
            )}

            {/* Individual Practitioners */}
            {filteredPractitioners.length === 0 && !showAllOption ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-bold text-muted-foreground">No doctor found</p>
                <p className="text-[11px] text-muted-foreground/70">
                  No match for &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              filteredPractitioners.map((p) => {
                const isSelected = p.id === currentPractitionerId;
                const docName = p.profiles?.full_name || "Doctor";
                const docTitle = p.title || "Dental Clinician";

                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      "group w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border border-primary/30 shadow-2xs"
                        : "hover:bg-muted/50 border border-transparent hover:border-border/60"
                    )}
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-8.5 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        <Stethoscope className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-xs font-bold truncate leading-tight transition-colors",
                            isSelected
                              ? "text-primary"
                              : "text-foreground group-hover:text-primary"
                          )}
                        >
                          {docName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                          {docTitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: Selected or Action indicator */}
                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          <Check className="size-2.5 stroke-[3]" />
                          Active
                        </span>
                      ) : (
                        <div className="size-6 rounded-lg flex items-center justify-center text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                          <ChevronRight className="size-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Strip */}
          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="size-1.5 rounded-full bg-primary" />
              Updates appointments for selected doctor
            </span>
            <span className="font-mono text-[9px] bg-muted/80 px-1.5 py-0.5 rounded font-semibold text-muted-foreground">
              ESC
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
