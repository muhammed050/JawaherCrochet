import { unwrapWebhook } from "@whop/sdk/helpers";
import { serviceDb } from "@/lib/supabase";
import { paymentEventSchema, minorUnits } from "@/lib/payment-validation";
export async function POST(request: Request) {
  if (!process.env.WHOP_WEBHOOK_SECRET)
    return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (raw.length > 262144) return new Response("Too large", { status: 413 });
  let event: Record<string, unknown>;
  try {
    event = unwrapWebhook(raw, {
      headers: Object.fromEntries(request.headers),
      key: process.env.WHOP_WEBHOOK_SECRET,
    });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }
  if (event.type !== "payment.succeeded")
    return Response.json({ received: true });
  try {
    const parsed = paymentEventSchema.parse(event);
    if (
      parsed.account_id !== process.env.WHOP_ACCOUNT_ID ||
      parsed.data.status !== "paid"
    )
      throw new Error("PAYMENT_MISMATCH");
    const p = parsed.data;
    const orderId = p.metadata?.order_id;
    if (typeof orderId !== "string") return Response.json({ ignored: true });
    const db = serviceDb();
    const { data: o, error } = await db
      .from("orders")
      .select("id,checkout_id")
      .eq("id", orderId)
      .single();
    if (error || !o || p.checkout_configuration_id !== o.checkout_id)
      throw new Error("ORDER_MISMATCH");
    const amount = p.presentment_total ?? p.total;
    if (!amount) throw new Error("MISSING_AMOUNT");
    const { error: rpcError } = await db.rpc("confirm_store_payment", {
      p_event: request.headers.get("webhook-id")!,
      p_order: o.id,
      p_payment: p.id,
      p_amount: minorUnits(amount.amount),
      p_currency: amount.currency,
      p_plan: p.plan_id,
    });
    if (rpcError) throw rpcError;
    return Response.json({ received: true });
  } catch {
    return new Response("Payment verification requires retry or review", {
      status: 500,
    });
  }
}
