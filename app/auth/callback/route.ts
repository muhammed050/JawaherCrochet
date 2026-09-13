import { serverDb } from "@/lib/supabase";
import { origin } from "@/lib/seo";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const locale = url.searchParams.get("locale") === "ar" ? "ar" : "tr";
  if (code) {
    const db = await serverDb();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return Response.redirect(`${origin()}/${locale}/account`);
  }
  return Response.redirect(`${origin()}/${locale}/account?error=auth`);
}
