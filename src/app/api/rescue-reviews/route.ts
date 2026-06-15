import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rescue-reviews - Get all rescue reviews (admin only)
export async function GET(request: Request) {
  const supabase = await createClient();

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("rescue_reviews")
    .select("*, emergencies(*), riders(*)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("review_status", status);
  }

  const { data: reviews, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews });
}
