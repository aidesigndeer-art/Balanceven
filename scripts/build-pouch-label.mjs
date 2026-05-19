#!/usr/bin/env node
/**
 * Bake the Fly Bites pouch label as an SVG of Coolvetica outlines.
 *
 * Emits public/textures/pouch-label.svg at 2400 × 1800 (4:3).
 *   - Left half  (x ∈ [   0, 1200]): front art
 *       wordmark, sub, translucent "Energy gummies" pill, 18 COUNT pill
 *   - Right half (x ∈ [1200, 2400]): back art (mirrored on the pouch)
 *       Nutrition Facts panel, ingredients column, distributed-by,
 *       barcode, "TEAR HERE" arrows along the top
 *
 * The pouch component (FlyBitesPouch.tsx) rasterizes this SVG to a
 * canvas at 2400 wide, then maps the texture so the front-face UVs
 * read u ∈ [0, 0.5] and the back-face UVs read u ∈ [0.5, 1.0]
 * (mirrored horizontally so back text is right-reading from behind).
 *
 * Layout coordinate system: SVG y is top-down; vUv.y on the geometry
 * is bottom-up. The pouch body occupies vUv.y roughly [0.08, 0.92] so
 * label content stays inside y ∈ [144, 1656] of the 1800-tall canvas.
 *
 * Permitted under Typodermic Desktop EULA §2(i)(b): static graphic
 * image, single merged path per text run (not glyph-addressable).
 *
 * NOTE: nutrition values and ingredients on the back panel are
 * PLACEHOLDERS pending lab + regulatory sign-off for the Indian SKU.
 * Update the BACK_NUTRITION and BACK_INGREDIENTS constants below
 * before launch.
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

// Canvas is 2400 × 1800 (4:3) — front art on the left half, back art
// on the right half. Each half is 1200 wide.
const W = 2400;
const H = 1800;
const HALF_W = W / 2;

// ─── Helpers ──────────────────────────────────────────────────────────
function textWidth(text, size) {
  const probe = font.getPath(text, 0, 0, size);
  const bb = probe.getBoundingBox();
  return { width: bb.x2 - bb.x1, x1: bb.x1 };
}

/** Centre `text` inside a horizontal slot [xMin, xMax]; auto-fit width. */
function centeredPath(text, desiredSize, cy, xMin, xMax, marginPx = 0) {
  const slotW = xMax - xMin;
  let size = desiredSize;
  let m = textWidth(text, size);
  if (m.width + marginPx > slotW) {
    size = Math.floor(size * ((slotW - marginPx) / m.width));
    m = textWidth(text, size);
  }
  const x = xMin + (slotW - m.width) / 2 - m.x1;
  const d = font.getPath(text, x, cy, size).toPathData(2);
  return { d, size, width: m.width };
}

/** Left-aligned at xLeft; baseline at cy. */
function alignedPath(text, size, xLeft, cy) {
  const m = textWidth(text, size);
  const x = xLeft - m.x1;
  const d = font.getPath(text, x, cy, size).toPathData(2);
  return { d, size, width: m.width };
}

// ─── Front art (left half) ────────────────────────────────────────────
const front = [];
const FRONT_X_MIN = 60;
const FRONT_X_MAX = HALF_W - 60;
const FRONT_PAD = 60;

// Wordmark — "Fly Bites" big
const flyBites = centeredPath('Fly Bites', 260, 460, FRONT_X_MIN, FRONT_X_MAX, 0);
front.push({ fill: '#0A0A0A', d: flyBites.d });

// Sub — "by balanceven"
const byBalanceven = centeredPath('by balanceven', 64, 555, FRONT_X_MIN, FRONT_X_MAX, 0);
front.push({ fill: '#0A0A0A', d: byBalanceven.d });

