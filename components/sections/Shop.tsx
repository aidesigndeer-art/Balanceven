'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Scene } from '@/components/three/Scene';
import { FloatBitesPouch } from '@/components/three/FloatBitesPouch';
import { FlyingGummies } from '@/components/three/FlyingGummies';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useCart, priceFor, UNIT_PRICE_INR } from '@/lib/store/cart';
import { useCursor } from '@/lib/hooks/useCursor';

const formatINR = (rupees: number) =>
  `₹${rupees.toLocaleString('en-IN')}`;

/**
 * §6.11 — Shop block.
 * Two columns: interactive pouch + flying gummies left, product card
 * right. Cart state lives in Zustand so /checkout sees the same values.
 */
export function Shop() {
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const cursor = useCursor(sectionRef);

  const quantity = useCart((s) => s.quantity);
  const subscribe = useCart((s) => s.subscribe);
  const setQuantity = useCart((s) => s.setQuantity);
  const toggleSubscribe = useCart((s) => s.toggleSubscribe);

  const { subtotal, total, freeShipping } = priceFor(quantity, subscribe);

  const onAddToCart = () => {
    // Cart already reflects the current selection via Zustand;
    // a real backend call would land here.
    alert(`Added to cart — ${quantity} × Float Bites (₹${total})`);
  };

  const onBuyNow = () => {
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
        {/* Pouch + gummies column */}
        <div className="relative h-[60vh] w-full md:col-span-6 md:h-[78vh]">
          <Scene className="absolute inset-0 h-full w-full">
            <FloatBitesPouch cursor={cursor} scale={0.95} />
            <FlyingGummies cursor={cursor} />
          </Scene>
        </div>

        {/* Product card */}
        <div className="flex flex-col justify-center md:col-span-6 md:py-12">
          <p className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/60">
            10 count · de-bloat &amp; digest
          </p>
          <h2
            id="shop-heading"
            className="mt-4 font-display text-section tracking-tighter"
          >
            Float Bites
          </h2>
          <p className="mt-3 max-w-md font-body text-base text-paper/75">
            Plant-based gummies, chewed after a meal. Twelve actives, no sugar
            crash.
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
                onClick={() => setQuantity(quantity - 1)}
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
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </QtyButton>
            </div>
          </div>

          {/* Subscribe toggle */}
          <button
            type="button"
            onClick={toggleSubscribe}
            aria-pressed={subscribe}
            className={clsx(
              'mt-6 inline-flex w-fit items-center gap-3 rounded-full border px-5 py-2.5 font-body text-sm transition-colors duration-300 ease-silk',
              subscribe
                ? 'border-paper bg-paper text-ink'
                : 'border-paper/30 text-paper hover:border-paper/60',
            )}
          >
            <motion.span
              animate={{ scale: subscribe ? 1 : 0.6, opacity: subscribe ? 1 : 0.5 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'block h-2 w-2 rounded-full',
                subscribe ? 'bg-ink' : 'bg-paper/50',
              )}
            />
            Subscribe &amp; save 15%
            {subscribe && (
              <span className="font-display text-xs tabular-nums">
                {formatINR(subtotal - total)} off
              </span>
            )}
          </button>

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
              freeShipping ? 'text-paper/90' : 'text-paper/55',
            )}
          >
            {freeShipping
              ? 'Free shipping unlocked.'
              : `Free shipping on orders over ${formatINR(500)}.`}
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
