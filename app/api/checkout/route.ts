import { requireUser, serviceDb } from "@/lib/supabase";
import { checkoutSchema } from "@/lib/validation";
import { sameOrigin, failure } from "@/lib/http";
import { whop, paymentsReady, whopEnvironment } from "@/lib/whop";
import { origin } from "@/lib/seo";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!paymentsReady()) throw new Error("STORE_NOT_CONFIGURED");
    const { user } = await requireUser();
    if (!user.email_confirmed_at) throw new Error("UNAUTHORIZED");
    const input = checkoutSchema.parse(await request.json());
    const db = serviceDb();
    const { data: order, error } = await db.rpc("create_store_order", {
      p_user: user.id,
      p_key: input.key,
      p_items: input.items,
      p_address: { ...input.address, email: user.email },
    });
    if (error) {
      const stock = error.message.includes("INSUFFICIENT_STOCK");
      return Response.json(
        {
          error: stock
            ? "INSUFFICIENT_STOCK"
            : error.message.includes("RATE_LIMIT")
              ? "RATE_LIMIT"
              : "INVALID_CART",
        },
        { status: stock ? 409 : 400 },
      );
    }
    if (order.status !== "pending_payment")
      return Response.json(
        { error: "ORDER_ALREADY_PROCESSED" },
        { status: 409 },
      );
    if (Date.now() - Date.parse(order.created_at) > 30 * 60 * 1000)
      return Response.json({ error: "CHECKOUT_EXPIRED" }, { status: 409 });
    let sessionId = order.checkout_id,
      planId = order.plan_id;
    if (!sessionId) {
      const config = await whop().checkoutConfigurations.create(
        {
          account_id: process.env.WHOP_ACCOUNT_ID!,
          plan: {
            currency: "try",
            initial_price: order.total / 100,
            plan_type: "one_time",
            title: `Jawaher Crochet · ${order.id.slice(0, 8)}`,
            visibility: "hidden",
            stock: 1,
            unlimited_stock: false,
            force_create_new_plan: true,
          },
          metadata: { order_id: order.id },
          redirect_url: `${origin()}/${input.locale}/checkout?order=${order.id}`,
        },
        { idempotencyKey: order.id },
      );
      sessionId = config.id;
      planId = config.plan?.id;
      if (!planId) throw new Error("MISSING_PLAN");
      const { error: saveError } = await db
        .from("orders")
        .update({ checkout_id: sessionId, plan_id: planId })
        .eq("id", order.id);
      if (saveError) throw saveError;
    }
    return Response.json(
      {
        orderId: order.id,
        sessionId,
        planId,
        total: order.total,
        shipping: order.shipping,
        items: order.items,
        address: order.address,
        environment: whopEnvironment(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
