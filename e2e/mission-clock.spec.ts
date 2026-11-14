import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Mission Clock scrubs the mission without a reload and persists", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  const slider = page.getByLabel("Mission day");

  await slider.fill("40");
  await expect(page.getByTestId("clock-day")).toHaveText("Day 40 / 179");
  await slider.fill("70");
  await expect(page.getByTestId("clock-day")).toHaveText("Day 70 / 179");
  await expect(page.getByTestId("signal-delay")).toContainText("min");

  // Event marker jumps to the solar storm.
  await page.getByRole("button", { name: /Jump to day 40/ }).click();
  await expect(page.getByTestId("clock-day")).toHaveText("Day 40 / 179");

  await page.reload();
  await waitForData(page);
  await expect(page.getByTestId("clock-day")).toHaveText("Day 40 / 179");
  expect(problems).toEqual([]);
});
