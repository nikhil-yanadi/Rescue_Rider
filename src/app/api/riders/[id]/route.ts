import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/riders/[id] — Update rider status (admin action)
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

  // Verify admin
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { verification_status, is_available } = body;

  const updateData: Record<string, unknown> = {};
  if (verification_status) updateData.verification_status = verification_status;
  if (is_available !== undefined) updateData.is_available = is_available;

  const { data, error } = await supabase
    .from("riders")
    .update(updateData)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rider: data });
}
