import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("first visit: day 70 + ORION-B, banner starts the demo, choice is remembered", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  await expect(page.getByTestId("clock-day")).toHaveText("Day 70 / 179");
  await expect(page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-B/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("home-alerts")).toContainText("Possible hidden fatigue");

  const banner = page.getByTestId("intro-banner");
  await banner.getByRole("button", { name: /Watch the 30-second demo/ }).click();
  await expect(page.getByTestId("demo-caption")).toContainText("learns each astronaut");
  await expect(banner).toHaveCount(0);
  await page.getByTestId("demo-button").click();

  await page.reload();
  await waitForData(page);
  await expect(page.getByTestId("intro-banner")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("dismissing the banner keeps it closed", async ({ page }) => {
  await page.goto("/");
  await waitForData(page);
  await page.getByTestId("intro-banner").getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByTestId("intro-banner")).toHaveCount(0);
  await page.reload();
  await waitForData(page);
  await expect(page.getByTestId("clock-day")).toBeVisible();
  await expect(page.getByTestId("intro-banner")).toHaveCount(0);
});
