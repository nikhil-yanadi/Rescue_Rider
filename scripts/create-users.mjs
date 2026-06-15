import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pazwupppiearzmjofvay.supabase.co";
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error("Usage: node scripts/create-users.mjs <service-role-key>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUser(email, password, role) {
  // Delete existing user first
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  if (found) {
    await supabase.auth.admin.deleteUser(found.id);
    console.log(`Deleted existing user: ${email}`);
  }

  // Create fresh user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error(`Failed to create ${email}:`, error.message);
    return null;
  }

  console.log(`Created ${role}: ${email} (${data.user.id})`);
  return data.user;
}

async function main() {
  console.log("Creating users via Supabase Admin API...\n");

  const rider = await createUser("rider@rescuerider.com", "Rider123", "rider");
  const admin = await createUser("admin@rescuerider.com", "Admin123", "admin");

  if (rider) {
    const { error } = await supabase
      .from("riders")
      .update({ user_id: rider.id })
      .eq("email", "rider@rescuerider.com");
    if (error) console.error("Rider profile link error:", error.message);
    else console.log("Rider profile linked.");
  }

  if (admin) {
    // Upsert admin_users
    const { error } = await supabase
      .from("admin_users")
      .upsert({ user_id: admin.id, email: "admin@rescuerider.com", full_name: "Admin User" }, { onConflict: "email" });
    if (error) console.error("Admin profile link error:", error.message);
    else console.log("Admin profile linked.");
  }

  console.log("\nDone! Login credentials:");
  console.log("Rider:  rider@rescuerider.com / Rider123");
  console.log("Admin:  admin@rescuerider.com / Admin123");
}

main();
