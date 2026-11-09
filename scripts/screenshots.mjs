// Draws images/screenshot.png (1500x1000) and images/tn.png (900x600) for themes.gohugo.io: screenshots.sh runs it in Playwright's Linux image.
// The page is taken in four states, laid side by side as bands slanted 60 degrees from upright, so that one picture shows day and night and each place.
// The window is as wide as the screenshot, so that the leaf leaves room on both sides for the place it lies in.
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const url = process.argv[2] || "https://vhabitat.shortarrow.jp/";
const states = [["light", "home"], ["dark", "forest"], ["light", "sky"], ["dark", "sky"]];
const slant = 60;
const outputs = { screenshot: 1500, tn: 900 };

const browser = await chromium.launch();
const shots = [];
for (const [scheme, place] of states) {
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 }, reducedMotion: "reduce" });
  await context.addInitScript(([scheme, place]) => {
    localStorage.setItem("bestiary-scheme", scheme);
    localStorage.setItem("bestiary-place", place);
  }, [scheme, place]);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  shots.push((await page.screenshot()).toString("base64"));
  await context.close();
}

const page = await browser.newPage();
mkdirSync(new URL("../images/", import.meta.url), { recursive: true });
for (const [name, width] of Object.entries(outputs)) {
  const png = await page.evaluate(async ({ shots, slant, width }) => {
    const height = (width * 2) / 3;
    const angle = (slant * Math.PI) / 180;
    const across = [Math.cos(angle), Math.sin(angle)];
    const along = [-across[1], across[0]];
    const reach = width + height;
    const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => x * across[0] + y * across[1]);
    const start = Math.min(...corners);
    const band = (Math.max(...corners) - start) / shots.length;
    const at = (offset, run) => [offset * across[0] + run * along[0], offset * across[1] + run * along[1]];
    const canvas = new OffscreenCanvas(width, height);
    const g = canvas.getContext("2d");
    for (const [k, shot] of shots.entries()) {
      const picture = new Image();
      picture.src = `data:image/png;base64,${shot}`;
      await picture.decode();
      const near = start + k * band;
      const far = near + band;
      g.save();
      g.beginPath();
      g.moveTo(...at(near, -reach));
      g.lineTo(...at(near, reach));
      g.lineTo(...at(far, reach));
      g.lineTo(...at(far, -reach));
      g.closePath();
      g.clip();
      g.drawImage(picture, 0, 0, width, height);
      g.restore();
      if (k > 0) {
        g.beginPath();
        g.moveTo(...at(near, -reach));
        g.lineTo(...at(near, reach));
        g.lineWidth = width / 500;
        g.strokeStyle = "rgba(255, 255, 255, 0.85)";
        g.stroke();
      }
    }
    const bytes = new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer());
    let text = "";
    for (let k = 0; k < bytes.length; k += 32768) text += String.fromCharCode(...bytes.subarray(k, k + 32768));
    return btoa(text);
  }, { shots, slant, width });
  writeFileSync(new URL(`../images/${name}.png`, import.meta.url), Buffer.from(png, "base64"));
  console.log(`wrote images/${name}.png`);
}
await browser.close();
