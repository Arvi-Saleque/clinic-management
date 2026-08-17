"use server";

import { addDays, eachDayOfInterval, format, startOfDay, subDays } from "date-fns";

import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const profile = await getProfile();
  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const rangeStart = subDays(todayStart, 6);
  const rangeEnd = addDays(todayStart, 7);

  let practitionerId: string | null = null;
  if (profile?.role === "dentist") {
    const { data: practitioner } = await supabase.from("practitioners").select("id").eq("profile_id", profile.id).maybeSingle();
    practitionerId = practitioner?.id ?? null;
  }

  let todayQuery = supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, notes, patients:patient_id(id, first_name, last_name, phone), services:service_id(name, duration_minutes), practitioners:practitioner_id(profiles:profile_id(full_name))")
    .gte("starts_at", todayStart.toISOString())
    .lt("starts_at", tomorrowStart.toISOString())
    .not("status", "eq", "cancelled")
    .order("starts_at");

  let weekQuery = supabase
    .from("appointments")
    .select("starts_at, status")
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString())
    .not("status", "eq", "cancelled");

  if (practitionerId) {
    todayQuery = todayQuery.eq("practitioner_id", practitionerId);
    weekQuery = weekQuery.eq("practitioner_id", practitionerId);
  }

  const [{ data: todayAppointments }, { data: rangeAppointments }, { count: totalPatients }, { data: outstanding }, { count: newPatients }] = await Promise.all([
    todayQuery,
    weekQuery,
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("total, status").in("status", ["issued", "partially_paid"]),
    supabase.from("patients").select("id", { count: "exact", head: true }).gte("created_at", subDays(todayStart, 30).toISOString()),
  ]);

  const schedule = todayAppointments ?? [];
  const completed = schedule.filter((appointment) => appointment.status === "completed").length;
  const checkedIn = schedule.filter((appointment) => appointment.status === "checked_in").length;
  const outstandingAmount = (outstanding ?? []).reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const sevenDays = eachDayOfInterval({ start: rangeStart, end: todayStart });
  const activity = sevenDays.map((day) => ({
    label: format(day, "EEE"),
    date: format(day, "yyyy-MM-dd"),
    count: (rangeAppointments ?? []).filter((appointment) => format(new Date(appointment.starts_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length,
  }));
  const upcomingSevenDays = (rangeAppointments ?? []).filter((appointment) => {
    const date = new Date(appointment.starts_at);
    return date >= tomorrowStart && date < rangeEnd;
  }).length;

  return {
    todaysAppointments: schedule.length,
    todaysSchedule: schedule,
    completedAppointments: completed,
    checkedInPatients: checkedIn,
    totalPatients: totalPatients ?? 0,
    newPatientsThisMonth: newPatients ?? 0,
    outstandingInvoiceCount: outstanding?.length ?? 0,
    outstandingAmount,
    upcomingSevenDays,
    activity,
    practitionerScoped: profile?.role === "dentist",
  };
}
