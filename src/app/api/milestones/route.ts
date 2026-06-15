import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/milestones — Store rider location milestone during mission
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { assignment_id, rider_id, latitude, longitude } = body;

    if (!assignment_id || !rider_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the rider owns this assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("emergency_assignments")
      .select("*")
      .eq("id", assignment_id)
      .eq("rider_id", rider_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: "Assignment not found or unauthorized" }, { status: 404 });
    }

    // Insert milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from("rider_milestones")
      .insert({
        assignment_id,
        rider_id,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (milestoneError) throw milestoneError;

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error("Milestone tracking error:", error);
    return NextResponse.json({ error: "Failed to store milestone" }, { status: 500 });
  }
}

// GET /api/milestones?assignment_id=xxx — Get milestones for an assignment
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const assignment_id = searchParams.get("assignment_id");

  if (!assignment_id) {
    return NextResponse.json({ error: "Missing assignment_id" }, { status: 400 });
  }

  const { data: milestones, error } = await supabase
    .from("rider_milestones")
    .select("*")
    .eq("assignment_id", assignment_id)
    .order("timestamp", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ milestones });
}
