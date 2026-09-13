"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check, Star } from "lucide-react";
import type { Product, Locale, Review } from "@/lib/types";
import { messages, money } from "@/lib/i18n";
import { useCart } from "./store-provider";
export function ProductDetail({
  product: p,
  locale,
  reviews,
  demo,
}: {
  product: Product;
  locale: Locale;
  reviews: Review[];
  demo: boolean;
}) {
  const t = messages[locale];
  const { add } = useCart();
  const [image, setImage] = useState(p.images[0]);
  const [color, setColor] = useState(p.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const data = new FormData(f);
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: p.id,
          display_name: data.get("display_name"),
          rating: Number(data.get("rating")),
          body: data.get("body"),
        }),
      });
      setMessage(
        res.ok
          ? t.reviewSent
          : res.status === 401
            ? t.continueAccount
            : res.status === 403
              ? t.reviewNote
              : t.error,
      );
      if (res.ok) f.reset();
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="breadcrumbs">
        <Link href={`/${locale}`}>{t.home}</Link> /{" "}
        <Link href={`/${locale}/shop`}>{t.shop}</Link> / {p[`name_${locale}`]}
      </div>
      <div className="detail-grid">
        <div>
          <div className="detail-image">
            <Image
              src={image || "/icon.svg"}
              alt={p[`name_${locale}`]}
              fill
              priority
              sizes="(max-width:700px) 100vw, 50vw"
              unoptimized={!image?.startsWith("/")}
            />
          </div>
          {p.images.length > 1 && (
            <div className="thumbnails">
              {p.images.map((src, i) => (
                <button
                  aria-label={`${p[`name_${locale}`]} ${i + 1}`}
                  className={src === image ? "active" : ""}
                  key={src}
                  onClick={() => setImage(src)}
                >
                  <Image src={src} alt="" width={80} height={90} unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{t.handmade}</p>
          <h1>{p[`name_${locale}`]}</h1>
          {reviews.length > 0 && (
            <a className="review-count" href="#reviews">
              ★{" "}
              {(
                reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              ).toFixed(1)}{" "}
              · {reviews.length} {t.reviews}
            </a>
          )}
          <p className="detail-price">{money(p.price, locale)}</p>
          <p>{p[`description_${locale}`]}</p>
          <label>
            {t.color}
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              {p.colors.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            {t.quantity}
            <input
              type="number"
              min={1}
              max={Math.min(p.stock, 10) || 1}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(10, p.stock, Number(e.target.value))),
                )
              }
            />
          </label>
          <button
            className="button full"
            disabled={demo || p.stock < 1}
            onClick={() => {
              add({ id: p.id, quantity, color });
              setAdded(true);
            }}
          >
            {added ? <Check size={20} /> : <ShoppingBag size={20} />}{" "}
            {p.stock === 0 ? t.sold : added ? t.added : t.add}
          </button>
          {added && (
            <Link className="text-link" href={`/${locale}/checkout`}>
              {t.continue} →
            </Link>
          )}
          <details open>
            <summary>{t.description}</summary>
            <p>{p[`description_${locale}`]}</p>
          </details>
          <details>
            <summary>{t.care}</summary>
            <p>{t.careText}</p>
          </details>
          <details>
            <summary>{t.shipping}</summary>
            <Link href={`/${locale}/policy`}>{t.policy}</Link>
          </details>
        </div>
      </div>
      <section className="reviews-section" id="reviews">
        <h2>{t.reviews}</h2>
        <div className="two-columns">
          <div>
            {reviews.length ? (
              reviews.map((r) => (
                <article className="review" key={r.id}>
                  <div className="stars" aria-label={`${r.rating}/5`}>
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p>{r.body}</p>
                  <strong>{r.display_name}</strong>
                  <small>
                    {t.verified} ·{" "}
                    {new Date(r.created_at).toLocaleDateString(
                      locale === "ar" ? "ar" : "tr",
                    )}
                  </small>
                </article>
              ))
            ) : (
              <p className="muted">{t.noReviews}</p>
            )}
          </div>
          <form className="panel form" onSubmit={submitReview}>
            <h3>{t.reviewButton}</h3>
            <p className="muted">{t.reviewNote}</p>
            <label>
              {t.name}
              <input
                name="display_name"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label>
              {t.reviews}
              <select name="rating">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.description}
              <textarea name="body" minLength={10} maxLength={2000} required />
            </label>
            <button className="button" disabled={busy || demo}>
              {busy ? t.loading : t.reviewButton}
            </button>
            <p role="status">{message}</p>
          </form>
        </div>
      </section>
    </>
  );
}
