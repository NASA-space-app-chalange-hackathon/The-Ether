import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Crew: privacy-first — ORION-B's details hidden from crewmates, visible to the CMO", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/crew");
  await waitForData(page);
  await page.getByLabel("Mission day").fill("70");
  const b = page.locator('[data-testid="crew-card"][data-member="orion-b"]');
  await expect(b.getByTestId("crew-private")).toBeVisible();
  await expect(b).not.toContainText("Possible hidden fatigue");
  await expect(b.getByTestId("count-CMO")).toHaveText("1");

  await page.getByRole("radio", { name: "Crew Medical Officer" }).click();
  await expect(b.getByTestId("crew-details")).toContainText("Possible hidden fatigue");
  await expect(page.getByTestId("cohesion")).toContainText("Average crew pulse");
  expect(problems).toEqual([]);
});

test("Learn: 5 hazards and sourced indicator cards", async ({ page }) => {
  await page.goto("/learn");
  await waitForData(page);
  await expect(page.getByTestId("hazard-cards").locator(":scope > li")).toHaveCount(5);
  const cards = page.getByTestId("indicator-cards").locator(":scope > li");
  await expect(cards).toHaveCount(10);
  await expect(page.getByTestId("indicator-cards")).toContainText("Can it be measured in space?");
  await expect(page.getByRole("link", { name: /Risk of Inadequate Teamwork/ })).toHaveAttribute("href", /nasa\.gov/);
});
