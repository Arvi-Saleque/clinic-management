-- db advisors flagged btree_gist as installed in `public` (security hygiene:
-- extensions shouldn't live in an exposed schema). Move it to the
-- `extensions` schema that Supabase projects already provision for this.
alter extension btree_gist set schema extensions;
