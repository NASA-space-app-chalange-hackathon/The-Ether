import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Demo Mode plays the story with captions and can be stopped", async ({ page }) => {
  test.setTimeout(45_000);
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  await page.getByTestId("demo-button").click();
  await expect(page.getByTestId("demo-caption")).toContainText("learns each astronaut");
  await expect(page.getByTestId("demo-caption")).toContainText("Solar storm", { timeout: 6_000 });
  await expect(page.getByTestId("clock-day")).toHaveText("Day 40 / 179");
  await expect(page.getByTestId("demo-caption")).toContainText("hidden fatigue", { timeout: 6_000 });
  await expect(page).toHaveURL(/\/body\?region=brain/);
  await expect(page.getByTestId("region-panel")).toContainText("Brain & behavior");
  await page.getByTestId("demo-button").click();
  await expect(page.getByTestId("demo-caption")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("skip link and 404 page", async ({ page }) => {
  await page.goto("/does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
