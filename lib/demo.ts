import type { Product, StoreSettings } from "./types";
export const demoProducts: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "gul-kurusu-orgu-canta",
    name_tr: "Gül Kurusu Örgü Çanta",
    name_ar: "حقيبة كروشيه وردية",
    description_tr:
      "Yumuşak dokusu ve zarif formuyla günlük anlarınıza eşlik eden el yapımı çanta. Bu, tasarımı göstermek için hazırlanmış örnek üründür.",
    description_ar:
      "حقيبة يدوية بملمس ناعم وشكل أنيق ترافق لحظاتك اليومية. هذا منتج توضيحي لعرض التصميم.",
    category: "bags",
    price: 89000,
    stock: 0,
    images: ["/bag-rose.svg"],
    colors: ["Gül kurusu / وردي"],
    active: true,
    featured: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "dogal-orgu-canta",
    name_tr: "Doğal Dokulu Çanta",
    name_ar: "حقيبة بلون طبيعي",
    description_tr:
      "Doğal tonlarda, sade ve zamansız bir parça. Tasarım amaçlı örnek ürün.",
    description_ar:
      "قطعة بسيطة بألوان طبيعية وجمال لا يبهت. منتج توضيحي للتصميم.",
    category: "bags",
    price: 95000,
    stock: 0,
    images: ["/bag-natural.svg"],
    colors: ["Doğal / طبيعي"],
    active: true,
    featured: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "orgu-bardak-altligi",
    name_tr: "Örgü Bardak Altlığı",
    name_ar: "قواعد أكواب كروشيه",
    description_tr:
      "Sofranız için küçük, el yapımı bir dokunuş. Tasarım amaçlı örnek ürün.",
    description_ar: "لمسة يدوية صغيرة لمائدتك. منتج توضيحي للتصميم.",
    category: "homeware",
    price: 32000,
    stock: 0,
    images: ["/coasters.svg"],
    colors: ["Zeytin / زيتوني"],
    active: true,
    featured: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    slug: "lavanta-mini-cuzdan",
    name_tr: "Lavanta Mini Çanta",
    name_ar: "حقيبة صغيرة لافندر",
    description_tr:
      "Küçük eşyalarınız için sevgiyle örülmüş bir parça. Tasarım amaçlı örnek ürün.",
    description_ar: "قطعة محبوكة بحب لأغراضك الصغيرة. منتج توضيحي للتصميم.",
    category: "accessories",
    price: 45000,
    stock: 0,
    images: ["/pouch.svg"],
    colors: ["Lavanta / لافندر"],
    active: true,
    featured: true,
  },
];
export const defaultSettings: StoreSettings = {
  id: 1,
  shipping_fee: 0,
  free_shipping_threshold: 0,
  contact_email: "",
  instagram_url: "",
  store_name: "Jawaher Crochet",
};