// "Energy gummies" pill — translucent rounded rectangle with cream copy
const pillText = 'Energy gummies';
const pillSize = 96;
const pillTextM = textWidth(pillText, pillSize);
const pillPadX = 70;
const pillPadY = 38;
const pillW = pillTextM.width + pillPadX * 2;
const pillH = pillSize + pillPadY * 2;
const pillCx = HALF_W / 2;
const pillCy = 1010;
const pillX = pillCx - pillW / 2;
const pillY = pillCy - pillH / 2;
const pillR = pillH / 2;
const pillTextX = pillCx - pillTextM.width / 2 - pillTextM.x1;
const pillTextY = pillCy + pillSize * 0.34;
const pillTextPath = font.getPath(pillText, pillTextX, pillTextY, pillSize).toPathData(2);
const energyPillRect = {
  x: pillX, y: pillY, w: pillW, h: pillH, r: pillR,
};

// Small "18 COUNT" pill near the bottom
const countText = '18 COUNT';
const countSize = 56;
const countM = textWidth(countText, countSize);
const countPadX = 38;
const countPadY = 18;
const countPillW = countM.width + countPadX * 2;
const countPillH = countSize + countPadY * 2;
const countCx = HALF_W / 2;
const countCy = 1480;
const countPillX = countCx - countPillW / 2;
const countPillY = countCy - countPillH / 2;
const countPillR = countPillH / 2;
const countTextX = countCx - countM.width / 2 - countM.x1;
const countTextY = countCy + countSize * 0.34;
const countPath = font.getPath(countText, countTextX, countTextY, countSize).toPathData(2);

// ─── Back art (right half) ────────────────────────────────────────────
// All x coords here are relative to the back-half origin (HALF_W, 0).
const BX = HALF_W;
const BACK_X_MIN = BX + 60;
const BACK_X_MAX = W - 60;

const back = [];

// TEAR HERE strip along the top of the back half
const tearText = 'TEAR HERE';
const tearSize = 28;
const tearM = textWidth(tearText, tearSize);
const tearY = 260;
// Centre the text and place an arrow on each side
const tearCenterX = BX + (HALF_W) / 2;
const tearTextX = tearCenterX - tearM.width / 2 - tearM.x1;
const tearPath = font.getPath(tearText, tearTextX, tearY, tearSize).toPathData(2);
back.push({ fill: '#0A0A0A', d: tearPath });
// Two short arrow ticks flanking the text
const tearArrowL = `M ${tearCenterX - tearM.width / 2 - 80},${tearY - 9} l 0,9 l 60,0`;
const tearArrowR = `M ${tearCenterX + tearM.width / 2 + 80},${tearY - 9} l 0,9 l -60,0`;
// Express both ticks as stroked lines via SVG `<path stroke>` later.

// Nutrition Facts panel — white block with title, divider lines, and
// faux rows. Sits in the upper-left of the back half.
const nfX = BX + 90;
const nfY = 360;
const nfW = 460;
const nfH = 700;
const nfTitle = 'Nutrition Facts';
const nfTitleSize = 56;
const nfTitleM = textWidth(nfTitle, nfTitleSize);
const nfTitleX = nfX + 20 - nfTitleM.x1;
const nfTitlePath = font.getPath(nfTitle, nfTitleX, nfY + 70, nfTitleSize).toPathData(2);

const nfRowsLabel = [
  ['Serving size', '1 gummy (5g)'],
  ['Servings per container', '18'],
];
const nfMacros = [
  ['Calories', '15'],
  ['Total Fat 0g', '0%'],
  ['Sodium 5mg', '0%'],
  ['Total Carbohydrate 4g', '1%'],
  ['  Total Sugars 3g', ''],
  ['Protein 0g', ''],
];
const nfActives = [
  ['Caffeine', '75mg'],
  ['Vitamin B6', '1.7mg (100% DV)'],
  ['Vitamin B12', '2.4mcg (100% DV)'],
  ['Niacin', '16mg (100% DV)'],
  ['L-Theanine', '50mg'],
];

const nfTextSize = 22;
let nfCursorY = nfY + 130;
const nfRowH = 32;

