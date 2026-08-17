import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Secret-key client — bypasses RLS entirely. Server-only (the
 * `server-only` import throws a build error if this is ever pulled into a
 * Client Component bundle). Use sparingly: seed scripts, Edge
 * Functions, and specific trusted server-side operations that
 * intentionally need to cross the normal RLS boundary — never for
 * regular request handling, which should go through
 * `lib/supabase/server.ts` so RLS stays the enforcement layer.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
