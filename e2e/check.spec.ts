import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("a check-in flows into Home, Body Map and Alerts without a reload", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/check");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-A/ }).click();
  await page.getByLabel("Mission day").fill("30");
  await expect(page.getByText("Saving for ORION-A · mission day 30")).toBeVisible();

  await page.getByRole("button", { name: /Vitals/ }).click();
  await page.getByLabel(/SpO₂/).fill("88");
  await page.getByLabel(/Body temperature/).fill("38.4");
  await page.getByRole("button", { name: /Review & save/ }).click();
  await expect(page.getByTestId("check-review")).toContainText("Blood oxygen (SpO₂)");
  await page.getByRole("button", { name: /Save check-in/ }).click();
  await expect(page.getByTestId("check-saved")).toBeVisible();

  // Client-side navigation only — no reload.
  await page.getByTestId("check-saved").getByRole("link", { name: "Mission Home" }).click();
  await expect(page.getByTestId("home-alerts")).toContainText("Blood oxygen low");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Body Map" }).click();
  await expect(page.locator('svg [data-region="lungs"]')).toHaveAttribute("data-status", "critical");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Action Center" }).click();
  await expect(page.locator('[data-testid="alert-card"][data-rule="fever"]')).toBeVisible();
  expect(problems).toEqual([]);
});

test("invalid values block saving", async ({ page }) => {
  await page.goto("/check");
  await waitForData(page);
  await page.getByRole("button", { name: /Vitals/ }).click();
  await page.getByLabel(/SpO₂/).fill("140");
  await expect(page.getByText("Enter a value between 70 and 100.")).toBeVisible();
  await page.getByRole("button", { name: /Review & save/ }).click();
  await expect(page.getByRole("button", { name: /Save check-in/ })).toBeDisabled();
});

test("PVT-lite records reaction time and lapses (15 s demo run)", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/check");
  await waitForData(page);
  await page.getByRole("button", { name: /Reaction test/ }).click();
  await page.getByRole("radio", { name: /15 s/ }).click();
  await page.getByRole("button", { name: "Start reaction test" }).click();
  const result = page.getByTestId("pvt-result");
  while (!(await result.isVisible())) {
    const stim = page.getByTestId("pvt-stimulus");
    if (await stim.isVisible()) {
      await page.waitForTimeout(250); // human-like reaction; < 100 ms would count as a false start
      await stim.dispatchEvent("pointerdown").catch(() => undefined);
    }
    await page.waitForTimeout(50);
  }
  await expect(result).toContainText(/Mean reaction \d+ ms · \d+ lapses · 0 false starts/);
});
