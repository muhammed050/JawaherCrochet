"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Locale, Product } from "@/lib/types";
import { messages } from "@/lib/i18n";
import { ProductCard } from "./product-card";
export function CatalogGrid({
  products,
  locale,
  initialCategory = "all",
}: {
  products: Product[];
  locale: Locale;
  initialCategory?: string;
}) {
  const t = messages[locale];
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");
  const filtered = products
    .filter(
      (p) =>
        (category === "all" || p.category === category) &&
        `${p.name_ar} ${p.name_tr}`
          .toLocaleLowerCase("tr")
          .includes(search.toLocaleLowerCase("tr")),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  return (
    <>
      <div className="catalog-toolbar">
        <div className="category-tabs" aria-label={t.filter}>
          {(["all", "bags", "homeware", "accessories"] as const).map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => setCategory(c)}
            >
              {t[c]}
            </button>
          ))}
        </div>
        <div className="search-sort">
          <label className="search-box">
            <Search size={18} />
            <input
              aria-label={t.search}
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label={t.sort}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="new">{t.newest}</option>
            <option value="low">{t.low}</option>
            <option value="high">{t.high}</option>
          </select>
        </div>
      </div>
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="empty-state">{t.empty}</p>
      )}
    </>
  );
}
