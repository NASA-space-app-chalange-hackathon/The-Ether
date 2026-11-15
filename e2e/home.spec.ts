import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Home: day 70 + ORION-B shows the hidden-fatigue alert; day 1 is all clear", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-B/ }).click();
  await page.getByLabel("Mission day").fill("70");
  await expect(page.getByTestId("home-alerts")).toContainText("You may be more tired than you feel");
  await expect(page.getByTestId("home-alerts")).toContainText("Crew doctor");

  await page.getByLabel("Mission day").fill("1");
  await expect(page.getByText("No active alerts")).toBeVisible();

  await page.getByLabel("Mission day").fill("40");
  await expect(page.getByTestId("radiation-meter")).toContainText("Solar particle event");
  expect(problems).toEqual([]);
});
