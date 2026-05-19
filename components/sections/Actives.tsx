'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface Active {
  index: string;          // "01", "02", ...
  name: string;
  dose: string;
  detail: string;
  /** Big background word, set quietly behind the panel. */
  whisper: string;
}

const ACTIVES: readonly Active[] = [
  {
    index: '01',
    name: 'Caffeine',
    dose: '75 mg',
    detail:
      'Roughly one espresso. Enough to feel the lift without the jitter — paired with L-Theanine so the curve stays clean.',
    whisper: 'LIFT',
  },
  {
    index: '02',
    name: 'L-Theanine',
    dose: '50 mg',
    detail:
      'The reason caffeine here reads as focus, not anxiety. Smooths the peak and stretches the runway.',
    whisper: 'FOCUS',
  },
  {
    index: '03',
    name: 'Vitamin B12',
    dose: '100% DV',
    detail:
      'Methylcobalamin form — the body actually uses it. Plugs into energy metabolism at the cellular level.',
    whisper: 'FUEL',
  },
  {
    index: '04',
    name: 'Niacin',
    dose: '100% DV',
    detail:
      'B3, the long-tail energy vitamin. Keeps the lift steady through the back half of the curve.',
    whisper: 'STEADY',
  },
] as const;

/**
 * Pinned, scrubbed carousel through the four actives. The whole
 * section pins for ~4 viewport heights and we map scroll progress to
 * a fractional panel index in [0, 4). Each panel reads its opacity
 * and a small Y offset from the distance between progress and panel
 * index — smooth crossfade with a touch of slide.
 *
 * Reduced motion: render all four as a static stack instead of pinning.
 */
export function Actives() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indexBigRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
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

    const N = ACTIVES.length;

    const applyState = (progress: number) => {
      // progress is [0, 1] across the pinned scroll distance. Map to
      // a fractional index in [0, N - 1] so the LAST panel gets the
      // full hold at the end (no fade-out into an empty fifth state).
      const idx = progress * (N - 1);

      panelRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = Math.abs(idx - i);
        // Plateau over ±0.5, fade out beyond.
        const op = Math.max(0, 1 - d);
        const slide = (idx - i) * -22; // px
        el.style.opacity = op.toFixed(3);
        el.style.transform = `translate3d(0, ${slide.toFixed(2)}px, 0)`;
      });

      // Big background index number: snap to the nearest panel,
      // crossfading on the half-step.
      if (indexBigRef.current) {
        // Show whichever index has the strongest opacity right now.
        const nearest = Math.min(N - 1, Math.max(0, Math.round(idx)));
        indexBigRef.current.textContent = ACTIVES[nearest].whisper;
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress.toFixed(3)})`;
      }
    };

    applyState(0);

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: `+=${(N - 0.5) * 100}%`,
      pin: stickyRef.current,
      pinSpacing: true,
      scrub: 0.6,
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
        aria-label="Actives (reduced-motion fallback)"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <p className="mb-12 font-body text-[11px] uppercase tracking-[0.32em] text-paper/55">
            Inside Fly Bites
          </p>
          <ul className="space-y-24">
            {ACTIVES.map((a) => (
              <li key={a.index}>
                <div className="font-display text-sm tracking-[0.32em] text-paper/55">
                  {a.index} / {String(ACTIVES.length).padStart(2, '0')}
                </div>
                <h3 className="mt-3 font-display text-section tracking-tighter">{a.name}</h3>
                <div className="mt-3 font-display text-2xl tracking-tight text-paper/70">{a.dose}</div>
                <p className="mt-6 max-w-xl font-body text-base text-paper/75">{a.detail}</p>
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
      id="science"
      className="relative bg-ink text-paper"
      data-theme="dark"
      aria-label="Inside Fly Bites — actives breakdown"
    >
      <div ref={stickyRef} className="relative h-screen overflow-hidden">
        {/* Whisper headline behind the panels — same vertical centre
            as the panels, but at huge type. The text content swaps
            between actives on each step. */}
        <div
          ref={indexBigRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[clamp(8rem,28vw,28rem)] leading-none tracking-tightest text-paper/[0.04]"
        >
          LIFT
        </div>

        <div className="relative mx-auto flex h-screen max-w-7xl flex-col px-6 pt-28 md:px-10 md:pt-36">
          {/* Section label */}
          <div className="flex items-baseline justify-between">
            <p className="font-body text-[11px] uppercase tracking-[0.32em] text-paper/55">
              Inside Fly Bites
            </p>
            <p className="font-display text-sm tracking-[0.22em] text-paper/55">
              Four actives
            </p>
          </div>

          {/* Stacked panels — only one is fully visible at a time. */}
          <div className="relative mt-12 flex-1 md:mt-20">
            {ACTIVES.map((a, i) => (
              <div
                key={a.index}
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                className="absolute inset-0 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10"
                style={{
                  opacity: i === 0 ? 1 : 0,
                  willChange: 'opacity, transform',
                }}
              >
                {/* Index — huge tabular number on the left. */}
                <div className="md:col-span-5">
                  <div className="font-display text-[clamp(7rem,18vw,16rem)] tabular-nums">
                    {a.index}
                    <span className="ml-2 align-top font-display text-2xl tracking-tight text-paper/45 md:text-3xl">
                      /{String(ACTIVES.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Detail column */}
                <div className="md:col-span-7 md:pt-6">
                  <h3 className="font-display text-section tracking-tighter">
                    {a.name}
                  </h3>
                  <div className="mt-4 font-display text-3xl tracking-tight text-paper/70 md:text-4xl">
                    {a.dose}
                  </div>
                  <p className="mt-8 max-w-md font-body text-base leading-relaxed text-paper/75 md:text-lg">
                    {a.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom progress bar — scaleX from 0 to 1 across the pin. */}
          <div className="mb-12 mt-12 flex items-center gap-6 md:mb-16">
            <span className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/55">
              Scroll
            </span>
            <div className="relative h-px flex-1 overflow-hidden bg-paper/15">
              <div
                ref={progressBarRef}
                className="absolute inset-y-0 left-0 origin-left bg-paper"
                style={{ width: '100%', transform: 'scaleX(0)', willChange: 'transform' }}
              />
            </div>
            <span className="font-body text-[11px] uppercase tracking-[0.28em] text-paper/55">
              04 actives
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
