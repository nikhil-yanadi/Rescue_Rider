import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/emergencies — Create a new emergency and notify nearby riders
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { emergency_id, latitude, longitude, threat_description, victim_contact } = body;

    if (!emergency_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert emergency
    const { data: emergency, error: emergencyError } = await supabase
      .from("emergencies")
      .insert({
        emergency_id,
        latitude,
        longitude,
        threat_description: threat_description || null,
        victim_contact: victim_contact || null,
        status: "pending",
      })
      .select()
      .single();

    if (emergencyError) throw emergencyError;

    // Find nearby verified & available riders
    // Simple approach: fetch all verified+available riders and notify them all
    // (In production you'd use PostGIS ST_DWithin for geospatial filtering)
    const { data: nearbyRiders } = await supabase
      .from("riders")
      .select("id")
      .eq("verification_status", "verified")
      .eq("is_available", true);

    if (nearbyRiders && nearbyRiders.length > 0) {
      // Create assignment records for each nearby rider
      const assignments = nearbyRiders.map((rider) => ({
        emergency_id: emergency.id,
        rider_id: rider.id,
        status: "notified" as const,
        notified_at: new Date().toISOString(),
      }));

      await supabase.from("emergency_assignments").insert(assignments);

      // Create notifications
      const notifications = nearbyRiders.map((rider) => ({
        rider_id: rider.id,
        emergency_id: emergency.id,
        type: "new_emergency" as const,
        message: `Emergency nearby: ${threat_description || "Help needed"}`,
        is_read: false,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({ emergency, notified_riders: nearbyRiders?.length ?? 0 });
  } catch (error) {
    console.error("Emergency creation error:", error);
    return NextResponse.json({ error: "Failed to create emergency" }, { status: 500 });
  }
}

// GET /api/emergencies — Fetch emergencies (admin)
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: emergencies, error } = await supabase
    .from("emergencies")
    .select("*, emergency_assignments(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emergencies });
}
