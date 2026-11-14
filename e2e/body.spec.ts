import { expect, test, type Page } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

async function open(page: Page, member: string, day: string) {
  await page.goto("/body");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: new RegExp(member) }).click();
  await page.getByLabel("Mission day").fill(day);
}

// Critical regions pulse forever; reduced motion keeps them still so clicks are deterministic
// (and exercises the prefers-reduced-motion path).
test.use({ reducedMotion: "reduce" });

const region = (page: Page, id: string) => page.locator(`svg [data-region="${id}"]`);

test("colors follow the engine on days 1, 70 and 95", async ({ page }) => {
  const problems = watchForProblems(page);
  await open(page, "ORION-C", "1");
  await expect(region(page, "heart")).toHaveAttribute("data-status", "ok");
  await page.getByLabel("Mission day").fill("95");
  await expect(region(page, "heart")).toHaveAttribute("data-status", "critical");
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-B/ }).click();
  await page.getByLabel("Mission day").fill("70");
  await expect(region(page, "brain")).toHaveAttribute("data-status", "watch");
  await expect(region(page, "eyes")).toHaveAttribute("data-status", "unknown");
  expect(problems).toEqual([]);
});

test("mouse click opens the panel with chart, actions and sources", async ({ page }) => {
  await open(page, "ORION-C", "95");
  await region(page, "heart").click();
  const panel = page.getByTestId("region-panel");
  await expect(panel.getByRole("heading", { name: "Heart & vessels" })).toBeVisible();
  await expect(panel.getByTestId("trend-heartRate")).toBeVisible();
  await expect(panel).toContainText("Earth · flight surgeon");
  await expect(panel.getByRole("link", { name: /Risk of Cardiovascular Adaptations/ })).toHaveAttribute("href", /nasa\.gov/);
});

test("keyboard: focus a region and press Enter", async ({ page }) => {
  await open(page, "ORION-B", "70");
  await region(page, "brain").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("region-panel").getByRole("heading", { name: "Brain & behavior" })).toBeVisible();
  await expect(page.getByTestId("region-panel")).toContainText("Possible hidden fatigue");
});

test.describe("touch", () => {
  test.use({ hasTouch: true });
  test("tap opens a region; back view shows the spine", async ({ page }) => {
    await open(page, "ORION-D", "170");
    await page.getByRole("radio", { name: "Back" }).tap();
    await region(page, "bones").tap();
    await expect(page.getByTestId("region-panel")).toContainText("Bone-loss risk score");
  });
});
