import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Verify admin
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!adminUser) {
    redirect("/admin/login");
  }

  // Fetch all data in parallel
  const [ridersRes, emergenciesRes] = await Promise.all([
    supabase
      .from("riders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("emergencies")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AdminDashboardClient
      adminUser={adminUser}
      riders={ridersRes.data ?? []}
      emergencies={emergenciesRes.data ?? []}
    />
  );
}
