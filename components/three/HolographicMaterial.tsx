'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color, Texture, Vector2 } from 'three';

/**
 * Holographic-foil ShaderMaterial.
 *
 * Drives the iridescent foil surface of the Fly Bites stand-up pouch.
 * The pouch silhouette (crimp peaks, gusset flare, hang hole, etc.)
 * is now defined in geometry — this shader only does:
 *   - foil shading (saturated cyan/magenta/violet/pink/mint cycle)
 *   - UV-space discards for the hang hole and tear-here notch
 *   - faint side seams along the vertical edges
 *   - label composite over the foil from a 2400×1800 texture whose
 *     left half is the front art and right half is the back art
 *
 * Reference: the pouch label texture is 4:3 (front + back side by side).
 * UV mapping done in geometry: front in u ∈ [0, 0.5], back mirrored in
 * u ∈ [0.5, 1.0]. Crimp band and gusset map to label-transparent areas.
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

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
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

    // ---- Noise --------------------------------------------------------
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
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

    // ---- Palette ------------------------------------------------------
    // Five-stop iridescent cycle tuned to match the Gemini reference
    // photos — saturated cyan -> magenta -> violet -> pink -> mint,
    // looping seamlessly back to cyan. Smoothstep blending keeps the
    // transitions buttery while preserving channel deltas of ~0.4 so
    // the cycle reads strongly even on the smaller Hero pouch.
    vec3 holoIris(float t) {
      t = fract(t);
      vec3 c0 = vec3(0.46, 0.86, 0.98);  // saturated cyan
      vec3 c1 = vec3(0.92, 0.48, 0.86);  // magenta
      vec3 c2 = vec3(0.62, 0.38, 0.95);  // violet
      vec3 c3 = vec3(1.00, 0.62, 0.78);  // warm pink
      vec3 c4 = vec3(0.60, 0.96, 0.86);  // mint
      float seg = t * 5.0;
      float i = floor(seg);
      float f = smoothstep(0.0, 1.0, fract(seg));
      vec3 a, b;
      if      (i < 1.0) { a = c0; b = c1; }
      else if (i < 2.0) { a = c1; b = c2; }
      else if (i < 3.0) { a = c2; b = c3; }
      else if (i < 4.0) { a = c3; b = c4; }
      else              { a = c4; b = c0; }
      return mix(a, b, f);
    }

    // ---- UV-space cutouts --------------------------------------------
    // Hang hole — a small circle punched through the crimp band.
    // Front-face vUv (label u ∈ [0, 0.5]) hole centre is at (0.25, 0.95).
    // Back-face vUv (label u ∈ [0.5, 1.0]) hole centre is at (0.75, 0.95).
    float hangHoleSdf(vec2 uv) {
      vec2 frontC = vec2(0.25, 0.955);
      vec2 backC  = vec2(0.75, 0.955);
      float dF = length(uv - frontC) - 0.015;
      float dB = length(uv - backC)  - 0.015;
      return min(dF, dB);
    }

    // Tear-here notch — a small V cut on the right edge of the front
    // face (vUv.x ~ 0.49 at the seam between front and back) near the
    // top of the body, just below the crimp band.
    float tearNotchSdf(vec2 uv) {
      // Distance to a tiny axis-aligned slot at the side seam.
      vec2 c = vec2(0.495, 0.85);
      vec2 d = abs(uv - c) - vec2(0.012, 0.008);
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    }

    void main() {
      // ---- Cutouts ------------------------------------------------
      if (hangHoleSdf(vUv) < 0.0) discard;
      if (tearNotchSdf(vUv) < 0.0) discard;

      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(vViewDir);
      float NdotV = clamp(dot(N, V), 0.0, 1.0);

      // ---- Iridescent phase ---------------------------------------
      // Drive hue with view angle + a coarse flow field + slow drift.
      // High-freq noise stays out of hue (luminance only) so the foil
      // reads as crumpled mylar, not a heat map.
      float coarse = fbm(vUv * 3.6);
      float micro  = vnoise(vUv * 95.0);

      float t = (1.0 - NdotV) * 0.42
              + coarse * 0.95
              + uTime * 0.026
              + uHueShift
              + (uCursor.x * 0.07 + uCursor.y * 0.05);

      vec3 foil = holoIris(t) * uTint;

      // Micro: ±10% luminance variation, no hue shift — reads as
      // crumple highlights catching the studio light.
      foil *= 0.90 + (micro - 0.5) * 0.20;

      // ---- Fresnel rim --------------------------------------------
      // Stronger than before so the silhouette has a clear bright edge
      // — matches the soft highlight cast around the gusset and crimp
      // peaks in the reference photos.
      float fresnel = pow(1.0 - NdotV, 2.4);
      foil = mix(foil, vec3(1.0), fresnel * 0.34);

      // ---- Side seams --------------------------------------------
      // Thin darker stripe along the side seams where the front and
      // back faces meet. Two seams: one at the front-face right edge
      // (vUv.x ≈ 0.5) and one at the back-face right edge (vUv.x ≈ 1.0
      // and 0.0). Same intensity on both, restricted to the body band
      // so it doesn't bleed into the crimp or gusset.
      float seamA = smoothstep(0.495, 0.499, vUv.x) - smoothstep(0.501, 0.505, vUv.x);
      float seamB = step(vUv.x, 0.005) + step(0.995, vUv.x);
      float bodyMask = smoothstep(0.06, 0.10, vUv.y) - smoothstep(0.88, 0.92, vUv.y);
      float seam = clamp(seamA + seamB, 0.0, 1.0) * bodyMask;
      foil = mix(foil, foil * 0.78, seam * 0.55);

      // ---- Crimp shadow band -------------------------------------
      // A subtle darker band just below the crimp peaks reads as the
      // sealed top — the place where front and back are heat-bonded.
      float crimpShadow = smoothstep(0.87, 0.90, vUv.y) - smoothstep(0.96, 0.99, vUv.y);
      foil = mix(foil, foil * 0.86, crimpShadow * 0.32);

      // ---- Label composite ---------------------------------------
      vec4 label = texture2D(uLabel, vUv);
      float mask = label.a * uLabelStrength;
      vec3 col = mix(foil, label.rgb, mask);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
);

extend({ HolographicMaterial: HolographicMaterialImpl });

export { HolographicMaterialImpl as HolographicMaterial };

declare module '@react-three/fiber' {
  interface ThreeElements {
    holographicMaterial: ReactThreeFiber.Object3DNode<
      InstanceType<typeof HolographicMaterialImpl>,
      typeof HolographicMaterialImpl
    >;
  }
}

import type { ReactThreeFiber } from '@react-three/fiber';
