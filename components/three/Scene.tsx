'use client';

import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { type ReactNode, Suspense } from 'react';

interface SceneProps {
  children: ReactNode;
  /** CSS class on the wrapping div. */
  className?: string;
}

/**
 * Shared 3D canvas wrapper. Black background, capped DPR for perf,
 * neutral studio HDRI so the holographic shader has something to
 * sample for highlights. All sections drop their meshes inside.
 */
export function Scene({ children, className }: SceneProps) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.6], fov: 32 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[2.5, 3, 2.5]} intensity={1.2} />
        <directionalLight position={[-2, -1, 1.5]} intensity={0.4} />
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.55} />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
