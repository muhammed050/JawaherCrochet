"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";
type CartContext = {
  items: CartItem[];
  add: (item: CartItem) => void;
  update: (id: string, color: string, quantity: number) => void;
  clear: () => void;
  ready: boolean;
};
const Context = createContext<CartContext>({
  items: [],
  add: () => {},
  update: () => {},
  clear: () => {},
  ready: false,
});
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("jawaher-cart") || "[]");
      if (Array.isArray(saved))
        setItems(
          saved
            .filter(
              (x) =>
                typeof x.id === "string" &&
                typeof x.color === "string" &&
                Number.isInteger(x.quantity) &&
                x.quantity > 0 &&
                x.quantity <= 10,
            )
            .slice(0, 30),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("jawaher-cart", JSON.stringify(items));
  }, [items, ready]);
  return (
    <Context.Provider
      value={{
        items,
        ready,
        add(item) {
          setItems((prev) => {
            const existing = prev.find(
              (x) => x.id === item.id && x.color === item.color,
            );
            return existing
              ? prev.map((x) =>
                  x === existing
                    ? {
                        ...x,
                        quantity: Math.min(10, x.quantity + item.quantity),
                      }
                    : x,
                )
              : [...prev, item].slice(0, 30);
          });
        },
        update(id, color, quantity) {
          setItems((prev) =>
            prev
              .map((x) =>
                x.id === id && x.color === color ? { ...x, quantity } : x,
              )
              .filter((x) => x.quantity > 0),
          );
        },
        clear() {
          setItems([]);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useCart = () => useContext(Context);
