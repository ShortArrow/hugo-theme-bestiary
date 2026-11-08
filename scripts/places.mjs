// Draws each place under assets/images/bestiary/places as a WebP picture beside its SVG: places.sh runs it in Playwright's Linux image.
// The stylesheet uses the pictures rather than the SVGs, so that a browser does not run the drawings' blurs and grain again for every part of a place that scrolls into view.
// Drawings no wider than 400px are drawn at twice their size, so that they stay sharp on a dense screen.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const dir = new URL("../assets/images/bestiary/places/", import.meta.url).pathname;
const browser = await chromium.launch();
for (const name of readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()) {
  const svg = readFileSync(join(dir, name), "utf8");
  const [, width, height] = svg.match(/width='(\d+)' height='(\d+)'/).map(Number);
  const scale = width <= 400 ? 2 : 1;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(`<body style="margin:0"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}" width="${width}" height="${height}" style="display:block"></body>`);
  await page.evaluate(() => document.querySelector("img").decode());
  const png = await page.screenshot({ omitBackground: true });
  const webp = await page.evaluate(async (png) => {
    const picture = new Image();
    picture.src = `data:image/png;base64,${png}`;
    await picture.decode();
    const canvas = new OffscreenCanvas(picture.width, picture.height);
    canvas.getContext("2d").drawImage(picture, 0, 0);
    const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: "image/webp", quality: 0.9 })).arrayBuffer());
    let text = "";
    for (let k = 0; k < bytes.length; k += 32768) text += String.fromCharCode(...bytes.subarray(k, k + 32768));
    return btoa(text);
  }, png.toString("base64"));
  writeFileSync(join(dir, name.replace(/\.svg$/, ".webp")), Buffer.from(webp, "base64"));
  console.log(`drew ${name.replace(/\.svg$/, ".webp")} at ${width * scale}x${height * scale}`);
  await page.close();
}
await browser.close();