const drawRow = (left, right, opts = {}) => {
  const { bold = false, indent = 0 } = opts;
  const size = bold ? nfTextSize + 4 : nfTextSize;
  const leftX = nfX + 20 + indent - textWidth(left, size).x1;
  const rightM = textWidth(right, size);
  const rightX = nfX + nfW - 20 - rightM.width - rightM.x1;
  const leftPath = font.getPath(left, leftX, nfCursorY, size).toPathData(2);
  back.push({ fill: '#0A0A0A', d: leftPath });
  if (right) {
    const rightPath = font.getPath(right, rightX, nfCursorY, size).toPathData(2);
    back.push({ fill: '#0A0A0A', d: rightPath });
  }
  nfCursorY += nfRowH;
};

nfRowsLabel.forEach(([l, r]) => drawRow(l, r));
nfCursorY += 12;                      // divider gap
drawRow('Amount per serving', '');
drawRow('% Daily Value*', '', { indent: 220 });
nfCursorY += 8;
nfMacros.forEach(([l, r]) => drawRow(l, r));
nfCursorY += 12;
drawRow('Active per serving', '');
nfCursorY += 6;
nfActives.forEach(([l, r]) => drawRow(l, r));

// Ingredients column — top-right of back half
const ingX = BX + 600;
const ingY = 360;
const ingW = 420;
const ingTitle = 'Ingredients';
const ingTitleSize = 36;
const ingTitleM = textWidth(ingTitle, ingTitleSize);
const ingTitleX = ingX - ingTitleM.x1;
const ingTitlePath = font.getPath(ingTitle, ingTitleX, ingY + 30, ingTitleSize).toPathData(2);
back.push({ fill: '#0A0A0A', d: ingTitlePath });

const BACK_INGREDIENTS = [
  'Cane sugar, glucose syrup,',
  'pectin, citric acid, natural',
  'flavors, sodium citrate,',
  'caffeine (75mg/gummy),',
  'vitamin B6 (pyridoxine HCl),',
  'vitamin B12 (methylcobalamin),',
  'niacin, L-theanine (50mg),',
  'beetroot extract (colour),',
  'spirulina extract (colour),',
  'sunflower oil.',
];

let ingCursorY = ingY + 80;
const ingSize = 22;
const ingLineH = 32;
BACK_INGREDIENTS.forEach((line) => {
  const x = ingX - textWidth(line, ingSize).x1;
  const d = font.getPath(line, x, ingCursorY, ingSize).toPathData(2);
  back.push({ fill: '#0A0A0A', d });
  ingCursorY += ingLineH;
});

// Distributed by — bottom-left of back half
const distLines = [
  'Distributed by',
  'balanceven',
  '27F Madison Road,',
  'Mumbai, MH 400069',
  'India',
];
let distCursorY = nfY + nfH + 100;
const distX = BX + 100;
const distSize = 22;
const distLineH = 30;
distLines.forEach((line, i) => {
  const size = i === 1 ? distSize + 8 : distSize; // bump "balanceven"
  const x = distX - textWidth(line, size).x1;
  const d = font.getPath(line, x, distCursorY, size).toPathData(2);
  back.push({ fill: '#0A0A0A', d });
  distCursorY += distLineH;
});

// Barcode — bottom-right of back half. Visual only, not a real UPC.
const bcX = BX + 720;
const bcY = nfY + nfH + 100;
const bcH = 130;
const bcWidths = [3, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1, 4];
let bcCursor = bcX;
const bars = [];
bcWidths.forEach((w, i) => {
  if (i % 2 === 0) {
    bars.push(`M ${bcCursor},${bcY} h ${w * 3} v ${bcH} h ${-w * 3} z`);
  }
  bcCursor += w * 3 + 4;
});
const barcodeDigits = '8 901234 567890';
const bcDigitSize = 22;
const bcDigitM = textWidth(barcodeDigits, bcDigitSize);
const bcDigitX = bcX + ((bcCursor - bcX) - bcDigitM.width) / 2 - bcDigitM.x1;
const bcDigitPath = font.getPath(barcodeDigits, bcDigitX, bcY + bcH + 34, bcDigitSize).toPathData(2);

