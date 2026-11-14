import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Trends: default charts, range switch, indicator toggle, synced to the clock", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/trends");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-C/ }).click();
  await page.getByLabel("Mission day").fill("95");
  await expect(page.getByTestId("trend-heartRate")).toBeVisible();
  await expect(page.getByTestId("trend-systolicBP")).toBeVisible();

  await page.getByRole("radio", { name: "Whole mission" }).click();
  await page.locator("fieldset label", { hasText: "Body temperature" }).click();
  await expect(page.getByTestId("trend-temperature")).toBeVisible();
  await page.locator("fieldset label", { hasText: "Body temperature" }).click();
  await expect(page.getByTestId("trend-temperature")).toHaveCount(0);

  await page.getByRole("radio", { name: "7 days" }).click();
  await page.getByLabel("Mission day").fill("20");
  await expect(page.getByTestId("trend-heartRate")).toBeVisible();
  expect(problems).toEqual([]);
});
