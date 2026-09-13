import { notFound } from "next/navigation";
import { isLocale, messages } from "@/lib/i18n";
import { getProducts } from "@/lib/catalog";
import { CatalogGrid } from "@/components/catalog-grid";
import { alternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "المجموعة اليدوية" : "El Yapımı Koleksiyon",
    alternates: alternates(locale, "/shop"),
  };
}
export default async function Shop({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { category } = await searchParams;
  return (
    <section className="section shop-page">
      <p className="eyebrow">JAWAHER COLLECTION</p>
      <h1>{messages[locale].shop}</h1>
      <p className="muted">{messages[locale].intro}</p>
      <CatalogGrid
        key={category}
        products={await getProducts()}
        locale={locale}
        initialCategory={
          ["bags", "homeware", "accessories"].includes(category || "")
            ? category
            : "all"
        }
      />
    </section>
  );
}
