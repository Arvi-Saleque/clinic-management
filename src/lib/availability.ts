import { addDays, format, getDay } from "date-fns";
import type {
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  TimeInterval,
  UpcomingDayAvailability,
} from "@/types/availability";

export function computeUpcoming10DaysAvailability(
  rules: AvailabilityRuleRow[],
  exceptions: AvailabilityExceptionRow[],
  startDateStr: string = format(new Date(), "yyyy-MM-dd"),
): UpcomingDayAvailability[] {
  const result: UpcomingDayAvailability[] = [];
  const baseDate = new Date(`${startDateStr}T00:00:00`);

  // Build a map of recurring rules per day of week (0..6)
  const rulesPerDow = new Map<number, TimeInterval[]>();
  for (const rule of rules) {
    const list = rulesPerDow.get(rule.day_of_week) ?? [];
    list.push({
      id: rule.id,
      startTime: rule.start_time.slice(0, 5),
      endTime: rule.end_time.slice(0, 5),
    });
    rulesPerDow.set(rule.day_of_week, list);
  }

  // Build a map of exceptions per date
  const exceptionsPerDate = new Map<string, AvailabilityExceptionRow[]>();
  for (const exc of exceptions) {
    const list = exceptionsPerDate.get(exc.date) ?? [];
    list.push(exc);
    exceptionsPerDate.set(exc.date, list);
  }

  for (let i = 0; i < 10; i++) {
    const current = addDays(baseDate, i);
    const dateStr = format(current, "yyyy-MM-dd");
    const dow = getDay(current);
    const dayName = format(current, "EEEE");
    const dayShort = format(current, "EEE, d MMM");
    const isToday = i === 0;

    const recurringIntervals = rulesPerDow.get(dow) ?? [];
    const dateExceptions = exceptionsPerDate.get(dateStr) ?? [];
    const fullDayException = dateExceptions.find((e) => e.is_unavailable && !e.start_time);

    let isAvailable = recurringIntervals.length > 0 && !fullDayException;
    let statusLabel = "";
    let effectiveIntervals: TimeInterval[] = [...recurringIntervals];

    if (fullDayException) {
      isAvailable = false;
      effectiveIntervals = [];
      statusLabel = fullDayException.reason ? `Unavailable (${fullDayException.reason})` : "Marked unavailable (Leave)";
    } else if (recurringIntervals.length === 0) {
      isAvailable = false;
      statusLabel = "Not scheduled";
    } else {
      statusLabel = "Available";
    }

    result.push({
      date: dateStr,
      dayOfWeek: dow,
      dayName,
      dayShort,
      isToday,
      isAvailable,
      intervals: effectiveIntervals,
      exception: fullDayException ?? dateExceptions[0] ?? null,
      statusLabel,
    });
  }

  return result;
}
