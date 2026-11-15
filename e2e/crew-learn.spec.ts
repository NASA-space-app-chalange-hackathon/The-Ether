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

test("Learn: NASA challenge resources section links all five official resources", async ({ page }) => {
  await page.goto("/learn");
  await waitForData(page);
  const section = page.getByTestId("challenge-resources");
  await expect(page.getByRole("heading", { name: "NASA challenge resources" })).toBeVisible();
  for (const href of [
    "https://www.nasa.gov/hrp/hazards/",
    "https://www.nasa.gov/hrp/risks/",
    "https://www.nasa.gov/hrp/ongoing-hrp-research/",
    "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
  ]) {
    await expect(section.locator(`a[href="${href}"]`)).toBeVisible();
  }
  await expect(section.locator(":scope > li")).toHaveCount(5);
});
