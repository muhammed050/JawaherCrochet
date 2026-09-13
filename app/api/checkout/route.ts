import { requireUser, serviceDb } from "@/lib/supabase";
import { checkoutSchema } from "@/lib/validation";
import { sameOrigin, failure } from "@/lib/http";
import { whop, paymentsReady, whopEnvironment } from "@/lib/whop";
import { origin } from "@/lib/seo";
// Emit only bounded classifications, never provider bodies, headers or customer data.
function logCheckoutFailure(stage: string, error: unknown) {
  const value = error && typeof error === "object"
    ? error as { statusCode?: unknown; message?: unknown; body?: unknown }
    : {};
  let details = typeof value.message === "string" ? value.message : "";
  try { details += JSON.stringify(value.body ?? {}); } catch { /* diagnostic only */ }
  const hints = [
    ["currency", /currency|\btry\b/i],
    ["account", /account|company|biz_/i],
    ["authentication", /unauthorized|api.?key|invalid.?token|authentication/i],
    ["permission", /permission|scope|forbidden/i],
    ["plan", /plan|product/i],
    ["network", /fetch failed|timeout|ECONN|ENOTFOUND/i],
  ] as const;
  console.error("checkout_failure", JSON.stringify({
    stage,
    environment: whopEnvironment(),
    upstreamStatus: typeof value.statusCode === "number" ? value.statusCode : null,
    hints: hints.filter(([, pattern]) => pattern.test(details)).map(([hint]) => hint),
  }));
}
export async function POST(request: Request) {
  let stage = "configuration";
  try {
    sameOrigin(request);
    if (!paymentsReady()) throw new Error("STORE_NOT_CONFIGURED");
    stage = "authentication";
    const { user } = await requireUser();
    if (!user.email_confirmed_at) throw new Error("UNAUTHORIZED");
    stage = "validation";
    const input = checkoutSchema.parse(await request.json());
    stage = "database_client";
    const db = serviceDb();
    stage = "order_creation";
    const { data: order, error } = await db.rpc("create_store_order", {
      p_user: user.id,
      p_key: input.key,
      p_items: input.items,
      p_address: { ...input.address, email: user.email },
    });
    if (error) {
      logCheckoutFailure(stage, error);
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
      stage = "whop_checkout_configuration";
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
      stage = "whop_response";
      sessionId = config.id;
      planId = config.plan?.id;
      if (!planId) throw new Error("MISSING_PLAN");
      stage = "checkout_persistence";
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
    logCheckoutFailure(stage, error);
    return failure(error);
  }
}
