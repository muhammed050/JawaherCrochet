import { z } from "zod";
const text = z.string().trim().min(2).max(200);
export const addressSchema = z.object({
  name: text,
  email: z.email().max(254),
  phone: z.string().regex(/^\+?[0-9 ()-]{8,22}$/),
  country: z.literal("TR"),
  city: text,
  district: text,
  street: z.string().trim().min(10).max(500),
  postal: z.string().regex(/^\d{5}$/),
  notes: z.string().max(1000).default(""),
});
export const checkoutSchema = z.object({
  key: z.uuid(),
  locale: z.enum(["ar", "tr"]),
  items: z
    .array(
      z.object({
        id: z.uuid(),
        quantity: z.number().int().min(1).max(10),
        color: z.string().max(100),
      }),
    )
    .min(1)
    .max(30),
  address: addressSchema,
  consent: z.literal(true),
});
export const productSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(150),
  name_tr: text,
  name_ar: text,
  description_tr: z.string().trim().min(10).max(5000),
  description_ar: z.string().trim().min(10).max(5000),
  category: z.enum(["bags", "homeware", "accessories"]),
  price: z.number().int().positive().max(100000000),
  stock: z.number().int().min(0).max(100000),
  images: z
    .array(z.url().refine((v) => v.startsWith("https://")))
    .min(1)
    .max(8),
  colors: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  active: z.boolean(),
  featured: z.boolean(),
});
export const reviewSchema = z.object({
  product_id: z.uuid(),
  rating: z.number().int().min(1).max(5),
  display_name: z.string().trim().min(2).max(80),
  body: z.string().trim().min(10).max(2000),
});
export function calculateTotal(
  items: { price: number; quantity: number }[],
  fee: number,
  threshold: number,
) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = threshold > 0 && subtotal >= threshold ? 0 : fee;
  if (!Number.isSafeInteger(subtotal) || subtotal <= 0)
    throw new Error("INVALID_TOTAL");
  return { subtotal, shipping, total: subtotal + shipping };
}
