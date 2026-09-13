export type Locale = "tr" | "ar";
export type Product = {
  id: string;
  slug: string;
  name_tr: string;
  name_ar: string;
  description_tr: string;
  description_ar: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  colors: string[];
  active: boolean;
  featured: boolean;
  created_at?: string;
};
export type Review = {
  id: string;
  product_id: string;
  display_name: string;
  rating: number;
  body: string;
  approved: boolean;
  created_at: string;
};
export type CartItem = { id: string; quantity: number; color: string };
export type StoreSettings = {
  id: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  contact_email: string;
  instagram_url: string;
  store_name: string;
};
export type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping: number;
  currency: string;
  address: Record<string, string>;
  items: {
    id: string;
    name_tr: string;
    name_ar: string;
    quantity: number;
    price: number;
    color: string;
  }[];
  created_at: string;
  tracking_number: string | null;
  payment_id: string | null;
};
