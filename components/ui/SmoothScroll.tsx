'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * App-level smooth scroll. Mounts once at the root and drives Lenis on
 * a single RAF loop, with GSAP's ticker authoritatively pulling it
 * forward each frame. ScrollTrigger updates on every `scroll` event
 * so any pinned section (HeroPin, future pins) stays in lockstep.
 *
 * Why a custom RAF instead of two of them:
 *   - Lenis ships its own RAF, but if GSAP also runs a separate ticker
 *     they can drift a fraction of a frame and the pinned pouch
 *     "judders" while crossfading. Driving Lenis from gsap.ticker
 *     keeps both on the same heartbeat.
 *   - lagSmoothing(0) prevents GSAP from auto-catching-up after a
 *     missed frame, which would otherwise compound the judder.
 *
 * Respects `prefers-reduced-motion`: smooth scrolling is disabled.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // 1 = native wheel speed. Slightly lower so the page feels weighty.
      wheelMultiplier: 0.95,
      touchMultiplier: 1.15,
      // Don't smooth on touch — feels worse than native momentum.
      smoothWheel: true,
    });

    // Refresh ScrollTrigger on every Lenis scroll so pins line up.
    lenis.on('scroll', ScrollTrigger.update);

    // Pump Lenis from the GSAP ticker (time is in seconds, Lenis wants ms).
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
