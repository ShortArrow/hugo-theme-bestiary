// What exampleSite looks like in each browser, and how its pages turn.
import { test, expect } from "@playwright/test";

/** Opens a page with the reader's scheme and place already chosen, and waits until its drawings and fonts are in. */
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

test("following a link turns the leaf over, and going back turns it the other way", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium turns pages across documents");
  await page.addInitScript(() =>
    addEventListener("pagereveal", (e) =>
      e.viewTransition?.ready.then(() => sessionStorage.setItem("turned", [...e.viewTransition.types].join())),
    ),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await page.click("a[href$='/creatures/inkwyrm/']");
  await page.waitForURL("**/creatures/inkwyrm/");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("turned"))).toBe("page-turn");
  await page.goBack();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("turned"))).toBe("page-turn,back");
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
          if (puff?.playState === "running") resolve(true);
          else if (performance.now() - start > 5000) resolve(false);
          else requestAnimationFrame(look);
        };
        look();
      }),
  );
  expect(billowed).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
