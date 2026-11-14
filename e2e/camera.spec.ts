import { expect, test, type Page } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

async function openHrStep(page: Page) {
  await page.goto("/check");
  await waitForData(page);
  await expect(page.getByRole("heading", { name: "Heart rate", level: 2 })).toBeVisible();
}

test("fake camera: measures, shows a waveform, and ends in a result or a manual fallback — never a crash", async ({ page }) => {
  test.setTimeout(60_000);
  const problems = watchForProblems(page);
  await page.addInitScript(() => {
    window.__ETHER_RPPG_SECONDS__ = 10;
  });
  await openHrStep(page);
  await page.getByRole("button", { name: "Start camera check" }).click();
  await expect(page.getByTestId("camera-remaining")).toBeVisible();
  await expect(page.getByTestId("rppg-waveform")).toBeVisible({ timeout: 8_000 });
  const result = page.getByTestId("camera-result");
  await expect(result).toBeVisible({ timeout: 20_000 });
  const use = result.getByRole("button", { name: "Use this value" });
  if (await use.isVisible()) {
    await use.click();
    await expect(page.getByTestId("camera-recorded")).toContainText("bpm");
  } else {
    await expect(result).toContainText("Signal too weak");
  }
  expect(problems).toEqual([]);
});

test("camera denied → clear message, manual entry still works", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await openHrStep(page);
  await page.getByRole("button", { name: "Start camera check" }).click();
  await expect(page.getByTestId("camera-hr").getByRole("alert")).toContainText("permission was denied");
  await page.getByLabel(/Resting heart rate/).fill("64");
  await page.getByRole("button", { name: /Review & save/ }).click();
  await expect(page.getByTestId("check-review")).toContainText("64 bpm");
});

test("no camera API → unavailable message", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
  });
  await openHrStep(page);
  await page.getByRole("button", { name: "Start camera check" }).click();
  await expect(page.getByTestId("camera-hr").getByRole("alert")).toContainText("No camera available");
});
