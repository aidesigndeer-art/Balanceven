'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wordmark } from './Wordmark';

const MIN_DURATION_MS = 1400;

/**
 * Black-curtain loader with a vertical digit-roll counter.
 *
 * Two stacked columns of 0–9 each. The strip is overflow-clipped to a
 * single digit's height; we translateY the strip so the active digit
 * lines up in the window. The animation tracks a real-time progress
 * float, so the digits visibly roll between values rather than
 * snapping.
 *
 * Time-gated to MIN_DURATION_MS so heavy assets (photos, R3F, Lenis)
 * have a beat to warm up. Holds at 100 briefly, then wipes upward.
 */
export function Loader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(elapsed / MIN_DURATION_MS, 1);
      // Ease-out so the counter slows near 100, feels less linear.
      const eased = 1 - Math.pow(1 - ratio, 2);
      // Keep the value as a float; the roller reads it directly so
      // the digit columns interpolate smoothly between integers.
      setProgress(eased * 100);
      if (ratio < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => setVisible(false), 220);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lock scroll while loader is up.
  useEffect(() => {
    if (visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          aria-hidden="true"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink text-paper"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.95, ease: [0.85, 0, 0.15, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
          >
            <Wordmark variant="white" height="6vw" />
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-8 font-body text-[11px] uppercase tracking-[0.4em] text-paper/60"
          >
            Loading Fly Bites experience
          </motion.div>

          {/* Digit roller */}
          <div className="pointer-events-none absolute bottom-8 right-8 flex items-end md:bottom-10 md:right-10">
            <DigitRoller value={progress} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Two-column digit roller for a 0–100 percentage. The roller treats
 * the value as a continuous float so the column slides smoothly
 * during the roll, not in discrete steps.
 *
 * Glyph height is set via the line-height container; each column is
 * one digit tall and clipped, with a 10-digit strip translated up
 * by `value / 10 * 100%` (tens) or `(value % 10) * 10%` of strip
 * height per digit (ones).
 */
function DigitRoller({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  // We render two columns, tens and ones. The tens column lives in
  // [0, 10] (10 being the wrap point at 100%), the ones lives in
  // [0, 9.999...]. We use float positions so the column can show
  // a half-digit roll mid-transition.
  const tens = clamped / 10;
  const ones = clamped % 10;

  return (
    <div className="flex items-baseline font-display text-3xl leading-none tracking-tight tabular-nums md:text-5xl">
      <DigitColumn position={tens} />
      <DigitColumn position={ones} />
    </div>
  );
}

function DigitColumn({ position }: { position: number }) {
  // Each strip has 11 digits (0–9 plus a duplicate 0) so when the
  // tens column rolls past 9 it can wrap into a fresh 0 with no jump.
  // We translate by (position / 10) of strip height. Position 10 = 100%
  // = the duplicate-0, identical to position 0.
  const offsetPct = (position / 10) * 100;
  return (
    <div className="relative h-[1em] overflow-hidden">
      <div
        className="flex flex-col"
        style={{
          transform: `translate3d(0, -${offsetPct.toFixed(3)}%, 0)`,
          willChange: 'transform',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => (
          <span key={i} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </div>
      {/* The digit window: 1em tall. Width is sized by content (single
          glyph). We don't pad — the tabular-nums above keeps both digit
          widths identical so the two columns align perfectly. */}
    </div>
  );
}
