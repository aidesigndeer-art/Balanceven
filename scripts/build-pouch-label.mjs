#!/usr/bin/env node
/**
 * Bake the Float Bites front-face label as an SVG of Coolvetica outlines.
 *
 * Emits public/textures/pouch-label.svg. The component pipeline reads
 * this SVG at runtime, rasterizes it via <canvas>, and uses the result
 * as a Three.js texture mapped to the pouch front face.
 *
 * Layout coordinate system: SVG y is top-down; vUv.y on the plane is
 * bottom-up. The pouch silhouette (defined in the shader) occupies
 * vUv.y roughly [0.05, 0.85], so label content is placed inside that
 * window — for H=1800 that means y ∈ [270, 1710].
 *
 * Permitted under Typodermic Desktop EULA §2(i)(b): static graphic
 * image, single merged path per text run (not glyph-addressable).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FONT_PATH = resolve(ROOT, '_brief/coolvetica/Coolvetica Rg.otf');
const OUT_PATH = resolve(ROOT, 'public/textures/pouch-label.svg');

if (!existsSync(FONT_PATH)) {
  console.error(`Font not found: ${FONT_PATH}`);
  process.exit(1);
}

const fontBuffer = readFileSync(FONT_PATH);
const font = opentype.parse(
  fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength,
  ),
);

// Canvas widened to 1200 x 1800 (2:3). Previous 1024 was too narrow
// for the headline at usable sizes — "Float Bites" at 220 needed
// ~1210 px and was clipping on the left edge.
const W = 1200;
const H = 1800;

// Hard limit: if a string at `size` exceeds maxW, scale `size` down
// so it fits with at least `marginPx` of slack on each side.
function fittedPath(text, desiredSize, cy, { maxW = W - 120, marginPx = 0 } = {}) {
  let size = desiredSize;
  let probe = font.getPath(text, 0, 0, size);
  let bb = probe.getBoundingBox();
  let width = bb.x2 - bb.x1;
  if (width + marginPx > maxW) {
    size = Math.floor(size * ((maxW - marginPx) / width));
    probe = font.getPath(text, 0, 0, size);
    bb = probe.getBoundingBox();
    width = bb.x2 - bb.x1;
  }
  const x = (W - width) / 2 - bb.x1;
  const d = font.getPath(text, x, cy, size).toPathData(2);
  return { d, size, width };
}

const layers = [];

// Top block: brand mark.
const floatBites = fittedPath('Float Bites', 180, 420);
layers.push({ fill: '#0A0A0A', d: floatBites.d });

const byBalanceven = fittedPath('by balanceven', 52, 490);
layers.push({ fill: '#0A0A0A', d: byBalanceven.d });

// Lower block: claim + variant.
const deBloat = fittedPath('De-bloat & Digest', 96, 1180);
layers.push({ fill: '#F2E6CB', d: deBloat.d });

const gummies = fittedPath('gummies', 78, 1270);
layers.push({ fill: '#0A0A0A', d: gummies.d });

// 10 COUNT pill at the foot of the body region.
const countText = '10 COUNT';
const countSize = 50;
const countProbe = font.getPath(countText, 0, 0, countSize);
const countBb = countProbe.getBoundingBox();
const countTextW = countBb.x2 - countBb.x1;
const pillPadX = 30;
const pillPadY = 14;
const pillW = countTextW + pillPadX * 2;
const pillH = countSize + pillPadY * 2;
const pillCy = 1560;
const pillCx = W / 2;
const pillX = pillCx - pillW / 2;
const pillY = pillCy - pillH / 2;
const pillR = pillH / 2;
const countX = pillCx - countTextW / 2 - countBb.x1;
const countY = pillCy + countSize * 0.32;
const countPath = font.getPath(countText, countX, countY, countSize).toPathData(2);

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
  `  <!-- transparent base; foil shader shows through -->`,
  ...layers.map((l) => `  <path fill="${l.fill}" d="${l.d}"/>`),
  `  <rect x="${pillX.toFixed(2)}" y="${pillY.toFixed(2)}" width="${pillW.toFixed(2)}" height="${pillH.toFixed(2)}" rx="${pillR.toFixed(2)}" ry="${pillR.toFixed(2)}" fill="none" stroke="#0A0A0A" stroke-width="3.5"/>`,
  `  <path fill="#0A0A0A" d="${countPath}"/>`,
  `</svg>`,
  '',
].join('\n');

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, svg);

console.log(`Pouch label baked: ${OUT_PATH}`);
console.log(`Canvas: ${W} x ${H}`);
console.log(`  Float Bites:        size ${floatBites.size}, width ${floatBites.width.toFixed(0)} px`);
console.log(`  by balanceven:      size ${byBalanceven.size}, width ${byBalanceven.width.toFixed(0)} px`);
console.log(`  De-bloat & Digest:  size ${deBloat.size}, width ${deBloat.width.toFixed(0)} px`);
console.log(`  gummies:            size ${gummies.size}, width ${gummies.width.toFixed(0)} px`);
console.log(`  10 COUNT pill:      size ${countSize}, pill width ${pillW.toFixed(0)} px`);
