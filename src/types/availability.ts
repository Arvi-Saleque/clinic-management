export interface TimeInterval {
  id?: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface DayAvailability {
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  enabled: boolean;
  intervals: TimeInterval[];
}

export interface AvailabilityRuleRow {
  id: string;
  practitioner_id: string;
  branch_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  effective_from: string;
  effective_to: string | null;
}

export interface AvailabilityExceptionRow {
  id: string;
  practitioner_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_unavailable: boolean;
  reason: string | null;
}

export interface UpcomingDayAvailability {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number;
  dayName: string;
  dayShort: string;
  isToday: boolean;
  isAvailable: boolean;
  intervals: TimeInterval[];
  exception: AvailabilityExceptionRow | null;
  statusLabel: string;
}

export interface SlotResult {
  slot_start: string;
  slot_end: string;
}
