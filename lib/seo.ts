export const origin = () =>
  new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").origin;
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
