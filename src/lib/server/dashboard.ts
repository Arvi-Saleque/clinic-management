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
    const { data: practitioner } = await supabase
      .from("practitioners")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    practitionerId = practitioner?.id ?? null;
  }

  let todayQuery = supabase
    .from("appointments")
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      notes,
      originating_encounter_id,
      patients:patient_id(
        id,
        first_name,
        last_name,
        phone,
        dob,
        created_at
      ),
      services:service_id(
        id,
        name,
        duration_minutes,
        price
      ),
      practitioners:practitioner_id(
        profiles:profile_id(full_name)
      ),
      branches:branch_id(
        name
      )
    `)
    .gte("starts_at", todayStart.toISOString())
    .lt("starts_at", tomorrowStart.toISOString())
    .order("starts_at", { ascending: true });

  let weekQuery = supabase
    .from("appointments")
    .select("starts_at, status")
    .gte("starts_at", rangeStart.toISOString())
    .lt("starts_at", rangeEnd.toISOString());

  if (practitionerId) {
    todayQuery = todayQuery.eq("practitioner_id", practitionerId);
    weekQuery = weekQuery.eq("practitioner_id", practitionerId);
  }

  const [
    { data: todayAppointments },
    { data: rangeAppointments },
    { count: totalPatients },
    { data: outstanding },
    { count: newPatients },
  ] = await Promise.all([
    todayQuery,
    weekQuery,
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase
      .from("invoices")
      .select("total, status")
      .in("status", ["issued", "partially_paid"]),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", subDays(todayStart, 30).toISOString()),
  ]);

  const schedule = todayAppointments ?? [];
  const completed = schedule.filter((a) => a.status === "completed");
  const inProgress = schedule.filter((a) => a.status === "checked_in");
  const upcoming = schedule.filter((a) => ["confirmed", "pending"].includes(a.status));
  const cancelledNoShow = schedule.filter((a) => ["cancelled", "no_show"].includes(a.status));

  // Determine next appointment for hero banner
  const now = new Date();
  const nextAppointment =
    inProgress[0] ??
    upcoming.find((a) => new Date(a.starts_at) >= now) ??
    upcoming[0] ??
    schedule[0] ??
    null;

  // Upcoming appointments list (excluding already completed, cancelled, and the current hero next appointment)
  const upcomingAppointmentsList = schedule.filter(
    (a) =>
      a.status !== "completed" &&
      a.status !== "cancelled" &&
      (!nextAppointment || a.id !== nextAppointment.id),
  );

  const outstandingAmount = (outstanding ?? []).reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0,
  );

  const sevenDays = eachDayOfInterval({ start: rangeStart, end: todayStart });
  const activity = sevenDays.map((day) => ({
    label: format(day, "EEE"),
    date: format(day, "yyyy-MM-dd"),
    count: (rangeAppointments ?? []).filter(
      (a) =>
        format(new Date(a.starts_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd") &&
        a.status !== "cancelled",
    ).length,
  }));

  const upcomingSevenDays = (rangeAppointments ?? []).filter((appointment) => {
    const date = new Date(appointment.starts_at);
    return date >= tomorrowStart && date < rangeEnd && appointment.status !== "cancelled";
  }).length;

  return {
    todaysAppointments: schedule.length,
    todaysSchedule: schedule,
    nextAppointment,
    upcomingAppointmentsList,
    completedAppointmentsList: completed,
    completedCount: completed.length,
    inProgressCount: inProgress.length,
    upcomingCount: upcoming.length,
    cancelledNoShowCount: cancelledNoShow.length,
    totalPatients: totalPatients ?? 0,
    newPatientsThisMonth: newPatients ?? 0,
    outstandingInvoiceCount: outstanding?.length ?? 0,
    outstandingAmount,
    upcomingSevenDays,
    activity,
    practitionerScoped: profile?.role === "dentist",
  };
}
