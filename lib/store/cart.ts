'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number },
  ) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  /** Total units across every line item. Recomputes on each access. */
  readonly totalItems: number;
  /** Sum of price × quantity for every line, in whole rupees. */
  readonly totalPrice: number;
  /** Number of distinct lines (SKUs) in the cart. */
  readonly itemCount: number;
}

function newId(seed: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      get totalItems() {
        return get().items.reduce((n, i) => n + i.quantity, 0);
      },
      get totalPrice() {
        return get().items.reduce((n, i) => n + i.price * i.quantity, 0);
      },
      get itemCount() {
        return get().items.length;
      },

      addItem: (item) => {
        const existing = get().items.find((i) => i.sku === item.sku);
        if (existing) {
          get().updateQuantity(item.sku, existing.quantity + (item.quantity ?? 1));
          return;
        }
        set({
          items: [
            ...get().items,
            {
              ...item,
              quantity: item.quantity ?? 1,
              id: newId(item.sku),
            },
          ],
        });
      },

      removeItem: (sku) => {
        set({ items: get().items.filter((i) => i.sku !== sku) });
      },

      updateQuantity: (sku, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sku);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.sku === sku ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'balanceven-cart',
      // Only `items` is persisted. The getters (totalItems, totalPrice,
      // itemCount) are *not* serialized, so rehydration doesn't overwrite
      // them with frozen numeric copies — they keep recomputing from
      // `items` after every reload.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// ─── Product-level constants ─────────────────────────────────────────────
// Single-SKU catalogue today; move to a catalogue module when more land.
export const UNIT_PRICE_INR = 111;
export const SUBSCRIBE_DISCOUNT = 0.15;
export const FREE_SHIPPING_THRESHOLD = 500;
export const FLY_BITES_SKU = 'fly-bites-18ct';

/**
 * @deprecated Renamed to FLY_BITES_SKU when the line moved from Float
 * Bites (de-bloat) to Fly Bites (energy). Kept as a re-export so any
 * persisted cart rows from the old SKU continue to resolve on read.
 */
export const FLOAT_BITES_SKU = FLY_BITES_SKU;

// ─── Selectors ───────────────────────────────────────────────────────────
// Use these with `useCartStore(selector)` for stable references and to
// keep components from over-subscribing to unrelated state slices.
export const selectItems = (s: CartState) => s.items;
export const selectTotalItems = (s: CartState) => s.totalItems;
export const selectTotalPrice = (s: CartState) => s.totalPrice;
export const selectItemCount = (s: CartState) => s.itemCount;
export const selectQuantityFor = (sku: string) => (s: CartState) =>
  s.items.find((i) => i.sku === sku)?.quantity ?? 0;
