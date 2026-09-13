import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, Flower2, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { isLocale, messages } from "@/lib/i18n";
import { getProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { alternates, jsonLd, origin } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return { alternates: alternates(locale) };
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = messages[locale];
  const products = await getProducts();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> {t.handmade}
          </p>
          <h1>
            {t.hero.split("\n").map((s, i) => (
              <span key={s} className={i ? "italic" : ""}>
                {s}
              </span>
            ))}
          </h1>
          <p className="hero-description">{t.intro}</p>
          <Link className="button" href={`/${locale}/shop`}>
            {t.explore}
            <ArrowUpRight size={20} />
          </Link>
          <div className="hero-footnote">
            <span className="thread-line" />
            {t.footer}
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-frame">
            <Image
              src="/bag-rose.svg"
              alt={
                locale === "tr"
                  ? "Gül kurusu örgü çanta illüstrasyonu"
                  : "رسم توضيحي لحقيبة كروشيه وردية"
              }
              fill
              priority
              sizes="(max-width: 700px) 95vw, 50vw"
            />
            <div className="round-seal">
              EL YAPIMI<span>♡</span>SEVGİYLE
            </div>
          </div>
          <span className="art-caption">01 / JAWAHER ATELIER</span>
          <span className="floating-note">
            {locale === "tr"
              ? "Biricik. Tıpkı sizin gibi."
              : "فريدة، تمامًا مثلك."}
          </span>
        </div>
      </section>
      <section className="benefits">
        {[
          [Heart, "crafted", "craftedText"],
          [Flower2, "details", "detailsText"],
          [Sparkles, "personal", "personalText"],
        ].map(([Icon, title, desc]) => {
          const C = Icon as typeof Heart;
          return (
            <div key={title as string}>
              <C strokeWidth={1.3} />
              <div>
                <h2>{t[title as "crafted"]}</h2>
                <p>{t[desc as "craftedText"]}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE JAWAHER EDIT</p>
            <h2>{t.featured}</h2>
          </div>
          <Link className="text-link" href={`/${locale}/shop`}>
            {t.all}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.featured)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
        </div>
      </section>
      <section className="story-section" id="story">
        <div className="story-art">
          <Image
            src="/coasters.svg"
            alt={
              locale === "tr"
                ? "Örgü dokusu illüstrasyonu"
                : "رسم لنسيج الكروشيه"
            }
            fill
            sizes="(max-width:700px) 100vw, 50vw"
          />
          <span>
            MADE SLOWLY.
            <br />
            LOVED DAILY.
          </span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">{t.storyLabel}</p>
          <h2>{t.storyTitle}</h2>
          <p>{t.storyText}</p>
          <span className="signature">Jawaher ♡</span>
        </div>
      </section>
      <section className="closing">
        <Flower2 size={34} strokeWidth={1} />
        <h2>{t.newsletter}</h2>
        <Link className="text-link" href={`/${locale}/shop`}>
          {t.explore} <ArrowUpRight size={18} />
        </Link>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Jawaher Crochet",
            url: origin(),
            logo: `${origin()}/icon.svg`,
          }),
        }}
      />
    </>
  );
}
