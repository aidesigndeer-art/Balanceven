'use client';

/**
 * Reveal — a sensory section between Marquee and HeroPin.
 *
 * Structure: a tall (250vh) outer wrapper containing a sticky h-screen inner
 * frame. The R3F Canvas inside that frame holds a CrystalPlane whose video
 * texture is scrubbed by the user's scroll position through the wrapper.
 *
 * Net effect: as the user scrolls through this section, an iridescent
 * crystalline form materializes from pure black, scaling and rotating
 * subtly. Scrolling backward rewinds the reveal. Scrolling past it
 * transitions cleanly into HeroPin.
 */

import { Canvas } from '@react-three/fiber';
import { useScroll } from 'framer-motion';
import { Suspense, useRef } from 'react';
import { CrystalPlane } from '@/components/three/CrystalPlane';

export function Reveal() {
  const sectionRef = useRef<HTMLElement>(null);

  // Map the wrapper's scroll position (from when its top hits the viewport
  // top to when its bottom hits the viewport bottom) to a 0→1 progress.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  return (
    <section
      ref={sectionRef}
      // 250vh gives the 4-second video room to breathe across scroll. The
      // sticky inner stays pinned to the viewport while the user scrolls
      // through this section's tall outer space.
      className="relative h-[250vh] bg-ink"
      data-theme="dark"
      aria-label="Iridescent crystalline form materializing from black"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink">
        <Canvas
          // Camera distance + fov chosen so the 10-wide plane fills the
          // viewport with a touch of breathing room on the sides.
          camera={{ position: [0, 0, 8.5], fov: 36 }}
          dpr={[1, 2]}
          gl={{
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
          }}
        >
          {/* Explicit black background — never let the page show through. */}
          <color attach="background" args={['#000000']} />
          <Suspense fallback={null}>
            <CrystalPlane
              scrollProgress={scrollYProgress}
              videoUrl="/videos/reveal.mp4"
              width={10}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}
