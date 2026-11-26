// Renders newspaper.html to entry.png (1024x1024) via headless Chromium.
// Usage: node render.mjs  (playwright-core lives in the shared shot-tools install)
import { createRequire } from 'node:module';
const require = createRequire('/home/hatch/workspace/makefun/shot-tools/package.json');
const { chromium } = require('playwright-core');
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(dir, 'newspaper.html');
const outPath = join(dir, 'entry.png');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: outPath });
await browser.close();
console.log('wrote', outPath);
