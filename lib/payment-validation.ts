import { z } from "zod";
const money = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  currency: z.string(),
});
export const paymentEventSchema = z.object({
  type: z.string(),
  account_id: z.string(),
  data: z.object({
    id: z.string(),
    status: z.string(),
    plan_id: z.string().nullable(),
    checkout_configuration_id: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    total: money.nullable(),
    presentment_total: money.nullable().optional(),
  }),
});
export function minorUnits(amount: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error("INVALID_MONEY");
  const [whole, decimal = ""] = amount.split(".");
  const n = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(n)) throw new Error("INVALID_MONEY");
  return n;
}
