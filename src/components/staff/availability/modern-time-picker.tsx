"use client";

import * as React from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernTimePickerProps {
  value: string; // "HH:mm" 24h format (e.g., "09:00", "17:30")
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
  align?: "left" | "right" | "auto";
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const COMMON_PRESETS = [
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "6:00 PM", value: "18:00" },
];

function parse24to12(val: string) {
  if (!val || !val.includes(":")) {
    return { hour12: 9, minuteStr: "00", period: "AM" as const, formatted: "09:00 AM" };
  }
  const [hStr, mStr] = val.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) h = 9;
  let m = parseInt(mStr, 10);
  if (isNaN(m)) m = 0;

  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const minuteStr = String(m).padStart(2, "0");
  const formatted = `${String(hour12).padStart(2, "0")}:${minuteStr} ${period}`;

  return { hour12, minuteStr, period, formatted };
}

function format12to24(hour12: number, minuteStr: string, period: "AM" | "PM") {
  let h = hour12;
  if (period === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  const h24Str = String(h).padStart(2, "0");
  return `${h24Str}:${minuteStr}`;
}

export function ModernTimePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
  placeholder = "Select time",
  align = "auto",
}: ModernTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [openDirection, setOpenDirection] = React.useState<"down" | "up">("down");
  const [computedAlign, setComputedAlign] = React.useState<"left" | "right">("left");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { hour12, minuteStr, period, formatted } = React.useMemo(
    () => parse24to12(value),
    [value],
  );

  // Position and collision calculation
  React.useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.left;

    // Popover height is ~320px
    if (spaceBelow < 330 && rect.top > 330) {
      setOpenDirection("up");
    } else {
      setOpenDirection("down");
    }

    if (align === "right") {
      setComputedAlign("right");
    } else if (align === "left") {
      setComputedAlign("left");
    } else {
      // Auto: if not enough room on the right for 300px popover, align right
      if (spaceRight < 310) {
        setComputedAlign("right");
      } else {
        setComputedAlign("left");
      }
    }
  }, [isOpen, align]);

  // Close on outside click or Escape
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSetHour = (h: number) => {
    const nextVal = format12to24(h, minuteStr, period);
    onChange(nextVal);
  };

  const handleSetMinute = (m: string) => {
    const nextVal = format12to24(hour12, m, period);
    onChange(nextVal);
  };

  const handleSetPeriod = (p: "AM" | "PM") => {
    const nextVal = format12to24(hour12, minuteStr, p);
    onChange(nextVal);
  };

  const handleSelectPreset = (presetVal: string) => {
    onChange(presetVal);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold tabular-nums transition-all border outline-none cursor-pointer",
          isOpen
            ? "bg-card border-[#0B3B36] ring-2 ring-[#0B3B36]/20 shadow-xs"
            : "bg-card hover:bg-muted/30 border-border/80 hover:border-border text-foreground shadow-2xs",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock
            className={cn(
              "size-3.5 shrink-0 transition-colors",
              isOpen ? "text-[#0B3B36] dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          <span className="font-heading font-extrabold text-xs text-foreground tracking-tight truncate">
            {value ? formatted : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground/80 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-foreground",
          )}
        />
      </button>

      {/* Floating Popover Picker */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-[100] w-72 sm:w-76 rounded-2xl border border-border/80 bg-popover/98 backdrop-blur-md p-3.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in-0 zoom-in-95 duration-150",
            computedAlign === "right" ? "right-0" : "left-0",
            openDirection === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {/* Header Preview & AM/PM Toggle */}
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Time
              </span>
              <span className="font-heading font-black text-sm text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                {formatted}
              </span>
            </div>

            {/* AM / PM Segmented Pills */}
            <div className="inline-flex rounded-lg bg-muted/40 p-0.5 border border-border/50">
              <button
                type="button"
                onClick={() => handleSetPeriod("AM")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer",
                  period === "AM"
                    ? "bg-[#0B3B36] text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleSetPeriod("PM")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer",
                  period === "PM"
                    ? "bg-[#0B3B36] text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Hours & Minutes Dual Selector */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Hours Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block text-center">
                Hour
              </span>
              <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto p-1 rounded-xl bg-muted/20 border border-border/40">
                {HOURS_12.map((h) => {
                  const isSelected = hour12 === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSetHour(h)}
                      className={cn(
                        "h-7 rounded-lg text-xs font-bold transition-all tabular-nums flex items-center justify-center cursor-pointer",
                        isSelected
                          ? "bg-[#0B3B36] text-white font-black shadow-2xs scale-105"
                          : "text-foreground hover:bg-card hover:shadow-2xs",
                      )}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block text-center">
                Minute
              </span>
              <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto p-1 rounded-xl bg-muted/20 border border-border/40">
                {MINUTES.map((m) => {
                  const isSelected = minuteStr === m;
                  const isMajor = ["00", "15", "30", "45"].includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSetMinute(m)}
                      className={cn(
                        "h-7 rounded-lg text-xs font-bold transition-all tabular-nums flex items-center justify-center cursor-pointer",
                        isSelected
                          ? "bg-[#0B3B36] text-white font-black shadow-2xs scale-105"
                          : isMajor
                            ? "text-foreground font-extrabold hover:bg-card hover:shadow-2xs"
                            : "text-muted-foreground hover:bg-card hover:text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="border-t border-border/50 pt-2.5">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider block mb-1.5">
              Quick Select
            </span>
            <div className="flex flex-wrap gap-1">
              {COMMON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer",
                    value === preset.value
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700"
                      : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Done Bar */}
          <div className="mt-3 pt-2 border-t border-border/50 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0B3B36] text-white hover:bg-[#075e5a] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check className="size-3" /> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
