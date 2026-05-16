'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Mesh, Vector3 } from 'three';

const GUMMY_COLORS = [
  '#f8d1ea', // pastel pink (palette stop c2)
  '#b3f0f5', // soft cyan (palette stop c1)
  '#ffc9a0', // warm peach — third hue for spatial variety
] as const;

const COUNT = 14;
const BOUND = 1.8;
const REPEL_RADIUS = 0.65;

interface Particle {
  pos: Vector3;
  vel: Vector3;
  spin: Vector3;
  color: string;
  scale: number;
}

interface FlyingGummiesProps {
  /** Normalized cursor in [-1, 1] on each axis, parent-space. */
  cursor: { x: number; y: number };
}

/**
 * Translucent gummy particles drifting around the pouch.
 * Per-frame: each particle applies its own velocity scaled by current
 * scroll velocity, gets pushed away from the projected cursor position
 * when close, has light damping + jitter, and wraps inside ±BOUND on
 * x/y so particles never leave the visible volume.
 *
 * Position is mutated directly on the Mesh refs — no React state
 * touches the render loop, so 14 particles cost ~nothing at 60 fps.
 */
export function FlyingGummies({ cursor }: FlyingGummiesProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      // Pseudo-random but deterministic spread on initial layout.
      const a = (i / COUNT) * Math.PI * 2;
      const r = 0.9 + ((i * 0.37) % 1) * 0.9;
      return {
        pos: new Vector3(
          Math.cos(a) * r,
          Math.sin(a) * r * 0.7,
          (Math.random() - 0.5) * 1.2,
        ),
        vel: new Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.04,
        ),
        spin: new Vector3(
          0.3 + Math.random() * 0.6,
          0.3 + Math.random() * 0.6,
          0.0,
        ),
        color: GUMMY_COLORS[i % GUMMY_COLORS.length],
        scale: 0.7 + Math.random() * 0.7,
      };
    });
  }, []);

  const meshes = useRef<(Mesh | null)[]>([]);
  const scrollVel = useRef(0);

  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      if (dt > 0.005) {
        scrollVel.current = Math.abs(window.scrollY - lastY) / dt;
        lastY = window.scrollY;
        lastT = now;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame((_, dt) => {
    // Scroll factor: 1.0 idle, up to ~3.5x while flicking the wheel.
    const scrollFactor = 1 + Math.min(scrollVel.current / 800, 2.5);
    scrollVel.current *= 0.9;

    const cx = cursor.x * 1.6;
    const cy = cursor.y * 1.4;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const mesh = meshes.current[i];
      if (!mesh) continue;

      // Cursor repel — only when close, force falls off with distance.
      const dx = p.pos.x - cx;
      const dy = p.pos.y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < REPEL_RADIUS * REPEL_RADIUS) {
        const dist = Math.sqrt(dist2) || 1;
        const strength = (1 - dist / REPEL_RADIUS) * 3.0;
        p.vel.x += (dx / dist) * strength * dt;
        p.vel.y += (dy / dist) * strength * dt;
      }

      // Tiny jitter so particles don't lock into static orbits.
      p.vel.x += (Math.random() - 0.5) * 0.0015;
      p.vel.y += (Math.random() - 0.5) * 0.0015;

      // Drift + scroll scaling.
      p.pos.x += p.vel.x * scrollFactor * dt * 60;
      p.pos.y += p.vel.y * scrollFactor * dt * 60;
      p.pos.z += p.vel.z * scrollFactor * dt * 60;

      // Damping.
      p.vel.x *= 0.985;
      p.vel.y *= 0.985;
      p.vel.z *= 0.99;

      // Soft wrap inside the visible volume.
      if (p.pos.x > BOUND) p.pos.x = -BOUND;
      else if (p.pos.x < -BOUND) p.pos.x = BOUND;
      if (p.pos.y > BOUND) p.pos.y = -BOUND;
      else if (p.pos.y < -BOUND) p.pos.y = BOUND;
      if (p.pos.z > 0.9) p.pos.z = -0.9;
      else if (p.pos.z < -0.9) p.pos.z = 0.9;

      mesh.position.copy(p.pos);
      mesh.rotation.x += p.spin.x * dt;
      mesh.rotation.y += p.spin.y * dt;
    }
  });

  return (
    <group>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          scale={p.scale}
        >
          <torusGeometry args={[0.07, 0.028, 14, 32]} />
          <meshStandardMaterial
            color={p.color}
            transparent
            opacity={0.58}
            roughness={0.22}
            metalness={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}
