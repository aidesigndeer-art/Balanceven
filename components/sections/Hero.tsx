'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FlyBitesPouch } from '@/components/three/FlyBitesPouch';
import { useCursor } from '@/lib/hooks/useCursor';

const HEADLINE_LINES = ['Bite into', 'balance.'] as const;

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const cursor = useCursor(heroRef);

  return (
    <section
      ref={heroRef}
      className="relative isolate min-h-screen overflow-hidden bg-ink text-paper"
      data-theme="dark"
    >
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 pt-24 md:grid-cols-12 md:gap-8 md:px-10 md:pt-0">
        {/* Type column */}
        <div className="relative z-10 flex flex-col justify-center md:col-span-7 md:py-32">
          <h1 className="font-display text-hero tracking-tight">
            {HEADLINE_LINES.map((line, i) => (
              <span
                key={i}
                className="block overflow-hidden"
                style={{ lineHeight: 1 }}
              >
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.95,
                    delay: 1.35 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-8 max-w-md font-body text-base font-medium leading-relaxed text-paper/75 md:text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.95, ease: 'easeOut' }}
          >
            Energy gummies, engineered for the lift. 18 count.
          </motion.p>
        </div>

        {/* Pouch column — photo composite, no R3F here.
            Explicit height required: the photo component is absolutely
            positioned inside this wrapper, so without a definite block
            size the wrapper collapses to just its padding. The entrance
            fade-in lives on the photo component itself now. */}
        <div className="relative h-[70vh] w-full md:col-span-5 md:h-screen md:max-h-[800px] md:py-12">
          <FlyBitesPouch cursor={cursor} scale={1} />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 text-paper/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.4 }}
      >
        <span className="font-body text-[11px] uppercase tracking-[0.28em]">scroll</span>
        <span className="block h-10 w-px overflow-hidden">
          <motion.span
            className="block h-full w-px bg-paper/80"
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 0.2,
            }}
          />
        </span>
      </motion.div>
    </section>
  );
}
