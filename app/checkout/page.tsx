'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MagneticButton } from '@/components/ui/MagneticButton';
import {
  useCart,
  priceFor,
  UNIT_PRICE_INR,
  FREE_SHIPPING_THRESHOLD,
} from '@/lib/store/cart';

const formatINR = (rupees: number) => `₹${rupees.toLocaleString('en-IN')}`;

interface Form {
  name: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
}

const EMPTY: Form = { name: '', email: '', address: '', city: '', pincode: '' };

export default function CheckoutPage() {
  const quantity = useCart((s) => s.quantity);
  const subscribe = useCart((s) => s.subscribe);
  const [form, setForm] = useState<Form>(EMPTY);
  const [placed, setPlaced] = useState(false);

  const { subtotal, total, freeShipping } = priceFor(quantity, subscribe);
  const savings = subtotal - total;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const order = {
      items: [{ sku: 'float-bites-10ct', quantity, unitPrice: UNIT_PRICE_INR }],
      subscribe,
      total,
      freeShipping,
      shipping: form,
      placedAt: new Date().toISOString(),
    };
    // Stubbed — no backend yet.
    // eslint-disable-next-line no-console
    console.log('Order placed:', order);
    setPlaced(true);
  };

  return (
    <main
      className="min-h-screen bg-ink text-paper"
      data-theme="dark"
    >
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32 md:px-10 md:pt-40">
        <Link
          href="/#shop"
          className="font-body text-sm text-paper/60 transition-colors hover:text-paper"
        >
          ← Back to shop
        </Link>

        <h1 className="mt-8 font-display text-section tracking-tighter">
          Checkout
        </h1>

        {placed ? (
          <OrderPlaced quantity={quantity} total={total} />
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <form onSubmit={onSubmit} className="space-y-7 md:col-span-7">
              <Field
                label="Name"
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="name"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
              <Field
                label="Address"
                value={form.address}
                onChange={set('address')}
                required
                autoComplete="street-address"
              />
              <div className="grid grid-cols-2 gap-6">
                <Field
                  label="City"
                  value={form.city}
                  onChange={set('city')}
                  required
                  autoComplete="address-level2"
                />
                <Field
                  label="Pincode"
                  value={form.pincode}
                  onChange={set('pincode')}
                  required
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="\d{6}"
                />
              </div>

              <div className="pt-4">
                <MagneticButton type="submit" variant="solid">
                  Place order · {formatINR(total)}
                </MagneticButton>
              </div>
            </form>

            <aside className="md:col-span-5 md:border-l md:border-paper/15 md:pl-12">
              <p className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/55">
                Order summary
              </p>
              <ul className="mt-6 space-y-4 font-body text-sm">
                <li className="flex items-baseline justify-between">
                  <span>
                    Float Bites × <span className="tabular-nums">{quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatINR(subtotal)}</span>
                </li>
                {subscribe && (
                  <li className="flex items-baseline justify-between text-paper/65">
                    <span>Subscribe &amp; save (15%)</span>
                    <span className="tabular-nums">−{formatINR(savings)}</span>
                  </li>
                )}
                <li className="flex items-baseline justify-between text-paper/65">
                  <span>Shipping</span>
                  <span>{freeShipping ? 'Free' : 'Calculated next'}</span>
                </li>
                <li className="flex items-baseline justify-between border-t border-paper/15 pt-5 font-display text-2xl tracking-tight">
                  <span>Total</span>
                  <span className="tabular-nums">{formatINR(total)}</span>
                </li>
              </ul>

              {!freeShipping && (
                <p className="mt-6 font-body text-xs text-paper/45">
                  Add {formatINR(FREE_SHIPPING_THRESHOLD - total)} for free shipping.
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

interface FieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({ label, ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="block font-body text-[11px] uppercase tracking-[0.22em] text-paper/55">
        {label}
      </span>
      <input
        {...rest}
        className="mt-3 block w-full border-b border-paper/25 bg-transparent pb-2 font-body text-base text-paper placeholder-paper/30 outline-none transition-colors focus:border-paper"
      />
    </label>
  );
}

function OrderPlaced({ quantity, total }: { quantity: number; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-16 max-w-xl"
    >
      <p className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/55">
        Stubbed — no payment processor yet
      </p>
      <h2 className="mt-4 font-display text-section tracking-tighter">
        Order placed.
      </h2>
      <p className="mt-6 font-body text-base text-paper/75">
        {quantity} × Float Bites — {formatINR(total)}. The order payload was
        logged to the console for now; wire this up to the commerce backend in
        the next pass.
      </p>
      <div className="mt-10">
        <MagneticButton variant="outline">
          <Link href="/">Back to home</Link>
        </MagneticButton>
      </div>
    </motion.div>
  );
}
