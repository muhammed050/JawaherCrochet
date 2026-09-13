import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { configured, serverDb } from "@/lib/supabase";
import { demoProducts, defaultSettings } from "@/lib/demo";
import { AuthForm } from "@/components/auth-form";
import { AdminDashboard } from "@/components/admin-dashboard";
export const metadata = {
  title: "Store admin",
  robots: { index: false, follow: false },
};
export default async function Admin({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (!configured())
    return (
      <AdminDashboard
        locale={locale}
        products={demoProducts}
        orders={[]}
        reviews={[]}
        settings={defaultSettings}
        demo
      />
    );
  const db = await serverDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return (
      <section className="section">
        <AuthForm locale={locale} enabled />
      </section>
    );
  const { data: admin } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin)
    return (
      <section className="section empty-state">
        <h1>
          {locale === "tr"
            ? "Bu sayfa yalnızca mağaza yöneticisine açıktır."
            : "هذه الصفحة متاحة لمدير المتجر فقط."}
        </h1>
      </section>
    );
  const results = await Promise.all([
    db.from("products").select("*").order("created_at", { ascending: false }),
    db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    db.from("store_settings").select("*").eq("id", 1).single(),
  ]);
  for (const r of results) if (r.error) throw r.error;
  return (
    <AdminDashboard
      locale={locale}
      products={results[0].data ?? []}
      orders={results[1].data ?? []}
      reviews={results[2].data ?? []}
      settings={results[3].data}
      demo={false}
    />
  );
}
