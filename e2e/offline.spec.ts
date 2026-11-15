import { expect, test } from "@playwright/test";
import { waitForData, watchForProblems } from "./helpers";

test("offline: after one online visit, the app loads and works with the network disabled", async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await waitForData(page);
  // Wait until the service worker controls the page and has finished precaching.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    }
  });
  await expect
    .poll(() => page.evaluate(async () => (await (await caches.open("ether-v3-cache")).keys()).length), { timeout: 20_000 })
    .toBeGreaterThan(20);

  const problems = watchForProblems(page);
  await context.setOffline(true);
  await page.reload();
  await waitForData(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mission Home");
  await page.getByLabel("Mission day").fill("95");
  await expect(page.getByTestId("clock-day")).toHaveText("Day 95 / 179");

  for (const [path, heading] of [["/body", "Body Map"], ["/alerts", "Action Center"], ["/learn", "Learn"]] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
  // Real NASA data still shows offline (cached route answers + the bundled snapshot).
  await expect(page.getByTestId("donki-list").locator("tbody tr")).toHaveCount(7);
  await expect(page.getByTestId("signal-delay")).toContainText("JPL Horizons");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Trends" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Trends");
  await context.setOffline(false);
  // Offline navigation may log failed network fetches for RSC payloads; nothing else may break.
  expect(problems.filter((p) => !/Failed to fetch|ERR_INTERNET_DISCONNECTED|net::|RSC payload/i.test(p))).toEqual([]);
});
