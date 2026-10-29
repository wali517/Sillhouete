"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import type { CartItem, Product } from "@/types";

export type CurrencyCode = "PKR" | "USD" | "GBP" | "EUR" | "CAD" | "AED";

export const CURRENCY_RATES: Record<CurrencyCode, { rate: number; symbol: string; prefix: string }> = {
  PKR: { rate: 1, symbol: "Rs.", prefix: "Rs." },
  USD: { rate: 0.0036, symbol: "$", prefix: "$" },
  GBP: { rate: 0.0028, symbol: "£", prefix: "£" },
  EUR: { rate: 0.0033, symbol: "€", prefix: "€" },
  CAD: { rate: 0.0049, symbol: "CA$", prefix: "CA$" },
  AED: { rate: 0.0132, symbol: "AED ", prefix: "AED " },
};

export interface AddToCartPayload {
  size: string;
  dupatta?: string;
  adOn?: string;
  expedite?: boolean;
  slip?: string;
  unitPrice?: number;
  quantity?: number;
}

interface Store {
  items: CartItem[];
  count: number;
  subtotal: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, sizeOrOptions: string | AddToCartPayload, quantity?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  orderNote: string;
  setOrderNote: (note: string) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (amountInPkr: number) => string;
  /** Shared 5s heartbeat: the announcement bar and the hero slider both advance on every tick. */
  tick: number;
  /** Restart the 5s countdown (used when a visitor picks a slide manually). */
  resetTick: () => void;
}

const StoreContext = createContext<Store | null>(null);

const CART_STORAGE_KEY = "sillhouete_cart_v1";
const WISHLIST_STORAGE_KEY = "sillhouete_wishlist_v1";
const CURRENCY_STORAGE_KEY = "sillhouete_currency_v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [currency, setCurrencyState] = useState<CurrencyCode>("PKR");
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const [tickEpoch, setTickEpoch] = useState(0);

  // One timer for the announcement bar and the hero slider so they always change together (every 5s).
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, [tickEpoch]);

  const resetTick = useCallback(() => setTickEpoch((e) => e + 1), []);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) setItems(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (savedCurrency && CURRENCY_RATES[savedCurrency]) setCurrencyState(savedCurrency);
    } catch {
      // Fallback
    }
    setMounted(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, mounted]);

  // Save wishlist to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist, mounted]);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {
      // ignore
    }
  }, []);

  const addToCart = useCallback(
    (product: Product, sizeOrOptions: string | AddToCartPayload, qty = 1) => {
      let size = "Standard";
      let dupatta: string | undefined;
      let adOn: string | undefined;
      let expedite = false;
      let slip: string | undefined;
      let unitPrice = product.price;
      let quantity = qty;

      if (typeof sizeOrOptions === "string") {
        size = sizeOrOptions;
      } else {
        size = sizeOrOptions.size || "Standard";
        dupatta = sizeOrOptions.dupatta;
        adOn = sizeOrOptions.adOn;
        expedite = !!sizeOrOptions.expedite;
        slip = sizeOrOptions.slip;
        if (sizeOrOptions.unitPrice !== undefined) {
          unitPrice = sizeOrOptions.unitPrice;
        }
        if (sizeOrOptions.quantity !== undefined) {
          quantity = sizeOrOptions.quantity;
        }
      }

      const key = `${product.id}:${size}:${dupatta || "none"}:${adOn || "none"}:${slip || "none"}:${expedite ? "exp" : "std"}`;
      setItems((prev) =>
        prev.some((i) => i.key === key)
          ? prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
          : [
              ...prev,
              {
                key,
                product,
                size,
                dupatta,
                adOn,
                expedite,
                slip,
                unitPrice,
                quantity,
              },
            ],
      );
      setCartOpen(true);
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    setItems((p) => p.filter((i) => i.key !== key));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((p) =>
      quantity <= 0 ? p.filter((i) => i.key !== key) : p.map((i) => (i.key === key ? { ...i, quantity } : i)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }, []);

  const formatPrice = useCallback(
    (amountInPkr: number) => {
      const info = CURRENCY_RATES[currency] || CURRENCY_RATES.PKR;
      const converted = amountInPkr * info.rate;
      if (currency === "PKR") {
        return `Rs.${Math.round(converted).toLocaleString("en-US")}`;
      }
      return `${info.prefix}${converted.toFixed(2)}`;
    },
    [currency],
  );

  const value = useMemo<Store>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * (i.unitPrice ?? i.product.price), 0),
      cartOpen,
      setCartOpen,
      addToCart,
      removeItem,
      setQuantity,
      clearCart,
      orderNote,
      setOrderNote,
      wishlist,
      toggleWishlist,
      currency,
      setCurrency,
      formatPrice,
      tick,
      resetTick,
    }),
    [
      items,
      cartOpen,
      addToCart,
      removeItem,
      setQuantity,
      clearCart,
      orderNote,
      wishlist,
      toggleWishlist,
      currency,
      setCurrency,
      formatPrice,
      tick,
      resetTick,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
