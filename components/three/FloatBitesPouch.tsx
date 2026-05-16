'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  CanvasTexture,
  type Group,
  type Mesh,
  type ShaderMaterial,
  MathUtils,
  PlaneGeometry,
  Vector2,
} from 'three';
import { HolographicMaterial } from './HolographicMaterial';

export interface FloatBitesPouchProps {
  /**
   * Optional path to a .glb. If provided, we use that mesh; otherwise
   * we fall back to procedural plane geometry with the holographic
   * shader, so designers can drop in a real model later without code
   * changes beyond the URL.
   */
  glbUrl?: string;
  /** World-space scale multiplier. */
  scale?: number;
  /** Per-frame cursor influence in [-1, 1] each axis. */
  cursor?: { x: number; y: number };
}

const POUCH_W = 1.7;
const POUCH_H = 2.15;

/**
 * Front-facing pouch geometry: a high-segment PlaneGeometry with each
 * vertex displaced along z by a layered noise field, plus a gentle
 * convex curvature down its long axis to suggest the "belly" of a
 * stand-up pouch.
 */
function makeProceduralGeometry() {
  const geo = new PlaneGeometry(POUCH_W, POUCH_H, 96, 144);
  const pos = geo.attributes.position;
  // Deterministic noise — small implementation so we don't pull a dep.
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    return MathUtils.lerp(
      MathUtils.lerp(hash(xi, yi), hash(xi + 1, yi), u),
      MathUtils.lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u),
      v,
    );
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Layered crumple — coarse + fine, modest amplitude.
    const n1 = noise(x * 3.5, y * 3.5) - 0.5;
    const n2 = noise(x * 16.0, y * 16.0) - 0.5;
    const crumple = n1 * 0.045 + n2 * 0.014;
    // Convex belly: parabolic in x with mild attenuation toward the
    // sealed crimp at the top and toward the gusset at the bottom.
    const belly = (1 - (x / (POUCH_W / 2)) ** 2) * 0.10;
    const topFade = 1 - Math.max(0, (y - 0.6) / 0.45);
    const bottomFade = 1 - Math.max(0, (-y - 0.85) / 0.2);
    pos.setZ(i, crumple + belly * topFade * bottomFade);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Loads /textures/pouch-label.svg, rasterizes to a canvas at 2K, and
 * returns the canvas texture (memoized). Returns null on the first
 * render pass and triggers an update once the SVG is decoded.
 */
function useLabelTexture(url = '/textures/pouch-label.svg'): CanvasTexture | null {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      // Match SVG viewBox aspect at 2K width.
      const targetW = 2048;
      const aspect = img.height / img.width;
      canvas.width = targetW;
      canvas.height = Math.round(targetW * aspect);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const tex = new CanvasTexture(canvas);
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.onerror = (e) => {
      console.warn('[FloatBitesPouch] label texture failed to load:', e);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}

function ProceduralPouch({
  cursor,
}: {
  cursor: { x: number; y: number };
}) {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<ShaderMaterial>(null);
  const label = useLabelTexture();
  const geometry = useMemo(() => makeProceduralGeometry(), []);

  // Cleanup geometry when unmounting to avoid leaks across HMR.
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Smoothed cursor — pouch springs to follow rather than snapping.
  const smoothed = useRef(new Vector2(0, 0));

  useFrame((_, dt) => {
    if (!groupRef.current || !matRef.current) return;
    // Damp cursor lerp.
    smoothed.current.x = MathUtils.damp(smoothed.current.x, cursor.x, 4, dt);
    smoothed.current.y = MathUtils.damp(smoothed.current.y, cursor.y, 4, dt);

    const g = groupRef.current;
    const baseY = performance.now() * 0.00018; // slow idle spin
    g.rotation.y = baseY + smoothed.current.x * 0.18;
    g.rotation.x = -smoothed.current.y * 0.14;
    g.position.y = Math.sin(performance.now() * 0.0008) * 0.04;

    const mat = matRef.current as unknown as {
      uTime: number;
      uCursor: Vector2;
      uLabel: CanvasTexture | null;
    };
    mat.uTime += dt;
    mat.uCursor.copy(smoothed.current);
    if (label && mat.uLabel !== label) mat.uLabel = label;
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <holographicMaterial ref={matRef} />
      </mesh>
    </group>
  );
}

function GlbPouch({ glbUrl, cursor }: { glbUrl: string; cursor: { x: number; y: number } }) {
  const { scene } = useGLTF(glbUrl);
  const groupRef = useRef<Group>(null);
  const matRef = useRef<ShaderMaterial | null>(null);
  const label = useLabelTexture();
  const smoothed = useRef(new Vector2(0, 0));

  // Replace standard materials in the loaded scene with our holographic shader.
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        // Bind our shader; the imported mesh keeps its UVs/normals.
        mesh.material = new HolographicMaterial();
        matRef.current = mesh.material as ShaderMaterial;
      }
    });
  }, [scene]);

  useFrame((_, dt) => {
    if (!groupRef.current || !matRef.current) return;
    smoothed.current.x = MathUtils.damp(smoothed.current.x, cursor.x, 4, dt);
    smoothed.current.y = MathUtils.damp(smoothed.current.y, cursor.y, 4, dt);
    const g = groupRef.current;
    g.rotation.y = performance.now() * 0.00018 + smoothed.current.x * 0.18;
    g.rotation.x = -smoothed.current.y * 0.14;
    g.position.y = Math.sin(performance.now() * 0.0008) * 0.04;
    const mat = matRef.current as unknown as {
      uTime: number;
      uCursor: Vector2;
      uLabel: CanvasTexture | null;
    };
    mat.uTime += dt;
    mat.uCursor.copy(smoothed.current);
    if (label && mat.uLabel !== label) mat.uLabel = label;
  });

  return <primitive ref={groupRef} object={scene} />;
}

export function FloatBitesPouch({
  glbUrl,
  scale = 1,
  cursor = { x: 0, y: 0 },
}: FloatBitesPouchProps) {
  return (
    <group scale={scale}>
      <Suspense fallback={null}>
        {glbUrl ? (
          <GlbPouch glbUrl={glbUrl} cursor={cursor} />
        ) : (
          <ProceduralPouch cursor={cursor} />
        )}
      </Suspense>
    </group>
  );
}

// Preload hook so a designer-supplied .glb can be primed at route entry.
export const preloadPouchGlb = (url: string) => useGLTF.preload(url);
