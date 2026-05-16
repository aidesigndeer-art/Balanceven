'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Scene } from '@/components/three/Scene';
import { FloatBitesPouch } from '@/components/three/FloatBitesPouch';

const HEADLINES = ['Bloat, gone.', 'Digestion, dialed in.', 'Float Bites.'] as const;

/**
 * For a given scroll progress in [0, 1], return the headline at `index`
 * opacity in [0, 1]. Each headline owns 1/3 of the scroll distance with
 * a peak plateau and short symmetric fade ramps on either side; the
 * fade tails overlap with the adjacent headlines so the swap reads as
 * a crossfade rather than a hard switch.
 */
function headlineOpacity(progress: number, index: number) {
  const center = (index + 0.5) / HEADLINES.length;
  const peakHalfWidth = 0.13;
  const fadeWidth = 0.10;
  const dist = Math.abs(progress - center);
  if (dist < peakHalfWidth) return 1;
  const fade = (dist - peakHalfWidth) / fadeWidth;
  return Math.max(0, 1 - fade);
}

/**
 * §6.4 — Pinned hero-scroll sequence.
 *
 * Pins the section for ~3 viewport heights of scroll. Across the pin:
 *   - the pouch rotates 0 -> 120° on Y
 *   - three headlines crossfade in sequence
 *
 * The pouch reads its target rotation from `rotationRef` every frame
 * (set inside ScrollTrigger's onUpdate), and headline opacity/transform
 * are written directly to DOM refs — no React state churn during scroll.
 *
 * On `prefers-reduced-motion: reduce`, the pin is skipped entirely and
 * all three headlines render in a static stack instead.
 */
export function HeroPin() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rotationRef = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced || !sectionRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const applyState = (progress: number) => {
      // 0 -> 2π/3 (120°)
      rotationRef.current = progress * ((Math.PI * 2) / 3);
      headlineRefs.current.forEach((el, i) => {
        if (!el) return;
        const op = headlineOpacity(progress, i);
        el.style.opacity = String(op);
        el.style.transform = `translateY(${(1 - op) * 24}px)`;
      });
    };

    // Seed initial state so the first headline is visible before the
    // user has scrolled past the section's top.
    applyState(0);

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: '+=300%',
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => applyState(self.progress),
    });

    return () => {
      trigger.kill();
    };
  }, [reduced]);

  if (reduced) {
    return (
      <section
        className="relative bg-ink py-32 text-paper"
        data-theme="dark"
        aria-label="Hero pinned sequence (reduced-motion fallback)"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <ul className="space-y-10">
            {HEADLINES.map((h, i) => (
              <li
                key={i}
                className="font-display text-mega leading-[0.92] tracking-tighter"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-ink text-paper"
      data-theme="dark"
    >
      <div className="mx-auto grid h-screen max-w-7xl grid-cols-1 px-6 md:grid-cols-12 md:gap-8 md:px-10">
        {/* Headline column — three spans stacked at the same grid cell;
            CSS grid sizes the cell to the tallest, so any wrap on the
            longer line still vertically centres correctly. */}
        <div className="relative flex items-center md:col-span-7">
          <div className="grid w-full">
            {HEADLINES.map((h, i) => (
              <span
                key={i}
                ref={(el) => {
                  headlineRefs.current[i] = el;
                }}
                className="font-display text-mega leading-[0.92] tracking-tighter"
                style={{
                  gridColumn: '1 / 2',
                  gridRow: '1 / 2',
                  opacity: 0,
                  willChange: 'opacity, transform',
                  transform: 'translateY(24px)',
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Pouch column — same canvas geometry as the hero, driven by
            rotationRef instead of its idle spin. */}
        <div className="relative h-[58vh] w-full md:col-span-5 md:h-full md:py-20 md:pr-8">
          <Scene className="absolute inset-0 h-full w-full">
            <FloatBitesPouch rotationYRef={rotationRef} />
          </Scene>
        </div>
      </div>
    </section>
  );
}
