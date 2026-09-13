import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale, Product } from "@/lib/types";
import { money, messages } from "@/lib/i18n";
export function ProductCard({
  product: p,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  return (
    <article className="product-card">
      <Link href={`/${locale}/products/${p.slug}`} className="product-image">
        <Image
          src={p.images[0] || "/icon.svg"}
          alt={p[`name_${locale}`]}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
          unoptimized={!p.images[0]?.startsWith("/")}
        />
        {p.stock === 0 && (
          <span className="product-badge">{messages[locale].sold}</span>
        )}
        <span className="product-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <p className="product-category">
        {messages[locale][p.category as "bags"] || p.category}
      </p>
      <Link className="product-name" href={`/${locale}/products/${p.slug}`}>
        {p[`name_${locale}`]}
      </Link>
      <p className="product-price">{money(p.price, locale)}</p>
    </article>
  );
}
