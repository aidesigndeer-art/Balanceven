'use client';

import { useEffect, useRef } from 'react';
import { Marquee } from '@/components/ui/Marquee';

const STACK_LINES = ['Fly', 'beyond', 'the crash.'] as const;
const MARQUEE_ITEMS = ['ENERGY', 'LIFT', 'NO CRASH', 'CLEAN FUEL', '18 COUNT', 'FLY BITES'] as const;

/**
 * Outro section — line-by-line stacked reveal of a closing statement
 * followed by a horizontal marquee. Each line is wrapped in an
 * overflow-clipped mask and slides up from below as the line enters
 * the viewport, using IntersectionObserver. Once revealed, the lines
 * stay; no scrub state to manage.
 */
export function Outro() {
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const elements = [...lineRefs.current, subRef.current].filter(
      (el): el is HTMLElement => el !== null,
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            // Per-line stagger via inline transition-delay (set on the
            // data attribute we read here). Once revealed, unobserve.
            const delay = Number(el.dataset.delay ?? 0);
            el.style.transitionDelay = `${delay}ms`;
            el.style.transform = 'translate3d(0, 0, 0)';
            el.style.opacity = '1';
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.35 },
    );

    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      className="relative bg-ink text-paper"
      data-theme="dark"
      aria-label="Closing statement"
    >
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-40 md:px-10 md:pb-32 md:pt-56">
        {/* Label */}
        <p
          ref={subRef}
          className="mb-12 font-body text-[11px] uppercase tracking-[0.32em] text-paper/55"
          data-delay="0"
          style={{
            opacity: 0,
            transform: 'translate3d(0, 14px, 0)',
            transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'opacity, transform',
          }}
        >
          A daily ritual, on your terms
        </p>

        {/* Stacked headline */}
        <h2 className="font-display tracking-tightest" aria-label={STACK_LINES.join(' ')}>
          {STACK_LINES.map((line, i) => (
            <span
              key={line}
              className="block overflow-hidden"
            >
              <span
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                data-delay={150 + i * 110}
                className="block text-[clamp(4rem,14vw,12rem)]"
                style={{
                  opacity: 0,
                  transform: 'translate3d(0, 110%, 0)',
                  transition:
                    'opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1), transform 0.95s cubic-bezier(0.22, 1, 0.36, 1)',
                  willChange: 'opacity, transform',
                }}
              >
                {line}
              </span>
            </span>
          ))}
        </h2>
      </div>

      {/* Closing marquee */}
      <Marquee items={MARQUEE_ITEMS} duration={36} />
    </section>
  );
}
