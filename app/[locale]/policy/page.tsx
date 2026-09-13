import { notFound } from "next/navigation";
import { isLocale, messages, money } from "@/lib/i18n";
import { getSettings } from "@/lib/catalog";
import { alternates } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "التوصيل والخصوصية" : "Teslimat ve Gizlilik",
    alternates: alternates(locale, "/policy"),
  };
}
export default async function Policy({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const s = await getSettings();
  return (
    <article className="section prose">
      <p className="eyebrow">JAWAHER CROCHET</p>
      <h1>{messages[locale].policy}</h1>
      {locale === "tr" ? (
        <>
          <h2>Teslimat</h2>
          <p>
            Bu mağaza Türkiye içi teslimat için hazırlanmıştır. Kargo tutarı
            ödeme öncesinde gösterilir: {money(s.shipping_fee, locale)}.{" "}
            {s.free_shipping_threshold > 0 &&
              `${money(s.free_shipping_threshold, locale)} ve üzeri siparişlerde kargo ücretsizdir.`}
          </p>
          <p>
            Hazırlık süresi ve teslimat tarihi ürünün stok durumuna ve teslimat
            adresine göre mağaza tarafından teyit edilir. Kargoya verilen
            siparişlerin takip numarası hesabınızda görünür.
          </p>
          <h2>İade ve sipariş desteği</h2>
          <p>
            İade, hasarlı ürün veya sipariş değişikliği için sipariş numaranızla
            mağazaya ulaşın. Kişiye özel üretim taleplerinde şartlar sipariş
            öncesinde ayrıca teyit edilmelidir.
          </p>
          <h2>Gizlilik</h2>
          <p>
            Adınız, e-posta adresiniz, telefonunuz ve teslimat adresiniz sipariş
            oluşturmak, teslimatı gerçekleştirmek ve sipariş desteği sağlamak
            için kaydedilir. Hesap ve sipariş bilgileri Supabase üzerinde
            tutulur. Kart bilgileri Whop’un güvenli ödeme bileşeni tarafından
            işlenir; mağaza kart numaranızı veya güvenlik kodunuzu saklamaz.
          </p>
          <p>
            Sepetiniz bu cihazın tarayıcısında saklanır. Oturum çerezleri
            girişinizi sürdürmek için kullanılır. Verilerinize erişim veya silme
            talebi için mağazaya ulaşabilirsiniz; sipariş kayıtlarının
            tutulmasıyla ilgili yükümlülükler ayrıca değerlendirilir.
          </p>
        </>
      ) : (
        <>
          <h2>التوصيل</h2>
          <p>
            المتجر مجهز للتوصيل داخل تركيا. تظهر تكلفة الشحن قبل الدفع:{" "}
            {money(s.shipping_fee, locale)}.{" "}
            {s.free_shipping_threshold > 0 &&
              `الشحن مجاني للطلبات من ${money(s.free_shipping_threshold, locale)}.`}
          </p>
          <p>
            يؤكّد المتجر مدة التجهيز والتوصيل بحسب توفر القطعة والعنوان. يظهر
            رقم تتبع الشحنة ضمن حسابك بعد الشحن.
          </p>
          <h2>الإرجاع ودعم الطلبات</h2>
          <p>
            لطلب الإرجاع أو الإبلاغ عن قطعة تالفة أو تعديل الطلب، تواصلي مع
            المتجر مع ذكر رقم الطلب. يجب تأكيد شروط القطع المصنوعة حسب الطلب قبل
            شرائها.
          </p>
          <h2>الخصوصية</h2>
          <p>
            نحفظ اسمك وبريدك ورقم هاتفك وعنوانك لإنشاء الطلب وتوصيله وتقديم
            الدعم. تُحفظ معلومات الحساب والطلبات على Supabase. يعالج مكوّن Whop
            الآمن بيانات البطاقة؛ ولا يحفظ المتجر رقم بطاقتك أو رمز الأمان.
          </p>
          <p>
            تُحفظ السلّة على متصفح هذا الجهاز، وتُستخدم ملفات جلسة الدخول
            لاستمرار تسجيل الدخول. يمكنك التواصل لطلب الوصول إلى بياناتك أو
            حذفها، مع مراعاة متطلبات الاحتفاظ بسجلات الطلبات.
          </p>
        </>
      )}
      {s.contact_email && (
        <p>
          <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>
        </p>
      )}
    </article>
  );
}
