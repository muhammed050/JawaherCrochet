import Link from "next/link";
import { messages } from "@/lib/i18n";
import type { Locale, StoreSettings } from "@/lib/types";
export function Footer({
  locale,
  settings,
}: {
  locale: Locale;
  settings: StoreSettings;
}) {
  const t = messages[locale];
  return (
    <footer>
      <div className="footer-main">
        <div>
          <Link href={`/${locale}`} className="footer-brand">
            Jawaher Crochet
          </Link>
          <p>{t.footer}</p>
        </div>
        <div>
          <h3>{t.shop}</h3>
          <Link href={`/${locale}/shop?category=bags`}>{t.bags}</Link>
          <Link href={`/${locale}/shop?category=homeware`}>{t.homeware}</Link>
          <Link href={`/${locale}/shop?category=accessories`}>
            {t.accessories}
          </Link>
        </div>
        <div>
          <h3>{t.account}</h3>
          <Link href={`/${locale}/account`}>{t.orders}</Link>
          <Link href={`/${locale}/policy`}>{t.policy}</Link>
          <Link href={`/${locale}/admin`}>{t.admin}</Link>
        </div>
        <div>
          <h3>{t.contact}</h3>
          {settings.contact_email && (
            <a href={`mailto:${settings.contact_email}`}>
              {settings.contact_email}
            </a>
          )}
          {settings.instagram_url && (
            <a href={settings.instagram_url} target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
          )}
          <p>{t.handmade}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Jawaher Crochet. {t.rights}
        </span>
        <span>TR / AR · {t.secure}</span>
      </div>
    </footer>
  );
}
