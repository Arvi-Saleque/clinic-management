import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Standard UK clinic currency formatter. */
export function formatCurrency(
  amount: number | string,
  currency: string = "GBP",
  locale: string = "en-GB",
): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export const CLINIC_TIME_ZONE = "Europe/London";

type ClinicDateInput = Date | string | number;

function clinicDate(value: ClinicDateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function formatClinicTime(value: ClinicDateInput): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(clinicDate(value));
}

export function formatClinicDate(
  value: ClinicDateInput,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    ...options,
  }).format(clinicDate(value));
}

export function formatClinicDateTime(value: ClinicDateInput): string {
  return `${formatClinicDate(value)}, ${formatClinicTime(value)}`;
}

export function formatClinicDateKey(value: ClinicDateInput): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(clinicDate(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function clinicOffsetMilliseconds(value: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return representedAsUtc - value.getTime();
}

function clinicMidnightUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localMidnightAsUtc = Date.UTC(year, month - 1, day);
  const firstGuess = new Date(localMidnightAsUtc);
  const corrected = new Date(localMidnightAsUtc - clinicOffsetMilliseconds(firstGuess));
  return new Date(localMidnightAsUtc - clinicOffsetMilliseconds(corrected));
}

export function getClinicDayBounds(reference: ClinicDateInput = new Date()) {
  const dateKey = formatClinicDateKey(reference);
  const [year, month, day] = dateKey.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDateKey = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDate.getUTCDate()).padStart(2, "0")}`;
  return {
    dateKey,
    start: clinicMidnightUtc(dateKey),
    end: clinicMidnightUtc(nextDateKey),
  };
}

export function getClinicHour(value: ClinicDateInput = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: CLINIC_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(clinicDate(value)),
  );
}
