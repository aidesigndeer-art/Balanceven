'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wordmark } from './Wordmark';

const MIN_DURATION_MS = 1200;

/**
 * Black-curtain loader. Mounts on first paint, fades the wordmark in,
 * ticks 00 → 100 in the corner, then wipes upward to reveal the page.
 *
 * Time-gated to MIN_DURATION_MS so heavy assets (3D scene) have a beat
 * to warm up. If the page loads faster, we still hold for the minimum.
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
      setProgress(Math.floor(eased * 100));
      if (ratio < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        // Hold briefly at 100 before wipe.
        setTimeout(() => setVisible(false), 180);
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
          transition={{ duration: 0.9, ease: [0.85, 0, 0.15, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
          >
            <Wordmark variant="white" height="6vw" />
          </motion.div>
          <div className="pointer-events-none absolute bottom-8 right-8 font-display text-2xl tracking-tighter tabular-nums md:bottom-10 md:right-10 md:text-3xl">
            {progress.toString().padStart(2, '0')}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
