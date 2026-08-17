import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Current authenticated user (verified against Supabase Auth servers, not just the cookie). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Current user's `profiles` row (role, org, name) — null if signed out or profile missing. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}