// ─── Compose SVG ──────────────────────────────────────────────────────
const svgParts = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
  `  <!-- transparent base; foil shader shows through everywhere except painted regions -->`,

  // ── Front (left half) ───────────────────────────────────────────
  ...front.map((l) => `  <path fill="${l.fill}" d="${l.d}"/>`),
  // Translucent "Energy gummies" pill — fill + outline, then cream text
  `  <rect x="${energyPillRect.x.toFixed(2)}" y="${energyPillRect.y.toFixed(2)}" width="${energyPillRect.w.toFixed(2)}" height="${energyPillRect.h.toFixed(2)}" rx="${energyPillRect.r.toFixed(2)}" ry="${energyPillRect.r.toFixed(2)}" fill="#F2E6CB" fill-opacity="0.92" stroke="#F2E6CB" stroke-width="3"/>`,
  `  <path fill="#0A0A0A" d="${pillTextPath}"/>`,
  // 18 COUNT pill outline + text
  `  <rect x="${countPillX.toFixed(2)}" y="${countPillY.toFixed(2)}" width="${countPillW.toFixed(2)}" height="${countPillH.toFixed(2)}" rx="${countPillR.toFixed(2)}" ry="${countPillR.toFixed(2)}" fill="none" stroke="#0A0A0A" stroke-width="3.5"/>`,
  `  <path fill="#0A0A0A" d="${countPath}"/>`,

  // ── Back (right half) ───────────────────────────────────────────
  // White Nutrition Facts panel background (drawn before back paths so
  // the text sits ON TOP of the panel)
  `  <rect x="${nfX}" y="${nfY}" width="${nfW}" height="${nfH}" fill="#ffffff" stroke="#0A0A0A" stroke-width="3"/>`,
  // Title + thin rule under the title
  `  <path fill="#0A0A0A" d="${nfTitlePath}"/>`,
  `  <line x1="${nfX + 14}" y1="${nfY + 90}" x2="${nfX + nfW - 14}" y2="${nfY + 90}" stroke="#0A0A0A" stroke-width="6"/>`,
  // Thin rule between header/macros and actives — drawn under text rows
  `  <line x1="${nfX + 14}" y1="${nfY + 232}" x2="${nfX + nfW - 14}" y2="${nfY + 232}" stroke="#0A0A0A" stroke-width="2"/>`,
  `  <line x1="${nfX + 14}" y1="${nfY + 470}" x2="${nfX + nfW - 14}" y2="${nfY + 470}" stroke="#0A0A0A" stroke-width="2"/>`,

  // All other back text paths
  ...back.map((l) => `  <path fill="${l.fill}" d="${l.d}"/>`),

  // Tear-here arrow ticks (stroked, not filled)
  `  <path d="${tearArrowL}" fill="none" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round"/>`,
  `  <path d="${tearArrowR}" fill="none" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round"/>`,

  // Barcode bars + digits
  ...bars.map((d) => `  <path fill="#0A0A0A" d="${d}"/>`),
  `  <path fill="#0A0A0A" d="${bcDigitPath}"/>`,

  `</svg>`,
  '',
].join('\n');

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, svgParts);

console.log(`Pouch label baked: ${OUT_PATH}`);
console.log(`Canvas: ${W} x ${H} (front left, back right)`);
console.log(`  Fly Bites:          size ${flyBites.size},  width ${flyBites.width.toFixed(0)} px`);
console.log(`  by balanceven:      size ${byBalanceven.size}, width ${byBalanceven.width.toFixed(0)} px`);
console.log(`  Energy pill:        text ${pillSize}, pill ${pillW.toFixed(0)} × ${pillH.toFixed(0)}`);
console.log(`  18 COUNT pill:      text ${countSize}, pill ${countPillW.toFixed(0)} × ${countPillH.toFixed(0)}`);
console.log(`  Nutrition Facts:    panel ${nfW} × ${nfH}`);
console.log(`  Ingredients:        ${BACK_INGREDIENTS.length} lines`);
console.log(`  Barcode:            ${bars.length} bars`);
