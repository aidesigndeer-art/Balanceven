'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color, Texture, Vector2 } from 'three';

/**
 * Holographic-foil ShaderMaterial.
 *
 * Approximates thin-film interference by cycling a 3-channel cosine
 * palette over view-angle dot product, then perturbs the phase with
 * high-frequency value noise to suggest crumpled foil. A Fresnel rim
 * pushes the silhouette toward white. The label texture (premultiplied
 * dark text over alpha) composites on top.
 *
 * No bona-fide thin-film physics here — the math is shaped to read
 * "iridescent" within the brand's blue / cyan / magenta / pink band.
 */
const HolographicMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uLabel: null as Texture | null,
    uLabelStrength: 1.0,
    uTint: new Color('#ffffff'),
    uHueShift: 0.0,
    uCursor: new Vector2(0, 0),
  },
  /* glsl */ `
    varying vec3 vWorldNormal;
    varying vec3 vViewDir;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  /* glsl */ `
    precision highp float;

    uniform float uTime;
    uniform sampler2D uLabel;
    uniform float uLabelStrength;
    uniform vec3 uTint;
    uniform float uHueShift;
    uniform vec2 uCursor;

    varying vec3 vWorldNormal;
    varying vec3 vViewDir;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    // Hash & value noise (Inigo Quilez style).
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p *= 2.02;
        a *= 0.5;
      }
      return v;
    }

    // 3-channel cosine palette cycling through cyan / magenta / pink / blue.
    vec3 iridescence(float t) {
      vec3 a = vec3(0.5, 0.5, 0.55);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(0.0, 0.18, 0.42); // phase offsets
      return a + b * cos(6.28318 * (c * t + d));
    }

    void main() {
      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(vViewDir);
      float NdotV = clamp(dot(N, V), 0.0, 1.0);

      // Crumple field — two octaves, second one very high frequency.
      float crumple = fbm(vUv * 6.0) * 0.55 + vnoise(vUv * 90.0) * 0.18;

      // Anisotropic horizontal seal band near the top (vUv.y -> ~0.96)
      float seal = smoothstep(0.94, 0.99, vUv.y) - smoothstep(0.99, 1.0, vUv.y);

      // Phase: combine view angle, crumple, slow drift, cursor parallax.
      float t = (1.0 - NdotV) * 0.85
              + crumple * 0.8
              + uTime * 0.03
              + uHueShift
              + (uCursor.x + uCursor.y) * 0.08;

      vec3 foil = iridescence(t) * uTint;

      // Fresnel rim pushes silhouette to white.
      float fresnel = pow(1.0 - NdotV, 2.5);
      foil = mix(foil, vec3(1.0), fresnel * 0.45);

      // Seal highlight.
      foil += seal * vec3(0.9);

      // Composite label (dark paths with alpha).
      vec4 label = texture2D(uLabel, vUv);
      float mask = label.a * uLabelStrength;
      vec3 col = mix(foil, label.rgb, mask);

      // Slight contrast lift to make the foil pop on dark bg.
      col = pow(col, vec3(0.95));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
);

extend({ HolographicMaterial: HolographicMaterialImpl });

export { HolographicMaterialImpl as HolographicMaterial };

// Augment R3F's JSX for the custom element.
declare module '@react-three/fiber' {
  interface ThreeElements {
    holographicMaterial: ReactThreeFiber.Object3DNode<
      InstanceType<typeof HolographicMaterialImpl>,
      typeof HolographicMaterialImpl
    >;
  }
}

// ReactThreeFiber import is type-only and erased; redeclare here for safety.
import type { ReactThreeFiber } from '@react-three/fiber';
