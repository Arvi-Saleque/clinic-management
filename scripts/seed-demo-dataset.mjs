import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local if present
const env = { ...process.env };
if (fs.existsSync(".env.local")) {
  const envFile = fs.readFileSync(".env.local", "utf8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
  });
}

const adminClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || "",
  env.SUPABASE_SECRET_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("=== CLINIC CARE DEMO DATASET SEEDER ===");
  const { count } = await adminClient.from("patients").select("*", { count: "exact", head: true });
  console.log(`Current patient count: ${count}`);
}

main().catch(console.error);
