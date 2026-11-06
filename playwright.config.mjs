// Browser tests of exampleSite in Chromium, Firefox and WebKit. Screenshots are compared with references made in
// Playwright's Linux image, so run them through scripts/visual.sh or in CI, which use the same image.
import { defineConfig, devices } from "@playwright/test";

const viewport = { width: 1024, height: 700 };

export default defineConfig({
  testDir: "tests/visual",
  snapshotPathTemplate: "{testDir}/screenshots/{projectName}/{arg}{ext}",
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, threshold: 0.05, animations: "disabled" } },
  use: { baseURL: "http://127.0.0.1:1313/", viewport },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport } },
  ],
  webServer: {
    command: "hugo server -s exampleSite --themesDir ../.. -p 1313 --bind 127.0.0.1 --baseURL http://127.0.0.1:1313/ --disableLiveReload --renderToMemory",
    url: "http://127.0.0.1:1313/",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
