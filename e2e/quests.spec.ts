import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Quests: generated from the engine, XP/streaks from data, crew goal, tick with celebration", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/quests");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-D/ }).click();
  await page.getByLabel("Mission day").fill("99");
  const streakBefore = Number((await page.getByTestId("exercise-streak").innerText()).split(" ")[0]);
  expect(streakBefore).toBeGreaterThan(20);

  await page.getByLabel("Mission day").fill("130");
  await expect(page.getByTestId("quest-list")).toContainText("Extra resistance session for bone health");
  await expect(page.getByTestId("quest-list")).toContainText("because: Missing exercise sessions");
  const streakAfter = Number((await page.getByTestId("exercise-streak").innerText()).split(" ")[0]);
  expect(streakAfter).toBeLessThan(5);
  await expect(page.getByTestId("crew-goal")).toContainText("routine quests done by the whole crew");

  const hydration = page.getByTestId("quest-list").getByRole("listitem").filter({ hasText: "Drink water" });
  await hydration.getByRole("checkbox").check();
  await expect(hydration.getByText("+5 XP")).toBeVisible();
  await expect(hydration.getByRole("checkbox")).toBeChecked();
  expect(problems).toEqual([]);
});
