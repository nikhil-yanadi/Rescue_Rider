import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/rescue-reviews/[id] - Approve or reject a rescue review
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { status, admin_notes } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
    }

    // Get the rescue review
    const { data: review, error: reviewError } = await supabase
      .from("rescue_reviews")
      .select("*")
      .eq("id", params.id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.review_status !== "pending") {
      return NextResponse.json({ error: "Review already processed" }, { status: 400 });
    }

    // Update the review
    const { error: updateError } = await supabase
      .from("rescue_reviews")
      .update({
        review_status: status,
        admin_notes: admin_notes || null,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) throw updateError;

    // If approved, award hero points
    if (status === "approved") {
      // Get the emergency to calculate time taken
      const { data: emergency } = await supabase
        .from("emergencies")
        .select("created_at")
        .eq("id", review.emergency_id)
        .single();

      const { data: assignment } = await supabase
        .from("emergency_assignments")
        .select("accepted_at")
        .eq("emergency_id", review.emergency_id)
        .eq("rider_id", review.rider_id)
        .single();

      let points = 50; // Base points for completed rescue

      // Bonus for fast response (if we have the data)
      if (emergency && assignment?.accepted_at) {
        const timeTaken = Math.floor(
          (new Date(assignment.accepted_at).getTime() - new Date(emergency.created_at).getTime()) / 1000
        );
        if (timeTaken < 180) {
          points += 25; // Bonus for < 3 min response
        }
      }

      // Check for 5-star review
      const { data: feedback } = await supabase
        .from("reviews")
        .select("rating")
        .eq("emergency_id", review.emergency_id)
        .eq("rider_id", review.rider_id)
        .single();

      if (feedback && feedback.rating === 5) {
        points += 25; // Bonus for 5-star review
      }

      // Insert hero points
      await supabase.from("hero_points").insert({
        rider_id: review.rider_id,
        points,
        reason: `Rescue approved by admin${feedback && feedback.rating === 5 ? " + 5-star bonus" : ""}`,
        emergency_id: review.emergency_id,
      });

      // Update rider stats
      const { data: rider } = await supabase
        .from("riders")
        .select("hero_points, rescue_streak")
        .eq("id", review.rider_id)
        .single();

      if (rider) {
        await supabase
          .from("riders")
          .update({
            hero_points: rider.hero_points + points,
            rescue_streak: rider.rescue_streak + 1,
          })
          .eq("id", review.rider_id);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Review update error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// GET /api/rescue-reviews/[id] - Get a specific rescue review
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data: review, error } = await supabase
    .from("rescue_reviews")
    .select("*, emergencies(*), riders(*)")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review });
}
