import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Heart,
  Flower2,
  Sparkles,
  MoveUpRight,
} from "lucide-react";
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
  const ar = locale === "ar";
  const products = await getProducts();
  const featured = products.filter((p) => p.featured);
  const selection = (featured.length ? featured : products).slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />{" "}
            {ar
              ? "صُنعت على مهل، لتبقى معك"
              : "YAVAŞÇA ÜRETİLDİ. SEVGİYLE TASARLANDI."}
          </p>
          <h1>
            {ar ? (
              <>
                تفاصيل صغيرة.
                <br />
                <em>فرحة كبيرة.</em>
              </>
            ) : (
              <>
                Küçük detaylar.
                <br />
                <em>Kocaman mutluluk.</em>
              </>
            )}
          </h1>
          <p className="hero-description">
            {ar
              ? "خيوط ناعمة، ألوان تحبّينها، وقطع يدوية تحمل لمسة مختلفة. اكتشفي عالم جواهر كروشيه."
              : "Yumuşacık ipler, sevdiğiniz renkler ve size eşlik edecek el yapımı parçalar. Jawaher’in renkli dünyasına hoş geldiniz."}
          </p>
          <div className="hero-buttons">
            <Link className="button" href={`/${locale}/shop`}>
              {t.explore}
              <ArrowUpRight size={19} />
            </Link>
            <Link className="text-link" href={`/${locale}#story`}>
              {t.story}
            </Link>
          </div>
          <div className="hero-footnote">
            <Flower2 size={26} />
            <span>
              {ar
                ? "كل غرزة تحمل شيئًا من القلب."
                : "Her ilmekte biraz kalp var."}
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-frame">
            <Image
              src="/images/jawaher-hero.webp"
              alt={
                ar
                  ? "تنسيق إلهامي لحقيبة كروشيه وردية وخيوط قطنية"
                  : "Pembe örgü çanta ve pamuk iplerle ilham veren bir kompozisyon"
              }
              fill
              preload
              sizes="(max-width: 800px) 94vw, 55vw"
            />
          </div>
          <div className="round-seal">
            <Flower2 size={28} />
            <strong>{ar ? "بكل حب" : "EL YAPIMI"}</strong>
            <small>JAWAHER</small>
          </div>
          <div className="hero-label">
            <span className="label-dot" />
            <span>
              {ar ? "لمسة ناعمة ليومك" : "Gününüze yumuşacık bir dokunuş"}
            </span>
            <Heart size={17} />
          </div>
        </div>
      </section>
      <div className="brand-ribbon" aria-hidden="true">
        <span>HANDMADE WITH LOVE</span>
        <Flower2 />
        <span>
          {ar ? "أشياء جميلة، صُنعت على مهل" : "GÜZEL ŞEYLER ZAMAN ALIR"}
        </span>
        <Flower2 />
        <span>JAWAHER CROCHET</span>
      </div>
      <section className="section collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {ar ? "اختاري عالمك" : "KENDİ DÜNYANIZI KEŞFEDİN"}
            </p>
            <h2>
              {ar ? "لإطلالتك. لبيتك. لكِ." : "Stilinize. Evinize. Size."}
            </h2>
          </div>
          <span className="collection-note">
            {ar ? "تفاصيل تستحق أن تحبّيها" : "Sevmeye değer küçük detaylar"}
          </span>
        </div>
        <div className="collection-grid">
          {(
            [
              [
                "bags",
                "/images/jawaher-hero.webp",
                ar ? "رفيقة كل يوم" : "Her güne eşlik eder",
              ],
              [
                "homeware",
                "/images/jawaher-atelier.webp",
                ar ? "دفء في كل زاوية" : "Her köşeye biraz sıcaklık",
              ],
              [
                "accessories",
                "/images/jawaher-atelier.webp",
                ar ? "اللمسة التي تُكمل" : "Günü güzelleştiren dokunuş",
              ],
            ] as const
          ).map(([category, image, subtitle], i) => (
            <Link
              key={category}
              href={`/${locale}/shop?category=${category}`}
              className={`collection-card collection-${i}`}
            >
              <div className="collection-image">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 88vw, 30vw"
                />
              </div>
              <div className="collection-card-copy">
                <div>
                  <small>{subtitle}</small>
                  <h3>{t[category]}</h3>
                </div>
                <span>
                  <MoveUpRight size={22} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {ar ? "من مجموعة جواهر" : "JAWAHER SEÇKİSİ"}
            </p>
            <h2>{t.featured}</h2>
          </div>
          <Link className="text-link" href={`/${locale}/shop`}>
            {t.all}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {selection.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
        {!selection.length && (
          <div className="empty-state">
            <Flower2 />
            <p>
              {ar
                ? "نحضّر قطعًا جميلة لمجموعتنا. عودي قريبًا لاكتشافها."
                : "Koleksiyonumuz için güzel parçalar hazırlıyoruz. Yakında yeniden bekleriz."}
            </p>
          </div>
        )}
      </section>
      <section className="story-section" id="story">
        <div className="story-art">
          <Image
            src="/images/jawaher-atelier.webp"
            alt={
              ar
                ? "خيوط وأدوات كروشيه على طاولة عمل بإضاءة دافئة"
                : "Sıcak ışıkta örgü ipleri ve tığlarla bir çalışma masası"
            }
            fill
            sizes="(max-width: 600px) 94vw, 48vw"
          />
          <span>THE ART OF SLOW MAKING</span>
        </div>
        <div className="story-copy">
          <Flower2 className="story-flower" size={46} strokeWidth={1} />
          <p className="eyebrow">{t.storyLabel}</p>
          <h2>
            {ar
              ? "مو مجرّد قطعة.\nحكاية من خيط."
              : "Sadece bir parça değil.\nİlmek ilmek bir hikâye."}
          </h2>
          <p>{t.storyText}</p>
          <Link className="button secondary" href={`/${locale}/shop`}>
            {t.explore}
            <ArrowUpRight size={18} />
          </Link>
          <span className="signature">with love, Jawaher</span>
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
              <C strokeWidth={1.5} />
              <div>
                <h2>{t[title as "crafted"]}</h2>
                <p>{t[desc as "craftedText"]}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section className="closing">
        <span className="eyebrow">A LITTLE JOY, EVERY DAY</span>
        <h2>
          {ar ? "قطعتك المفضّلة تنتظرك." : "Yeni favoriniz sizi bekliyor."}
        </h2>
        <Link className="button" href={`/${locale}/shop`}>
          {t.explore}
          <ArrowUpRight size={19} />
        </Link>
        <Flower2 className="closing-flower" size={130} strokeWidth={0.7} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${origin()}/#organization`,
            name: "Jawaher Crochet",
            alternateName: "جواهر كروشيه",
            url: origin(),
            logo: {
              "@type": "ImageObject",
              url: `${origin()}/brand/logo-512.png`,
              width: 512,
              height: 512,
            },
            image: `${origin()}/brand/social-cover.jpg`,
          }),
        }}
      />
    </>
  );
}
