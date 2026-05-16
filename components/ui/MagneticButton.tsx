'use client';

import { forwardRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

type Variant = 'solid' | 'outline';

interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  children: ReactNode;
  /** Pull strength as a fraction of half-width. 0.25 ≈ subtle. */
  pull?: number;
}

/**
 * Button that drifts toward the cursor on hover and springs back on
 * leave. Wraps the click target in a motion.span so the motion is
 * visual only — focus/keyboard activation still hits the underlying
 * button cleanly.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton(
    { variant = 'solid', children, className, pull = 0.28, onMouseMove, onMouseLeave, ...rest },
    ref,
  ) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 240, damping: 22, mass: 0.6 });
    const sy = useSpring(y, { stiffness: 240, damping: 22, mass: 0.6 });

    return (
      <motion.button
        ref={ref}
        style={{ x: sx, y: sy }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          x.set((e.clientX - cx) * pull);
          y.set((e.clientY - cy) * pull);
          onMouseMove?.(e);
        }}
        onMouseLeave={(e) => {
          x.set(0);
          y.set(0);
          onMouseLeave?.(e);
        }}
        whileTap={{ scale: 0.97 }}
        className={clsx(
          'relative inline-flex items-center justify-center rounded-full px-7 py-3.5 font-display text-base tracking-tight transition-colors duration-300 ease-silk',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-paper/70',
          variant === 'solid' && 'bg-paper text-ink hover:bg-paper/90',
          variant === 'outline' &&
            'border border-paper text-paper hover:bg-paper hover:text-ink',
          className,
        )}
        {...rest}
      >
        <span className="pointer-events-none relative z-10">{children}</span>
      </motion.button>
    );
  },
);
