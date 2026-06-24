import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const existing = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
const numbers = existing
  .map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] ?? '0'))
  .filter(n => !isNaN(n));
const next = numbers.length ? Math.max(...numbers) + 1 : 1;

const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;
const outPath = path.join(screenshotDir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll through the full page to trigger IntersectionObserver reveal animations
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
const viewportHeight = 900;
for (let y = 0; y <= pageHeight; y += viewportHeight - 100) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await new Promise(r => setTimeout(r, 80));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 300));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
