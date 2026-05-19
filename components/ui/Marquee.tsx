'use client';

import clsx from 'clsx';

interface MarqueeProps {
  /** Items rendered between separators in the strip. */
  items: readonly string[];
  /** Seconds for one full loop. Lower = faster. Default 28s. */
  duration?: number;
  /** Reverse direction. */
  reverse?: boolean;
  /** Outer wrapper class for borders/padding overrides. */
  className?: string;
  /** Inline separator between items. */
  separator?: string;
}

/**
 * Infinite horizontal text scroller. The strip duplicates its content
 * once and slides exactly one strip's width per loop — so the cycle
 * point lands on a visually identical character, never producing a
 * visible "jump". Pure CSS animation: no JS frame loop and no Lenis
 * interaction, which keeps it cheap.
 */
export function Marquee({
  items,
  duration = 28,
  reverse = false,
  className,
  separator = '·',
}: MarqueeProps) {
  const strip = items.map((item, i) => (
    <span key={i} className="inline-flex items-center">
      <span>{item}</span>
      <span className="px-8 text-paper/40" aria-hidden="true">
        {separator}
      </span>
    </span>
  ));

  return (
    <div
      className={clsx(
        'pointer-events-none relative overflow-hidden border-y border-paper/10 py-6 md:py-8',
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="flex whitespace-nowrap font-display text-3xl tracking-tight md:text-5xl"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
          willChange: 'transform',
        }}
      >
        {/* Two identical strips for a seamless loop — the animation
            translates by exactly one strip's width. */}
        <div className="flex shrink-0 pr-8">{strip}</div>
        <div className="flex shrink-0 pr-8">{strip}</div>
      </div>
    </div>
  );
}
