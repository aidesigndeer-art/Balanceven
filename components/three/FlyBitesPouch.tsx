'use client';

import Image from 'next/image';
import { forwardRef, useEffect, useRef } from 'react';

export interface FlyBitesPouchProps {
  /**
   * No-op on the photo build. Retained so the prop shape matches the
   * earlier R3F component — callers don't change. If/when we ship a
   * real .glb we can branch back to that path here.
   */
  glbUrl?: string;
  /** Base CSS scale multiplier applied to the whole pouch group. */
  scale?: number;
  /** Per-frame cursor influence in [-1, 1] each axis. */
  cursor?: { x: number; y: number };
  /**
   * If provided, the pouch reads its target rotation (radians, 0–2π/3)
   * from this ref on every frame and uses it to crossfade between
   * front / three-quarter / side angle photos, and to amplify scale
   * + perspective tilt so the rotation reads as physical motion.
   * When omitted, the pouch shows the front angle with a multi-axis
   * idle breath and reacts to its own viewport scroll progress.
   */
  rotationYRef?: React.MutableRefObject<number>;
}

const FRONT_SRC = '/products/pouch-front.png';
const TQ_SRC = '/products/pouch-three-quarter.png';
const SIDE_SRC = '/products/pouch-side.png';

// PNGs are 2528 × 1684 (landscape 3:2) but the actual pouch only
// occupies the central column — left/right edges are solid #000
// padding. We render with `object-fit: cover` so the photo always
// fills the reserved slot (cropping the black side margins, which
// blend invisibly against the page bg). A small overscale still
// helps eat any vertical black padding when the slot is squarer.
const PHOTO_OVERSCALE = 1.08;

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Crossfade three image opacities across the GSAP 0–120° sweep. We
 * cut the range slightly inside its endpoints (5°/115°) so the front
 * and side angles get a clean "hold" phase before/after the crossfade,
 * which prevents a flickery double-fade right at the pin boundaries.
 */
function anglesFromRotation(radians: number) {
  const deg = (radians * 180) / Math.PI;
  const t = clamp01((deg - 5) / 110);
  const front = 1 - smoothstep(0, 0.5, t);
  const side = smoothstep(0.5, 1, t);
  const threeQuarter = Math.max(0, 1 - front - side);
  return { front, threeQuarter, side };
}

