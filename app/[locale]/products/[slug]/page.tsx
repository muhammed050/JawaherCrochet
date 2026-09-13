import { notFound } from "next/navigation";
import { getProduct, getReviews } from "@/lib/catalog";
import { configured } from "@/lib/supabase";
import { isLocale } from "@/lib/i18n";
import { ProductDetail } from "@/components/product-detail";
import { alternates, jsonLd, origin } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p || !isLocale(locale)) return {};
  return {
    title: p[`name_${locale}`],
    description: p[`description_${locale}`].slice(0, 160),
    alternates: alternates(locale, `/products/${slug}`),
    openGraph: {
      title: p[`name_${locale}`],
      description: p[`description_${locale}`].slice(0, 160),
      images: p.images.slice(0, 1),
    },
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = await getProduct(slug);
  if (!p) notFound();
  const reviews = await getReviews(p.id);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p[`name_${locale}`],
    description: p[`description_${locale}`],
    image: p.images.map((i) => new URL(i, origin()).href),
    sku: p.id,
    brand: { "@type": "Brand", name: "Jawaher Crochet" },
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: (p.price / 100).toFixed(2),
      availability: `https://schema.org/${p.stock > 0 ? "InStock" : "OutOfStock"}`,
      url: `${origin()}/${locale}/products/${slug}`,
    },
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue:
              reviews.reduce((s, r) => s + r.rating, 0) / reviews.length,
            reviewCount: reviews.length,
          },
        }
      : {}),
  };
  return (
    <section className="section detail-page">
      <ProductDetail
        product={p}
        reviews={reviews}
        locale={locale}
        demo={!configured()}
      />
      {configured() && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { name: "Jawaher Crochet", item: `${origin()}/${locale}` },
              {
                name: locale === "tr" ? "Koleksiyon" : "المجموعة",
                item: `${origin()}/${locale}/shop`,
              },
              {
                name: p[`name_${locale}`],
                item: `${origin()}/${locale}/products/${slug}`,
              },
            ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
          }),
        }}
      />
    </section>
  );
}
