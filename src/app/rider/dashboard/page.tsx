import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RiderDashboardClient from "./RiderDashboardClient";

export default async function RiderDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/rider/login");
  }

  const { data: rider } = await supabase
    .from("riders")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!rider) {
    redirect("/rider/register");
  }

  // Fetch mission history
  const { data: assignments } = await supabase
    .from("emergency_assignments")
    .select("*, emergencies(*)")
    .eq("rider_id", rider.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <RiderDashboardClient rider={rider} assignments={assignments ?? []} />;
}
