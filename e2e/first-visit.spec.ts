import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("first visit: day 70 + ORION-B, banner starts the demo, choice is remembered", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  await expect(page.getByTestId("clock-day")).toHaveText("Day 70 / 179");
  await expect(page.getByRole("group", { name: "Crew member" }).getByRole("button", { name: /ORION-B/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("home-alerts")).toContainText("You may be more tired than you feel");

  const banner = page.getByTestId("intro-banner");
  await banner.getByRole("button", { name: /Watch 30-second demo/ }).click();
  await expect(page.getByTestId("demo-caption")).toContainText("learns each astronaut");
  await expect(banner).toHaveCount(0);
  await page.getByTestId("demo-button").click();

  await page.reload();
  await waitForData(page);
  await expect(page.getByTestId("intro-banner")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("dismissing the banner keeps it closed", async ({ page }) => {
  await page.goto("/");
  await waitForData(page);
  await page.getByTestId("intro-banner").getByRole("button", { name: "Hide this introduction" }).click();
  await expect(page.getByTestId("intro-banner")).toHaveCount(0);
  await page.reload();
  await waitForData(page);
  await expect(page.getByTestId("clock-day")).toBeVisible();
  await expect(page.getByTestId("intro-banner")).toHaveCount(0);
});

test("intro says what the app is and whose data you see — per mode and language", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/");
  await waitForData(page);
  const intro = page.getByTestId("intro-banner");
  await expect(intro).toContainText("helps astronauts check their own health");
  await expect(page.getByTestId("intro-viewing")).toHaveText("You're viewing ORION-B, a simulated astronaut on day 70 of a Mars mission — all crew data is simulated.");
  await expect(intro.getByRole("link", { name: "Start today's check" })).toHaveAttribute("href", "/check");

  await page.getByTestId("mode-steppe").click();
  await expect(intro).toContainText("herder families");
  await expect(page.getByTestId("intro-viewing")).toContainText("simulated herder household on day 24 of winter");
  await page.getByTestId("lang-mn").click();
  await expect(page.getByTestId("intro-viewing")).toContainText("загварчилсан малчин өрх");
  expect(problems).toEqual([]);
});

test("one clear main action, labelled controls, and explained jargon", async ({ page }) => {
  await page.goto("/");
  await waitForData(page);
  const cta = page.getByTestId("primary-check");
  await expect(cta).toHaveText("Start today's 3-minute check");
  await expect(page.getByTestId("clock-help")).toHaveText("Mission timeline — drag to time-travel");
  await expect(page.getByText("Whose data you're viewing").first()).toBeVisible();
  await expect(page.getByText("It changes how long a message takes to reach Earth.")).toBeVisible();

  // Event icons show a label on hover.
  await page.getByRole("button", { name: /Jump to day 40/ }).hover();
  await expect(page.getByText(/Day 40 · Real NASA DONKI event/)).toBeVisible();

  // "Signal to Earth" explains itself.
  await page.getByTestId("signal-delay").getByTestId("term-signal").click();
  await expect(page.getByRole("tooltip")).toContainText("How long a message takes to reach Earth");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);

  await cta.click();
  await expect(page).toHaveURL(/\/check$/);

  await page.goto("/learn#glossary-pvt");
  await waitForData(page);
  await expect(page.getByTestId("glossary")).toContainText("PVT (reaction-time test)");
  await expect(page.getByTestId("glossary")).toContainText("CMO (crew doctor)");
});
