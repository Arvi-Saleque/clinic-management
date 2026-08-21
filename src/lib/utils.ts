import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard clinic currency formatter (defaults to EUR €).
 */
export function formatCurrency(
  amount: number | string,
  currency: string = "EUR",
  locale: string = "en-IE",
): string {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
