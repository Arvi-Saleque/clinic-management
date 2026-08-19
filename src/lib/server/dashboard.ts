"use server";

import { addDays, eachDayOfInterval, format, startOfDay, subDays } from "date-fns";

import { getProfile } from "@/lib/auth/session";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export interface ReceptionistDashboardAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    dob: string | null;
  } | null;
  services: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  } | null;
  practitioners: {
    id: string;
    title: string | null;
    profiles: { full_name: string } | null;
  } | null;
  branches: {
    id: string;
    name: string;
  } | null;
}

export interface ReceptionistDashboardContext {
  profile: {
    id: string;
    full_name: string;
    role: string;
    organization_id: string | null;
  };
  todayDateFormatted: string;
  greeting: string;
  practitioners: Array<{
    id: string;
    title: string | null;
    branch_id: string;
    profiles: { full_name: string } | null;
  }>;
  services: Array<{
    id: string;
    name: string;
    duration_minutes: number;
  }>;
  activePractitionerId?: string;
  nextAppointment: ReceptionistDashboardAppointment | null;
  waitingAppointments: ReceptionistDashboardAppointment[];
  upcomingAppointments: ReceptionistDashboardAppointment[];
  completedAppointments: ReceptionistDashboardAppointment[];
  counts: {
    waiting: number;
    upcoming: number;
    completed: number;
  };
}

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
  if (profile?.organization_id) {
    todayQuery = todayQuery.eq("organization_id", profile.organization_id);
    weekQuery = weekQuery.eq("organization_id", profile.organization_id);
  }

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

/**
 * Dedicated Receptionist front-desk dashboard context.
 * Queries ONLY operational queue data (no clinical encounters/notes/odontogram).
 */
export async function getReceptionistDashboardContext(
  practitionerFilterId?: string,
): Promise<ReceptionistDashboardContext> {
  const profile = await requireStaff();
  const supabase = await createClient();

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  // Dynamic greeting based on current local hour
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Good afternoon"
        : "Good evening";

  // 1. Fetch permitted active practitioners
  const { data: practitionersData } = await supabase
    .from("practitioners")
    .select("id, title, branch_id, is_bookable, profiles:profile_id(full_name)")
    .eq("is_bookable", true)
    .order("id");
  const practitioners = (practitionersData ?? []) as Array<{
    id: string;
    title: string | null;
    branch_id: string;
    profiles: { full_name: string } | null;
  }>;

  // 2. Fetch services for booking
  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, duration_minutes")
    .order("name");
  const services = (servicesData ?? []) as Array<{
    id: string;
    name: string;
    duration_minutes: number;
  }>;

  // 3. Query today's operational queue across permitted branch/org
  let query = supabase
    .from("appointments")
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      notes,
      patients:patient_id(
        id,
        first_name,
        last_name,
        phone,
        dob
      ),
      services:service_id(
        id,
        name,
        duration_minutes,
        price
      ),
      practitioners:practitioner_id(
        id,
        title,
        profiles:profile_id(full_name)
      ),
      branches:branch_id(
        id,
        name
      )
    `)
    .gte("starts_at", todayStart.toISOString())
    .lt("starts_at", tomorrowStart.toISOString())
    .order("starts_at", { ascending: true });

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  }

  if (practitionerFilterId) {
    query = query.eq("practitioner_id", practitionerFilterId);
  }

  const { data: appointmentsData } = await query;
  const rawSchedule = (appointmentsData ?? []) as unknown as ReceptionistDashboardAppointment[];

  // Classify queues
  const rawWaiting = rawSchedule.filter((a) => a.status === "checked_in");
  const upcomingConfirmed = rawSchedule.filter((a) =>
    ["confirmed", "booked", "pending"].includes(a.status),
  );
  const completedAppointments = rawSchedule.filter((a) => a.status === "completed");

  // Determine Next Patient Hero:
  // 1. Arrived/waiting patient requiring immediate attention, OR
  // 2. Earliest future upcoming confirmed appointment
  const nextAppointment =
    rawWaiting[0] ??
    upcomingConfirmed.find((a) => new Date(a.starts_at) >= now) ??
    upcomingConfirmed[0] ??
    null;

  // De-duplication rule:
  // The Next Patient hero appointment must NOT appear in Waiting Now OR in Today's Upcoming!
  const waitingAppointments = rawWaiting.filter(
    (a) => !nextAppointment || a.id !== nextAppointment.id,
  );
  const upcomingAppointments = upcomingConfirmed.filter(
    (a) => !nextAppointment || a.id !== nextAppointment.id,
  );

  return {
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role,
      organization_id: profile.organization_id,
    },
    todayDateFormatted: format(now, "EEEE, d MMMM yyyy"),
    greeting,
    practitioners,
    services,
    activePractitionerId: practitionerFilterId,
    nextAppointment,
    waitingAppointments,
    upcomingAppointments,
    completedAppointments,
    counts: {
      waiting: rawWaiting.length,
      upcoming: upcomingConfirmed.length,
      completed: completedAppointments.length,
    },
  };
}
