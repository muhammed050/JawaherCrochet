"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { LockKeyhole, ShoppingBag } from "lucide-react";
import type { Product, Locale, StoreSettings, Order } from "@/lib/types";
import { messages, money } from "@/lib/i18n";
import { useCart } from "./store-provider";
export type CheckoutSession = {
  orderId: string;
  sessionId: string;
  planId: string;
  total: number;
  shipping: number;
  items: Order["items"];
  address: Record<string, string>;
  environment: "production" | "sandbox";
  status?: string;
  created_at?: string;
};
export function Checkout({
  locale,
  products,
  settings,
  email,
  enabled,
  initial,
}: {
  locale: Locale;
  products: Product[];
  settings: StoreSettings;
  email: string;
  enabled: boolean;
  initial: CheckoutSession | null;
}) {
  const t = messages[locale];
  const cart = useCart();
  const [session, setSession] = useState(initial);
  const [status, setStatus] = useState(initial?.status || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  useEffect(() => setKey(crypto.randomUUID()), []);
  const rows = cart.items.map((i) => ({
    ...i,
    product: products.find((p) => p.id === i.id),
  }));
  const subtotal = rows.reduce(
    (s, r) => s + (r.product?.price || 0) * r.quantity,
    0,
  );
  const shipping =
    settings.free_shipping_threshold > 0 &&
    subtotal >= settings.free_shipping_threshold
      ? 0
      : settings.shipping_fee;
  const invalid = rows.some(
    (r) =>
      !r.product ||
      r.product.stock < r.quantity ||
      !r.product.colors.includes(r.color),
  );
  const paid = ["paid", "processing", "shipped", "delivered"].includes(status);
  async function refresh() {
    if (!session) return;
    try {
      const r = await fetch(`/api/orders/${session.orderId}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const o = await r.json();
        setStatus(o.status);
        if (["paid", "processing", "shipped", "delivered"].includes(o.status))
          cart.clear();
      }
    } catch {
      setMessage(t.error);
    }
  }
  useEffect(() => {
    if (!session || paid) return;
    let count = 0;
    const timer = setInterval(() => {
      if (++count > 30) {
        clearInterval(timer);
        return;
      }
      void refresh();
    }, 4000);
    return () => clearInterval(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.orderId, paid]);
  async function start(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const f = new FormData(e.currentTarget);
    const address = Object.fromEntries(
      [
        "name",
        "phone",
        "country",
        "city",
        "district",
        "street",
        "postal",
        "notes",
      ].map((k) => [k, String(f.get(k) || "")]),
    );
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          locale,
          items: cart.items,
          address: { ...address, email },
          consent: f.get("consent") === "on",
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMessage(
          data.error === "INSUFFICIENT_STOCK"
            ? t.outOfStock
            : data.error === "STORE_NOT_CONFIGURED"
              ? t.demo
              : data.error === "CHECKOUT_EXPIRED"
                ? locale === "tr"
                  ? "Ödeme süresi doldu. Tekrar deneyin."
                  : "انتهت مهلة الدفع، حاولي مجددًا."
                : t.error,
        );
        if (data.error === "CHECKOUT_EXPIRED") setKey(crypto.randomUUID());
        return;
      }
      setSession(data);
      setStatus("pending_payment");
      window.history.replaceState(
        null,
        "",
        `/${locale}/checkout?order=${data.orderId}`,
      );
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  if (!cart.ready) return <p className="empty-state">{t.loading}</p>;
  if (paid)
    return (
      <section className="empty-state">
        <ShoppingBag size={42} />
        <h1>{t.paid}</h1>
        <p>#{session?.orderId.slice(0, 8)}</p>
        <Link className="button" href={`/${locale}/account`}>
          {t.orders}
        </Link>
      </section>
    );
  if (!session && !rows.length)
    return (
      <section className="empty-state">
        <ShoppingBag size={42} />
        <h1>{t.emptyCart}</h1>
        <Link className="button" href={`/${locale}/shop`}>
          {t.backShop}
        </Link>
      </section>
    );
  return (
    <>
      <p className="eyebrow">
        <LockKeyhole size={14} /> {t.secure}
      </p>
      <h1>{t.checkout}</h1>
      <div className="checkout-grid">
        <div>
          {!session ? (
            <form className="panel form" onSubmit={start}>
              <h2>01 · {t.address}</h2>
              <div className="form-grid">
                {(["name", "phone", "city", "district", "postal"] as const).map(
                  (field) => (
                    <label key={field}>
                      {t[field]}
                      <input
                        name={field}
                        required
                        minLength={field === "name" ? 2 : undefined}
                        pattern={
                          field === "postal"
                            ? "[0-9]{5}"
                            : field === "phone"
                              ? "[+0-9 ()-]{8,22}"
                              : undefined
                        }
                        maxLength={200}
                        autoComplete={
                          {
                            name: "name",
                            phone: "tel",
                            city: "address-level1",
                            district: "address-level2",
                            postal: "postal-code",
                          }[field]
                        }
                      />
                    </label>
                  ),
                )}
                <label>
                  {t.country}
                  <select name="country">
                    <option value="TR">Türkiye / تركيا</option>
                  </select>
                </label>
              </div>
              <label>
                {t.email}
                <input type="email" value={email} readOnly />
              </label>
              <label>
                {t.street}
                <textarea
                  name="street"
                  required
                  minLength={10}
                  maxLength={500}
                  autoComplete="street-address"
                />
              </label>
              <label>
                {t.notes}
                <textarea name="notes" maxLength={1000} />
              </label>
              <label className="check">
                <input type="checkbox" name="consent" required />
                <span>
                  {t.consent}{" "}
                  <Link href={`/${locale}/policy`} target="_blank">
                    {t.policy}
                  </Link>
                </span>
              </label>
              <button
                className="button full"
                disabled={busy || invalid || !enabled || !key}
              >
                {busy ? t.loading : t.pay}
                <LockKeyhole size={18} />
              </button>
              {!enabled && <p className="notice">{t.demo}</p>}
              {invalid && <p role="alert">{t.outOfStock}</p>}
            </form>
          ) : (
            <div className="panel">
              <h2>02 · {t.checkout}</h2>
              <p>
                {session.address.name} · {session.address.email}
              </p>
              <p className="muted">
                {session.address.street}, {session.address.district},{" "}
                {session.address.city}
              </p>
              {status === "payment_review" ? (
                <p role="status">
                  {locale === "tr"
                    ? "Ödemeniz alındı. Mağaza siparişinizi inceliyor."
                    : "تم استلام الدفع، والمتجر يراجع طلبك."}
                </p>
              ) : (
                <WhopCheckoutEmbed
                  planId={session.planId}
                  sessionId={session.sessionId}
                  environment={session.environment}
                  locale={locale}
                  skipRedirect
                  theme="light"
                  themeOptions={{
                    accentColor: "#773f50",
                    backgroundColor: "#ffffff",
                    borderRadius: 10,
                  }}
                  prefill={{
                    email: session.address.email,
                    address: {
                      name: session.address.name,
                      country: "TR",
                      line1: session.address.street,
                      city: session.address.city,
                      state: session.address.district,
                      postalCode: session.address.postal,
                    },
                  }}
                  returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/checkout?order=${session.orderId}`}
                  onComplete={() => {
                    setMessage(t.pending);
                    void refresh();
                  }}
                  onPaymentError={() => setMessage(t.error)}
                  fallback={<p>{t.loading}</p>}
                />
              )}
              <p role="status">{t.pending}</p>
              <button className="text-link" onClick={() => void refresh()}>
                {t.refresh}
              </button>
              <p>
                <Link href={`/${locale}/account`}>{t.orders}</Link>
              </p>
            </div>
          )}
          <p role="status">{message}</p>
        </div>
        <aside className="panel order-summary">
          <h2>{t.cart}</h2>
          {session
            ? session.items.map((i, index) => (
                <div className="summary-line" key={index}>
                  <span>
                    {i[`name_${locale}`]} × {i.quantity}
                    <small>{i.color}</small>
                  </span>
                  <strong>{money(i.price * i.quantity, locale)}</strong>
                </div>
              ))
            : rows.map((r, index) => (
                <div className="cart-row" key={`${r.id}-${index}`}>
                  <Image
                    src={r.product?.images[0] || "/icon.svg"}
                    alt=""
                    width={66}
                    height={78}
                    unoptimized
                  />
                  <div>
                    <strong>{r.product?.[`name_${locale}`] || t.sold}</strong>
                    <small>{r.color}</small>
                    <div className="cart-controls">
                      <input
                        aria-label={t.quantity}
                        type="number"
                        min={1}
                        max={Math.min(r.product?.stock || 1, 10)}
                        value={r.quantity}
                        onChange={(e) =>
                          cart.update(
                            r.id,
                            r.color,
                            Math.max(1, Math.min(10, Number(e.target.value))),
                          )
                        }
                      />
                      <button onClick={() => cart.update(r.id, r.color, 0)}>
                        {t.remove}
                      </button>
                    </div>
                  </div>
                  <span>
                    {money((r.product?.price || 0) * r.quantity, locale)}
                  </span>
                </div>
              ))}
          <div className="summary-line">
            <span>{t.subtotal}</span>
            <span>
              {money(
                session ? session.total - session.shipping : subtotal,
                locale,
              )}
            </span>
          </div>
          <div className="summary-line">
            <span>{t.shipping}</span>
            <span>
              {(session?.shipping ?? shipping) === 0
                ? t.free
                : money(session?.shipping ?? shipping, locale)}
            </span>
          </div>
          <div className="summary-line summary-total">
            <strong>{t.total}</strong>
            <strong>
              {money(session?.total ?? subtotal + shipping, locale)}
            </strong>
          </div>
          <small>
            {locale === "tr"
              ? "Ödeme sağlayıcısının varsa ek ücretleri ödeme alanında gösterilir."
              : "تظهر أي رسوم إضافية لمزوّد الدفع ضمن قسم الدفع."}
          </small>
          <p className="secure-note">
            <LockKeyhole size={14} />
            {t.secure}
          </p>
        </aside>
      </div>
    </>
  );
}
