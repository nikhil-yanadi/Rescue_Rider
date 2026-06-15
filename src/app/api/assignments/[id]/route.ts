import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/assignments/[id] — Accept, reject, or update an emergency assignment
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the rider record for this user
  const { data: rider } = await supabase
    .from("riders")
    .select("id, verification_status")
    .eq("user_id", user.id)
    .single();

  if (!rider) {
    return NextResponse.json({ error: "Rider not found" }, { status: 404 });
  }

  if (rider.verification_status !== "verified") {
    return NextResponse.json({ error: "Rider not verified" }, { status: 403 });
  }

  // Get the assignment
  const { data: assignment } = await supabase
    .from("emergency_assignments")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Verify the rider owns this assignment
  if (assignment.rider_id !== rider.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status, emergency_id } = body;

  if (status === "accepted") {
    // Check if already accepted by another rider
    const { data: existing } = await supabase
      .from("emergency_assignments")
      .select("id")
      .eq("emergency_id", emergency_id || assignment.emergency_id)
      .eq("status", "accepted")
      .neq("id", params.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Mission already accepted by another rider" },
        { status: 409 }
      );
    }

    // Accept this assignment
    const { data, error } = await supabase
      .from("emergency_assignments")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update emergency status and assign rider
    await supabase
      .from("emergencies")
      .update({ status: "assigned", assigned_rider_id: rider.id })
      .eq("id", emergency_id || assignment.emergency_id);

    return NextResponse.json({ assignment: data, message: "Mission accepted" });
  }

  if (status === "rejected") {
    const { data, error } = await supabase
      .from("emergency_assignments")
      .update({ status: "rejected" })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ assignment: data, message: "Mission rejected" });
  }

  if (status === "completed") {
    const { data, error } = await supabase
      .from("emergency_assignments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update emergency status
    await supabase
      .from("emergencies")
      .update({ status: "completed" })
      .eq("id", assignment.emergency_id);

    return NextResponse.json({ assignment: data, message: "Mission completed" });
  }

  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}

// GET /api/assignments/[id] — Get a specific assignment
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: assignment, error } = await supabase
    .from("emergency_assignments")
    .select("*, emergencies(*)")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assignment });
}
