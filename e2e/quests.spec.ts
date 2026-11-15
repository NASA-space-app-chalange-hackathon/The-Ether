import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("Quests: generated from the engine, XP/streaks from data, crew goal, tick with celebration", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/quests");
  await waitForData(page);
  await page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-D/ }).click();
  await page.getByLabel("Mission day").fill("99");
  const streak = async () => Number((await page.getByTestId("exercise-streak").innerText()).split(" ")[0]);
  // Readings stream in from IndexedDB after the first render, so poll instead of reading once.
  // Day 85 is a shelter day (real DONKI event, no exercise), so the streak runs from day 86.
  await expect.poll(streak).toBeGreaterThanOrEqual(14);

  await page.getByLabel("Mission day").fill("130");
  await expect(page.getByTestId("quest-list")).toContainText("Extra resistance session for bone health");
  await expect(page.getByTestId("quest-list")).toContainText("because: Missing exercise sessions");
  await expect.poll(streak).toBeLessThan(5);
  await expect(page.getByTestId("crew-goal")).toContainText("routine quests done by the whole crew");

  const hydration = page.getByTestId("quest-list").getByRole("listitem").filter({ hasText: "Drink water" });
  await hydration.getByRole("checkbox").check();
  await expect(hydration.getByText("+5 XP")).toBeVisible();
  await expect(hydration.getByRole("checkbox")).toBeChecked();
  expect(problems).toEqual([]);
});
