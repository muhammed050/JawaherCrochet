"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  ShoppingBag,
  Star,
  Settings,
  Plus,
  LayoutDashboard,
  Upload,
} from "lucide-react";
import type {
  Locale,
  Product,
  Review,
  Order,
  StoreSettings,
} from "@/lib/types";
import { messages, money } from "@/lib/i18n";
import { browserDb } from "@/lib/browser-db";
export function AdminDashboard({
  locale,
  products,
  orders,
  reviews,
  settings,
  demo,
}: {
  locale: Locale;
  products: Product[];
  orders: Order[];
  reviews: Review[];
  settings: StoreSettings;
  demo: boolean;
}) {
  const t = messages[locale];
  const tr = (a: string, b: string) => (locale === "tr" ? a : b);
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(action: string, data: unknown) {
    if (demo) return false;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      if (!res.ok) {
        setMessage(t.error);
        return false;
      }
      setMessage(t.saved);
      router.refresh();
      return true;
    } catch {
      setMessage(t.error);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files || demo) return;
    setBusy(true);
    try {
      const db = browserDb();
      const uploaded: string[] = [];
      for (const f of Array.from(files).slice(0, 8 - images.length)) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
          f.size > 5 * 1024 * 1024
        )
          throw new Error("FILE");
        const ext =
          f.type === "image/jpeg"
            ? "jpg"
            : f.type === "image/png"
              ? "png"
              : "webp";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await db.storage
          .from("product-images")
          .upload(path, f, { contentType: f.type });
        if (error) throw error;
        uploaded.push(
          db.storage.from("product-images").getPublicUrl(path).data.publicUrl,
        );
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setMessage(
        tr(
          "Yükleme başarısız. JPG, PNG veya WebP, en fazla 5 MB.",
          "تعذّر الرفع. استخدمي JPG أو PNG أو WebP بحجم أقل من 5 ميغابايت.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const paidOrders = orders.filter((o) =>
    ["paid", "processing", "shipped", "delivered"].includes(o.status),
  );
  const nav = [
    ["overview", LayoutDashboard, tr("Genel bakış", "نظرة عامة")],
    ["products", Package, t.products],
    ["orders", ShoppingBag, t.orders],
    ["reviews", Star, t.reviews],
    ["settings", Settings, t.settings],
  ] as const;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">JAWAHER STUDIO</p>
        <h2>{t.admin}</h2>
        <nav>
          {nav.map(([key, Icon, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key);
                setEditing(undefined);
                setMessage("");
              }}
            >
              <Icon size={19} />
              {label}
              {key === "reviews" && reviews.some((r) => !r.approved) && (
                <span className="count">
                  {reviews.filter((r) => !r.approved).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {tr("MAĞAZANIZ, SİZİN ELİNİZDE", "متجرك بين يديك")}
            </p>
            <h1>{nav.find((n) => n[0] === tab)?.[2]}</h1>
          </div>
          {tab === "products" && (
            <button
              className="button"
              disabled={demo}
              onClick={() => {
                setEditing(null);
                setImages([]);
              }}
            >
              <Plus size={18} />
              {t.newProduct}
            </button>
          )}
        </div>
        {demo && (
          <p className="notice">
            {tr(
              "Yönetim önizlemesi. Supabase bağlandıktan sonra yönetici hesabıyla giriş yapın.",
              "معاينة لوحة الإدارة. بعد ربط Supabase، سجّلي الدخول بحساب الإدارة.",
            )}
          </p>
        )}
        <p role="status" className="form-status">
          {message}
        </p>
        {tab === "overview" && (
          <>
            <div className="stats-grid">
              <div className="stat">
                <span>{tr("Doğrulanmış satışlar", "المبيعات المؤكّدة")}</span>
                <strong>
                  {money(
                    paidOrders.reduce((s, o) => s + o.total, 0),
                    locale,
                  )}
                </strong>
              </div>
              <div className="stat">
                <span>{t.orders}</span>
                <strong>{orders.length}</strong>
              </div>
              <div className="stat">
                <span>{t.products}</span>
                <strong>{products.length}</strong>
              </div>
              <div className="stat">
                <span>
                  {tr("Onay bekleyen yorumlar", "تقييمات بانتظار النشر")}
                </span>
                <strong>{reviews.filter((r) => !r.approved).length}</strong>
              </div>
            </div>
            <p className="muted">
              {tr(
                "Özet, en son 500 siparişi kapsar.",
                "الملخص يغطي آخر 500 طلب.",
              )}
            </p>
            <div className="panel">
              <h2>{tr("Hazırlanacak siparişler", "طلبات بانتظار التجهيز")}</h2>
              {paidOrders.filter(
                (o) => o.status === "paid" || o.status === "processing",
              ).length ? (
                paidOrders
                  .filter(
                    (o) => o.status === "paid" || o.status === "processing",
                  )
                  .slice(0, 8)
                  .map((o) => (
                    <div className="summary-line" key={o.id}>
                      <span>
                        #{o.id.slice(0, 8)} · {o.address.name}
                      </span>
                      <strong>{money(o.total, locale)}</strong>
                    </div>
                  ))
              ) : (
                <p className="empty-state">{t.noOrders}</p>
              )}
              <button className="text-link" onClick={() => setTab("orders")}>
                {t.orders} →
              </button>
            </div>
            <div className="panel">
              <h2>{tr("Azalan stok", "المخزون المنخفض")}</h2>
              {products
                .filter((p) => p.stock < 4)
                .map((p) => (
                  <div className="summary-line" key={p.id}>
                    <span>{p[`name_${locale}`]}</span>
                    <b>{p.stock}</b>
                  </div>
                ))}
            </div>
          </>
        )}
        {tab === "products" &&
          (editing !== undefined ? (
            <form
              className="panel form"
              key={editing?.id || "new"}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const data = {
                  ...(editing ? { id: editing.id } : {}),
                  slug: String(f.get("slug")),
                  name_tr: String(f.get("name_tr")),
                  name_ar: String(f.get("name_ar")),
                  description_tr: String(f.get("description_tr")),
                  description_ar: String(f.get("description_ar")),
                  category: String(f.get("category")),
                  price: Math.round(Number(f.get("price")) * 100),
                  stock: Number(f.get("stock")),
                  colors: String(f.get("colors"))
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  images,
                  active: f.get("active") === "on",
                  featured: f.get("featured") === "on",
                };
                if (await save("product", data)) setEditing(undefined);
              }}
            >
              <h2>{editing ? t.edit : t.newProduct}</h2>
              <div className="form-grid">
                {(["name_tr", "name_ar", "slug"] as const).map((k) => (
                  <label key={k}>
                    {k === "name_tr"
                      ? "Ürün adı (Türkçe)"
                      : k === "name_ar"
                        ? "اسم المنتج (العربية)"
                        : "URL slug"}
                    <input
                      name={k}
                      defaultValue={editing?.[k]}
                      required
                      pattern={
                        k === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined
                      }
                      dir={k === "name_ar" ? "rtl" : "ltr"}
                    />
                  </label>
                ))}
                <label>
                  {t.filter}
                  <select
                    name="category"
                    defaultValue={editing?.category || "bags"}
                  >
                    {(["bags", "homeware", "accessories"] as const).map((c) => (
                      <option key={c} value={c}>
                        {t[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t.price} (TRY)
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={editing ? editing.price / 100 : ""}
                  />
                </label>
                <label>
                  {t.stock}
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    required
                    defaultValue={editing?.stock ?? 0}
                  />
                </label>
              </div>
              <label>
                Açıklama (Türkçe)
                <textarea
                  name="description_tr"
                  minLength={10}
                  defaultValue={editing?.description_tr}
                  required
                  dir="ltr"
                />
              </label>
              <label>
                الوصف (العربية)
                <textarea
                  name="description_ar"
                  minLength={10}
                  defaultValue={editing?.description_ar}
                  required
                  dir="rtl"
                />
              </label>
              <label>
                {t.color} · {tr("Virgülle ayırın", "افصلي بفاصلة إنجليزية")}
                <input
                  name="colors"
                  defaultValue={editing?.colors.join(", ")}
                  required
                />
              </label>
              <label className="upload-label">
                <Upload size={20} />
                {tr("Ürün fotoğrafları · En fazla 8", "صور المنتج · حتى 8 صور")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={busy || demo || images.length >= 8}
                  onChange={(e) => void upload(e.target.files)}
                />
              </label>
              <div className="image-list">
                {images.map((src, i) => (
                  <div key={src}>
                    {/* Admin image URLs are uploaded to the public product bucket. */}
                    <img src={src} alt={`${i + 1}`} width={90} height={90} />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((x) => x !== src))}
                    >
                      {t.remove}
                    </button>
                  </div>
                ))}
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editing?.active}
                />
                {tr("Mağazada yayınla", "نشر في المتجر")}
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={editing?.featured}
                />
                {tr("Ana sayfada öne çıkar", "إظهار في الصفحة الرئيسية")}
              </label>
              <div className="inline-actions">
                <button
                  className="button"
                  disabled={busy || demo || !images.length}
                >
                  {t.save}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setEditing(undefined)}
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          ) : (
            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.products}</th>
                    <th>{t.price}</th>
                    <th>{t.stock}</th>
                    <th>{t.status}</th>
                    <th>{t.edit}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p[`name_${locale}`]}</strong>
                        <small>{p.slug}</small>
                      </td>
                      <td>{money(p.price, locale)}</td>
                      <td>{p.stock}</td>
                      <td>{p.active ? t.approve : t.hide}</td>
                      <td>
                        <button
                          className="text-link"
                          disabled={demo}
                          onClick={() => {
                            setEditing(p);
                            setImages(p.images);
                          }}
                        >
                          {t.edit}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!products.length && <p className="empty-state">{t.empty}</p>}
            </div>
          ))}
        {tab === "orders" && (
          <>
            {orders.length ? (
              orders.map((o) => (
                <form
                  className="panel order-card form"
                  key={o.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    await save("order", {
                      id: o.id,
                      status: f.get("status"),
                      tracking_number: f.get("tracking_number"),
                    });
                  }}
                >
                  <div className="section-heading">
                    <strong>
                      #{o.id.slice(0, 8)} · {o.address.name}
                    </strong>
                    <span className="badge">
                      {t[o.status as "paid"] || o.status}
                    </span>
                  </div>
                  <p>
                    {o.address.email} · {o.address.phone}
                  </p>
                  <p>
                    {o.address.street}, {o.address.district}, {o.address.city}{" "}
                    {o.address.postal}
                  </p>
                  {o.address.notes && <p>{o.address.notes}</p>}
                  {o.items.map((i, k) => (
                    <div className="summary-line" key={k}>
                      <span>
                        {i[`name_${locale}`]} × {i.quantity} · {i.color}
                      </span>
                      <span>{money(i.price * i.quantity, locale)}</span>
                    </div>
                  ))}
                  <strong>
                    {t.total}: {money(o.total, locale)}
                  </strong>
                  {["paid", "processing", "shipped", "delivered"].includes(
                    o.status,
                  ) && (
                    <>
                      <label>
                        {t.status}
                        <select
                          name="status"
                          defaultValue={
                            o.status === "paid" ? "processing" : o.status
                          }
                        >
                          <option value="processing">{t.processing}</option>
                          <option value="shipped">{t.shipped}</option>
                          <option value="delivered">{t.delivered}</option>
                        </select>
                      </label>
                      <label>
                        {t.tracking}
                        <input
                          name="tracking_number"
                          defaultValue={o.tracking_number || ""}
                        />
                      </label>
                      <button className="button" disabled={busy || demo}>
                        {t.save}
                      </button>
                    </>
                  )}
                </form>
              ))
            ) : (
              <div className="panel empty-state">{t.noOrders}</div>
            )}
          </>
        )}
        {tab === "reviews" && (
          <>
            {reviews.length ? (
              reviews.map((r) => (
                <article className="panel" key={r.id}>
                  <div className="section-heading">
                    <strong>
                      {r.display_name} · {r.rating}/5
                    </strong>
                    <span className="badge">
                      {r.approved
                        ? t.approve
                        : tr("Bekliyor", "بانتظار المراجعة")}
                    </span>
                  </div>
                  <p>
                    {
                      products.find((p) => p.id === r.product_id)?.[
                        `name_${locale}`
                      ]
                    }
                  </p>
                  <p>{r.body}</p>
                  <button
                    className="button secondary"
                    disabled={busy || demo}
                    onClick={() =>
                      void save("review", { id: r.id, approved: !r.approved })
                    }
                  >
                    {r.approved ? t.hide : t.approve}
                  </button>
                </article>
              ))
            ) : (
              <div className="panel empty-state">{t.noReviews}</div>
            )}
          </>
        )}
        {tab === "settings" && (
          <form
            className="panel form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await save("settings", {
                store_name: String(f.get("store_name")),
                shipping_fee: Math.round(Number(f.get("shipping_fee")) * 100),
                free_shipping_threshold: Math.round(
                  Number(f.get("free_shipping_threshold")) * 100,
                ),
                contact_email: String(f.get("contact_email")),
                instagram_url: String(f.get("instagram_url")),
              });
            }}
          >
            <label>
              {tr("Mağaza adı", "اسم المتجر")}
              <input
                name="store_name"
                defaultValue={settings.store_name}
                required
              />
            </label>
            <label>
              {t.shipping} (TRY)
              <input
                name="shipping_fee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={settings.shipping_fee / 100}
                required
              />
            </label>
            <label>
              {tr(
                "Ücretsiz kargo alt limiti (0 = kapalı)",
                "حد الشحن المجاني (0 = معطّل)",
              )}
              <input
                name="free_shipping_threshold"
                type="number"
                min="0"
                step="0.01"
                defaultValue={settings.free_shipping_threshold / 100}
                required
              />
            </label>
            <label>
              {t.email}
              <input
                name="contact_email"
                type="email"
                defaultValue={settings.contact_email}
              />
            </label>
            <label>
              Instagram URL
              <input
                name="instagram_url"
                type="url"
                defaultValue={settings.instagram_url}
              />
            </label>
            <button className="button" disabled={busy || demo}>
              {t.save}
            </button>
            <p className="notice">
              {tr(
                "Ödeme ve veritabanı anahtarları yalnızca sunucu ortam değişkenlerinde saklanır.",
                "تُحفظ مفاتيح الدفع وقاعدة البيانات في متغيرات بيئة الخادم فقط.",
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
