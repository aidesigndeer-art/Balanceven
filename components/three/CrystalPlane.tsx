'use client';

/**
 * CrystalPlane — a 3D plane painted with a VideoTexture, where the user's
 * scroll position drives both the video's playhead AND the plane's spatial
 * transforms. The video is never visible as an HTML video element; it exists
 * only as a material on a Three.js mesh.
 *
 * Pattern: Apple/Dyson scroll-scrub reveal. Scrolling forward dollies through
 * the 4-second clip; scrolling back rewinds it. Plane rotates and scales
 * subtly so the reveal reads as a 3D event, not just video playback.
 */

import { useVideoTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  /** A framer-motion MotionValue<number> in the range [0, 1]. */
  scrollProgress: MotionValue<number>;
  /** Path to the video file under /public/. */
  videoUrl: string;
  /** Plane width in world units. Height is derived assuming 16:9. */
  width?: number;
};

export function CrystalPlane({
  scrollProgress,
  videoUrl,
  width = 10,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useVideoTexture(videoUrl, {
    start: false,
    muted: true,
    loop: false,
    crossOrigin: 'anonymous',
    playsInline: true,
  });

  // Linear color → sRGB so the iridescent gradient renders true-to-source.
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  useFrame(() => {
    const t = scrollProgress.get();
    // Ease the raw 0→1 with a smoothstep so the reveal feels deliberate at
    // start and end, like a manual camera dolly rather than uniform motion.
    const eased = THREE.MathUtils.smoothstep(t, 0, 1);

    // 1) Seek the video to match scroll position.
    const video = texture.source.data as HTMLVideoElement | null;
    if (video && video.duration && Number.isFinite(video.duration)) {
      const targetTime = eased * video.duration;
      // Only seek when the delta is meaningful — reduces decode thrash.
      if (Math.abs(video.currentTime - targetTime) > 0.04) {
        video.currentTime = targetTime;
      }
    }

    // 2) Subtle spatial transforms on the plane itself. These give the
    //    illusion of a real 3D object (not just a flat video).
    if (meshRef.current) {
      // Rotate ±0.12 rad as scroll moves through the section.
      meshRef.current.rotation.y = (eased - 0.5) * 0.24;
      meshRef.current.rotation.x = (eased - 0.5) * 0.08;
      // Scale 0.92 → 1.10 as the form materializes.
      const scale = 0.92 + eased * 0.18;
      meshRef.current.scale.set(scale, scale, scale);
      // Drift Z forward slightly — adds to the dolly feel.
      meshRef.current.position.z = eased * 0.5;
    }
  });

  const height = (width * 9) / 16;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      {/* meshBasicMaterial preserves the video's own lighting/gradient
          without adding scene lighting on top. toneMapped: false keeps the
          iridescent cyan/pink pop true to the source. */}
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
