import { requireUser } from "@/lib/supabase";
import { sameOrigin, failure } from "@/lib/http";
import { reviewSchema } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db, user } = await requireUser();
    const input = reviewSchema.parse(await request.json());
    const { error } = await db
      .from("reviews")
      .insert({ ...input, user_id: user.id, approved: false });
    if (error)
      return Response.json(
        { error: "PURCHASE_REQUIRED_OR_ALREADY_REVIEWED" },
        { status: 403 },
      );
    return Response.json({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
