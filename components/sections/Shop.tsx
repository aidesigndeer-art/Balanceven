'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Scene } from '@/components/three/Scene';
import { FlyBitesPouch } from '@/components/three/FlyBitesPouch';
import { FlyingGummies } from '@/components/three/FlyingGummies';
import { MagneticButton } from '@/components/ui/MagneticButton';
import {
  useCartStore,
  selectTotalPrice,
  UNIT_PRICE_INR,
  FREE_SHIPPING_THRESHOLD,
  FLY_BITES_SKU,
} from '@/lib/store/cart';
import { useCursor } from '@/lib/hooks/useCursor';

const formatINR = (rupees: number) => `₹${rupees.toLocaleString('en-IN')}`;

const FLY_BITES_ITEM = {
  sku: FLY_BITES_SKU,
  name: 'Fly Bites',
  price: UNIT_PRICE_INR,
} as const;

/**
 * §6.11 — Shop block.
 *
 * Quantity here is PDP-local — it's the amount the user is about to
 * add. `Add to cart` increments the existing line by that amount
 * (addItem dedupes by SKU and bumps quantity). The cart total in the
 * Nav badge reflects what's accumulated across this and any prior add.
 */
export function Shop() {
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const cursor = useCursor(sectionRef);

  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const cartTotalPrice = useCartStore(selectTotalPrice);

  // What the basket would look like *if* the user clicks add right now.
  // Drives the shipping line so the message is honest about the next
  // click, not the current cart.
  const projectedTotal = cartTotalPrice + quantity * UNIT_PRICE_INR;
  const projectedFreeShipping = projectedTotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(
    FREE_SHIPPING_THRESHOLD - projectedTotal,
    0,
  );

  const onAddToCart = () => {
    addItem({ ...FLY_BITES_ITEM, quantity });
    alert(`Added ${quantity} × Fly Bites to cart`);
  };

  const onBuyNow = () => {
    addItem({ ...FLY_BITES_ITEM, quantity });
    router.push('/checkout');
  };

  return (
    <section
      ref={sectionRef}
      id="shop"
      className="relative min-h-screen overflow-hidden bg-ink py-24 text-paper md:py-32"
      data-theme="dark"
      aria-labelledby="shop-heading"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-12 md:gap-8 md:px-10">
        {/* Pouch + gummies.
            FlyingGummies still uses R3F so we keep a transparent Canvas
            *behind* the photo pouch — the gummies drift in 3D while the
            real-photo pouch sits in front of them. */}
        <div className="relative h-[60vh] w-full md:col-span-6 md:h-[78vh]">
          <Scene className="absolute inset-0 h-full w-full">
            <FlyingGummies cursor={cursor} />
          </Scene>
          <FlyBitesPouch cursor={cursor} scale={0.95} />
        </div>

        {/* Product card */}
        <div className="flex flex-col justify-center md:col-span-6 md:py-12">
          <p className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/60">
            18 count · energy
          </p>
          <h2
            id="shop-heading"
            className="mt-4 font-display text-section tracking-tighter"
          >
            Fly Bites
          </h2>
          <p className="mt-3 max-w-md font-body text-base text-paper/75">
            Plant-based gummies, chewed before work, training, or anything that
            needs lift. Clean caffeine, B-complex, adaptogens. No sugar crash.
          </p>

          <div className="mt-10 flex items-baseline gap-4">
            <span className="font-display text-5xl tracking-tight md:text-6xl">
              {formatINR(UNIT_PRICE_INR)}
            </span>
            <span className="font-body text-sm text-paper/55">per pouch</span>
          </div>

          {/* Quantity */}
          <div className="mt-8 flex items-center gap-6">
            <span className="font-body text-xs uppercase tracking-[0.22em] text-paper/55">
              Qty
            </span>
            <div className="flex items-center gap-1 rounded-full border border-paper/30">
              <QtyButton
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </QtyButton>
              <span
                aria-live="polite"
                className="w-8 text-center font-display text-lg tabular-nums"
              >
                {quantity}
              </span>
              <QtyButton
                aria-label="Increase quantity"
                disabled={quantity >= 10}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              >
                +
              </QtyButton>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton variant="solid" onClick={onAddToCart}>
              Add to cart
            </MagneticButton>
            <MagneticButton variant="outline" onClick={onBuyNow}>
              Buy now
            </MagneticButton>
          </div>

          {/* Shipping line */}
          <p
            className={clsx(
              'mt-6 font-body text-sm transition-colors',
              projectedFreeShipping ? 'text-paper/90' : 'text-paper/55',
            )}
          >
            {projectedFreeShipping
              ? 'Free shipping unlocked.'
              : `Free shipping on orders over ${formatINR(FREE_SHIPPING_THRESHOLD)}` +
                (remainingForFreeShipping > 0 && cartTotalPrice > 0
                  ? ` — ${formatINR(remainingForFreeShipping)} to go.`
                  : '.')}
          </p>
          <p className="mt-2 font-body text-xs uppercase tracking-[0.22em] text-paper/40">
            Made in India
          </p>
        </div>
      </div>
    </section>
  );
}

function QtyButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg text-paper transition-colors hover:bg-paper/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      {...rest}
    >
      {children}
    </button>
  );
}
