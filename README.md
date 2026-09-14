# Jawaher Crochet

A Turkish/Arabic handmade crochet store built with Next.js App Router, Supabase and Whop embedded checkout. Arabic has server-rendered RTL pages; each product has its own localized URL, canonical, hreflang, metadata and Product/Breadcrumb structured data. The admin dashboard manages products, uploaded photos, inventory, prices, featured products, orders, tracking numbers, review moderation and shipping settings.

## Current delivery

The application and database migration are implemented. Without credentials it displays a **clearly labelled, non-purchasable illustrated demo collection** and a read-only admin preview. Demo data is never imported into the live database. Demo pages are `noindex`, and the demo sitemap is empty. No fabricated reviews, sales or ratings are shown.

Connecting your accounts and completing a sandbox transaction are necessary before accepting real payments. This repository does not contain account credentials. The production domain, real product photography, seller contact details, and seller-specific shipping/return terms must be entered before launch. The included information page is a starting text, not a claim of legal compliance.

## Run

Node.js 22+ recommended.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

- Turkish storefront: `/tr`
- Arabic storefront: `/ar`
- Admin: `/tr/admin` or `/ar/admin`
- Account and orders: `/tr/account` or `/ar/account`
- Checkout: `/tr/checkout` or `/ar/checkout`

## 1. Supabase — one-time setup

1. Create a Supabase project and execute `supabase/migrations/001_store.sql` in its SQL Editor. The migration creates products, orders, reviews, admin membership, store settings, transactional order/payment functions, and the `product-images` bucket with its policies.
2. Copy the Project URL and anon/publishable-compatible key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Put the **server-only** service role key into `SUPABASE_SERVICE_ROLE_KEY`.
3. Enable email/password authentication with email confirmation. Configure your real Site URL and allow `https://YOUR-DOMAIN/auth/callback` as a redirect URL. For reliable delivery, configure your own SMTP provider.
4. Register your own account using the storefront, confirm its email, and retrieve its UUID from Supabase Authentication → Users.
5. Grant that existing account admin membership through the SQL Editor, substituting its actual UUID:

```sql
insert into public.admins(user_id) values ('YOUR-AUTH-USER-UUID');
```

Users cannot grant themselves administrator access. Admin checks run on the server and through RLS. The service role key is never shipped to the browser. Customer order reads are scoped to the authenticated owner; review inserts require a paid order containing that product.

6. Sign into `/tr/admin` or `/ar/admin`. Add real products, images, Turkish/Arabic descriptions, colors, TRY prices and stock. Publish the products using the checkbox in the product editor. Change shipping and contact details in Settings.

Images: JPG, PNG or WebP, up to 5 MB each and 8 images per product. The first image is the cover; remove/reupload to reorder. SVG uploads are not permitted.

## 2. Whop — one-time setup

Official references checked during implementation:

