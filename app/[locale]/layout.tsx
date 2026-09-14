import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { isLocale, messages } from "@/lib/i18n";
import { configured } from "@/lib/supabase";
import { getSettings } from "@/lib/catalog";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StoreProvider } from "@/components/store-provider";
export const viewport: Viewport = { themeColor: "#51243c" };
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    title: {
      default:
        locale === "tr"
          ? "Jawaher Crochet | El Yapımı Örgü Çanta ve Aksesuar"
          : "جواهر كروشيه | حقائب وإكسسوارات يدوية",
      template: "%s | Jawaher Crochet",
    },
    description: messages[locale].intro,
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      ],
      apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    twitter: {
      card: "summary_large_image",
      images: ["/brand/social-cover.jpg"],
    },
    robots: configured()
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      siteName: "Jawaher Crochet",
      locale: locale === "tr" ? "tr_TR" : "ar_AR",
      type: "website",
      title:
        locale === "ar"
          ? "جواهر كروشيه | تفاصيل صغيرة، فرحة كبيرة"
          : "Jawaher Crochet | Küçük detaylar, kocaman mutluluk",
      description: messages[locale].intro,
      images: [
        {
          url: "/brand/social-cover.jpg",
          width: 1200,
          height: 630,
          alt: "Jawaher Crochet — handmade with love",
        },
      ],
    },
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const settings = await getSettings();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <StoreProvider>
          <a className="skip-link" href="#main">
            {locale === "tr" ? "İçeriğe geç" : "انتقل للمحتوى"}
          </a>
          <Header locale={locale} demo={!configured()} />
          <main id="main">{children}</main>
          <Footer locale={locale} settings={settings} />
        </StoreProvider>
      </body>
    </html>
  );
}
