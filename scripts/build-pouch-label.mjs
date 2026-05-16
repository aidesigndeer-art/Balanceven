#!/usr/bin/env node
/**
 * Bake the Float Bites front-face label as an SVG of Coolvetica outlines.
 *
 * Emits public/textures/pouch-label.svg. The component pipeline reads
 * this SVG at runtime, rasterizes it via <canvas>, and uses the result
 * as a Three.js texture mapped to the pouch front face.
 *
 * The SVG contains only static outline paths — no glyph-addressable
 * font rendering — permitted under Typodermic Desktop EULA §2(i)(b).
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

// Canvas is 1024 x 1536 px (2:3, matches a typical pouch front-face).
const W = 1024;
const H = 1536;

/**
 * Render text centered horizontally at the given baseline y, return SVG path data.
 * `size` is the font size; opentype interprets baseline as y-up, so we negate.
 */
function centeredPath(text, size, cy) {
  // Estimate width by laying out at origin first.
  const probe = font.getPath(text, 0, 0, size);
  const bb = probe.getBoundingBox();
  const width = bb.x2 - bb.x1;
  const x = (W - width) / 2 - bb.x1;
  const path = font.getPath(text, x, cy, size);
  return path.toPathData(2);
}

const layers = [];

// "Float Bites" — display, large, black
layers.push({
  fill: '#0A0A0A',
  d: centeredPath('Float Bites', 220, 330),
});

// "by balanceven" — small, black
layers.push({
  fill: '#0A0A0A',
  d: centeredPath('by balanceven', 64, 405),
});

// "De-bloat & Digest" — cream
layers.push({
  fill: '#F2E6CB',
  d: centeredPath('De-bloat & Digest', 110, 880),
});

// "gummies" — black
layers.push({
  fill: '#0A0A0A',
  d: centeredPath('gummies', 90, 970),
});

// "10 COUNT" inside a pill — render path centered, plus a rounded outline.
const countText = '10 COUNT';
const countSize = 56;
const countProbe = font.getPath(countText, 0, 0, countSize);
const countBb = countProbe.getBoundingBox();
const countTextW = countBb.x2 - countBb.x1;
const pillPadX = 28;
const pillPadY = 16;
const pillW = countTextW + pillPadX * 2;
const pillH = countSize + pillPadY * 2;
const pillCy = 1400;
const pillCx = W / 2;
const pillX = pillCx - pillW / 2;
const pillY = pillCy - pillH / 2;
const pillR = pillH / 2;
const countX = pillCx - countTextW / 2 - countBb.x1;
const countY = pillCy + countSize * 0.32; // approximate optical centering
const countPath = font.getPath(countText, countX, countY, countSize).toPathData(2);

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
  `  <!-- transparent base; foil shader shows through -->`,
  ...layers.map(
    (l) => `  <path fill="${l.fill}" d="${l.d}"/>`,
  ),
  // pill outline (1.5 px equivalent at canvas scale)
  `  <rect x="${pillX.toFixed(2)}" y="${pillY.toFixed(2)}" width="${pillW.toFixed(2)}" height="${pillH.toFixed(2)}" rx="${pillR.toFixed(2)}" ry="${pillR.toFixed(2)}" fill="none" stroke="#0A0A0A" stroke-width="4"/>`,
  `  <path fill="#0A0A0A" d="${countPath}"/>`,
  `</svg>`,
  '',
].join('\n');

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, svg);
console.log(`Pouch label baked: ${OUT_PATH}`);
console.log(`Canvas: ${W} x ${H}`);
