'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Per-navigation fade. `template.tsx` re-mounts on every route change,
 * unlike `layout.tsx`, so the initial->animate cycle runs on each
 * navigation. The full black-curtain wipe described in the brand brief
 * is deferred to the polish pass.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
