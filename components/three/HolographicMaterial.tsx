'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color, Texture, Vector2 } from 'three';

/**
 * Holographic-foil ShaderMaterial.
 *
 * Renders a stand-up zip pouch silhouette (SDF: rounded body + small
 * hangtag tab with a hole + gusset strip at the bottom) and shades it
 * with a pastel iridescent foil — soft cyan / blue / pink / magenta —
 * driven by view angle and a coarse fbm field. A second, high-frequency
 * noise affects only micro-brightness (not hue), so the foil reads as
 * crumpled metal rather than a thermal map. The Coolvetica-outline
 * label composites on top.
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

    // ---- 2D SDF helpers ------------------------------------------------
    float sdRoundedBox(vec2 p, vec2 b, float r) {
      vec2 d = abs(p) - b + vec2(r);
      return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
    }

    // Stand-up zip pouch silhouette in UV space.
    //   - Body: rounded rectangle (the bulk of the pouch front)
    //   - Tab:  short rounded rectangle above the body (hangtag area)
    //   - Hole: small circular notch in the tab — visible from hero camera
    //   - Gusset: slightly wider strip at the bottom hinting at the base
    float pouchSdf(vec2 uv) {
      vec2 p = uv - vec2(0.5, 0.5);
      float body   = sdRoundedBox(p - vec2(0.0, -0.05), vec2(0.42, 0.40), 0.05);
      float gusset = sdRoundedBox(p - vec2(0.0, -0.43), vec2(0.44, 0.04), 0.04);
      float tab    = sdRoundedBox(p - vec2(0.0,  0.41), vec2(0.20, 0.05), 0.025);
      float hole   = length(uv - vec2(0.5, 0.91)) - 0.022;
      float shape  = min(min(body, gusset), tab);
      return max(shape, -hole);
    }

    // ---- Noise ---------------------------------------------------------
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

    // ---- Palette -------------------------------------------------------
    // Hand-tuned pastel LUT cycling through four stops in the cool half
    // of the wheel — blue, cyan, pink, magenta — with smoothstep blending
    // between segments. The earlier cosine palette let one channel slide
    // into mint-green at certain phases; this stepped form stays strictly
    // inside the brand band while keeping enough channel delta (~0.27)
    // for the cycle to read across the surface.
    vec3 pastelIris(float t) {
      t = fract(t);
      vec3 c0 = vec3(0.68, 0.78, 0.96);  // pastel blue
      vec3 c1 = vec3(0.70, 0.94, 0.96);  // soft cyan
      vec3 c2 = vec3(0.97, 0.82, 0.92);  // pale pink
      vec3 c3 = vec3(0.85, 0.68, 0.94);  // soft magenta
      float seg = t * 4.0;
      float i = floor(seg);
      float f = smoothstep(0.0, 1.0, fract(seg));
      vec3 a, b;
      if      (i < 1.0) { a = c0; b = c1; }
      else if (i < 2.0) { a = c1; b = c2; }
      else if (i < 3.0) { a = c2; b = c3; }
      else              { a = c3; b = c0; }
      return mix(a, b, f);
    }

    void main() {
      // ---- Silhouette mask -------------------------------------------
      float sdf = pouchSdf(vUv);
      if (sdf > 0.0) discard;

      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(vViewDir);
      float NdotV = clamp(dot(N, V), 0.0, 1.0);

      // ---- Color phase: view angle + coarse fbm + slow drift --------
      // Coarse drives the iridescent hue (large, smooth color blobs).
      // High-freq noise NEVER touches hue — only micro-brightness.
      // fbm dominates so the cycle visibly sweeps across the surface
      // rather than reading as a single tone tied to the silhouette.
      float coarse = fbm(vUv * 3.2);
      float micro  = vnoise(vUv * 80.0);

      float t = (1.0 - NdotV) * 0.35
              + coarse * 0.85
              + uTime * 0.022
              + uHueShift
              + (uCursor.x * 0.06 + uCursor.y * 0.04);

      vec3 foil = pastelIris(t) * uTint;

      // Micro: ±8% luminance variation, no hue shift.
      foil *= 0.92 + (micro - 0.5) * 0.16;

      // ---- Fresnel rim -----------------------------------------------
      float fresnel = pow(1.0 - NdotV, 2.8);
      foil = mix(foil, vec3(1.0), fresnel * 0.28);

      // ---- Sealed crimp band -----------------------------------------
      // Just below the tab (vUv.y ~ 0.82 – 0.86). A thin darker band
      // with a slight bright top edge reads as a crimped seal.
      float crimpBody  = smoothstep(0.815, 0.83, vUv.y) - smoothstep(0.85, 0.865, vUv.y);
      float crimpEdge  = smoothstep(0.828, 0.835, vUv.y) - smoothstep(0.838, 0.845, vUv.y);
      foil = mix(foil, foil * 0.82, crimpBody * 0.55);
      foil = mix(foil, vec3(0.95), crimpEdge * 0.5);

      // ---- Label composite -------------------------------------------
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
