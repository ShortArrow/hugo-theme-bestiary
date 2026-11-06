// What exampleSite looks like in each browser, and how its pages turn.
import { test, expect } from "@playwright/test";

/** Opens a page with the reader's scheme and place already chosen, and waits until its drawings and fonts are in and its letters are fitted to the grain. */
async function open(page, path, { scheme, place }) {
  await page.addInitScript(
    ([scheme, place]) => {
      localStorage.setItem("bestiary-scheme", scheme);
      localStorage.setItem("bestiary-place", place);
    },
    [scheme, place],
  );
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.bestiaryTurned);
  await page.waitForLoadState("networkidle");
}

for (const scheme of ["light", "dark"]) {
  for (const place of ["home", "forest", "sky"]) {
    test(`the index on the ${place === "home" ? "desk" : place} by ${scheme === "light" ? "day" : "night"}`, async ({ page }) => {
      await open(page, "/", { scheme, place });
      await expect(page).toHaveScreenshot(`index-${place}-${scheme}.png`);
    });
  }
  test(`an entry by ${scheme === "light" ? "day" : "night"}`, async ({ page }) => {
    await open(page, "/creatures/inkwyrm/", { scheme, place: "home" });
    await expect(page).toHaveScreenshot(`entry-${scheme}.png`);
  });
}

/** Records the types of each page turn as the new page is revealed. */
async function watchTurns(page) {
  await page.addInitScript(() =>
    addEventListener("pagereveal", (e) =>
      e.viewTransition?.ready.then(() => sessionStorage.setItem("turned", [...e.viewTransition.types].join())),
    ),
  );
  return () => page.evaluate(() => sessionStorage.getItem("turned"));
}

test("a taller leaf is laid down over a shorter one, and turned away from it", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium turns pages across documents");
  const turned = await watchTurns(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.click("a[href$='/creatures/inkwyrm/']");
  await page.waitForURL("**/creatures/inkwyrm/");
  await expect.poll(turned).toBe("page-turn,lay-down");
  await page.goBack();
  await page.waitForURL("http://127.0.0.1:1313/");
  await expect.poll(turned).toBe("page-turn");
});

test("following a link to the page already open does not turn the leaf", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium turns pages across documents");
  const turned = await watchTurns(page);
  await page.addInitScript(() => addEventListener("pagereveal", () => sessionStorage.setItem("revealed", (+sessionStorage.getItem("revealed") || 0) + 1)));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.click("header a[href='/']");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("revealed"))).toBe("2");
  await page.waitForTimeout(500);
  expect(await turned()).toBeNull();
});

test("the page being left keeps its leaf in view while it is captured", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium turns pages across documents");
  await page.addInitScript(() =>
    addEventListener("pageswap", (e) => {
      if (!e.viewTransition) return;
      const fold = document.querySelector(".bestiary-fold");
      sessionStorage.setItem("flap-while-leaving", getComputedStyle(fold).visibility);
    }),
  );
  await page.goto("/creatures/inkwyrm/", { waitUntil: "networkidle" });
  await page.evaluate(() => (location.href = "/creatures/lanternmoth/"));
  await page.waitForURL("**/creatures/lanternmoth/");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("flap-while-leaving"))).toBe("hidden");
});

test("between leaves as tall as the window, going on turns the leaf and going back lays it down", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium turns pages across documents");
  const turned = await watchTurns(page);
  await page.goto("/creatures/inkwyrm/", { waitUntil: "networkidle" });
  await page.evaluate(() => (location.href = "/creatures/lanternmoth/"));
  await page.waitForURL("**/creatures/lanternmoth/");
  await expect.poll(turned).toBe("page-turn");
  await page.goBack();
  await page.waitForURL("**/creatures/inkwyrm/");
  await expect.poll(turned).toBe("page-turn,lay-down");
});

test("turning to night billows out from the button", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "Firefox has no view transitions to billow with");
  await open(page, "/", { scheme: "light", place: "home" });
  await page.click(".bestiary-scheme");
  const billowed = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now();
        const look = () => {
          const puff = document.getAnimations().find((a) => a.effect?.pseudoElement === "::view-transition-new(root)");
          if (puff && (puff.playState === "running" || puff.playState === "finished")) resolve(true);
          else if (performance.now() - start > 15000) resolve(false);
          else requestAnimationFrame(look);
        };
        look();
      }),
  );
  expect(billowed).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("before the turn's first frame, the leaf being turned lies flat and whole", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium turns pages across documents");
  await page.addInitScript(() =>
    addEventListener("pagereveal", (e) =>
      e.viewTransition?.ready.then(() => {
        document.getAnimations().forEach((a) => a.cancel());
        const reach = (pseudo) => {
          const clip = getComputedStyle(document.documentElement, pseudo).clipPath;
          return clip === "none" ? Infinity : parseFloat(clip.split(",")[1]);
        };
        const lay = e.viewTransition.types.has("lay-down");
        sessionStorage.setItem("still", JSON.stringify({ lay, old: reach("::view-transition-old(bestiary-leaf)"), new: reach("::view-transition-new(bestiary-leaf)") }));
      }),
    ),
  );
  const still = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("still") || "null"));
  await page.goto("/creatures/inkwyrm/", { waitUntil: "networkidle" });
  await page.click("header a[href='/']");
  await page.waitForURL("http://127.0.0.1:1313/");
  await expect.poll(still).toMatchObject({ lay: false });
  expect((await still()).old).toBeGreaterThan(page.viewportSize().width + page.viewportSize().height);
  await page.evaluate(() => sessionStorage.removeItem("still"));
  await page.goBack();
  await expect.poll(still).toMatchObject({ lay: true });
  expect((await still()).new).toBeLessThanOrEqual(0);
});

test("a long title keeps its fleurons beside its words at any width", async ({ page }) => {
  test.setTimeout(90_000);
  await page.route("**/creatures/", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/(<main>\s*<h1>)[^<]*(<\/h1>)/, "$1IDE and Programming Editors$2");
    await route.fulfill({ response, body });
  });
  await page.goto("/creatures/", { waitUntil: "networkidle" });
  const strays = [];
  for (let width = 320; width <= 1200; width += 16) {
    await page.setViewportSize({ width, height: 700 });
    const stray = await page.evaluate(() => {
      const title = document.querySelector("main h1");
      const range = document.createRange();
      range.selectNodeContents(title);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      const box = title.getBoundingClientRect();
      const half = parseFloat(getComputedStyle(title).lineHeight) / 2;
      return rects[0].top - box.top > half || box.bottom - rects[rects.length - 1].bottom > half;
    });
    if (stray) strays.push(width);
  }
  expect(strays, "widths at which a fleuron stands alone on a line").toEqual([]);
});
