// Renders thumbnails for seeded builds and owner cars with the real 3D engine, into public/seed/.
// Usage: ALLOW_SEED_RENDER=1 npm run dev -- --port 3217   (in another shell)
//        node scripts/render-seed-images.mjs http://localhost:3217
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:3217';
const out = path.resolve('public/seed');
fs.mkdirSync(path.join(out, 'builds'), { recursive: true });
fs.mkdirSync(path.join(out, 'owners'), { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });

async function shot(url, file) {
  await page.goto(base + url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__sfReady === true, null, { timeout: 60000 });
  const dataUrl = await page.evaluate(() => window.__sfCapture());
  if (!dataUrl?.startsWith('data:image/webp')) throw new Error(`capture failed for ${url}`);
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('wrote', path.relative(process.cwd(), file));
}

const builds = Number(process.env.BUILDS ?? 36);
const owners = Number(process.env.OWNERS ?? 14);
const views = ['front34', 'front34', 'rear34', 'side'];
for (let i = 1; i <= builds; i++) await shot(`/dev/render?kind=build&id=${i}&view=${views[i % views.length]}`, path.join(out, 'builds', `${i}.webp`));
for (let i = 1; i <= owners; i++) {
  await shot(`/dev/render?kind=owner&id=${i}&view=front34`, path.join(out, 'owners', `${i}-1.webp`));
  await shot(`/dev/render?kind=owner&id=${i}&view=rear34`, path.join(out, 'owners', `${i}-2.webp`));
}
await browser.close();
