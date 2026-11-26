// News-image entry for Thursday, 26 November 2026 (Node 22, standard library only).
// The page is newspaper.html, sitting beside this file. The deliverable is a single
// 1024x1024 PNG of at most 1 MiB, and the judge sees exactly those bytes.
//
// Two ways to get there, in order:
//   1. If entry.png already sits beside this file (rendered locally with the repo's
//      render.mjs + optimize.py), it is checked and copied as-is.
//   2. Otherwise this file runs that same pipeline itself (node render.mjs, then
//      python3 optimize.py) to produce entry.png, then checks and copies it.
//
// The output folder comes from MAKEFUN_OUTPUT_DIR, falling back to /output, which
// is the folder the grader mounts. Outside the grader, run it like:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(folder, 'newspaper.html');
const pngPath = join(folder, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outPath = join(outDir, 'entry.png');

const MAX_BYTES = 1024 * 1024;
const MAX_SIDE = 1024;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const IEND_TAIL = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

// Read the IHDR chunk and return the pixel size, or throw if the file is not a PNG.
function readPngSize(path: string): { width: number; height: number } {
  const head = readFileSync(path);
  if (head.length < 33 || !head.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error(`not a PNG file: ${path}`);
  }
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

// Gate check: file exists, is a whole PNG, fits the size and dimension limits.
function gateCheck(path: string): number {
  const bytes = statSync(path).size;
  if (bytes > MAX_BYTES) {
    throw new Error(`entry.png is ${bytes} bytes, over the 1 MiB gate limit`);
  }
  const { width, height } = readPngSize(path);
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 gate limit`);
  }
  const tail = readFileSync(path);
  if (!tail.subarray(tail.length - IEND_TAIL.length).equals(IEND_TAIL)) {
    throw new Error('entry.png is truncated: missing IEND trailer');
  }
  return bytes;
}

if (!existsSync(htmlPath)) {
  throw new Error(`newspaper.html not found beside main.ts: ${htmlPath}`);
}

if (!existsSync(pngPath)) {
  console.log('entry.png missing, rendering from newspaper.html with the repo pipeline...');
  execFileSync('node', [join(folder, 'render.mjs')], { stdio: 'inherit', cwd: folder });
  if (!existsSync(pngPath)) {
    throw new Error('render.mjs finished but entry.png still does not exist; check the render output above');
  }
  execFileSync('python3', [join(folder, 'optimize.py')], { stdio: 'inherit', cwd: folder });
  if (!existsSync(pngPath)) {
    throw new Error('optimize.py finished but entry.png is gone; check the optimize output above');
  }
}

const size = gateCheck(pngPath);
const { width, height } = readPngSize(pngPath);

mkdirSync(outDir, { recursive: true });
copyFileSync(pngPath, outPath);

const copied = statSync(outPath).size;
if (copied !== size) {
  throw new Error(`copy incomplete: ${outPath} is ${copied} bytes, expected ${size}`);
}
const before = createHash('sha256').update(readFileSync(pngPath)).digest('hex');
const after = createHash('sha256').update(readFileSync(outPath)).digest('hex');
if (before !== after) {
  throw new Error(`copy corrupt: ${outPath} sha256 ${after}, expected ${before}`);
}
console.log(`copied entry.png (${width}x${height}, ${size} bytes, sha256 ${before}) to ${outPath}`);
