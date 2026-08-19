import { addDays, format, getDay, isBefore, parseISO, startOfDay } from "date-fns";
import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  CalendarDayAvailability,
  DayScheduleSource,
  TimeInterval,
  UpcomingDayAvailability,
} from "@/types/availability";

/**
 * Subtracts an unavailable block [bStart, bEnd] from a single working interval [wStart, wEnd].
 * Handles splitting, trimming, and full occlusion.
 */
export function subtractSingleInterval(
  w: TimeInterval,
  b: { startTime: string; endTime: string },
): TimeInterval[] {
  if (b.endTime <= w.startTime || b.startTime >= w.endTime) {
    // No overlap
    return [w];
  }
  if (b.startTime <= w.startTime && b.endTime >= w.endTime) {
    // Block completely covers working interval
    return [];
  }

  const result: TimeInterval[] = [];
  if (b.startTime > w.startTime) {
    result.push({
      startTime: w.startTime,
      endTime: b.startTime,
    });
  }
  if (b.endTime < w.endTime) {
    result.push({
      startTime: b.endTime,
      endTime: w.endTime,
    });
  }
  return result;
}

/**
 * Sequentially subtracts a list of partial unavailable blocks from working intervals.
 */
export function subtractTimeIntervals(
  working: TimeInterval[],
  blocks: { startTime: string; endTime: string }[],
): TimeInterval[] {
  let current = [...working];
  for (const block of blocks) {
    const next: TimeInterval[] = [];
    for (const w of current) {
      next.push(...subtractSingleInterval(w, block));
    }
    current = next;
  }
  return current.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Pure effective-day schedule resolver following the authoritative 4-tier hierarchy:
 * 1. Full-Day Leave Exception (highest precedence)
 * 2. Positive Custom Date Overrides (replaces recurring template)
 * 3. Recurring Weekly Rules (fallback when no positive date override exists)
 * 4. Partial Unavailable Blocks (subtracted from whichever working source was chosen)
 */
export function resolveEffectiveDayAvailability(
  dateStr: string,
  rules: AvailabilityRuleRow[],
  exceptions: AvailabilityExceptionRow[],
): {
  isAvailable: boolean;
  source: DayScheduleSource;
  intervals: TimeInterval[];
  leaveReason?: string | null;
  statusLabel: string;
  exceptions: AvailabilityExceptionRow[];
} {
  const dateExceptions = exceptions.filter((e) => e.date === dateStr);
  const fullDayLeave = dateExceptions.find((e) => e.is_unavailable && !e.start_time);

  // Level 1: Full-Day Leave
  if (fullDayLeave) {
    return {
      isAvailable: false,
      source: "full_day_leave",
      intervals: [],
      leaveReason: fullDayLeave.reason ?? null,
      statusLabel: fullDayLeave.reason ? `Leave: ${fullDayLeave.reason}` : "Marked unavailable (Leave)",
      exceptions: dateExceptions,
    };
  }

  // Level 2: Positive Custom Date Overrides (is_unavailable = false)
  const positiveOverrides = dateExceptions.filter(
    (e) => !e.is_unavailable && e.start_time && e.end_time,
  );

  let baseIntervals: TimeInterval[] = [];
  let source: DayScheduleSource = "recurring_default";

  if (positiveOverrides.length > 0) {
    source = "date_override";
    baseIntervals = positiveOverrides.map((e) => ({
      id: e.id,
      startTime: e.start_time!.slice(0, 5),
      endTime: e.end_time!.slice(0, 5),
    }));
  } else {
    // Level 3: Recurring Weekly Rules Fallback
    const dayDate = parseISO(dateStr);
    const dow = getDay(dayDate);
    const matchingRules = rules
      .filter((r) => {
        if (r.day_of_week !== dow) return false;
        if (r.effective_from && r.effective_from > dateStr) return false;
        if (r.effective_to && r.effective_to < dateStr) return false;
        return true;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (matchingRules.length > 0) {
      source = "recurring_default";
      baseIntervals = matchingRules.map((r) => ({
        id: r.id,
        startTime: r.start_time.slice(0, 5),
        endTime: r.end_time.slice(0, 5),
      }));
    } else {
      source = "not_scheduled";
      baseIntervals = [];
    }
  }

  if (baseIntervals.length === 0) {
    return {
      isAvailable: false,
      source,
      intervals: [],
      statusLabel: "Not scheduled",
      exceptions: dateExceptions,
    };
  }

  // Level 4: Partial Unavailable Blocks Subtraction
  const partialBlocks = dateExceptions
    .filter((e) => e.is_unavailable && e.start_time && e.end_time)
    .map((e) => ({
      startTime: e.start_time!.slice(0, 5),
      endTime: e.end_time!.slice(0, 5),
    }));

  const effectiveIntervals = subtractTimeIntervals(baseIntervals, partialBlocks);
  const isAvailable = effectiveIntervals.length > 0;

  let statusLabel = "Available";
  if (!isAvailable) {
    statusLabel = "Unavailable (Blocked)";
  } else if (source === "date_override") {
    statusLabel = "Custom Schedule";
  }

  return {
    isAvailable,
    source,
    intervals: effectiveIntervals,
    statusLabel,
    exceptions: dateExceptions,
  };
}

/**
 * Computes calendar matrix days for a given target month (Monday..Sunday layout).
 */
export function computeMonthCalendarDays(
  targetDate: Date,
  rules: AvailabilityRuleRow[],
  exceptions: AvailabilityExceptionRow[],
  appointmentCounts: Record<string, number> = {},
): {
  date: string;
  dayNumber: number;
  dayDate: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isAvailable: boolean;
  source: DayScheduleSource;
  statusType: "available" | "adjusted" | "leave" | "off";
  intervals: TimeInterval[];
  leaveReason?: string | null;
  statusLabel: string;
  activeAppointmentCount: number;
}[] {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Week starts on Monday (1)
  const startDay = getDay(firstOfMonth);
  const daysBefore = startDay === 0 ? 6 : startDay - 1;
  const startDate = addDays(firstOfMonth, -daysBefore);

  const endDay = getDay(lastOfMonth);
  const daysAfter = endDay === 0 ? 0 : 7 - endDay;
  const endDate = addDays(lastOfMonth, daysAfter);

  const result = [];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayStart = startOfDay(new Date());

  let current = startDate;
  while (current <= endDate || result.length % 7 !== 0 || result.length < 35) {
    const dateStr = format(current, "yyyy-MM-dd");
    const isCurrentMonth = current.getMonth() === month;
    const isToday = dateStr === todayStr;
    const isPast = isBefore(startOfDay(current), todayStart);

    const effective = resolveEffectiveDayAvailability(dateStr, rules, exceptions);
    const activeAppointmentCount = appointmentCounts[dateStr] ?? 0;

    let statusType: "available" | "adjusted" | "leave" | "off" = "off";
    if (effective.source === "full_day_leave") {
      statusType = "leave";
    } else if (effective.source === "date_override") {
      statusType = "adjusted";
    } else if (effective.isAvailable && effective.intervals.length > 0) {
      statusType = "available";
    } else {
      statusType = "off";
    }

    result.push({
      date: dateStr,
      dayNumber: current.getDate(),
      dayDate: current,
      isCurrentMonth,
      isToday,
      isPast,
      isAvailable: effective.isAvailable,
      source: effective.source,
      statusType,
      intervals: effective.intervals,
      leaveReason: effective.leaveReason,
      statusLabel: effective.statusLabel,
      activeAppointmentCount,
    });

    current = addDays(current, 1);
    if (result.length >= 42) break; // max 6 weeks
  }

  return result;
}

/**
 * Computes rolling 30 days of effective schedule for backwards compatibility.
 */
export function computeUpcoming30DaysAvailability(
  rules: AvailabilityRuleRow[],
  exceptions: AvailabilityExceptionRow[],
  appointmentCounts: Record<string, number> = {},
  startDateStr: string = format(new Date(), "yyyy-MM-dd"),
): CalendarDayAvailability[] {
  const result: CalendarDayAvailability[] = [];
  const baseDate = parseISO(startDateStr);
  const todayStart = startOfDay(new Date());

  for (let i = 0; i < 30; i++) {
    const current = addDays(baseDate, i);
    const dateStr = format(current, "yyyy-MM-dd");
    const dow = getDay(current);
    const dayName = format(current, "EEEE");
    const dayShort = format(current, "EEE, d MMM");
    const dayNumber = current.getDate();
    const isToday = i === 0 || format(todayStart, "yyyy-MM-dd") === dateStr;
    const isPast = isBefore(startOfDay(current), todayStart);

    const effective = resolveEffectiveDayAvailability(dateStr, rules, exceptions);
    const activeAppointmentCount = appointmentCounts[dateStr] ?? 0;

    result.push({
      date: dateStr,
      dayOfWeek: dow,
      dayName,
      dayShort,
      dayNumber,
      isToday,
      isPast,
      isAvailable: effective.isAvailable,
      source: effective.source,
      intervals: effective.intervals,
      leaveReason: effective.leaveReason,
      exceptions: effective.exceptions,
      activeAppointmentCount,
      statusLabel: effective.statusLabel,
    });
  }

  return result;
}

/**
 * Legacy 10-day helper preserved for backwards compatibility.
 */
export function computeUpcoming10DaysAvailability(
  rules: AvailabilityRuleRow[],
  exceptions: AvailabilityExceptionRow[],
  startDateStr: string = format(new Date(), "yyyy-MM-dd"),
): UpcomingDayAvailability[] {
  const thirtyDays = computeUpcoming30DaysAvailability(rules, exceptions, {}, startDateStr);
  return thirtyDays.slice(0, 10).map((day) => ({
    date: day.date,
    dayOfWeek: day.dayOfWeek,
    dayName: day.dayName,
    dayShort: day.dayShort,
    isToday: day.isToday,
    isAvailable: day.isAvailable,
    intervals: day.intervals,
    exception: day.exceptions[0] ?? null,
    statusLabel: day.statusLabel,
  }));
}