export function FlyBitesPouch({
  scale = 1,
  cursor = { x: 0, y: 0 },
  rotationYRef,
}: FlyBitesPouchProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const tqRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  // Latest cursor lives in a ref so the RAF loop doesn't restart on
  // every pointermove.
  const cursorRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor.x, cursor.y]);

  // Self-tracked viewport progress for the pouch's own bounding rect.
  // 0 when the pouch enters the viewport, 1 when it leaves; we read
  // it inside the RAF loop to drive entrance scale + parallax. This
  // makes the pouch feel alive even in Hero/Shop where there's no
  // GSAP pin driving it.
  const viewportProgressRef = useRef(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Where the pouch's centre sits in the viewport. 0 = entering
      // from the bottom, 1 = leaving from the top. Clamped so off-
      // screen values don't push transforms past sensible bounds.
      const centreY = rect.top + rect.height / 2;
      viewportProgressRef.current = clamp01(1 - centreY / vh);
    };
    update();
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Reduced motion: still show the pouch, just freeze every animation.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      if (innerRef.current) innerRef.current.style.transform = 'none';
      return;
    }

    let raf = 0;
    let lastT = performance.now();
    const smoothed = { x: 0, y: 0 };
    // Smoothed scroll progress so the parallax responds organically
    // instead of snapping with the scroll wheel.
    let smoothProgress = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      // Cursor lerp.
      smoothed.x = damp(smoothed.x, cursorRef.current.x, 5, dt);
      smoothed.y = damp(smoothed.y, cursorRef.current.y, 5, dt);

      // Scroll progress lerp.
      smoothProgress = damp(smoothProgress, viewportProgressRef.current, 4, dt);

      // ── Idle breath ──────────────────────────────────────────────
      // Three independent oscillators at decoupled frequencies so the
      // motion never reads as a single sine. Adds a Z breath (pouch
      // pushes gently forward and back through the perspective frustum)
      // on top of the existing X/Y bob and Z-axis tilt.
      const bobY = Math.sin(now * 0.00075) * 9;
      const bobX = Math.cos(now * 0.00045) * 2.5;
      const bobZ = Math.sin(now * 0.00055) * 22;          // forward/back breath
      const breathRotZ = Math.sin(now * 0.0005) * 1.4;

      // ── Rotation source ────────────────────────────────────────────
      // GSAP-driven during HeroPin, else a much subtler idle sway.
      const rotRad = rotationYRef
        ? rotationYRef.current
        : Math.sin(now * 0.0004) * 0.05;
      const rotDeg = (rotRad * 180) / Math.PI;

      // ── Cursor tilt + cursor-driven Z ───────────────────────────
      const tiltY = smoothed.x * 11;
      const tiltX = -smoothed.y * 8;
      // When the cursor is near the centre of the pouch, the pouch
      // comes forward toward the viewer; when the cursor drifts away,
      // it recedes. Reads as "the camera is paying attention".
      const cursorDist = Math.min(
        1,
        Math.sqrt(smoothed.x * smoothed.x + smoothed.y * smoothed.y),
      );
      const cursorZ = (1 - cursorDist) * 38;

      // ── Scroll-driven scale + parallax + Z dolly ──────────────────
      // Entrance: scale grows from 0.92 to 1.0 between progress 0 → 0.4.
      // Pin amplification: during HeroPin's rotation sweep, scale climbs
      // up to +12% AND the pouch dollies forward in Z, selling "the
      // camera is moving in as it orbits".
      const entranceScale = 0.92 + smoothstep(0, 0.4, smoothProgress) * 0.08;
      const pinAmplify = rotationYRef
        ? 1 + smoothstep(0, 1, rotRad / ((Math.PI * 2) / 3)) * 0.12
        : 1;
      const parallaxY = (smoothProgress - 0.5) * -36;
      // Scroll-driven Z bell — recedes at top and bottom of the
      // pouch's viewport pass, hits maximum forward depth at centre.
      // Independent of pin amplification so the two compose cleanly.
      const centreFactor = 1 - Math.abs(smoothProgress - 0.5) * 2;
      const scrollZ = Math.max(-30, centreFactor * 55 - 30);
      // Pin Z dolly — gradual forward push across the full rotation
      // sweep, peaking just before the side-profile angle.
      const pinZ = rotationYRef
        ? smoothstep(0, 1, rotRad / ((Math.PI * 2) / 3)) * 60
        : 0;

      const finalScale = scale * entranceScale * pinAmplify;
      const finalZ = bobZ + cursorZ + scrollZ + pinZ;

      if (innerRef.current) {
        innerRef.current.style.transform =
          `translate3d(${bobX.toFixed(2)}px, ${(bobY + parallaxY).toFixed(2)}px, ${finalZ.toFixed(2)}px) ` +
          `rotateX(${tiltX.toFixed(2)}deg) ` +
          `rotateY(${(rotDeg * 0.4 + tiltY).toFixed(2)}deg) ` +
          `rotateZ(${breathRotZ.toFixed(2)}deg) ` +
          `scale(${finalScale.toFixed(4)})`;
      }

      // Halo follows the pouch but with softer parallax so it reads
      // as the surrounding "studio glow" the camera is moving through.
      if (haloRef.current) {
        const haloLift = parallaxY * 0.6;
        const haloIntensity = 0.42 + smoothProgress * 0.18 + (pinAmplify - 1) * 0.6;
        haloRef.current.style.transform = `translate3d(${(bobX * 0.4).toFixed(2)}px, ${haloLift.toFixed(2)}px, 0)`;
        haloRef.current.style.opacity = haloIntensity.toFixed(3);
      }

      // Ground reflection sinks as the pouch rises during scroll,
      // strengthens slightly when the pouch rotates to side angle
      // (where the foil catches more "stage" light).
      if (groundRef.current) {
        const groundFade = clamp01(0.55 - smoothProgress * 0.35);
        const sideBoost = rotationYRef
          ? smoothstep(0.5, 1, rotRad / ((Math.PI * 2) / 3)) * 0.25
          : 0;
        groundRef.current.style.opacity = (groundFade + sideBoost).toFixed(3);
      }

      const ops = anglesFromRotation(rotRad);
      if (frontRef.current) frontRef.current.style.opacity = ops.front.toFixed(3);
      if (tqRef.current) tqRef.current.style.opacity = ops.threeQuarter.toFixed(3);
      if (sideRef.current) sideRef.current.style.opacity = ops.side.toFixed(3);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rotationYRef, scale]);

  return (
    <div
      ref={stageRef}
      aria-label="Fly Bites — Energy gummies, 18 count pouch"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ perspective: '1400px', perspectiveOrigin: '50% 45%' }}
    >
      {/* Soft radial halo behind the pouch — gives the impression of
          a studio backdrop catching foil reflection. Sits behind every
          image layer; opacity is driven by scroll + pin progress. */}
      <div
        ref={haloRef}
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(closest-side, rgba(170, 130, 255, 0.28) 0%, rgba(120, 180, 255, 0.18) 35%, rgba(255, 130, 200, 0.08) 60%, transparent 75%)',
          filter: 'blur(40px)',
          opacity: 0.45,
          willChange: 'opacity, transform',
        }}
      />

      <div
        ref={innerRef}
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translate3d(0, 0, 0) scale(0.92)',
          transformOrigin: '50% 55%',
          willChange: 'transform',
        }}
      >
        {/* Ground reflection — a soft elliptical smear under the pouch.
            Reads as the iridescent foil bouncing onto an unseen surface.
            Opacity is driven by scroll + rotation. */}
        <div
          ref={groundRef}
          aria-hidden="true"
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2"
          style={{
            width: '60%',
            height: '6%',
            background:
              'radial-gradient(50% 100% at 50% 50%, rgba(180,140,255,0.55), rgba(120,180,255,0.20) 55%, transparent 80%)',
            filter: 'blur(18px)',
            opacity: 0.45,
            willChange: 'opacity',
          }}
        />

        {/* Stack of angle photos. inset-0 fills the parent, scale
            adds a small overscale to nibble any residual padding.
            Inline transform avoids fighting Tailwind's translate
            utilities for ownership of the `transform` CSS property. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${PHOTO_OVERSCALE})`,
            transformOrigin: '50% 50%',
          }}
        >
          <PouchLayer ref={frontRef} src={FRONT_SRC} alt="Fly Bites pouch, front view" priority />
          <PouchLayer ref={tqRef} src={TQ_SRC} alt="Fly Bites pouch, three-quarter view" initialOpacity={0} />
          <PouchLayer ref={sideRef} src={SIDE_SRC} alt="Fly Bites pouch, side profile" initialOpacity={0} />
        </div>
      </div>
    </div>
  );
}

// Single image layer in the crossfade stack. The parent RAF loop
// mutates `opacity` on the wrapper div directly, so the ref is passed
// straight through without React state churn.
interface PouchLayerProps {
  src: string;
  alt: string;
  priority?: boolean;
  initialOpacity?: number;
}

const PouchLayer = forwardRef<HTMLDivElement, PouchLayerProps>(function PouchLayer(
  { src, alt, priority = false, initialOpacity = 1 },
  ref,
) {
  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{ opacity: initialOpacity, willChange: 'opacity' }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 48vw, 95vw"
        priority={priority}
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
        draggable={false}
      />
    </div>
  );
});

/**
 * @deprecated Renamed when the product line moved from Float Bites
 * (de-bloat) to Fly Bites (energy). Kept as an alias so older callers
 * still resolve.
 */
export const FloatBitesPouch = FlyBitesPouch;

/**
 * No-op on the photo build (the old R3F path used this to preload a
 * .glb). Kept exported so callers that imported it don't break.
 */
export const preloadPouchGlb = (_url: string) => {
  /* no-op */
};
