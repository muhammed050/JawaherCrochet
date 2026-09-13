import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { unwrapWebhook } from "@whop/sdk/helpers";
import { checkoutSchema, calculateTotal } from "../lib/validation";
import { minorUnits } from "../lib/payment-validation";
test("money stays exact in minor units", () => {
  assert.equal(minorUnits("890.50"), 89050);
  assert.equal(minorUnits("0.01"), 1);
  assert.throws(() => minorUnits("2.999"));
  assert.throws(() => minorUnits("-10"));
});
test("shipping threshold uses the server subtotal", () => {
  assert.deepEqual(
    calculateTotal([{ price: 89000, quantity: 2 }], 9000, 150000),
    { subtotal: 178000, shipping: 0, total: 178000 },
  );
  assert.equal(
    calculateTotal([{ price: 32000, quantity: 1 }], 9000, 150000).total,
    41000,
  );
});
test("checkout rejects empty carts and forged negative quantities", () => {
  assert.equal(checkoutSchema.safeParse({ items: [] }).success, false);
  assert.equal(
    checkoutSchema.safeParse({ items: [{ quantity: -1 }] }).success,
    false,
  );
});
test("Whop verification rejects unsigned, tampered and expired webhooks", () => {
  const key = "ws_test_signing_key_for_local_tests";
  const body = JSON.stringify({ type: "payment.succeeded" });
  const stamp = String(Math.floor(Date.now() / 1000));
  const id = "msg_test"; // SDK treats ws_ secrets as raw bytes.
  const signature = createHmac("sha256", key)
    .update(`${id}.${stamp}.${body}`)
    .digest("base64");
  const headers = {
    "webhook-id": id,
    "webhook-timestamp": stamp,
    "webhook-signature": `v1,${signature}`,
  };
  assert.equal(unwrapWebhook(body, { headers, key }).type, "payment.succeeded");
  assert.throws(() => unwrapWebhook(body + " ", { headers, key }));
  assert.throws(() => unwrapWebhook(body, { headers: {}, key }));
  const old = "1";
  headers["webhook-timestamp"] = old;
  headers["webhook-signature"] =
    "v1," +
    createHmac("sha256", key).update(`${id}.${old}.${body}`).digest("base64");
  assert.throws(() => unwrapWebhook(body, { headers, key }));
});
