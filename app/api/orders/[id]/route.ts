import { requireUser } from "@/lib/supabase";
import { failure } from "@/lib/http";
import { z } from "zod";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, db } = await requireUser();
    const id = z.uuid().parse((await params).id);
    const { data, error } = await db
      .from("orders")
      .select("id,status,total,shipping,items,checkout_id,plan_id,created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !data)
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}
