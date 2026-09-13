"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingBag, UserRound, Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { messages } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useCart } from "./store-provider";
export function Header({ locale, demo }: { locale: Locale; demo: boolean }) {
  const t = messages[locale];
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const other = locale === "tr" ? "ar" : "tr";
  return (
    <>
      <div className="announcement">
        {demo
          ? t.demo
          : locale === "tr"
            ? "Her parça el yapımı. Her ilmek bir hikâye."
            : "كل قطعة صنع يدوي، وكل غرزة حكاية."}
        <span>
          JAWAHER CROCHET <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="header">
        <Link className="brand" href={`/${locale}`}>
          <Image src="/icon.svg" width={42} height={42} alt="" />
          <span>
            Jawaher<small>CROCHET</small>
          </span>
        </Link>
        <nav className={open ? "nav open" : "nav"} aria-label={t.shop}>
          <Link onClick={() => setOpen(false)} href={`/${locale}/shop`}>
            {t.shop}
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href={`/${locale}/shop?category=bags`}
          >
            {t.bags}
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href={`/${locale}/shop?category=homeware`}
          >
            {t.homeware}
          </Link>
          <Link onClick={() => setOpen(false)} href={`/${locale}#story`}>
            {t.story}
          </Link>
        </nav>
        <div className="header-actions">
          <Link
            className="language"
            href={path.replace(/^\/(tr|ar)/, `/${other}`)}
            hrefLang={other}
          >
            {locale === "tr" ? "العربية" : "Türkçe"}
          </Link>
          <Link
            className="icon-button"
            href={`/${locale}/account`}
            aria-label={t.account}
          >
            <UserRound size={20} />
          </Link>
          <Link
            className="icon-button cart-icon"
            href={`/${locale}/checkout`}
            aria-label={t.cart}
          >
            <ShoppingBag size={20} />
            <span>{items.reduce((s, x) => s + x.quantity, 0)}</span>
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={open ? t.cancel : t.shop}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
