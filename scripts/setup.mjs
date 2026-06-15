/**
 * Rescue Rider — Full Setup Script
 * Run: node scripts/setup.mjs
 * Reads credentials from .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteIfExists(email) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const found = data?.users?.find((u) => u.email === email);
  if (found) {
    await supabase.auth.admin.deleteUser(found.id);
    console.log(`  Deleted existing: ${email}`);
  }
}

async function createUser(email, password) {
  await deleteIfExists(email);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Create ${email} failed: ${error.message}`);
  console.log(`  Created: ${email} → ${data.user.id}`);
  return data.user;
}

async function main() {
  console.log("\n🚀 Rescue Rider Setup\n");

  try {
    // Create rider user
    console.log("Creating rider user...");
    const rider = await createUser("rider@rescuerider.com", "Rider123");

    // Create admin user  
    console.log("Creating admin user...");
    const admin = await createUser("admin@rescuerider.com", "Admin123");

    // Insert rider profile
    console.log("\nInserting rider profile...");
    const { error: riderErr } = await supabase.from("riders").upsert({
      user_id: rider.id,
      full_name: "Arjun Kumar",
      email: "rider@rescuerider.com",
      phone: "+91 98765 43210",
      delivery_company: "Zomato",
      employee_id: "ZMT-2024-7841",
      verification_status: "verified",
      is_available: true,
      hero_points: 150,
      rescue_streak: 3,
      total_rescues: 6,
    }, { onConflict: "email" });
    if (riderErr) throw new Error(`Rider profile: ${riderErr.message}`);
    console.log("  Rider profile created.");

    // Insert admin profile
    console.log("Inserting admin profile...");
    const { error: adminErr } = await supabase.from("admin_users").upsert({
      user_id: admin.id,
      email: "admin@rescuerider.com",
      full_name: "Admin User",
    }, { onConflict: "email" });
    if (adminErr) throw new Error(`Admin profile: ${adminErr.message}`);
    console.log("  Admin profile created.");

    console.log("\n✅ Setup complete!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Rider:  rider@rescuerider.com / Rider123");
    console.log("  Admin:  admin@rescuerider.com / Admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (err) {
    console.error("\n❌ Setup failed:", err.message);
    process.exit(1);
  }
}

main();
