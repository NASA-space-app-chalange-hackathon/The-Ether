import { expect, test, type Page } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

async function open(page: Page, member: string, day: string) {
  await page.goto("/alerts");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: new RegExp(member) }).click();
  await page.getByLabel("Mission day").fill(day);
}

test("EARTH alert: evidence, checklist, ladder, and Message to Ground countdown", async ({ page }) => {
  const problems = watchForProblems(page);
  await open(page, "ORION-C", "95");
  const card = page.locator('[data-testid="alert-card"][data-rule="cardiovascular"]');
  await expect(card).toBeVisible();
  await expect(card.getByRole("table", { name: /triggered/ })).toContainText("Systolic blood pressure");
  await expect(card.locator('[aria-current="step"]')).toContainText("Earth");

  await card.getByRole("checkbox").first().check();
  await expect(card).toContainText("1 of 4 done");

  const composer = card.getByTestId("ground-composer");
  await expect(composer.getByRole("textbox")).toHaveValue(/ORION-C, mission day 95/);
  await composer.getByRole("button", { name: /Queue message/ }).click();
  await expect(composer.getByTestId("ground-countdown")).toContainText("min");

  await page.reload();
  await waitForData(page);
  await expect(card.getByRole("checkbox").first()).toBeChecked();
  await expect(card.getByTestId("ground-sent")).toBeVisible();
  expect(problems).toEqual([]);
});

test("behavioral drift card explains with mood evidence; crew view lists the solar event for all", async ({ page }) => {
  await open(page, "ORION-B", "70");
  const drift = page.locator('[data-testid="alert-card"][data-rule="behavioral-drift"]');
  await expect(drift).toContainText("Self-reported mood");
  await expect(drift.locator('[aria-current="step"]')).toContainText("Crew Medical Officer");

  await page.getByLabel("Mission day").fill("40");
  await page.getByRole("radio", { name: "Whole crew" }).click();
  await expect(page.locator('[data-testid="alert-card"][data-rule="radiation-event"]')).toHaveCount(4);
});
