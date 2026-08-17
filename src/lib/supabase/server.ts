import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client bound to the request's cookies (publishable
 * key, RLS-enforced as the signed-in user). Use in Server Components,
 * Server Actions, and Route Handlers — never in Client Components.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no writable response —
            // safe to ignore as long as middleware.ts also refreshes the
            // session on every request.
          }
        },
      },
    },
  );
}
