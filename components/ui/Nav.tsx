'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';
import { Wordmark } from './Wordmark';
import { useCart } from '@/lib/store/cart';

const LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/science', label: 'Science' },
  { href: '/about', label: 'About' },
  { href: '/journal', label: 'Journal' },
] as const;

const SCROLL_THRESHOLD = 32;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const cartCount = useCart((s) => s.quantity);

  // Nav is only allowed to be transparent over the hero on the home
  // page. Every other route has content starting at the top, so the
  // nav must read as solid from the first paint.
  const allowTransparent = pathname === '/';
  const solid = !allowTransparent || scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <header
        className={clsx(
          'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-silk',
          solid ? 'bg-ink/90 backdrop-blur-md' : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20 md:px-10">
          <Link
            href="/"
            aria-label="balanceven home"
            className="relative z-10"
            onClick={() => setOpen(false)}
          >
            <Wordmark variant="white" height="1.1rem" className="md:!h-[1.4rem]" />
          </Link>

          <ul className="hidden items-center gap-10 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="group relative font-body text-sm font-medium tracking-wide text-paper/90 transition-colors hover:text-paper"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-paper transition-[width] duration-500 ease-silk group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <button
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-paper transition-colors hover:bg-paper/10"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-paper px-1 font-display text-[10px] leading-none text-ink">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="relative z-10 flex h-10 w-10 items-center justify-center text-paper md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              <Burger open={open} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-ink md:hidden"
          >
            <ul className="flex h-full flex-col items-start justify-center gap-6 px-8 pt-20">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.08 + i * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="overflow-hidden"
                >
                  <Link
                    href={l.href}
                    className="block font-display text-mega leading-[0.9] tracking-tighter text-paper"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 7h12l-1.2 11.2A2 2 0 0 1 14.8 20H9.2a2 2 0 0 1-2-1.8L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-6">
      <span
        className={clsx(
          'absolute left-0 top-0 h-px w-full bg-paper transition-transform duration-300 ease-silk',
          open && 'translate-y-[7px] rotate-45',
        )}
      />
      <span
        className={clsx(
          'absolute bottom-0 left-0 h-px w-full bg-paper transition-transform duration-300 ease-silk',
          open && '-translate-y-[7px] -rotate-45',
        )}
      />
    </span>
  );
}