- [Embedded checkout](https://docs.whop.com/payments/checkout-embed)
- [Inline plans and dynamic checkout pricing](https://docs.whop.com/developer/guides/accept-payments)
- [Webhook verification](https://docs.whop.com/developer/guides/webhooks)
- [Sandbox](https://docs.whop.com/developer/guides/sandbox)

1. Create your account/API key in the Whop sandbox and set `WHOP_API_KEY`, `WHOP_ACCOUNT_ID` (the `biz_…` account ID) and `WHOP_ENVIRONMENT=sandbox`.
2. Create a webhook pointing to `https://YOUR-DOMAIN/api/whop/webhook`, subscribe to `payment.succeeded`, select API `v1`, and pin its API version date to **2026-08-14**. Store the signing secret exactly as returned (including `ws_`) in `WHOP_WEBHOOK_SECRET`.
3. Grant the API key checkout-configuration/inline-plan creation permissions and the account scopes required by your Whop account. Keep it server-only.
4. Whop must approve your seller account and support your physical products and TRY checkout. Confirm this in your account before launch. The implementation never silently changes the currency or exchange rate.
5. Add a real test product, buy it with a sandbox card, and verify the webhook changes the order to `paid` and decrements inventory once. Test duplicate webhook delivery, a declined card and 3D Secure return.
6. Replace sandbox credentials with production credentials and webhook secret and set `WHOP_ENVIRONMENT=production` only after successful testing.

### How checkout works

The customer enters name, phone, Turkish city/district, full address, postal code and optional notes in **our own page**. The user must sign in with a confirmed email so orders can be accessed securely. The server ignores client prices, locks product rows, checks colors/quantities, reads current prices and shipping rules, and stores an immutable order snapshot. It then creates a hidden, one-time inline Whop plan for the order total and returns its checkout configuration.

The Whop iframe is mounted **inside the store page**, themed to the store. It uses the locale and prefills email/address. There is no normal navigation to a Whop-hosted checkout. **Bank verification/3D Secure or external payment methods can still require a provider redirect**, returning to the store afterward. Whop owns the secure card fields; our application never receives card numbers/CVCs. Provider disclosures and fees remain visible.

**You do not need to open Whop to add each product or price.** Product management happens in the store admin. Whop account setup and account verification are one-time external requirements.

The server uses an idempotency key for both the local order and remote configuration. Pending orders reserve stock logically for 30 minutes. Late payments are checked against actual inventory again; if stock is insufficient, the paid order enters `payment_review` without making stock negative. Such orders require seller intervention and, when appropriate, a refund in Whop. A browser callback or `?status=success` never marks an order paid.

Webhook signatures are checked against the raw request body using the official SDK helper, including its timestamp tolerance. Payment account, checkout configuration, plan, currency and exact order total must match. Duplicate delivery and stock changes are handled in one database transaction. Configure Whop so additional seller-side discounts/taxes do not change the expected order total; mismatches fail closed and must be investigated. Provider buyer fees are shown by Whop separately. Advanced promotions, tax calculation and automated refunds are not implemented.

Admin fulfillment advances `paid → processing → shipped → delivered`; shipping requires a tracking number. Refunds/chargebacks are managed in Whop and are not automatically synchronized by this version. The dashboard shows verified gross order totals, **not net settlement revenue**. It summarizes the latest 500 orders.

## 3. Deploy to Vercel

Import this GitHub repository into Vercel using the Next.js preset. Set all `.env.example` variables in the Vercel project. Set `NEXT_PUBLIC_SITE_URL` to your canonical HTTPS domain **without a trailing slash**, then deploy. Update Supabase redirect URLs and Whop webhook URLs to that domain.

Do not publish `.env.local` or any service-role/payment secrets to GitHub. Variables prefixed `NEXT_PUBLIC_` are public and may contain only the site URL and Supabase public connection values.

## Verification

```sh
npm run typecheck
npm test
npm run build
node scripts/smoke.mjs
```

Tests execute PostgreSQL migration and transactional functions in PGlite with local auth/storage stubs: authoritative pricing, retries, inventory, reservations, duplicate webhooks, late-payment review, customer isolation, admin escalation prevention, and review visibility. Separate tests cover money arithmetic and valid/invalid/expired webhook signatures. These tests **do not replace testing against your live Supabase project and Whop sandbox**.

## SEO and content

- Server-rendered `/tr` and `/ar` storefront, collection and product pages.
- Localized titles/descriptions, canonical and reciprocal hreflang links.
- Dynamic sitemap containing only public live catalog URLs.
- Product structured data from actual prices, availability and approved buyer reviews; no invented aggregate ratings.
- Customer, admin and checkout pages use `noindex`; robots excludes private/API routes.
- Matching brand favicon, responsive layout and keyboard focus states.
- Demo illustrations are local SVG artwork, not photographs of merchandise. Replace them with real product photography through admin.

## ملاحظات التشغيل

المتجر جاهز برمجيًا، لكن قبول الطلبات الحقيقية يحتاج ربط Supabase وWhop وإجراء دفعة تجريبية ناجحة. ارفعي المنتجات والصور والأسعار من لوحة الإدارة؛ لا يلزم إنشاء منتج يدويًا في Whop كل مرة. حقول العنوان وتصميم صفحة الدفع من المتجر، وحقول البطاقة الآمنة مضمّنة من Whop. لا ترسلي مفاتيح الخدمة السرية في المحادثة؛ أدخليها في إعدادات بيئة الاستضافة.

### Visual identity (September 2026)

The storefront and management dashboard share a plum, blush, lavender and pale yellow design system. The flower/J vector mark is in `public/brand/logo.svg`; matching PNG favicons, Apple touch icon, manifest icons and a 1200×630 social cover are included. Organization structured data uses the 512px logo. Arabic RTL and Turkish LTR share responsive layouts and reduced-motion support.

`public/images/jawaher-hero.webp` and `jawaher-atelier.webp` were generated with the built-in image generation tool as decorative editorial imagery, not photographs of actual inventory. Real product images continue to come from the catalog. Image briefs: a rose crochet bag with bamboo handles, yarn and cream linen in warm sunlight; a crochet worktable with a cream flower coaster, lilac yarn and wooden hooks. Do not use these as evidence of actual stock or customer purchases.
