import "server-only";
import { configured, serverDb } from "./supabase";
import { demoProducts, defaultSettings } from "./demo";
import type { Product, Review, StoreSettings } from "./types";
export async function getProducts(): Promise<Product[]> {
  if (!configured()) return demoProducts;
  const db = await serverDb();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getProduct(slug: string) {
  if (!configured()) return demoProducts.find((p) => p.slug === slug);
  const db = await serverDb();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}
export async function getReviews(productId: string): Promise<Review[]> {
  if (!configured()) return [];
  const db = await serverDb();
  const { data, error } = await db
    .from("reviews")
    .select("id,product_id,display_name,rating,body,approved,created_at")
    .eq("product_id", productId)
    .eq("approved", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function getSettings(): Promise<StoreSettings> {
  if (!configured()) return defaultSettings;
  const db = await serverDb();
  const { data, error } = await db
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}
