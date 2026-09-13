import "server-only";
import { WhopClient } from "@whop/sdk";
export const whopEnvironment = () =>
  process.env.WHOP_ENVIRONMENT === "production" ? "production" : "sandbox";
export const paymentsReady = () =>
  Boolean(
    process.env.WHOP_API_KEY &&
    process.env.WHOP_ACCOUNT_ID &&
    process.env.WHOP_WEBHOOK_SECRET,
  );
export function whop() {
  if (!paymentsReady()) throw new Error("STORE_NOT_CONFIGURED");
  return new WhopClient({
    token: process.env.WHOP_API_KEY!,
    baseUrl:
      whopEnvironment() === "sandbox"
        ? "https://sandbox-api.whop.com/api/v1"
        : "https://api.whop.com/api/v1",
    headers: { "Api-Version-Date": "2026-08-14" },
  });
}
