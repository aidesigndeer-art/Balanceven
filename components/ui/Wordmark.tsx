'use client';

import clsx from 'clsx';
import { useTheme } from '@/lib/theme';

export type WordmarkVariant = 'black' | 'white' | 'auto';

interface WordmarkProps {
  variant?: WordmarkVariant;
  className?: string;
  /** CSS height value, e.g. "1.5rem", "32px", "8vw". Width auto-scales. */
  height?: string;
  /** Optional aria-label override. */
  label?: string;
}

/**
 * Renders the balanceven wordmark from the pre-baked outline SVG.
 *
 * `auto` (default) picks white on dark surfaces and vice versa,
 * reading from the nearest ThemeProvider. Pass `black` or `white`
 * to force a variant — useful inside section overrides.
 */
export function Wordmark({
  variant = 'auto',
  className,
  height = '1em',
  label = 'balanceven',
}: WordmarkProps) {
  const { theme } = useTheme();
  const resolved: 'black' | 'white' =
    variant === 'auto' ? (theme === 'dark' ? 'white' : 'black') : variant;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logo/balanceven-${resolved}.svg`}
      alt={label}
      className={clsx('block select-none', className)}
      style={{ height, width: 'auto' }}
      draggable={false}
    />
  );
}
