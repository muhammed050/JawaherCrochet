import { z } from "zod";
import { requireAdmin, serviceDb } from "@/lib/supabase";
import { sameOrigin, failure } from "@/lib/http";
import { productSchema } from "@/lib/validation";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { db } = await requireAdmin();
    const body = await request.json();
    if (body.action === "product") {
      const input = productSchema.parse(body.data);
      const { error } = await db.from("products").upsert(input);
      if (error) throw error;
    } else if (body.action === "review") {
      const input = z
        .object({ id: z.uuid(), approved: z.boolean() })
        .parse(body.data);
      const { error } = await db
        .from("reviews")
        .update({ approved: input.approved })
        .eq("id", input.id);
      if (error) throw error;
    } else if (body.action === "order") {
      const input = z
        .object({
          id: z.uuid(),
          status: z.enum(["processing", "shipped", "delivered"]),
          tracking_number: z.string().trim().max(150),
        })
        .parse(body.data);
      if (input.status === "shipped" && !input.tracking_number)
        return Response.json({ error: "TRACKING_REQUIRED" }, { status: 400 });
      const allowed = {
        processing: ["paid", "processing"],
        shipped: ["processing", "shipped"],
        delivered: ["shipped", "delivered"],
      }[input.status];
      const { data, error } = await serviceDb()
        .from("orders")
        .update({
          status: input.status,
          tracking_number: input.tracking_number || null,
        })
        .eq("id", input.id)
        .in("status", allowed)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return Response.json({ error: "INVALID_TRANSITION" }, { status: 409 });
    } else if (body.action === "settings") {
      const input = z
        .object({
          store_name: z.string().min(2).max(100),
          shipping_fee: z.number().int().min(0).max(100000),
          free_shipping_threshold: z.number().int().min(0).max(10000000),
          contact_email: z.union([z.email(), z.literal("")]),
          instagram_url: z.union([
            z.url().refine((v) => new URL(v).protocol === "https:"),
            z.literal(""),
          ]),
        })
        .parse(body.data);
      const { error } = await db
        .from("store_settings")
        .update(input)
        .eq("id", 1);
      if (error) throw error;
    } else return Response.json({ error: "INVALID_ACTION" }, { status: 400 });
    return Response.json({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
