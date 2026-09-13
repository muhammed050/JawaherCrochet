import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { configured, serverDb } from "@/lib/supabase";
import { getProducts, getSettings } from "@/lib/catalog";
import { paymentsReady, whopEnvironment } from "@/lib/whop";
import { AuthForm } from "@/components/auth-form";
import { Checkout, type CheckoutSession } from "@/components/checkout";
export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const db = configured() ? await serverDb() : null;
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (configured() && !user)
    return (
      <section className="section">
        <AuthForm locale={locale} enabled />
      </section>
    );
  let initial: CheckoutSession | null = null;
  const { order } = await searchParams;
  if (order && db && user) {
    const { data } = await db
      .from("orders")
      .select("*")
      .eq("id", order)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data && data.plan_id && data.checkout_id)
      initial = {
        orderId: data.id,
        sessionId: data.checkout_id,
        planId: data.plan_id,
        total: data.total,
        shipping: data.shipping,
        items: data.items,
        address: data.address,
        status: data.status,
        created_at: data.created_at,
        environment: whopEnvironment(),
      };
  }
  return (
    <section className="section">
      <Checkout
        locale={locale}
        products={await getProducts()}
        settings={await getSettings()}
        email={user?.email || ""}
        enabled={configured() && paymentsReady()}
        initial={initial}
      />
    </section>
  );
}
