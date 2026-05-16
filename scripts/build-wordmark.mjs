#!/usr/bin/env node
/**
 * Render "balanceven" in Coolvetica Regular to outline SVGs.
 *
 * Reads _brief/coolvetica/Coolvetica Rg.otf (kept local, gitignored)
 * and emits public/logo/balanceven-{black,white}.svg.
 *
 * Permitted under Typodermic Desktop EULA §2(i)(b): static graphic
 * image use, single merged path per file (not glyph-addressable).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const FONT_PATH = resolve(ROOT, '_brief/coolvetica/Coolvetica Rg.otf');
const OUT_DIR = resolve(ROOT, 'public/logo');
const TEXT = 'balanceven';
const FONT_SIZE = 1000; // arbitrary high-precision unit; SVG is vector

if (!existsSync(FONT_PATH)) {
  console.error(`Font not found: ${FONT_PATH}`);
  console.error('Place Coolvetica Rg.otf in _brief/coolvetica/ to regenerate.');
  process.exit(1);
}

const fontBuffer = readFileSync(FONT_PATH);
const font = opentype.parse(
  fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength)
);

// Place baseline at y=0; get the outline path.
const path = font.getPath(TEXT, 0, 0, FONT_SIZE);
const pathData = path.toPathData(3);

const bbox = path.getBoundingBox();
const padX = (bbox.x2 - bbox.x1) * 0.02;
const padY = (bbox.y2 - bbox.y1) * 0.08;
const vbX = bbox.x1 - padX;
const vbY = bbox.y1 - padY;
const vbW = bbox.x2 - bbox.x1 + padX * 2;
const vbH = bbox.y2 - bbox.y1 + padY * 2;

function buildSvg(fill) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}" role="img" aria-label="balanceven">`,
    `  <title>balanceven</title>`,
    `  <path fill="${fill}" d="${pathData}"/>`,
    `</svg>`,
    '',
  ].join('\n');
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'balanceven-black.svg'), buildSvg('#000000'));
writeFileSync(resolve(OUT_DIR, 'balanceven-white.svg'), buildSvg('#FFFFFF'));

console.log(`Wordmark generated:`);
console.log(`  ${resolve(OUT_DIR, 'balanceven-black.svg')}`);
console.log(`  ${resolve(OUT_DIR, 'balanceven-white.svg')}`);
console.log(`viewBox: ${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}`);
console.log(`path length: ${pathData.length} chars`);
