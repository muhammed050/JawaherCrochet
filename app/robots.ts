import type { MetadataRoute } from "next";
import { origin } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/tr/admin",
        "/ar/admin",
        "/tr/account",
        "/ar/account",
        "/tr/checkout",
        "/ar/checkout",
      ],
    },
    sitemap: `${origin()}/sitemap.xml`,
  };
}
