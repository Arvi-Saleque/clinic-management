"use server";

import { createClient } from "@/lib/supabase/server";

/** All of these read from public-catalogue RLS policies (services_public_read,
 * practitioners_public_read, branches_public_read, opening_hours_public_read) --
 * safe to call from anon (signed-out) visitors. */

export interface PublicServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category_id?: string | null;
  category?: string;
}

export async function listPublicServices(): Promise<PublicServiceItem[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("services")
    .select("id, name, slug, description, duration_minutes, price, category_id, service_categories(name)")
    .eq("show_on_website", true)
    .eq("is_active", true)
    .order("name");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((s: any): PublicServiceItem => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    duration_minutes: s.duration_minutes,
    price: s.price,
    category_id: s.category_id,
    category: s.service_categories?.name || "General Dentistry",
  }));
}

export async function getPublicServiceBySlug(slug: string): Promise<PublicServiceItem | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("services")
    .select("id, name, slug, description, duration_minutes, price, category_id, service_categories(name)")
    .eq("slug", slug)
    .eq("show_on_website", true)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = data as any;
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    duration_minutes: s.duration_minutes,
    price: s.price,
    category_id: s.category_id,
    category: s.service_categories?.name || "General Dentistry",
  };
}

const HIDDEN_PRACTITIONER_NAMES = ["rafi ahmed", "nadia islam"];

function isHiddenPractitioner(fullName?: string | null): boolean {
  if (!fullName) return false;
  const lower = fullName.toLowerCase();
  return HIDDEN_PRACTITIONER_NAMES.some((hidden) => lower.includes(hidden));
}

export async function listPublicPractitioners() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("id, title, bio, specialties, photo_url, profiles:profile_id(full_name)")
    .eq("is_bookable", true)
    .order("id");

  return (data ?? []).filter((p) => {
    const fullName = (p.profiles as { full_name?: string } | null)?.full_name;
    return !isHiddenPractitioner(fullName);
  });
}

export async function getPublicPractitionerById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("id, title, bio, specialties, photo_url, profiles:profile_id(full_name)")
    .eq("id", id)
    .eq("is_bookable", true)
    .maybeSingle();

  if (!data) return null;
  const fullName = (data.profiles as { full_name?: string } | null)?.full_name;
  if (isHiddenPractitioner(fullName)) return null;
  return data;
}

export async function getClinicInfo() {
  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, address, phone, email, timezone")
    .eq("is_primary", true)
    .maybeSingle();

  const { data: hours } = await supabase
    .from("opening_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .order("day_of_week");

  return { branch, hours: hours ?? [] };
}
