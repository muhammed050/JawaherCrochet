import { notFound } from "next/navigation";
import { configured, serverDb } from "@/lib/supabase";
import { isLocale, messages, money } from "@/lib/i18n";
import { AuthForm, Logout } from "@/components/auth-form";
import type { Order } from "@/lib/types";
import Link from "next/link";
export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};
export default async function Account({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = messages[locale];
  const db = configured() ? await serverDb() : null;
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!db || !user)
    return (
      <section className="section">
        <AuthForm locale={locale} enabled={configured()} />
      </section>
    );
  const { data, error } = await db
    .from("orders")
    .select(
      "id,user_id,status,total,shipping,currency,address,items,created_at,tracking_number,payment_id",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (
    <section className="section account-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.welcome}</p>
          <h1>{t.orders}</h1>
          <p>{user.email}</p>
        </div>
        <Logout locale={locale} />
      </div>
      {data?.length ? (
        (data as Order[]).map((o) => (
          <article className="panel order-card" key={o.id}>
            <div className="section-heading">
              <div>
                <strong>#{o.id.slice(0, 8)}</strong>
                <p>{new Date(o.created_at).toLocaleDateString(locale)}</p>
              </div>
              <span className="badge">{t[o.status as "paid"] || o.status}</span>
            </div>
            {o.items.map((i, index) => (
              <p key={index}>
                {i[`name_${locale}`]} × {i.quantity} · {i.color}
              </p>
            ))}
            <strong>{money(o.total, locale)}</strong>
            {o.tracking_number && (
              <p>
                {t.tracking}: <b dir="ltr">{o.tracking_number}</b>
              </p>
            )}
            {o.status === "pending_payment" && (
              <Link
                className="text-link"
                href={`/${locale}/checkout?order=${o.id}`}
              >
                {t.continue}
              </Link>
            )}
          </article>
        ))
      ) : (
        <div className="empty-state">
          <p>{t.noOrders}</p>
          <Link className="button" href={`/${locale}/shop`}>
            {t.explore}
          </Link>
        </div>
      )}
    </section>
  );
}
