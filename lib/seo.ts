export const origin = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const alternates = (locale: string, path = "") => ({
  canonical: `${origin()}/${locale}${path}`,
  languages: {
    tr: `${origin()}/tr${path}`,
    ar: `${origin()}/ar${path}`,
    "x-default": `${origin()}/tr${path}`,
  },
});
export const jsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
