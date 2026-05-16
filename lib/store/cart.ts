'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Cart state — for now, the catalogue is exactly one SKU (Float Bites),
 * so we track quantity + subscribe rather than a list of line items.
 * When more SKUs land, swap `quantity` for a `items: CartItem[]`.
 */
interface CartState {
  quantity: number;
  subscribe: boolean;
  setQuantity: (n: number) => void;
  toggleSubscribe: () => void;
  reset: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      quantity: 1,
      subscribe: false,
      setQuantity: (n) => set({ quantity: Math.min(10, Math.max(1, n)) }),
      toggleSubscribe: () => set((s) => ({ subscribe: !s.subscribe })),
      reset: () => set({ quantity: 1, subscribe: false }),
    }),
    { name: 'balanceven-cart' },
  ),
);

export const UNIT_PRICE_INR = 111;
export const SUBSCRIBE_DISCOUNT = 0.15;
export const FREE_SHIPPING_THRESHOLD = 500;

/** Returns subtotal and discounted total in whole rupees. */
export function priceFor(quantity: number, subscribe: boolean) {
  const subtotal = quantity * UNIT_PRICE_INR;
  const total = subscribe
    ? Math.round(subtotal * (1 - SUBSCRIBE_DISCOUNT))
    : subtotal;
  return { subtotal, total, freeShipping: total >= FREE_SHIPPING_THRESHOLD };
}
