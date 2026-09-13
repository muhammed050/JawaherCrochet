import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { configured } from "@/lib/supabase";
import { origin } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!configured()) return [];
  const products = await getProducts();
  const paths = [
    "",
    "/shop",
    "/policy",
    ...products.map((p) => `/products/${p.slug}`),
  ];
  return paths.flatMap((path) =>
    ["tr", "ar"].map((locale) => ({
      url: `${origin()}/${locale}${path}`,
      alternates: {
        languages: { tr: `${origin()}/tr${path}`, ar: `${origin()}/ar${path}` },
      },
    })),
  );
}
