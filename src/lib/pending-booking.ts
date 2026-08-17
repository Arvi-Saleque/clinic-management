"use client";

/**
 * Carries a booking selection made on the public homepage's availability
 * dialog across the sign-up/login redirect into the real booking wizard,
 * so "Continue booking" doesn't dump the patient back at step 1 after
 * they already chose a service, practitioner, date and time.
 */
const STORAGE_KEY = "clinic_pending_booking";

export interface PendingBooking {
  serviceId: string;
  practitionerId: string;
  date: string;
  slotStart: string | null;
}

export function savePendingBooking(booking: PendingBooking) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function readPendingBooking(): PendingBooking | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}

export function clearPendingBooking() {
  window.localStorage.removeItem(STORAGE_KEY);
}
